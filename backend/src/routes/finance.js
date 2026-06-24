// Reportes financieros: ingresos, costos, márgenes, flujo de caja
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/summary', asyncHandler(async (req, res) => {
  const inv = await one(`
    SELECT
      COALESCE(SUM(stock * cost), 0)::numeric(14,2) AS inventory_cost_value,
      COALESCE(SUM(stock * price), 0)::numeric(14,2) AS inventory_sale_value,
      COALESCE(SUM(stock * (price - cost)), 0)::numeric(14,2) AS potential_margin
    FROM products
  `);

  const sales = await one(`
    SELECT
      COUNT(*)::int AS orders_count,
      COALESCE(SUM(total), 0)::numeric(14,2) AS revenue,
      COALESCE(SUM(subtotal), 0)::numeric(14,2) AS revenue_net
    FROM orders WHERE status IN ('pagado', 'enviado', 'entregado')
  `);

  const cogs = await one(`
    SELECT
      COALESCE(SUM(unit_cost * quantity), 0)::numeric(14,2) AS cost_of_goods_sold,
      COALESCE(SUM((unit_price - unit_cost) * quantity), 0)::numeric(14,2) AS gross_margin
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('pagado', 'enviado', 'entregado')
  `);

  const revenue = Number(sales.revenue);
  const margin = Number(cogs.gross_margin);
  const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(2)) : 0;

  res.json({
    inventory_cost_value: Number(inv.inventory_cost_value),
    inventory_sale_value: Number(inv.inventory_sale_value),
    potential_margin: Number(inv.potential_margin),
    orders_count: sales.orders_count,
    revenue,
    revenue_net: Number(sales.revenue_net),
    cost_of_goods_sold: Number(cogs.cost_of_goods_sold),
    gross_margin: margin,
    gross_margin_pct: marginPct,
  });
}));

router.get('/cash-flow', asyncHandler(async (req, res) => {
  const days = Math.max(1, Math.min(parseInt(req.query.days) || 30, 365));
  
  // CORRECCIÓN CLAVE: Agrupamos ingresos por un lado y costos por el otro ANTES del join del rango para evitar duplicar totales
  const rows = await query(`
    WITH range AS (
      SELECT generate_series(
        (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    ),
    daily_income AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        SUM(total) AS total_income
      FROM orders 
      WHERE status IN ('pagado','enviado','entregado')
      GROUP BY 1
    ),
    daily_cost AS (
      SELECT 
        date_trunc('day', o.created_at)::date AS day,
        SUM(oi.unit_cost * oi.quantity) AS total_cost
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('pagado','enviado','entregado')
      GROUP BY 1
    )
    SELECT
      r.day::text AS date,
      COALESCE(i.total_income, 0)::numeric(14,2) AS income,
      COALESCE(c.total_cost, 0)::numeric(14,2) AS cost
    FROM range r
    LEFT JOIN daily_income i ON i.day = r.day
    LEFT JOIN daily_cost c ON c.day = r.day
    ORDER BY r.day ASC
  `, [days]);

  res.json(rows.map((r) => ({
    date: r.date,
    income: Number(r.income),
    cost: Number(r.cost),
    profit: Number((Number(r.income) - Number(r.cost)).toFixed(2)),
  })));
}));

router.get('/top-products', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT
      oi.product_id, oi.product_sku, oi.product_name,
      SUM(oi.quantity)::int AS units_sold,
      COALESCE(SUM(oi.unit_price * oi.quantity), 0)::numeric(14,2) AS revenue,
      COALESCE(SUM((oi.unit_price - oi.unit_cost) * oi.quantity), 0)::numeric(14,2) AS margin
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('pagado','enviado','entregado')
    GROUP BY oi.product_id, oi.product_sku, oi.product_name
    ORDER BY revenue DESC
    LIMIT 10
  `);
  res.json(rows.map((r) => ({
    ...r,
    revenue: Number(r.revenue),
    margin: Number(r.margin),
  })));
}));

module.exports = router;