// Auth de clientes finales (separada del staff)
const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { one, query } = require('../config/db');
const {
  signCustomerAccess, signCustomerRefresh, verify,
  setCustomerCookies, clearCustomerCookies,
} = require('../utils/tokens');
const { customerRequired, authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

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

router.post('/register', asyncHandler(async (req, res) => {
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

router.post('/login', asyncHandler(async (req, res) => {
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
  });
  const d = schema.parse(req.body);
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