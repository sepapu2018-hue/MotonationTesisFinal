import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User as UserIcon } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const GREETING = {
  role: "bot",
  text: "¡Hola! Soy el asistente virtual de MotoNation 🏍️. Puedo ayudarte con disponibilidad de motos/accesorios, precios, horario, ubicación, métodos de pago y más. ¿Qué necesitas?",
};

const QUICK_REPLIES = [
  "¿Qué motos tienen disponibles?",
  "Horario de atención",
  "Ubicación",
  "Métodos de pago",
  "Hablar con un asesor",
];

// Chatbot de atención al cliente — motor de reglas en el backend (sin costo,
// sin dependencias externas), este widget solo se encarga de la conversación.
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/chatbot/message", { message: trimmed });
      setMessages((m) => [...m, { role: "bot", text: data.reply, products: data.products }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Tuve un problema para responder. Intenta de nuevo en un momento." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat de ayuda" : "Abrir chat de ayuda"}
        aria-expanded={open}
        data-testid="chatbot-toggle"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#10B981] hover:bg-[#34D399] text-black flex items-center justify-center shadow-lg shadow-black/40 transition-colors"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat de atención MotoNation"
          data-testid="chatbot-panel"
          className="fixed bottom-24 right-6 z-50 w-[min(92vw,380px)] max-h-[min(70vh,calc(100dvh_-_7rem))] flex flex-col border border-white/10 bg-[#0E0E0E] shadow-2xl shadow-black/60 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
        >
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black">
            <div className="h-8 w-8 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center">
              <Bot className="h-4 w-4 text-[#10B981]" />
            </div>
            <div className="font-display font-bold uppercase text-xs tracking-widest">Asistente Motonation</div>
          </div>

          <div ref={scrollRef} aria-live="polite" className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-sm flex gap-2 items-start ${
                    m.role === "user"
                      ? "bg-[#10B981] text-black"
                      : "bg-white/5 border border-white/10 text-zinc-200"
                  }`}
                >
                  {m.role === "bot" && <Bot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#10B981]" />}
                  <div>
                    <p className="leading-relaxed">{m.text}</p>
                    {Array.isArray(m.products) && m.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.products.map((p) => (
                          <Link
                            key={p.sku}
                            to={p.url}
                            onClick={() => setOpen(false)}
                            className="block border border-white/10 hover:border-[#10B981] bg-black/40 px-3 py-2 transition-colors"
                          >
                            <div className="font-display font-bold uppercase text-xs">{p.name}</div>
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span className="text-[#10B981] font-bold">{formatCurrency(p.price)}</span>
                              <span className={p.in_stock ? "text-zinc-400" : "text-red-400"}>
                                {p.in_stock ? `Stock: ${p.stock}` : "Sin stock"}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && <UserIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-white/5 border border-white/10 text-zinc-400 text-xs italic">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="shrink-0 px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[10px] uppercase tracking-wide font-bold border border-white/15 hover:border-[#10B981] hover:text-[#10B981] px-2 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="shrink-0 flex items-center gap-2 border-t border-white/10 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              maxLength={300}
              data-testid="chatbot-input"
              className="flex-1 bg-black border border-white/15 focus:border-[#10B981] outline-none px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              data-testid="chatbot-send"
              aria-label="Enviar mensaje"
              className="h-9 w-9 shrink-0 flex items-center justify-center bg-[#10B981] hover:bg-[#34D399] disabled:opacity-40 text-black transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
