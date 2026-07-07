// Pedidos: checkout simulado + listado de pedidos del cliente y admin
const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { pool, query, one } = require('../config/db');
const { customerRequired, authRequired } = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { computeOrderTotals, generateOrderNumber } = require('../utils/pricing');
const { sendOrderConfirmationEmail, sendNewOrderAdminEmail, isConfigured: mailerConfigured } = require('../utils/mailer');
const { checkLowStockAlert } = require('../utils/stockAlerts');

const router = express.Router();

const checkoutSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
  shipping_address: z.string().min(5),
  notes: z.string().optional().default(''),
});

// POST /api/orders/checkout — checkout simulado (descuenta stock + crea pedido + movimientos)
router.post('/checkout', customerRequired, asyncHandler(async (req, res) => {
  const data = checkoutSchema.parse(req.body);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productIds = data.items.map((i) => i.product_id);
    const prodRes = await client.query(
      `SELECT id, sku, name, cost, price, stock, min_stock FROM products
       WHERE id = ANY($1::uuid[]) AND is_published = true
       FOR UPDATE`,
      [productIds]
    );

    if (prodRes.rows.length !== data.items.length) {
      throw httpError(400, 'Algún producto no está disponible o no existe');
    }

    const byId = Object.fromEntries(prodRes.rows.map((p) => [p.id, p]));

    // Validación estricta de stock disponible
    for (const it of data.items) {
      const p = byId[it.product_id];
      if (p.stock < it.quantity) {
        throw httpError(400, `Stock insuficiente para "${p.name}" (disponible: ${p.stock})`);
      }
    }

    const { subtotal, tax, total } = computeOrderTotals(
      data.items.map((it) => ({ price: byId[it.product_id].price, quantity: it.quantity }))
    );
    const orderNumber = generateOrderNumber();
    const paymentRef = 'SIM-' + Math.random().toString(36).slice(2, 10).toUpperCase();

    const orderRes = await client.query(
      `INSERT INTO orders
        (order_number, customer_id, customer_name, customer_email, customer_phone,
         shipping_address, subtotal, tax, total, status, payment_method, payment_ref, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        orderNumber, req.customer.id, req.customer.name, req.customer.email, req.customer.phone,
        data.shipping_address, subtotal, tax, total, 'pagado', 'simulado', paymentRef, data.notes,
      ]
    );
    const order = orderRes.rows[0];

    // Persistencia de los ítems de la orden y registro en Kardex
    const emailItems = [];
    const stockAlertCandidates = [];
    for (const it of data.items) {
      const p = byId[it.product_id];
      const itemSubtotal = Number((Number(p.price) * it.quantity).toFixed(2));
      emailItems.push({ product_name: p.name, quantity: it.quantity, subtotal: itemSubtotal });

      await client.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, product_sku, unit_cost, unit_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, p.id, p.name, p.sku, Number(p.cost), Number(p.price), it.quantity, itemSubtotal]
      );

      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [it.quantity, p.id]
      );
      stockAlertCandidates.push({
        product: { name: p.name, sku: p.sku, min_stock: p.min_stock, stock: p.stock - it.quantity },
        previousStock: p.stock,
      });

      await client.query(
        `INSERT INTO movements
          (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price,
           reason, user_id, user_name, order_id)
         VALUES ($1,$2,$3,'venta',$4,$5,$6,$7,NULL,$8,$9)`,
        [p.id, p.name, p.sku, it.quantity, Number(p.cost), Number(p.price),
         `Venta online ${orderNumber}`, req.customer.name, order.id]
      );
    }

    await client.query('COMMIT');

    // Correos "best effort": si fallan, la compra ya quedó confirmada igual,
    // solo se registra el error sin romper el checkout.
    if (mailerConfigured()) {
      try {
        await sendOrderConfirmationEmail(order.customer_email, order, emailItems);
      } catch (err) {
        console.error('Error enviando comprobante de compra:', err);
      }
      try {
        const admins = await query("SELECT email FROM users WHERE role = 'admin'");
        await sendNewOrderAdminEmail(admins.map((a) => a.email), order, emailItems);
      } catch (err) {
        console.error('Error notificando pedido nuevo al admin:', err);
      }
    }
    for (const { product, previousStock } of stockAlertCandidates) {
      await checkLowStockAlert(product, previousStock);
    }

    res.status(201).json({
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// Pedidos del cliente actual
router.get('/mine', customerRequired, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, order_number, total, status, payment_method, created_at
     FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.customer.id]
  );
  res.json(rows.map((o) => ({ ...o, total: Number(o.total) })));
}));

router.get('/mine/:id', customerRequired, asyncHandler(async (req, res) => {
  const order = await one(
    'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
    [req.params.id, req.customer.id]
  );
  if (!order) throw httpError(404, 'Pedido no encontrado');
  const items = await query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [order.id]
  );
  res.json({
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    items: items.map((i) => ({
      ...i,
      unit_cost: Number(i.unit_cost),
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
  });
}));

// Cliente: cancela su propio pedido mientras no haya sido enviado (repone stock)
router.put('/mine/:id/cancel', customerRequired, asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE',
      [req.params.id, req.customer.id]
    );
    const order = orderRes.rows[0];
    if (!order) throw httpError(404, 'Pedido no encontrado');
    if (!['pendiente', 'pagado'].includes(order.status)) {
      throw httpError(400, 'Este pedido ya no se puede cancelar');
    }

    const items = (await client.query('SELECT * FROM order_items WHERE order_id = $1', [order.id])).rows;
    for (const it of items) {
      await client.query(
        'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2',
        [it.quantity, it.product_id]
      );
      await client.query(
        `INSERT INTO movements
          (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price,
           reason, user_id, user_name, order_id)
         VALUES ($1,$2,$3,'entrada',$4,$5,$6,$7,NULL,$8,$9)`,
        [it.product_id, it.product_name, it.product_sku, it.quantity, Number(it.unit_cost), Number(it.unit_price),
         `Cancelación de pedido ${order.order_number}`, req.customer.name, order.id]
      );
    }

    const updated = await client.query(
      "UPDATE orders SET status = 'cancelado', updated_at = NOW() WHERE id = $1 RETURNING *",
      [order.id]
    );

    await client.query('COMMIT');
    res.json({ ok: true, status: updated.rows[0].status });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// Admin: listado de todos los pedidos
router.get('/', authRequired, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, order_number, customer_name, customer_email, total, status, created_at
     FROM orders ORDER BY created_at DESC LIMIT 500`
  );
  res.json(rows.map((o) => ({ ...o, total: Number(o.total) })));
}));

router.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const order = await one('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!order) throw httpError(404, 'Pedido no encontrado');
  const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  res.json({
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    items: items.map((i) => ({
      ...i,
      unit_cost: Number(i.unit_cost),
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
  });
}));

router.put('/:id/status', authRequired, asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']),
  });
  const { status } = schema.parse(req.body);
  const o = await one(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!o) throw httpError(404, 'Pedido no encontrado');
  res.json({ ok: true, status: o.status });
}));

module.exports = router;