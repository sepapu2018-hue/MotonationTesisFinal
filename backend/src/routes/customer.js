// Auth de clientes finales (separada del staff)
const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const {
  signCustomerAccess, signCustomerRefresh, verify,
  setCustomerCookies, clearCustomerCookies,
} = require('../utils/tokens');
const { customerRequired, authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail, isConfigured: mailerConfigured } = require('../utils/mailer');

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

// Protección anti fuerza bruta: máx. 10 intentos cada 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.' },
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', loginLimiter, asyncHandler(async (req, res) => {
  const d = registerSchema.parse(req.body);
  const email = d.email.toLowerCase().trim();

  const exists = await one('SELECT id FROM customers WHERE email = $1', [email]);
  if (exists) throw httpError(400, 'Este correo ya está registrado');

  const hash = await bcrypt.hash(d.password, 10);
  const customer = await one(
    `INSERT INTO customers (email, name, password_hash, phone, address, city)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, email, name, phone, address, city, created_at`,
    [email, d.name, hash, d.phone, d.address, d.city]
  );

  setCustomerCookies(res, signCustomerAccess(customer), signCustomerRefresh(customer));
  res.status(201).json(customer);
}));

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const normalized = email.toLowerCase().trim();

  const customer = await one(
    'SELECT id, email, name, phone, address, city, password_hash FROM customers WHERE email = $1',
    [normalized]
  );
  if (!customer) throw httpError(401, 'Credenciales inválidas');

  const ok = await bcrypt.compare(password, customer.password_hash);
  if (!ok) throw httpError(401, 'Credenciales inválidas');

  setCustomerCookies(res, signCustomerAccess(customer), signCustomerRefresh(customer));
  delete customer.password_hash;
  res.json(customer);
}));

const RESET_TOKEN_TTL_MIN = 30;

router.post('/forgot-password', loginLimiter, asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const normalized = email.toLowerCase().trim();
  const customer = await one('SELECT id FROM customers WHERE email = $1', [normalized]);

  // Respuesta genérica aunque el correo no exista, para no revelar qué correos están registrados
  if (!customer) {
    res.json({ ok: true });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

  await query('DELETE FROM password_resets WHERE customer_id = $1 AND used_at IS NULL', [customer.id]);
  await query(
    'INSERT INTO password_resets (customer_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [customer.id, tokenHash, expiresAt]
  );

  const resetLink = `${FRONTEND_URL}/cuenta/restablecer?token=${rawToken}`;

  if (mailerConfigured()) {
    try {
      await sendPasswordResetEmail(normalized, resetLink);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error enviando email de recuperación:', err);
      // Si falla el envío, se entrega el enlace en la respuesta para no bloquear al usuario
      res.json({ ok: true, dev_reset_token: rawToken });
    }
  } else {
    // Sin GMAIL_USER/GMAIL_APP_PASSWORD configurados: el token se devuelve directo en la respuesta
    res.json({ ok: true, dev_reset_token: rawToken });
  }
}));

router.post('/reset-password', loginLimiter, asyncHandler(async (req, res) => {
  const { token, new_password } = z.object({
    token: z.string().min(10),
    new_password: z.string().min(6),
  }).parse(req.body);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await one(
    'SELECT id, customer_id, expires_at, used_at FROM password_resets WHERE token_hash = $1',
    [tokenHash]
  );
  if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
    throw httpError(400, 'El enlace de recuperación no es válido o ya expiró');
  }

  const hash = await bcrypt.hash(new_password, 10);
  await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [hash, reset.customer_id]);
  await query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [reset.id]);

  res.json({ ok: true });
}));

router.post('/logout', customerRequired, (req, res) => {
  clearCustomerCookies(res);
  res.json({ ok: true });
});

router.get('/me', customerRequired, (req, res) => {
  res.json(req.customer);
});

router.put('/me', customerRequired, asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().optional().default(''),
    address: z.string().optional().default(''),
    city: z.string().optional().default(''),
    current_password: z.string().optional(),
    new_password: z.union([z.string().min(6), z.literal('')]).optional(),
  });
  const d = schema.parse(req.body);

  if (d.new_password) {
    if (!d.current_password) throw httpError(400, 'Ingresa tu contraseña actual para cambiarla');
    const existing = await one('SELECT password_hash FROM customers WHERE id = $1', [req.customer.id]);
    const ok = await bcrypt.compare(d.current_password, existing.password_hash);
    if (!ok) throw httpError(400, 'La contraseña actual es incorrecta');
    const hash = await bcrypt.hash(d.new_password, 10);
    await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [hash, req.customer.id]);
  }

  const updated = await one(
    `UPDATE customers SET name=$1, phone=$2, address=$3, city=$4
     WHERE id = $5 RETURNING id, email, name, phone, address, city, created_at`,
    [d.name, d.phone, d.address, d.city, req.customer.id]
  );
  res.json(updated);
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.customer_refresh_token;
  if (!token) throw httpError(401, 'No refresh token');
  try {
    const payload = verify(token);
    if (payload.type !== 'refresh') throw httpError(401, 'Token inválido');
    const customer = await one('SELECT id, email, name, phone, address, city FROM customers WHERE id = $1', [payload.sub]);
    if (!customer) throw httpError(401, 'Cliente no encontrado');
    setCustomerCookies(res, signCustomerAccess(customer), token);
    res.json({ ok: true });
  } catch (e) {
    if (e.status) throw e;
    throw httpError(401, 'Token inválido');
  }
}));

// RUTA DELETE /api/customer/:id — solo admins
router.delete('/:id', authRequired, adminRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await one('SELECT id FROM customers WHERE id = $1', [id]);
  if (!customer) throw httpError(404, 'Cliente no encontrado');
  await query('DELETE FROM customers WHERE id = $1', [id]);
  res.json({ ok: true });
}));

module.exports = router;