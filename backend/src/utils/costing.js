// Costeo por promedio ponderado: al entrar mercadería a un costo distinto del
// actual, el nuevo costo del producto es el promedio entre el stock existente
// (a su costo actual) y lo que entra (a su costo de compra).
function weightedAverageCost(currentStock, currentCost, incomingQty, incomingCost) {
  if (currentStock <= 0) return incomingCost;
  const totalUnits = currentStock + incomingQty;
  return (currentStock * currentCost + incomingQty * incomingCost) / totalUnits;
}

module.exports = { weightedAverageCost };
