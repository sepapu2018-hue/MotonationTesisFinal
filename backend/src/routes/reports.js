// Reportes de gestión: stock por categoría y resumen de movimientos por día
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// 1. STOCK POR CATEGORÍA (Valoración real al costo)
router.get('/stock-by-category', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT
      c.name,
      COUNT(p.id)::int AS items,
      COALESCE(SUM(p.stock), 0)::int AS stock,
      COALESCE(SUM(p.stock * p.cost), 0)::numeric(14,2) AS value
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name ASC
  `);
  res.json(rows.map((r) => ({ ...r, value: Number(r.value) })));
}));

// 2. RESUMEN DE MOVIMIENTOS POR DÍA (Optimizado mediante CTEs para rendimiento de base de datos)
router.get('/movements-summary', asyncHandler(async (req, res) => {
  const days = Math.max(1, Math.min(parseInt(req.query.days) || 7, 90));

  const rows = await query(`
    WITH range AS (
      SELECT generate_series(
        (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    ),
    daily_summary AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COALESCE(SUM(CASE WHEN type = 'entrada' THEN quantity ELSE 0 END), 0)::int AS total_entradas,
        COALESCE(SUM(CASE WHEN type = 'salida' OR type = 'venta' THEN quantity ELSE 0 END), 0)::int AS total_salidas
      FROM movements
      GROUP BY 1
    )
    SELECT
      r.day::text AS date,
      COALESCE(s.total_entradas, 0)::int AS entradas,
      COALESCE(s.total_salidas, 0)::int AS salidas
    FROM range r
    LEFT JOIN daily_summary s ON s.day = r.day
    ORDER BY r.day ASC
  `, [days]);

  res.json(rows);
}));

module.exports = router;