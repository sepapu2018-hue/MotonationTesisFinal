// Captura errores en handlers async sin tener que envolver cada uno en try/catch
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);