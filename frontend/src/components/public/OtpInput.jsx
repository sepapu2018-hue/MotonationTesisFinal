import { useRef } from "react";

// Codigo de un solo uso como 6 casillas separadas: avanza solo, soporta
// pegar el codigo completo y retroceder con backspace/flechas.
export default function OtpInput({ value, onChange, disabled, testId = "otp-code-input" }) {
  const refs = useRef([]);

  const setDigit = (i, digit) => {
    const chars = value.padEnd(6, " ").split("");
    chars[i] = digit || " ";
    onChange(chars.join("").replace(/ /g, ""));
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(i, "");
      return;
    }
    setDigit(i, raw.slice(-1));
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        setDigit(i, "");
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setDigit(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, 6) - 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between" data-testid={testId} onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          data-testid={`${testId}-${i}`}
          className="w-full aspect-square bg-transparent border border-white/20 text-white text-center text-2xl font-bold focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
        />
      ))}
    </div>
  );
}
