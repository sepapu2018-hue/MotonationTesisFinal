// Chatbot de atención al cliente — basado en reglas, sin IA externa ni costo.
// Ruta pública (sin autenticación), ligada al catálogo real vía chatbotEngine.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { handleMessage } = require('../utils/chatbotEngine');

const router = express.Router();

// Evita abuso del endpoint sin limitar una conversación normal de un visitante.
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Demasiados mensajes seguidos. Espera un momento antes de continuar.' },
});

const messageSchema = z.object({
  message: z.string().min(1).max(300),
});

router.post('/message', chatLimiter, asyncHandler(async (req, res) => {
  const { message } = messageSchema.parse(req.body);
  const result = await handleMessage(message);
  res.json(result);
}));

module.exports = router;
