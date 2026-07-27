require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, one } = require('../config/db');

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