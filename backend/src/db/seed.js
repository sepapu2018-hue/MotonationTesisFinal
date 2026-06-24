require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, query, one } = require('../config/db');

async function seedUsers() {
  // Ponemos correos fijos de prueba ya que no lee el .env
  const adminEmail = 'admin@motonation.com';
  const empEmail = 'empleado@motonation.com';

  const adminExists = await one('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (!adminExists) {
    // Ponemos una contraseña fija: 'admin123'
    const hash = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
      [adminEmail, 'Administrador', hash, 'admin']
    );
    console.log('[seed] admin creado');
  }

  const empExists = await one('SELECT id FROM users WHERE email = $1', [empEmail]);
  if (!empExists) {
    // Ponemos una contraseña fija: 'empleado123'
    const hash = await bcrypt.hash('empleado123', 10);
    await query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
      [empEmail, 'Empleado Demo', hash, 'empleado']
    );
    console.log('[seed] empleado creado');
  }
}

async function seedCategories() {
  const count = await one('SELECT COUNT(*)::int AS c FROM categories');
  if (count.c > 0) return;

  const data = [
    ['Deportivas', 'Motocicletas deportivas de alta cilindrada'],
    ['Naked', 'Motocicletas tipo naked / street'],
    ['Touring', 'Motocicletas para viajes largos'],
    ['Cascos', 'Cascos integrales y modulares'],
    ['Repuestos', 'Repuestos y refacciones'],
    ['Accesorios', 'Guantes, chaquetas y otros'],
  ];

  for (const [name, desc] of data) {
    await query('INSERT INTO categories (name, description) VALUES ($1, $2)', [name, desc]);
  }
  console.log('[seed] categorias creadas');
}

async function seedProducts() {
  const count = await one('SELECT COUNT(*)::int AS c FROM products');
  if (count.c > 0) return;

  const cats = await query('SELECT id, name FROM categories');
  const byName = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  const moto = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?crop=entropy&cs=srgb&fm=jpg&q=85&w=800';
  const acc = 'https://images.unsplash.com/photo-1759776421981-c4ad3c596a10?crop=entropy&cs=srgb&fm=jpg&q=85&w=800';

  const products = [
    ['MN-YZF-R1', 'Yamaha YZF-R1', 'motocicleta', 'Yamaha', 'YZF-R1 2024', byName['Deportivas'], 17500, 24999, 4, 2, moto],
    ['MN-CBR1000', 'Honda CBR 1000RR', 'motocicleta', 'Honda', 'CBR 1000RR', byName['Deportivas'], 15800, 22500, 3, 2, moto],
    ['MN-MT07', 'Yamaha MT-07', 'motocicleta', 'Yamaha', 'MT-07', byName['Naked'], 7200, 9999, 7, 3, moto],
    ['MN-DUKE390', 'KTM Duke 390', 'motocicleta', 'KTM', 'Duke 390', byName['Naked'], 4500, 6299, 5, 3, moto],
    ['MN-GS1250', 'BMW R 1250 GS', 'motocicleta', 'BMW', 'R 1250 GS', byName['Touring'], 23500, 32999, 2, 2, moto],
    ['MN-HLM-AGV', 'Casco AGV Pista GP-RR', 'accesorio', 'AGV', 'Pista GP-RR', byName['Cascos'], 1100, 1599, 12, 5, acc],
    ['MN-HLM-SHOEI', 'Casco Shoei X-Fourteen', 'accesorio', 'Shoei', 'X-Fourteen', byName['Cascos'], 900, 1299, 8, 5, acc],
    ['MN-GLV-ALP', 'Guantes Alpinestars GP Pro', 'accesorio', 'Alpinestars', 'GP Pro R3', byName['Accesorios'], 170, 249, 25, 10, acc],
    ['MN-CHQ-DAI', 'Chaqueta Dainese Racing 4', 'accesorio', 'Dainese', 'Racing 4', byName['Accesorios'], 480, 699, 8, 5, acc],
    ['MN-REP-CHN', 'Cadena DID 520VX3', 'accesorio', 'DID', '520VX3', byName['Repuestos'], 85, 129, 40, 15, acc],
    ['MN-REP-BRK', 'Pastillas Brembo Z04', 'accesorio', 'Brembo', 'Z04', byName['Repuestos'], 55, 89, 18, 10, acc],
  ];

  for (const p of products) {
    await query(
      `INSERT INTO products (sku, name, type, brand, model, category_id, cost, price, stock, min_stock, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      p
    );
  }
  console.log(`[seed] ${products.length} productos creados`);
}

async function seedCustomer() {
  const exists = await one('SELECT id FROM customers WHERE email = $1', ['cliente@demo.com']);
  if (exists) return;
  const hash = await bcrypt.hash('Cliente123!', 10);
  await query(
    `INSERT INTO customers (email, name, password_hash, phone, address, city)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    ['cliente@demo.com', 'Cliente Demo', hash, '+593 99 999 9999', 'Av. Siempre Viva 742', 'Guayaquil']
  );
  console.log('[seed] cliente demo creado');
}

async function run() {
  await seedUsers();
  await seedCategories();
  await seedProducts();
  await seedCustomer();
}

if (require.main === module) {
  run()
    .then(() => { console.log('[seed] OK'); process.exit(0); })
    .catch((e) => { console.error('[seed] error:', e); process.exit(1); });
}

module.exports = { run };