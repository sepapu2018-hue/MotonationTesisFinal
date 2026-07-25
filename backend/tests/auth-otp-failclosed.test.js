process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV = 'test';

// Este test fija la regresión de un bug de seguridad real: antes, si el envío
// de correo (OTP de login / reset de contraseña) fallaba —o directamente no
// estaba configurado—, el código/token se devolvía igual en la respuesta JSON.
// Eso permitía tomar cualquier cuenta sin acceso al correo real. Ahora debe
// "fallar cerrado": si el mailer está configurado, nunca se expone el secreto,
// pase lo que pase con el envío.

jest.mock('../src/config/db', () => ({
  one: jest.fn(),
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));
jest.mock('../src/utils/mailer', () => ({
  sendLoginOtpEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  isConfigured: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const mailer = require('../src/utils/mailer');
const authRoutes = require('../src/routes/auth');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

const fakeUser = {
  id: 'u1', email: 'empleado@test.com', name: 'Empleado Test', role: 'empleado',
  avatar_url: '', permissions: [], password_hash: 'hashed',
};

beforeEach(() => {
  jest.clearAllMocks();
  db.one.mockResolvedValue(fakeUser);
  db.query.mockResolvedValue([]);
  bcrypt.compare.mockResolvedValue(true);
});

describe('POST /api/auth/login — envío de OTP', () => {
  it('con mailer configurado y envío exitoso: NO expone dev_otp_code', async () => {
    mailer.isConfigured.mockReturnValue(true);
    mailer.sendLoginOtpEmail.mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: fakeUser.email, password: 'whatever' });

    expect(res.status).toBe(200);
    expect(res.body.otp_required).toBe(true);
    expect(res.body.dev_otp_code).toBeUndefined();
  });

  it('con mailer configurado pero el envío FALLA: responde error y NO expone el código (fail-closed)', async () => {
    mailer.isConfigured.mockReturnValue(true);
    mailer.sendLoginOtpEmail.mockRejectedValue(new Error('SMTP caído'));

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: fakeUser.email, password: 'whatever' });

    expect(res.status).toBe(502);
    expect(res.body.dev_otp_code).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\d{6}/); // ningún código de 6 dígitos filtrado
  });

  it('sin mailer configurado y en producción: responde error y NO expone el código', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    // Re-requerir con NODE_ENV=production para que el módulo capture isProd=true
    jest.doMock('../src/config/db', () => db);
    jest.doMock('../src/utils/mailer', () => mailer);
    jest.doMock('bcryptjs', () => bcrypt);
    const authRoutesProd = require('../src/routes/auth');
    const { errorHandler: errorHandlerProd } = require('../src/middleware/errorHandler');
    const appProd = express();
    appProd.use(express.json());
    appProd.use(cookieParser());
    appProd.use('/api/auth', authRoutesProd);
    appProd.use(errorHandlerProd);

    mailer.isConfigured.mockReturnValue(false);

    const res = await request(appProd)
      .post('/api/auth/login')
      .send({ email: fakeUser.email, password: 'whatever' });

    expect(res.status).toBe(502);
    expect(res.body.dev_otp_code).toBeUndefined();

    process.env.NODE_ENV = 'test';
  });

  it('sin mailer configurado en desarrollo: sí devuelve dev_otp_code (conveniencia local, no en prod)', async () => {
    mailer.isConfigured.mockReturnValue(false);

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: fakeUser.email, password: 'whatever' });

    expect(res.status).toBe(200);
    expect(res.body.dev_otp_code).toMatch(/^\d{6}$/);
  });

  it('con credenciales inválidas responde 401 sin intentar enviar OTP', async () => {
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: fakeUser.email, password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(mailer.sendLoginOtpEmail).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('con mailer configurado pero el envío falla: responde ok genérico y NO expone el token', async () => {
    mailer.isConfigured.mockReturnValue(true);
    mailer.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP caído'));
    db.one.mockResolvedValue({ id: 'u1' });

    const res = await request(buildApp())
      .post('/api/auth/forgot-password')
      .send({ email: 'empleado@test.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.body.dev_reset_token).toBeUndefined();
  });

  it('con un correo que no existe: responde ok genérico igual (no revela qué cuentas existen)', async () => {
    mailer.isConfigured.mockReturnValue(true);
    db.one.mockResolvedValue(null);

    const res = await request(buildApp())
      .post('/api/auth/forgot-password')
      .send({ email: 'no-existe@test.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
