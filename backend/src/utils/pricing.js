const TAX_RATE = 0.15;

function computeOrderTotals(lines) {
  let subtotal = 0;
  for (const { price, quantity } of lines) {
    subtotal += Number((Number(price) * quantity).toFixed(2));
  }
  subtotal = Number(subtotal.toFixed(2));
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { subtotal, tax, total };
}

function generateOrderNumber() {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MN-${ts}${rand}`;
}

module.exports = { TAX_RATE, computeOrderTotals, generateOrderNumber };
