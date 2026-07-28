// Motor de chatbot basado en reglas (sin IA externa, sin costo, sin API keys).
// Clasifica el mensaje por coincidencia de palabras clave y, cuando corresponde,
// consulta el catálogo real para responder disponibilidad/precio con datos vivos.
const { query } = require('../config/db');

const BUSINESS = {
  horario: 'Lunes a sábado de 9:00 a 19:00.',
  direccion: 'Av. La Prensa N47-131 y Jorge Páez, Quito, Ecuador',
  telefono: '+593 99 999 9999',
  correo: 'contacto@motonation.com',
};

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos (marcas combinadas tras NFD)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Coincide contra el mensaje completo (no por token) para soportar palabras
// clave de más de una palabra, ej. "donde estan" o "como llegar".
function scoreKeywords(normalizedMsg, keywords) {
  let score = 0;
  for (const kw of keywords) {
    if (normalizedMsg.includes(kw)) score += 1;
  }
  return score;
}

// Intenciones fijas (no dependen del catálogo). Se evalúan por coincidencia de palabras clave.
const STATIC_INTENTS = [
  {
    name: 'asesor_humano',
    keywords: ['asesor', 'humano', 'persona', 'alguien', 'agente', 'operador'],
    reply: () =>
      `Con gusto te comunico con el equipo de MotoNation: 📞 ${BUSINESS.telefono} · ✉️ ${BUSINESS.correo}. Horario de atención: ${BUSINESS.horario}`,
  },
  {
    name: 'horario',
    keywords: ['horario', 'hora', 'abren', 'cierran', 'atienden', 'abierto', 'cerrado'],
    reply: () => `Nuestro horario de atención es: ${BUSINESS.horario}`,
  },
  {
    name: 'ubicacion',
    keywords: ['ubicacion', 'direccion', 'donde estan', 'como llegar', 'mapa', 'local', 'tienda fisica', 'sucursal'],
    reply: () => `Estamos en ${BUSINESS.direccion}. ¡Te esperamos!`,
  },
  {
    name: 'contacto',
    keywords: ['contacto', 'telefono', 'whatsapp', 'numero', 'llamar', 'email', 'correo'],
    reply: () => `Puedes contactarnos al ${BUSINESS.telefono} o escribirnos a ${BUSINESS.correo}.`,
  },
  {
    name: 'pago',
    keywords: ['pago', 'pagar', 'tarjeta', 'efectivo', 'cuotas', 'metodos de pago', 'transferencia'],
    reply: () =>
      'Aceptamos pago con tarjeta y otros métodos habilitados en el checkout de la tienda. Puedes revisar las opciones disponibles al finalizar tu compra en el carrito.',
  },
  {
    name: 'envio',
    keywords: ['envio', 'entrega', 'domicilio', 'demora', 'demoran', 'tiempo de entrega', 'despacho'],
    reply: () =>
      'Coordinamos la entrega una vez confirmado tu pedido; recibirás un correo con el número de pedido y el detalle de tu compra apenas se confirme.',
  },
  {
    name: 'garantia',
    keywords: ['garantia', 'devolucion', 'cambio', 'defectuoso', 'reembolso'],
    reply: () =>
      `Si tienes un problema con tu compra escríbenos a ${BUSINESS.correo} o llámanos al ${BUSINESS.telefono} y te ayudamos con el cambio o la garantía correspondiente.`,
  },
  {
    name: 'como_comprar',
    keywords: ['comprar', 'como funciona', 'pasos', 'hacer un pedido', 'como pido', 'checkout'],
    reply: () =>
      'Es muy fácil: 1) Explora el catálogo en "Tienda", 2) agrega productos al carrito, 3) inicia sesión o crea una cuenta, 4) confirma tu pedido en el checkout. Te llegará un correo con el comprobante.',
  },
  {
    name: 'resenas',
    keywords: ['resena', 'resenas', 'opinion', 'opiniones', 'comentarios', 'testimonio'],
    reply: () => 'Puedes ver reseñas de clientes en la página de inicio y en el detalle de cada producto. ¡También puedes dejar la tuya!',
  },
  {
    name: 'saludo',
    keywords: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'que tal'],
    reply: () => '¡Hola! Soy el asistente virtual de MotoNation 🏍️. Puedo ayudarte con disponibilidad de motos/accesorios, horarios, ubicación, métodos de pago y más. ¿Qué necesitas?',
  },
  {
    name: 'despedida',
    keywords: ['chao', 'adios', 'gracias', 'hasta luego', 'nos vemos', 'bye'],
    reply: () => '¡Gracias por escribirnos! Si necesitas algo más, aquí estaré. 🏍️',
  },
];

// Palabras inequívocas de consulta de catálogo: si aparecen, el catálogo real
// gana sobre cualquier intención estática (es la razón de ser del chatbot
// ligado al inventario en vivo, no un FAQ estático).
const STRONG_PRODUCT_WORDS = [
  'disponible', 'disponibles', 'stock', 'catalogo', 'precio', 'precios',
  'cuesta', 'cuestan', 'vale', 'valen', 'modelo', 'modelos', 'venden',
];

