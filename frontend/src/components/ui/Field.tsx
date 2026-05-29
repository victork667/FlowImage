import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-1.5 overflow-hidden text-sm font-medium text-gray-700">
      <span className="truncate text-sm font-medium text-gray-700">{label}</span>
      <input
        className={`focus-ring min-h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-gray-900 transition placeholder:text-gray-400 hover:border-gray-400 ${className}`}
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
    <label className="grid min-w-0 gap-1.5 overflow-hidden text-sm font-medium text-gray-700">
      <span className="truncate text-sm font-medium text-gray-700">{label}</span>
      <select className={`focus-ring min-h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-gray-900 transition hover:border-gray-400 ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
