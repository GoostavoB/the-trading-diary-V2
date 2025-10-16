import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFinancialColor(value: number): string {
  if (value === 0) return 'text-foreground';
  if (value > 0) return 'text-neon-green';
  return 'text-neon-red';
}
