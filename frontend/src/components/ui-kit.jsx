export function PageHeader({ kicker, title, actions, testid, count }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6" data-testid={testid}>
      <div>
        {kicker && <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// {kicker}</div>}
        <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
          {title}
          {count != null && <span className="timer text-2xl text-zinc-600">[{String(count).padStart(3, "0")}]</span>}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function PrimaryButton({ children, className = "", testid, ...rest }) {
  return (
    <button
      data-testid={testid}
      className={`bg-[#10B981] hover:bg-[#34D399] text-white font-display uppercase tracking-widest font-bold px-4 py-2 text-sm transition-colors disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", testid, ...rest }) {
  return (
    <button
      data-testid={testid}
      className={`border border-white/15 hover:border-[#10B981] hover:text-[#10B981] text-white font-display uppercase tracking-widest font-bold px-4 py-2 text-sm transition-colors disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`bg-[#141414] border border-white/10 ${className}`}>{children}</div>;
}

export function Badge({ children, variant = "default" }) {
  const styles = {
    default: "border-white/15 text-zinc-300",
    danger: "border-amber-500/50 text-amber-400 bg-amber-500/10",
    success: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    info: "border-sky-500/40 text-sky-400 bg-sky-500/10",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">{label}</span>
      {children}
    </label>
  );
}

export function inputClass() {
  return "w-full bg-transparent border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors";
}
