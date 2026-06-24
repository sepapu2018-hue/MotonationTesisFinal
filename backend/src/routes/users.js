const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authRequired, adminRequired);

const userSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(6),
  name: z.string().min(1).trim(),
  role: z.enum(['admin', 'empleado']).default('empleado'),
  permissions: z.array(z.string()).default([]),
  avatar_url: z.string().default(''),
});

// RUTA GET /api/users
router.get('/', asyncHandler(async (req, res) => {
  const users = await query(
    `SELECT id, email, name, role, avatar_url,
            ARRAY(SELECT jsonb_array_elements_text(permissions)) AS permissions,
            created_at FROM users
     UNION ALL
     SELECT id, email, name, 'customer' AS role, ''::text AS avatar_url, ARRAY[]::text[] AS permissions, created_at FROM customers
     ORDER BY created_at DESC`
  );
  res.json(users);
}));

// RUTA POST /api/users
router.post('/', asyncHandler(async (req, res) => {
  const data = userSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const existingUser = await one('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser) throw httpError(400, 'El correo ya existe');

  const hash = await bcrypt.hash(data.password, 10);

  const user = await one(
    `INSERT INTO users (email, name, password_hash, role, avatar_url, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, name, role, avatar_url, permissions, created_at`,
    [email, data.name, hash, data.role, data.avatar_url || '', JSON.stringify(data.permissions || [])]
  );
  res.status(201).json(user);
}));

// RUTA DELETE /api/users/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await one('SELECT id FROM users WHERE id = $1', [id]);
  if (!user) throw httpError(404, 'Usuario no encontrado');
  await query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
}));

module.exports = router;