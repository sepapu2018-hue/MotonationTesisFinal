// CRUD de proveedores — se ligan opcionalmente a las entradas de stock en Movimientos
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authRequired);

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre del proveedor es requerido').trim(),
  contact: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
});

router.get('/', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM suppliers ORDER BY name ASC');
  res.json(rows);
}));

router.post('/', adminRequired, asyncHandler(async (req, res) => {
  const data = supplierSchema.parse(req.body);

  const exists = await one('SELECT id FROM suppliers WHERE name = $1', [data.name]);
  if (exists) throw httpError(400, 'Ya existe un proveedor con ese nombre');

  const row = await one(
    'INSERT INTO suppliers (name, contact, phone, email) VALUES ($1,$2,$3,$4) RETURNING *',
    [data.name, data.contact, data.phone, data.email]
  );
  res.status(201).json(row);
}));

router.put('/:id', adminRequired, asyncHandler(async (req, res) => {
  const data = supplierSchema.parse(req.body);

  const exists = await one('SELECT id FROM suppliers WHERE name = $1 AND id <> $2', [data.name, req.params.id]);
  if (exists) throw httpError(400, 'Ya existe otro proveedor con ese nombre');

  const row = await one(
    'UPDATE suppliers SET name = $1, contact = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *',
    [data.name, data.contact, data.phone, data.email, req.params.id]
  );
  if (!row) throw httpError(404, 'Proveedor no encontrado');
  res.json(row);
}));

router.delete('/:id', adminRequired, asyncHandler(async (req, res) => {
  // Los movimientos que ya lo referencian conservan supplier_name (denormalizado)
  // y solo pierden el vínculo (supplier_id se pone en NULL vía ON DELETE SET NULL).
  const row = await one('DELETE FROM suppliers WHERE id = $1 RETURNING id', [req.params.id]);
  if (!row) throw httpError(404, 'Proveedor no encontrado o ya eliminado');
  res.json({ ok: true });
}));

module.exports = router;
