require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, one } = require('../config/db');
const { computeOrderTotals, generateOrderNumber } = require('../utils/pricing');

async function seedUsers() {
  // Ponemos correos fijos de prueba ya que no lee el .env
  const adminEmail = 'admin@motonation.com';
  const empEmail = 'empleado@motonation.com';

  // INSERT ... ON CONFLICT DO NOTHING en vez de "check-then-insert": en Vercel pueden
  // arrancar varias instancias en paralelo en el primer tráfico y correr el seed a la
  // vez, así que el chequeo previo (SELECT) no evita la carrera entre instancias.
  const adminHash = await bcrypt.hash('admin123', 10);
  await query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [adminEmail, 'Administrador', adminHash, 'admin']
  );

  const empHash = await bcrypt.hash('empleado123', 10);
  await query(
    `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [empEmail, 'Empleado Demo', empHash, 'empleado']
  );
}

async function seedCategories() {
  const data = [
    ['Deportivas', 'Motocicletas deportivas de alta cilindrada'],
    ['Naked', 'Motocicletas tipo naked / street'],
    ['Touring', 'Motocicletas para viajes largos'],
    ['Cascos', 'Cascos integrales y modulares'],
    ['Repuestos', 'Repuestos y refacciones'],
    ['Accesorios', 'Guantes, chaquetas y otros'],
  ];

  for (const [name, desc] of data) {
    await query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [name, desc]
    );
  }
}

async function seedProducts() {
  const cats = await query('SELECT id, name FROM categories');
  const byName = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // Fotos reales (no genéricas) de cada producto, descargadas de sus fuentes
  // oficiales (Wikimedia Commons para las motos, sitio oficial del fabricante
  // para los accesorios) — ver docs/CREDITOS_IMAGENES.md para la atribución
  // completa de cada una. Los guantes GP Pro R3 y la chaqueta Racing 4
  // aparecían descontinuados en el sitio del fabricante (sin foto real
  // verificable), así que el catálogo usa su sucesor vigente de la misma
  // línea (GP Pro RS4 / Racing 5), que sí tiene foto real disponible.

  const products = [
    ['MN-YZF-R1', 'Yamaha YZF-R1', 'motocicleta', 'Yamaha', 'YZF-R1 2024', byName['Deportivas'], 17500, 24999, 4, 2, '/images/products/yamaha-yzf-r1.jpg'],
    ['MN-CBR1000', 'Honda CBR 1000RR', 'motocicleta', 'Honda', 'CBR 1000RR', byName['Deportivas'], 15800, 22500, 3, 2, '/images/products/honda-cbr1000rr.jpg'],
    ['MN-MT07', 'Yamaha MT-07', 'motocicleta', 'Yamaha', 'MT-07', byName['Naked'], 7200, 9999, 7, 3, '/images/products/yamaha-mt07.jpg'],
    ['MN-DUKE390', 'KTM Duke 390', 'motocicleta', 'KTM', 'Duke 390', byName['Naked'], 4500, 6299, 5, 3, '/images/products/ktm-duke-390.jpg'],
    ['MN-GS1250', 'BMW R 1250 GS', 'motocicleta', 'BMW', 'R 1250 GS', byName['Touring'], 23500, 32999, 2, 2, '/images/products/bmw-r1250gs.jpg'],
    ['MN-S1000RR', 'BMW S1000RR', 'motocicleta', 'BMW', 'S1000RR', byName['Deportivas'], 19800, 27999, 3, 2, '/images/products/bmw-s1000rr.jpg'],
    ['MN-HLM-AGV', 'Casco AGV Pista GP-RR', 'accesorio', 'AGV', 'Pista GP-RR', byName['Cascos'], 1100, 1599, 12, 5, '/images/products/agv-pista-gp-rr.jpg'],
    ['MN-HLM-SHOEI', 'Casco Shoei X-Fourteen', 'accesorio', 'Shoei', 'X-Fourteen', byName['Cascos'], 900, 1299, 8, 5, '/images/products/shoei-x-fourteen.png'],
    ['MN-GLV-ALP', 'Guantes Alpinestars GP Pro RS4', 'accesorio', 'Alpinestars', 'GP Pro RS4', byName['Accesorios'], 190, 299, 25, 10, '/images/products/alpinestars-gp-pro-rs4.png'],
    ['MN-CHQ-DAI', 'Chaqueta Dainese Racing 5', 'accesorio', 'Dainese', 'Racing 5', byName['Accesorios'], 520, 749, 8, 5, '/images/products/dainese-racing-5.jpg'],
    ['MN-REP-CHN', 'Cadena DID 520VX3', 'accesorio', 'DID', '520VX3', byName['Repuestos'], 85, 129, 40, 15, '/images/products/did-520vx3.jpg'],
    ['MN-REP-BRK', 'Pastillas Brembo Z04', 'accesorio', 'Brembo', 'Z04', byName['Repuestos'], 55, 89, 18, 10, '/images/products/brembo-z04.jpg'],
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (sku, name, type, brand, model, category_id, cost, price, stock, min_stock, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (sku) DO NOTHING`,
      p
    );
  }
}

