import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-1.5 overflow-hidden text-sm font-semibold text-steel">
      <span className="truncate text-xs font-black uppercase text-violet-950/75">{label}</span>
      <input
        className={`focus-ring min-h-11 rounded-2xl border border-violet-100 bg-white/95 px-3.5 text-ink shadow-inner shadow-violet-100/60 transition hover:border-violet-200 ${className}`}
        {...props}
      />
    </label>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, children, className = "", ...props }: SelectFieldProps) {
  return (
    <label className="grid min-w-0 gap-1.5 overflow-hidden text-sm font-semibold text-steel">
      <span className="truncate text-xs font-black uppercase text-violet-950/75">{label}</span>
      <select className={`focus-ring min-h-11 rounded-2xl border border-violet-100 bg-white/95 px-3.5 text-ink shadow-inner shadow-violet-100/60 transition hover:border-violet-200 ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
