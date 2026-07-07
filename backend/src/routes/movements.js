// Gestión de movimientos de inventario (Kardex manual)
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { pool, query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { weightedAverageCost } = require('../utils/costing');
const { checkLowStockAlert } = require('../utils/stockAlerts');

const router = express.Router();
router.use(authRequired);

const movSchema = z.object({
  product_id: z.string().uuid(),
  type: z.enum(['entrada', 'salida', 'ajuste']),
  quantity: z.coerce.number().int().positive(),
  unit_cost: z.coerce.number().min(0).optional().default(0),
  reason: z.string().optional().default(''),
  direction: z.enum(['positivo', 'negativo']).optional(),
  supplier_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.type === 'ajuste') {
    if (!data.direction) {
      ctx.addIssue({ code: 'custom', path: ['direction'], message: 'El ajuste requiere indicar dirección (positivo/negativo)' });
    }
    if (!data.reason || !data.reason.trim()) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'El ajuste por conteo físico requiere un motivo' });
    }
  }
});

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const rows = await query(
    'SELECT * FROM movements ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  res.json(rows.map((m) => ({ ...m, unit_cost: Number(m.unit_cost), unit_price: Number(m.unit_price) })));
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = movSchema.parse(req.body);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prodRes = await client.query(
      'SELECT id, name, sku, stock, cost, price, min_stock FROM products WHERE id = $1 FOR UPDATE',
      [data.product_id]
    );
    const product = prodRes.rows[0];
    if (!product) throw httpError(404, 'Producto no encontrado');

    const isIncrease = data.type === 'entrada' || (data.type === 'ajuste' && data.direction === 'positivo');
    const newStock = isIncrease ? product.stock + data.quantity : product.stock - data.quantity;

    if (newStock < 0) {
      throw httpError(400, data.type === 'ajuste' ? 'Stock insuficiente para aplicar el ajuste' : 'Stock insuficiente para salida');
    }

    let supplier = null;
    if (data.type === 'entrada' && data.supplier_id) {
      const supRes = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [data.supplier_id]);
      supplier = supRes.rows[0] || null;
      if (!supplier) throw httpError(404, 'Proveedor no encontrado');
    }

    let unitCost;
    if (data.type === 'entrada') {
      const enteredCost = data.unit_cost > 0 ? data.unit_cost : Number(product.cost);
      unitCost = weightedAverageCost(product.stock, Number(product.cost), data.quantity, enteredCost);
      await client.query(
        'UPDATE products SET stock = $1, cost = $2, updated_at = NOW() WHERE id = $3',
        [newStock, unitCost, product.id]
      );
    } else {
      unitCost = data.unit_cost > 0 ? data.unit_cost : Number(product.cost);
      await client.query(
        'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
        [newStock, product.id]
      );
    }

    const ins = await client.query(
      `INSERT INTO movements (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price, reason, user_id, user_name, direction, supplier_id, supplier_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        product.id, product.name, product.sku, data.type, data.quantity, unitCost, Number(product.price),
        data.reason, req.user.id, req.user.name, data.type === 'ajuste' ? data.direction : null,
        supplier?.id || null, supplier?.name || '',
      ]
    );

    await client.query('COMMIT');

    if (!isIncrease) {
      await checkLowStockAlert(
        { name: product.name, sku: product.sku, min_stock: product.min_stock, stock: newStock },
        product.stock
      );
    }

    res.status(201).json(ins.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

module.exports = router;