async function seedCustomer() {
  const hash = await bcrypt.hash('Cliente123!', 10);
  await query(
    `INSERT INTO customers (email, name, password_hash, phone, address, city)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (email) DO NOTHING`,
    ['cliente@demo.com', 'Cliente Demo', hash, '+593 99 999 9999', 'Av. Siempre Viva 742', 'Guayaquil']
  );
}

async function seedSuppliers() {
  const data = [
    ['Andes Motos Import', 'Carlos Vega', '+593 98 123 4567', 'ventas@andesmotos.ec'],
    ['Repuestos del Pacífico', 'María Salas', '+593 99 234 5678', 'contacto@repuestospacifico.ec'],
    ['Gear Import Ecuador', 'Luis Andrade', '+593 97 345 6789', 'info@gearimport.ec'],
  ];
  for (const [name, contact, phone, email] of data) {
    await query(
      'INSERT INTO suppliers (name, contact, phone, email) VALUES ($1,$2,$3,$4) ON CONFLICT (name) DO NOTHING',
      [name, contact, phone, email]
    );
  }
}

// Un movimiento de 'entrada' por producto (el stock inicial con el que arranca
// la demo), ligado a un proveedor real del seed, para que Kárdex/Movimientos
// no arranquen completamente vacíos.
async function seedMovements() {
  const already = await one('SELECT id FROM movements LIMIT 1');
  if (already) return;

  const products = await query('SELECT id, name, sku, cost, stock FROM products');
  const suppliers = await query('SELECT id, name FROM suppliers');
  if (products.length === 0 || suppliers.length === 0) return;

  let i = 0;
  for (const p of products) {
    const supplier = suppliers[i % suppliers.length];
    i++;
    await query(
      `INSERT INTO movements
        (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price,
         reason, user_name, supplier_id, supplier_name, created_at)
       VALUES ($1,$2,$3,'entrada',$4,$5,0,$6,$7,$8,$9, NOW() - INTERVAL '20 days')`,
      [p.id, p.name, p.sku, p.stock, Number(p.cost), 'Stock inicial', 'Sistema (seed)', supplier.id, supplier.name]
    );
  }
}

