import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "border border-transparent bg-violet-600 text-white shadow-sm hover:bg-violet-700",
  secondary: "border-2 border-violet-600 bg-white text-violet-600 shadow-sm hover:bg-violet-50",
  danger: "border border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-violet-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: Variant;
}

export function Button({ children, icon, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