// Palabras ambiguas: aparecen tanto en consultas de producto ("tienen motos")
// como en otras intenciones ("tienen horario los sabados"). Solo se usan para
// decidir una búsqueda de catálogo cuando ninguna intención estática matcheó.
const WEAK_PRODUCT_WORDS = ['tienen', 'tiene', 'hay', 'busco', 'buscando', 'quiero', 'necesito', 'oferta'];

// Palabras sin valor discriminante para buscar en el catálogo (se descartan del término de búsqueda).
const STOPWORDS = new Set([
  ...STRONG_PRODUCT_WORDS,
  ...WEAK_PRODUCT_WORDS,
  'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'al', 'en',
  'para', 'por', 'que', 'cual', 'cuales', 'como', 'con', 'y', 'o', 'a', 'se', 'su', 'sus',
  'me', 'interesa', 'interesan', 'algun', 'alguna', 'algunos', 'algunas',
  'moto', 'motos', 'motocicleta', 'motocicletas', 'accesorio', 'accesorios',
  'producto', 'productos', 'hola', 'buenas', 'porfa', 'porfavor', 'favor',
]);

function extractSearchTokens(normalizedMsg) {
  return normalizedMsg
    .split(' ')
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

async function searchProducts(tokens, normalizedMsg) {
  // Catálogo de un solo concesionario: se trae publicado y se puntúa en memoria,
  // evita armar SQL dinámico frágil para un volumen de datos pequeño.
  const rows = await query(`
    SELECT p.id, p.sku, p.name, p.brand, p.model, p.type, p.price, p.stock, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_published = true
  `);

  let candidates = rows;

  if (tokens.length > 0) {
    const scored = rows
      .map((p) => {
        const haystack = normalize(`${p.name} ${p.brand} ${p.model} ${p.category_name || ''} ${p.sku}`);
        const matches = tokens.filter((t) => haystack.includes(t)).length;
        return { p, matches };
      })
      .filter((s) => s.matches > 0)
      .sort((a, b) => b.matches - a.matches || b.p.stock - a.p.stock);
    candidates = scored.map((s) => s.p);
  } else {
    // Sin término específico: al menos filtrar por tipo si el mensaje lo menciona.
    if (normalizedMsg.includes('accesorio') || normalizedMsg.includes('casco')) {
      candidates = rows.filter((p) => p.type === 'accesorio');
    } else if (normalizedMsg.includes('moto')) {
      candidates = rows.filter((p) => p.type === 'motocicleta');
    }
    candidates = candidates.sort((a, b) => b.stock - a.stock);
  }

  return candidates.slice(0, 5);
}

async function handleMessage(rawMessage) {
  const normalized = normalize(rawMessage);
  if (!normalized) {
    return { intent: 'vacio', reply: 'No recibí ningún mensaje. ¿En qué puedo ayudarte?' };
  }

  const hasStrongProductSignal = STRONG_PRODUCT_WORDS.some((w) => normalized.includes(w));
  const hasWeakProductSignal = WEAK_PRODUCT_WORDS.some((w) => normalized.includes(w));

  // Mejor intención estática por puntaje de palabras clave
  let bestIntent = null;
  let bestScore = 0;
  for (const intent of STATIC_INTENTS) {
    const s = scoreKeywords(normalized, intent.keywords);
    if (s > bestScore) {
      bestScore = s;
      bestIntent = intent;
    }
  }

  // Una señal fuerte de catálogo ("precio", "stock", "disponible"...) siempre
  // gana: es la razón de ser de este chatbot frente a un FAQ estático, ligarlo
  // al inventario real. Una señal débil ("tienen", "quiero"...) solo dispara
  // la búsqueda si no hubo ninguna intención estática reconocida.
  const searchTokens = extractSearchTokens(normalized);
  const shouldSearchCatalog =
    hasStrongProductSignal ||
    (bestScore === 0 && (hasWeakProductSignal || searchTokens.length > 0));

  if (shouldSearchCatalog) {
    const products = await searchProducts(searchTokens, normalized);
    if (products.length > 0) {
      return {
        intent: 'disponibilidad_producto',
        reply: `Encontré ${products.length} producto(s) que podrían interesarte:`,
        products: products.map((p) => ({
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          price: Number(p.price),
          stock: p.stock,
          in_stock: p.stock > 0,
          url: `/producto/${p.sku}`,
        })),
      };
    }
    if (hasStrongProductSignal || hasWeakProductSignal) {
      return {
        intent: 'disponibilidad_producto_sin_resultados',
        reply: 'No encontré productos que coincidan con tu búsqueda. Puedes revisar el catálogo completo en la sección "Tienda".',
        products: [],
      };
    }
  }

  if (bestIntent && bestScore > 0) {
    return { intent: bestIntent.name, reply: bestIntent.reply() };
  }

  return {
    intent: 'fallback',
    reply:
      'No estoy seguro de haber entendido. Puedo ayudarte con: disponibilidad de motos/accesorios, precios, horario, ubicación, métodos de pago, envíos, garantía o hablar con un asesor. ¿Qué te gustaría saber?',
  };
}

module.exports = { handleMessage, normalize, BUSINESS };
