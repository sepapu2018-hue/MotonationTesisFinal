const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authRequired);

router.get('/:productId', asyncHandler(async (req, res) => {
  const product = await one('SELECT id, sku, name, type, brand, model, stock, cost, price FROM products WHERE id = $1', [req.params.productId]);
  if (!product) throw httpError(404, 'Producto no encontrado');

  const rows = await query(
    `SELECT id, type, quantity, unit_cost, unit_price, reason, user_name, order_id, created_at
     FROM movements
     WHERE product_id = $1
     ORDER BY created_at ASC`,
    [req.params.productId]
  );

  let balance = 0;
  let avgCost = 0;

  const enriched = rows.map((m) => {
    const qty = m.type === 'entrada' ? m.quantity : -m.quantity;
    const previousBalance = balance;
    balance += qty;

    const currentUnitCost = Number(m.unit_cost);

    if (m.type === 'entrada' && currentUnitCost > 0) {
      const previousValue = previousBalance * avgCost;
      const newValue = previousValue + (m.quantity * currentUnitCost);
      const newBalance = previousBalance + m.quantity;
      avgCost = newBalance > 0 ? newValue / newBalance : avgCost;
    }

    return {
      ...m,
      unit_cost: currentUnitCost,
      unit_price: Number(m.unit_price),
      balance,
      avg_cost: Number(avgCost.toFixed(2)),
      balance_value: Number((balance * avgCost).toFixed(2)),
    };
  });

  const lastEntry = enriched[enriched.length - 1];
  const finalAvgCost = lastEntry ? lastEntry.avg_cost : Number(product.cost);

  enriched.reverse();

  res.json({
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      type: product.type,
      brand: product.brand,
      model: product.model,
      current_stock: product.stock,
      current_cost: Number(product.cost),
      current_price: Number(product.price),
      avg_cost: finalAvgCost,
    },
    entries: enriched,
  });
}));

module.exports = router;