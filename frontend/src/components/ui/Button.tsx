import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "border border-white/15 bg-gradient-to-r from-violet-800 via-purple-600 to-fuchsia-600 text-white shadow-[0_18px_34px_rgba(124,58,237,0.34)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0",
  secondary: "border border-violet-100 bg-white/95 text-violet-950 shadow-[0_10px_26px_rgba(70,25,120,0.10)] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white active:translate-y-0",
  danger: "border border-red-500/10 bg-gradient-to-r from-red-700 to-rose-600 text-white shadow-[0_14px_28px_rgba(185,28,28,0.20)] hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0",
  ghost: "text-steel hover:bg-white/80",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: Variant;
}

export function Button({ children, icon, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
