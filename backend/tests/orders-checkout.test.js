process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV = 'test';

// Cubre las dos guardas de negocio más importantes del checkout (orders.js):
// no vender productos no publicados/inexistentes, y no vender más stock del
// disponible. Ambas corren dentro de una transacción que debe hacer ROLLBACK
// si fallan — se verifica también eso, no solo el código de respuesta.

const FAKE_PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_PRODUCT_ID = '22222222-2222-2222-2222-222222222222';

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock('../src/config/db', () => ({
  one: jest.fn(),
  query: jest.fn(),
  pool: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));
jest.mock('../src/utils/mailer', () => ({
  sendOrderConfirmationEmail: jest.fn(),
  sendNewOrderAdminEmail: jest.fn(),
  isConfigured: jest.fn().mockReturnValue(false),
}));
jest.mock('../src/utils/stockAlerts', () => ({
  checkLowStockAlert: jest.fn(),
}));

const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const db = require('../src/config/db');
const { signCustomerAccess } = require('../src/utils/tokens');
const ordersRoutes = require('../src/routes/orders');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/orders', ordersRoutes);
  app.use(errorHandler);
  return app;
}

const fakeCustomer = {
  id: 'cust-1', email: 'cliente@test.com', name: 'Cliente Test',
  phone: '0999999999', address: 'Calle 123', city: 'Guayaquil',
};

const authedRequest = (app) => {
  const token = signCustomerAccess(fakeCustomer);
  return request(app).post('/api/orders/checkout').set('Cookie', `customer_access_token=${token}`);
};

beforeEach(() => {
  jest.clearAllMocks();
  db.one.mockResolvedValue(fakeCustomer); // customerRequired
  mockClient.query.mockImplementation((sql) => {
    if (typeof sql === 'string' && sql.trim().toUpperCase().startsWith('BEGIN')) return Promise.resolve();
    if (typeof sql === 'string' && sql.trim().toUpperCase().startsWith('ROLLBACK')) return Promise.resolve();
    return Promise.resolve({ rows: [] });
  });
});

describe('POST /api/orders/checkout — guardas de negocio', () => {
  it('rechaza con 400 si algún producto no existe o no está publicado (y hace ROLLBACK)', async () => {
    // Se piden 2 productos pero la consulta (con is_published=true) solo devuelve 1.
    mockClient.query.mockImplementation((sql) => {
      const s = String(sql).trim().toUpperCase();
      if (s.startsWith('BEGIN') || s.startsWith('ROLLBACK')) return Promise.resolve();
      if (s.startsWith('SELECT ID, SKU, NAME, COST, PRICE, STOCK, MIN_STOCK')) {
        return Promise.resolve({ rows: [{ id: FAKE_PRODUCT_ID, sku: 'A', name: 'Producto A', cost: 10, price: 20, stock: 5, min_stock: 1 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await authedRequest(buildApp()).send({
      items: [
        { product_id: FAKE_PRODUCT_ID, quantity: 1 },
        { product_id: OTHER_PRODUCT_ID, quantity: 1 },
      ],
      shipping_address: 'Av. Siempre Viva 742',
    });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/no está disponible|no existe/i);
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('rechaza con 400 si la cantidad pedida supera el stock disponible (y hace ROLLBACK)', async () => {
    mockClient.query.mockImplementation((sql) => {
      const s = String(sql).trim().toUpperCase();
      if (s.startsWith('BEGIN') || s.startsWith('ROLLBACK')) return Promise.resolve();
      if (s.startsWith('SELECT ID, SKU, NAME, COST, PRICE, STOCK, MIN_STOCK')) {
        return Promise.resolve({ rows: [{ id: FAKE_PRODUCT_ID, sku: 'A', name: 'Producto A', cost: 10, price: 20, stock: 2, min_stock: 1 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const res = await authedRequest(buildApp()).send({
      items: [{ product_id: FAKE_PRODUCT_ID, quantity: 5 }],
      shipping_address: 'Av. Siempre Viva 742',
    });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/Stock insuficiente/i);
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('rechaza el checkout sin autenticación de cliente (401), sin llegar a tocar la base de datos', async () => {
    const res = await request(buildApp())
      .post('/api/orders/checkout')
      .send({ items: [{ product_id: FAKE_PRODUCT_ID, quantity: 1 }], shipping_address: 'Av. Siempre Viva 742' });

    expect(res.status).toBe(401);
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it('rechaza payloads inválidos (sin items, o cantidad no positiva) con 400 antes de abrir transacción', async () => {
    const resEmpty = await authedRequest(buildApp()).send({ items: [], shipping_address: 'Av. Siempre Viva 742' });
    expect(resEmpty.status).toBe(400);

    const resBadQty = await authedRequest(buildApp()).send({
      items: [{ product_id: FAKE_PRODUCT_ID, quantity: 0 }],
      shipping_address: 'Av. Siempre Viva 742',
    });
    expect(resBadQty.status).toBe(400);
    expect(db.pool.connect).not.toHaveBeenCalled();
  });
});
