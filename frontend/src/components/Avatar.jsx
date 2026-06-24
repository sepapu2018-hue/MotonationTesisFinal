// Avatar circular reutilizable. Usa imagen base64/URL o iniciales como fallback.
export default function Avatar({ src, name, size = 36, className = "" }) {
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        style={dim}
        className={`rounded-full object-cover border border-[#10B981]/40 ${className}`}
      />
    );
  }
  return (
    <div
      style={dim}
      className={`rounded-full bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center font-display font-bold text-[#10B981] ${className}`}
    >
      {initial}
    </div>
  );
}