// Pedidos de ejemplo del cliente demo, con sus order_items y el movimiento de
// 'venta' correspondiente (igual que el checkout real), para que Pedidos,
// Reportes y el Dashboard tengan datos con los que probar filtros y gráficos.
async function seedOrders() {
  const already = await one('SELECT id FROM orders LIMIT 1');
  if (already) return;

  const customer = await one("SELECT id, name, email, phone FROM customers WHERE email = 'cliente@demo.com'");
  if (!customer) return;

  const products = await query('SELECT id, name, sku, cost, price FROM products ORDER BY sku');
  if (products.length < 2) return;

  const sampleOrders = [
    { items: [{ p: products[0], qty: 1 }], status: 'entregado', daysAgo: 14 },
    { items: [{ p: products[1], qty: 1 }, { p: products[6] || products[1], qty: 1 }], status: 'enviado', daysAgo: 5 },
    { items: [{ p: products[2] || products[0], qty: 1 }], status: 'pagado', daysAgo: 1 },
  ];

  for (const o of sampleOrders) {
    const lines = o.items.map(({ p, qty }) => ({ price: Number(p.price), quantity: qty }));
    const { subtotal, tax, total } = computeOrderTotals(lines);
    const orderNumber = generateOrderNumber();
    const order = await one(
      `INSERT INTO orders
        (order_number, customer_id, customer_name, customer_email, customer_phone,
         shipping_address, subtotal, tax, total, status, payment_method, payment_ref, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'simulado',$11, NOW() - $12::interval, NOW() - $12::interval)
       RETURNING id, order_number`,
      [
        orderNumber, customer.id, customer.name, customer.email, customer.phone,
        'Av. Siempre Viva 742, Guayaquil', subtotal, tax, total, o.status,
        'SIM-' + Math.random().toString(36).slice(2, 10).toUpperCase(), `${o.daysAgo} days`,
      ]
    );

    for (const { p, qty } of o.items) {
      const itemSubtotal = Number((Number(p.price) * qty).toFixed(2));
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_cost, unit_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, p.id, p.name, p.sku, Number(p.cost), Number(p.price), qty, itemSubtotal]
      );
      await query(
        `INSERT INTO movements
          (product_id, product_name, product_sku, type, quantity, unit_cost, unit_price,
           reason, user_name, order_id, created_at)
         VALUES ($1,$2,$3,'venta',$4,$5,$6,$7,$8,$9, NOW() - $10::interval)`,
        [p.id, p.name, p.sku, qty, Number(p.cost), Number(p.price), `Venta online ${order.order_number}`, customer.name, order.id, `${o.daysAgo} days`]
      );
      await query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [qty, p.id]);
    }
  }
}

async function seedReviews() {
  const already = await one('SELECT id FROM reviews LIMIT 1');
  if (already) return;

  const general = [
    ['Andrés Molina', 'Quito', 5, 'Excelente atención y la moto llegó en perfecto estado. Totalmente recomendados.'],
    ['Paola Rivas', 'Cuenca', 5, 'El proceso de compra fue muy fácil y el soporte respondió todas mis dudas rápido.'],
    ['Diego Toapanta', 'Guayaquil', 4, 'Buenos precios y variedad de accesorios. El envío tardó un poco más de lo esperado.'],
  ];
  for (const [name, city, rating, text] of general) {
    await query(
      'INSERT INTO reviews (name, city, rating, text, is_published) VALUES ($1,$2,$3,$4,true)',
      [name, city, rating, text]
    );
  }

  const moto = await one("SELECT id FROM products WHERE sku = 'MN-MT07'");
  if (moto) {
    await query(
      'INSERT INTO reviews (name, city, rating, text, is_published, product_id) VALUES ($1,$2,$3,$4,true,$5)',
      ['Fernando Castro', 'Ambato', 5, 'La MT-07 rinde muchísimo para uso diario y en ruta. Muy contento con la compra.', moto.id]
    );
  }
}

async function run() {
  await seedUsers();
  await seedCategories();
  await seedProducts();
  await seedCustomer();
  await seedSuppliers();
  await seedMovements();
  await seedOrders();
  await seedReviews();
}

if (require.main === module) {
  run()
    .then(() => { console.log('[seed] OK'); process.exit(0); })
    .catch((e) => { console.error('[seed] error:', e); process.exit(1); });
}

module.exports = { run };