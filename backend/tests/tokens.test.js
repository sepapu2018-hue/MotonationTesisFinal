process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

const jwt = require('jsonwebtoken');
const {
  signAccess, signRefresh, signCustomerAccess, signCustomerRefresh, verify,
} = require('../src/utils/tokens');

const staffUser = { id: 'user-1', email: 'staff@test.com', role: 'admin' };
const customerUser = { id: 'cust-1', email: 'cliente@test.com' };

describe('tokens de staff', () => {
  it('firma un access token con kind=staff y los datos del usuario', () => {
    const token = signAccess(staffUser);
    const payload = verify(token);
    expect(payload.sub).toBe(staffUser.id);
    expect(payload.email).toBe(staffUser.email);
    expect(payload.role).toBe(staffUser.role);
    expect(payload.kind).toBe('staff');
    expect(payload.type).toBe('access');
  });

  it('firma un refresh token sin exponer el email/rol', () => {
    const token = signRefresh(staffUser);
    const payload = verify(token);
    expect(payload.sub).toBe(staffUser.id);
    expect(payload.type).toBe('refresh');
    expect(payload.email).toBeUndefined();
  });
});

describe('tokens de cliente', () => {
  it('firma un access token con kind=customer', () => {
    const token = signCustomerAccess(customerUser);
    const payload = verify(token);
    expect(payload.sub).toBe(customerUser.id);
    expect(payload.kind).toBe('customer');
    expect(payload.type).toBe('access');
  });

  it('firma un refresh token de cliente', () => {
    const token = signCustomerRefresh(customerUser);
    const payload = verify(token);
    expect(payload.kind).toBe('customer');
    expect(payload.type).toBe('refresh');
  });
});

describe('verify', () => {
  it('rechaza un token firmado con otra clave', () => {
    const forged = jwt.sign({ sub: 'x', kind: 'staff' }, 'otra-clave-distinta');
    expect(() => verify(forged)).toThrow();
  });

  it('rechaza un token expirado', () => {
    const expired = jwt.sign({ sub: staffUser.id }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verify(expired)).toThrow();
  });

  it('rechaza un token malformado', () => {
    expect(() => verify('esto-no-es-un-jwt')).toThrow();
  });
});
