// Moderación de reseñas: solo staff autenticado puede listar/eliminar
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authRequired);

router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT r.id, r.name, r.city, r.rating, r.text, r.is_published, r.created_at,
           r.product_id, p.name AS product_name
    FROM reviews r
    LEFT JOIN products p ON p.id = r.product_id
    ORDER BY r.created_at DESC
  `);
  res.json(rows);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await one('SELECT id FROM reviews WHERE id = $1', [req.params.id]);
  if (!existing) throw httpError(404, 'Reseña no encontrada');
  await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
