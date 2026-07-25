process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';

const { adminRequired, permissionRequired } = require('../src/middleware/auth');

// Helpers: req/res/next falsos, sin tocar Express ni la base de datos real.
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('permissionRequired', () => {
  it('bloquea con 401 si no hay usuario autenticado en la request', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    permissionRequired('view_reports')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deja pasar a un admin aunque su columna permissions esté vacía', () => {
    // Caso real: los admins no necesitan permisos explícitos, su acceso es por rol.
    // Este es exactamente el bug que se coló al agregar el chequeo de permisos:
    // un admin con permissions=[] quedaba bloqueado en todas las rutas gateadas.
    const req = { user: { role: 'admin', permissions: [] } };
    const res = mockRes();
    const next = jest.fn();

    permissionRequired('view_reports')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deja pasar a un empleado que tiene uno de los permisos requeridos', () => {
    const req = { user: { role: 'empleado', permissions: ['view_kardex'] } };
    const res = mockRes();
    const next = jest.fn();

    permissionRequired('create_sale', 'view_dashboard')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deja pasar si el empleado tiene AL MENOS UNO de varios permisos aceptados (lógica OR)', () => {
    // Ej: GET /api/dashboard/low-stock lo usan tanto Dashboard (view_dashboard)
    // como Alertas (view_alerts) — cualquiera de los dos debe alcanzar.
    const req = { user: { role: 'empleado', permissions: ['view_alerts'] } };
    const res = mockRes();
    const next = jest.fn();

    permissionRequired('view_dashboard', 'view_alerts')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('bloquea con 403 a un empleado sin ninguno de los permisos requeridos', () => {
    const req = { user: { role: 'empleado', permissions: ['view_reports'] } };
    const res = mockRes();
    const next = jest.fn();

    permissionRequired('view_categories', 'view_products')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.any(String) }));
  });

  it('trata permissions ausente/null como sin permisos (no revienta, solo bloquea)', () => {
    const req = { user: { role: 'empleado', permissions: null } };
    const res = mockRes();
    const next = jest.fn();

    expect(() => permissionRequired('view_reports')(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('adminRequired', () => {
  it('bloquea con 403 a un empleado', () => {
    const req = { user: { role: 'empleado' } };
    const res = mockRes();
    const next = jest.fn();

    adminRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deja pasar a un admin', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    adminRequired(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
