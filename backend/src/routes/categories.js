// CRUD Completo de Categorías para motonation-final
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

// Bloquea todas las rutas de este archivo: requiere inicio de sesión (Staff o Admin)
router.use(authRequired);

// Esquema de validación para crear y editar categorías
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido').trim(),
  description: z.string().optional().default(''),
});

// 1. LEER TODAS LAS CATEGORÍAS (GET /api/categories)
router.get('/', asyncHandler(async (req, res) => {
  const cats = await query('SELECT id, name, description, created_at FROM categories ORDER BY name ASC');
  res.json(cats);
}));

// 2. CREAR CATEGORÍA (POST /api/categories) — Solo Administradores
router.post('/', adminRequired, asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  
  const cat = await one(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [data.name, data.description]
  );
  res.status(201).json(cat);
}));

// 3. EDITAR CATEGORÍA (PUT /api/categories/:id) — Solo Administradores (¡Añadido!)
router.put('/:id', adminRequired, asyncHandler(async (req, res) => {
  const data = categorySchema.parse(req.body);
  
  const updatedCat = await one(
    'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [data.name, data.description, req.params.id]
  );
  
  if (!updatedCat) throw httpError(404, 'Categoría no encontrada');
  res.json(updatedCat);
}));

// 4. ELIMINAR CATEGORÍA (DELETE /api/categories/:id) — Solo Administradores
router.delete('/:id', adminRequired, asyncHandler(async (req, res) => {
  // Verificación manual preventiva antes de borrar
  const used = await one('SELECT COUNT(*)::int AS c FROM products WHERE category_id = $1', [req.params.id]);
  if (used && used.c > 0) {
    throw httpError(400, 'No se puede eliminar: existen motocicletas o productos asociados a esta categoría.');
  }
  
  const out = await one('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
  if (!out) throw httpError(404, 'Categoría no encontrada o ya eliminada');
  
  res.json({ ok: true });
}));

module.exports = router;