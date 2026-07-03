const { computeOrderTotals, generateOrderNumber, TAX_RATE } = require('../src/utils/pricing');

describe('computeOrderTotals', () => {
  it('calcula subtotal, IVA (15%) y total para una sola línea', () => {
    const { subtotal, tax, total } = computeOrderTotals([{ price: 100, quantity: 2 }]);
    expect(subtotal).toBe(200);
    expect(tax).toBe(30);
    expect(total).toBe(230);
  });

  it('suma correctamente varias líneas con precios decimales', () => {
    const { subtotal, tax, total } = computeOrderTotals([
      { price: 19.99, quantity: 3 },
      { price: 5.5, quantity: 1 },
    ]);
    expect(subtotal).toBe(65.47);
    expect(tax).toBeCloseTo(9.82, 2);
    expect(total).toBeCloseTo(75.29, 2);
  });

  it('no acumula error de punto flotante en muchas líneas pequeñas', () => {
    const lines = Array.from({ length: 10 }, () => ({ price: 0.1, quantity: 1 }));
    const { subtotal } = computeOrderTotals(lines);
    expect(subtotal).toBe(1);
  });

  it('usa la tasa de IVA del 15% definida para Ecuador', () => {
    expect(TAX_RATE).toBe(0.15);
  });
});

describe('generateOrderNumber', () => {
  it('genera un número con el prefijo MN- y longitud consistente', () => {
    const n = generateOrderNumber();
    expect(n).toMatch(/^MN-\d{11}$/);
  });

  it('genera valores distintos en llamadas sucesivas', () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).not.toBe(b);
  });
});
