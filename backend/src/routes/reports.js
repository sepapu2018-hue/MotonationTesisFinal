// Reportes agregados de ventas por rango de fechas (para exportar desde el panel)
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authRequired);

const rangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha "desde" inválida (YYYY-MM-DD)'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha "hasta" inválida (YYYY-MM-DD)'),
});

router.get('/sales', asyncHandler(async (req, res) => {
  const { from, to } = rangeSchema.parse(req.query);
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  toDate.setUTCDate(toDate.getUTCDate() + 1); // "hasta" incluye el día completo

  if (fromDate >= toDate) throw httpError(400, 'El rango de fechas no es válido');

  const summary = await one(
    `SELECT
       COUNT(*)::int AS order_count,
       COALESCE(SUM(subtotal), 0)::numeric(14,2) AS subtotal,
       COALESCE(SUM(tax), 0)::numeric(14,2) AS tax,
       COALESCE(SUM(total), 0)::numeric(14,2) AS revenue
     FROM orders
     WHERE created_at >= $1 AND created_at < $2 AND status <> 'cancelado'`,
    [fromDate, toDate]
  );

  const topProducts = await query(
    `SELECT oi.product_name, oi.product_sku,
            SUM(oi.quantity)::int AS quantity,
            SUM(oi.subtotal)::numeric(14,2) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelado'
     GROUP BY oi.product_name, oi.product_sku
     ORDER BY revenue DESC
     LIMIT 20`,
    [fromDate, toDate]
  );

  res.json({
    from, to,
    order_count: summary.order_count,
    subtotal: Number(summary.subtotal),
    tax: Number(summary.tax),
    revenue: Number(summary.revenue),
    top_products: topProducts.map((p) => ({ ...p, revenue: Number(p.revenue) })),
  });
}));

module.exports = router;
