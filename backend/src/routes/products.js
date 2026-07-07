// CRUD de productos e inventario general para motonation-final
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { pool, query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLog');

const router = express.Router();
router.use(authRequired);

const productSchema = z.object({
  sku: z.string().min(1).trim(),
  name: z.string().min(1).trim(),
  type: z.enum(['motocicleta', 'accesorio']),
  brand: z.string().optional().default(''),
  model: z.string().optional().default(''),
  category_id: z.string().uuid(),
  cost: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  min_stock: z.coerce.number().int().min(0).default(5),
  image_url: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(''),
  is_published: z.coerce.boolean().optional().default(true),
  // Ficha técnica: pares clave/valor libres (ej. "Cilindraje": "150cc")
  specs: z.record(z.string(), z.string()).optional().default({}),
});

// El stock NO se edita por acá: una vez creado el producto, solo cambia a
// través de Movimientos (entrada/salida/ajuste), para no perder trazabilidad en el Kárdex.
const productUpdateSchema = productSchema.omit({ stock: true });

const normalize = (p) => ({
  ...p,
  cost: Number(p.cost),
  price: Number(p.price),
});

// 1. LISTAR PRODUCTOS CON FILTROS DINÁMICOS
// Retrocompatible: sin ?page devuelve el arreglo completo (lo usan los selectores
// de Movimientos/Kárdex); con ?page se activa la paginación real para la tabla.
router.get('/', asyncHandler(async (req, res) => {
  const { q, type, category_id, low_stock, page, page_size } = req.query;
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(name ILIKE $${i} OR sku ILIKE $${i} OR brand ILIKE $${i} OR model ILIKE $${i})`);
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  if (category_id) {
    params.push(category_id);
    where.push(`category_id = $${params.length}`);
  }
  if (low_stock === 'true') {
    where.push(`stock <= min_stock`);
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  if (!page) {
    const sql = `SELECT * FROM products ${whereSql} ORDER BY created_at DESC`;
    const rows = await query(sql, params);
    return res.json(rows.map(normalize));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(page_size, 10) || 20));
  const offset = (pageNum - 1) * pageSize;

  const { total } = await one(`SELECT COUNT(*)::int AS total FROM products ${whereSql}`, params);

  const dataSql = `SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const rows = await query(dataSql, [...params, pageSize, offset]);

  res.json({ data: rows.map(normalize), total, page: pageNum, pageSize });
}));

// 2. OBTENER UN PRODUCTO POR ID
router.get('/:id', asyncHandler(async (req, res) => {
  const p = await one('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!p) throw httpError(404, 'Producto no encontrado');
  res.json(normalize(p));
}));

// 3. CREAR PRODUCTO (CON TRANSACCIÓN PARA INYECTAR EN KARDEX SI TIENE STOCK INICIAL)
router.post('/', adminRequired, asyncHandler(async (req, res) => {
  const d = productSchema.parse(req.body);
  
  const skuExists = await one('SELECT id FROM products WHERE sku = $1', [d.sku]);
  if (skuExists) throw httpError(400, 'El SKU ya está registrado por otro producto');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const p = await one(
      `INSERT INTO products (sku, name, type, brand, model, category_id, cost, price, stock, min_stock, image_url, images, description, is_published, specs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [d.sku, d.name, d.type, d.brand, d.model, d.category_id, d.cost, d.price, d.stock, d.min_stock, d.image_url,
       JSON.stringify(d.images), d.description, d.is_published, JSON.stringify(d.specs)]
    );

    // Si el producto se crea con stock inicial, se genera su partida correspondiente en movimientos
    if (d.stock > 0) {
      await client.query(
        `INSERT INTO movements (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price, reason, user_id, user_name)
         VALUES ($1,$2,$3,'entrada',$4,$5,$6,$7,$8,$9)`,
        [p.id, p.name, p.sku, d.stock, d.cost, d.price, 'Inventario inicial', req.user.id, req.user.name]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(normalize(p));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// 4. ACTUALIZAR PRODUCTO (el stock no se toca acá — ver productUpdateSchema)
router.put('/:id', adminRequired, asyncHandler(async (req, res) => {
  const d = productUpdateSchema.parse(req.body);

  const skuExists = await one('SELECT id FROM products WHERE sku = $1 AND id <> $2', [d.sku, req.params.id]);
  if (skuExists) throw httpError(400, 'El SKU ya está siendo usado por otro producto');

  const p = await one(
    `UPDATE products SET sku=$1, name=$2, type=$3, brand=$4, model=$5, category_id=$6,
                        cost=$7, price=$8, min_stock=$9, image_url=$10, images=$11, description=$12,
                        is_published=$13, specs=$14, updated_at=NOW()
     WHERE id = $15 RETURNING *`,
    [d.sku, d.name, d.type, d.brand, d.model, d.category_id, d.cost, d.price, d.min_stock, d.image_url,
     JSON.stringify(d.images), d.description, d.is_published, JSON.stringify(d.specs), req.params.id]
  );
  if (!p) throw httpError(404, 'Producto no encontrado');
  res.json(normalize(p));
}));

// 5. ELIMINAR PRODUCTO
router.delete('/:id', adminRequired, asyncHandler(async (req, res) => {
  const existing = await one('SELECT id, name, sku FROM products WHERE id = $1', [req.params.id]);
  if (!existing) throw httpError(404, 'Producto no encontrado o ya eliminado');

  await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  await logAudit(req.user, 'eliminar_producto', 'product', existing.id, { name: existing.name, sku: existing.sku });
  res.json({ ok: true });
}));

module.exports = router;