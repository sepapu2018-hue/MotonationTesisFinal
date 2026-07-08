// Rutas públicas — SIN autenticación. Solo expone productos publicados.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { query, one } = require('../config/db');
const { httpError } = require('../middleware/errorHandler');

const router = express.Router();

// Catálogo público — devuelve campos seguros (protegemos la columna 'cost' por privacidad comercial)
const publicFields = `
  id, sku, name, type, brand, model, category_id,
  price, stock, image_url, description, created_at
`;
// La ficha de detalle además expone specs (ficha técnica) e images (galería)
const detailFields = `${publicFields}, specs, images`;

// 1. OBTENER TODO EL CATÁLOGO PÚBLICO CON FILTROS
router.get('/products', asyncHandler(async (req, res) => {
  const { q, type, category_id, in_stock, brand, min_price, max_price } = req.query;
  const where = ['is_published = true'];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(name ILIKE $${i} OR brand ILIKE $${i} OR model ILIKE $${i})`);
  }

  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }

  if (category_id) {
    params.push(category_id);
    where.push(`category_id = $${params.length}`);
  }

  if (brand) {
    params.push(brand);
    where.push(`brand = $${params.length}`);
  }

  if (min_price) {
    params.push(Number(min_price));
    where.push(`price >= $${params.length}`);
  }

  if (max_price) {
    params.push(Number(max_price));
    where.push(`price <= $${params.length}`);
  }

  if (in_stock === 'true') {
    where.push(`stock > 0`);
  }

  const sql = `
    SELECT ${publicFields}
    FROM products
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
  `;

  const rows = await query(sql, params);
  res.json(rows.map((p) => ({ ...p, price: Number(p.price) })));
}));

// Marcas disponibles (para el filtro de la tienda)
router.get('/brands', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT DISTINCT brand FROM products
    WHERE is_published = true AND brand <> ''
    ORDER BY brand ASC
  `);
  res.json(rows.map((r) => r.brand));
}));

// 2. OBTENER DETALLE DE UN PRODUCTO POR SU SKU (incluye ficha técnica y productos relacionados)
router.get('/products/:sku', asyncHandler(async (req, res) => {
  const p = await one(
    `SELECT ${detailFields}
     FROM products
     WHERE sku = $1 AND is_published = true`,
    [req.params.sku]
  );

  if (!p) throw httpError(404, 'Producto no encontrado');

  const related = await query(
    `SELECT ${publicFields} FROM products
     WHERE category_id = $1 AND id <> $2 AND is_published = true
     ORDER BY created_at DESC LIMIT 4`,
    [p.category_id, p.id]
  );

  res.json({
    ...p,
    price: Number(p.price),
    related_products: related.map((r) => ({ ...r, price: Number(r.price) })),
  });
}));

// 3. OBTENER CATEGORÍAS CON CONTADOR DE ÍTEMS PUBLICADOS
router.get('/categories', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT
      c.id,
      c.name,
      c.description,
      COUNT(p.id) FILTER (WHERE p.is_published = true)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.description
    ORDER BY c.name ASC
  `);

  res.json(rows);
}));

// 4. MOSTRAR PRODUCTOS DESTACADOS EN LA HOME DE LA TIENDA
router.get('/featured', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT ${publicFields}
    FROM products
    WHERE is_published = true
      AND stock > 0
    ORDER BY price DESC
    LIMIT 6
  `);

  res.json(rows.map((p) => ({
    ...p,
    price: Number(p.price)
  })));
}));

// Solo se muestran (y se conservan) las reseñas más recientes.
// IMPORTANTE: el cap de MAX_REVIEWS aplica solo a los testimonios generales
// (product_id IS NULL) — las reseñas de producto no se borran automáticamente.
const MAX_REVIEWS = 3;

function validateReviewInput({ name, city, rating, text }) {
  if (!name || !String(name).trim()) throw httpError(400, 'El nombre es obligatorio');
  if (!city || !String(city).trim()) throw httpError(400, 'La ciudad es obligatoria');
  if (!text || !String(text).trim()) throw httpError(400, 'El comentario es obligatorio');
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw httpError(400, 'La calificación debe ser un número entre 1 y 5');
  }
  return { name: String(name).trim(), city: String(city).trim(), rating: ratingNum, text: String(text).trim() };
}

// 5. OBTENER RESEÑAS PUBLICADAS (testimonios generales, más recientes primero)
router.get('/reviews', asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT id, name, city, rating, text, created_at
    FROM reviews
    WHERE is_published = true AND product_id IS NULL
    ORDER BY created_at DESC
    LIMIT $1
  `, [MAX_REVIEWS]);

  res.json(rows);
}));

// 6. CREAR UNA NUEVA RESEÑA GENERAL (pública, sin autenticación)
router.post('/reviews', asyncHandler(async (req, res) => {
  const data = validateReviewInput(req.body);

  const row = await one(
    `INSERT INTO reviews (name, city, rating, text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, city, rating, text, created_at`,
    [data.name, data.city, data.rating, data.text]
  );

  // Solo se conservan las MAX_REVIEWS testimonios generales más recientes
  await query(
    `DELETE FROM reviews WHERE product_id IS NULL AND id IN (
       SELECT id FROM reviews WHERE product_id IS NULL ORDER BY created_at DESC OFFSET $1
     )`,
    [MAX_REVIEWS]
  );

  res.status(201).json(row);
}));

// 7. RESEÑAS DE UN PRODUCTO ESPECÍFICO (sin cap, se acumulan)
router.get('/products/:sku/reviews', asyncHandler(async (req, res) => {
  const product = await one('SELECT id FROM products WHERE sku = $1 AND is_published = true', [req.params.sku]);
  if (!product) throw httpError(404, 'Producto no encontrado');

  const rows = await query(`
    SELECT id, name, city, rating, text, created_at
    FROM reviews
    WHERE is_published = true AND product_id = $1
    ORDER BY created_at DESC
  `, [product.id]);

  res.json(rows);
}));

router.post('/products/:sku/reviews', asyncHandler(async (req, res) => {
  const product = await one('SELECT id FROM products WHERE sku = $1 AND is_published = true', [req.params.sku]);
  if (!product) throw httpError(404, 'Producto no encontrado');

  const data = validateReviewInput(req.body);

  const row = await one(
    `INSERT INTO reviews (name, city, rating, text, product_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, city, rating, text, created_at`,
    [data.name, data.city, data.rating, data.text, product.id]
  );

  res.status(201).json(row);
}));

module.exports = router;