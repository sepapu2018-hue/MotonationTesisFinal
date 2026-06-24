// CRUD de productos e inventario general para motonation-final
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { pool, query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

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
  description: z.string().optional().default(''),
  is_published: z.coerce.boolean().optional().default(true),
});

const normalize = (p) => ({
  ...p,
  cost: Number(p.cost),
  price: Number(p.price),
});

// 1. LISTAR PRODUCTOS CON FILTROS DINÁMICOS
router.get('/', asyncHandler(async (req, res) => {
  const { q, type, category_id, low_stock } = req.query;
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

  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
  const rows = await query(sql, params);
  res.json(rows.map(normalize));
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
      `INSERT INTO products (sku, name, type, brand, model, category_id, cost, price, stock, min_stock, image_url, description, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [d.sku, d.name, d.type, d.brand, d.model, d.category_id, d.cost, d.price, d.stock, d.min_stock, d.image_url, d.description, d.is_published]
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

// 4. ACTUALIZAR PRODUCTO
router.put('/:id', adminRequired, asyncHandler(async (req, res) => {
  const d = productSchema.parse(req.body);

  const skuExists = await one('SELECT id FROM products WHERE sku = $1 AND id <> $2', [d.sku, req.params.id]);
  if (skuExists) throw httpError(400, 'El SKU ya está siendo usado por otro producto');

  const p = await one(
    `UPDATE products SET sku=$1, name=$2, type=$3, brand=$4, model=$5, category_id=$6,
                        cost=$7, price=$8, stock=$9, min_stock=$10, image_url=$11, description=$12, is_published=$13, updated_at=NOW()
     WHERE id = $14 RETURNING *`,
    [d.sku, d.name, d.type, d.brand, d.model, d.category_id, d.cost, d.price, d.stock, d.min_stock, d.image_url, d.description, d.is_published, req.params.id]
  );
  if (!p) throw httpError(404, 'Producto no encontrado');
  res.json(normalize(p));
}));

// 5. ELIMINAR PRODUCTO
router.delete('/:id', adminRequired, asyncHandler(async (req, res) => {
  const out = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
  if (out.length === 0) throw httpError(404, 'Producto no encontrado o ya eliminado');
  res.json({ ok: true });
}));

module.exports = router;