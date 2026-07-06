const { weightedAverageCost } = require('../src/utils/costing');

describe('weightedAverageCost', () => {
  it('promedia el costo existente con el de la mercadería que entra', () => {
    // 10 unidades a 100 + 10 unidades a 200 => costo promedio 150
    expect(weightedAverageCost(10, 100, 10, 200)).toBe(150);
  });

  it('usa el costo de entrada tal cual cuando no había stock previo', () => {
    expect(weightedAverageCost(0, 0, 5, 80)).toBe(80);
  });

  it('pondera proporcionalmente cuando las cantidades son distintas', () => {
    // 30 unidades a 10 + 10 unidades a 50 => (300 + 500) / 40 = 20
    expect(weightedAverageCost(30, 10, 10, 50)).toBe(20);
  });

  it('no cambia el costo si la entrada llega al mismo costo actual', () => {
    expect(weightedAverageCost(15, 75, 5, 75)).toBe(75);
  });
});
