// Métricas agregadas para el panel principal
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await one(`
    SELECT
      COUNT(*)::int AS total_products,
      COALESCE(SUM(stock), 0)::int AS total_units,
      COALESCE(SUM(stock * cost), 0)::numeric(14,2) AS total_value,
      COUNT(*) FILTER (WHERE stock <= min_stock)::int AS low_stock_count,
      COUNT(*) FILTER (WHERE type = 'motocicleta')::int AS motos_count,
      COUNT(*) FILTER (WHERE type = 'accesorio')::int AS accesorios_count
    FROM products
  `);

  const movs = await one(`
    SELECT COUNT(*)::int AS c
    FROM movements
    WHERE created_at >= date_trunc('day', NOW())
  `);

  res.json({
    total_products: stats.total_products,
    total_units: stats.total_units,
    total_value: Number(stats.total_value),
    low_stock_count: stats.low_stock_count,
    motos_count: stats.motos_count,
    accesorios_count: stats.accesorios_count,
    movements_today: movs.c,
  });
}));

router.get('/low-stock', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC
  `);
  res.json(rows.map((p) => ({ 
    ...p, 
    price: Number(p.price),
    cost: Number(p.cost)
  })));
}));

module.exports = router;