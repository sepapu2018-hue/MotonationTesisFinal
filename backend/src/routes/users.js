const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLog');

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

// Edición de usuario: la contraseña es opcional (si se omite, se conserva la actual)
const userEditSchema = z.object({
  email: z.string().email().trim(),
  name: z.string().min(1).trim(),
  role: z.enum(['admin', 'empleado']),
  permissions: z.array(z.string()).default([]),
  password: z.union([z.string().min(6), z.literal('')]).optional(),
});

const avatarSchema = z.object({
  avatar_url: z.string(),
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
  await logAudit(req.user, 'crear_usuario', 'user', user.id, { email: user.email, role: user.role, permissions: user.permissions });
  res.status(201).json(user);
}));

// RUTA PUT /api/users/:id — edición completa (datos, rol, permisos y opcionalmente contraseña)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = userEditSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const target = await one(
    `SELECT id, role, ARRAY(SELECT jsonb_array_elements_text(permissions)) AS permissions FROM users WHERE id = $1`,
    [id]
  );
  if (!target) throw httpError(404, 'Usuario no encontrado');

  const emailTaken = await one('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, id]);
  if (emailTaken) throw httpError(400, 'El correo ya está en uso por otro usuario');

  // Protege el sistema de quedarse sin administradores
  if (target.role === 'admin' && data.role !== 'admin') {
    const admins = await one("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'");
    if (admins.c <= 1) throw httpError(400, 'No puedes quitar el rol de administrador al único admin del sistema');
  }

  let user;
  if (data.password) {
    const hash = await bcrypt.hash(data.password, 10);
    user = await one(
      `UPDATE users SET email=$1, name=$2, role=$3, permissions=$4, password_hash=$5
       WHERE id = $6 RETURNING id, email, name, role, avatar_url, permissions, created_at`,
      [email, data.name, data.role, JSON.stringify(data.permissions || []), hash, id]
    );
  } else {
    user = await one(
      `UPDATE users SET email=$1, name=$2, role=$3, permissions=$4
       WHERE id = $5 RETURNING id, email, name, role, avatar_url, permissions, created_at`,
      [email, data.name, data.role, JSON.stringify(data.permissions || []), id]
    );
  }

  const roleChanged = target.role !== user.role;
  const permsChanged = JSON.stringify([...target.permissions].sort()) !== JSON.stringify([...user.permissions].sort());
  if (roleChanged || permsChanged) {
    await logAudit(req.user, 'editar_permisos_usuario', 'user', user.id, {
      email: user.email,
      role_antes: target.role, role_despues: user.role,
      permisos_antes: target.permissions, permisos_despues: user.permissions,
    });
  }

  res.json(user);
}));

// RUTA PATCH /api/users/:id — actualización parcial (foto de perfil)
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = avatarSchema.parse(req.body);

  const user = await one(
    'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, role, avatar_url, permissions, created_at',
    [data.avatar_url, id]
  );
  if (!user) throw httpError(404, 'Usuario no encontrado');
  res.json(user);
}));

// RUTA DELETE /api/users/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) throw httpError(400, 'No puedes eliminar tu propia cuenta');

  const user = await one('SELECT id, email, role FROM users WHERE id = $1', [id]);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  if (user.role === 'admin') {
    const admins = await one("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'");
    if (admins.c <= 1) throw httpError(400, 'No puedes eliminar al único administrador del sistema');
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  await logAudit(req.user, 'eliminar_usuario', 'user', id, { email: user.email, role: user.role });
  res.json({ ok: true });
}));

module.exports = router;
