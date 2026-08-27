import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Premium ease-out used for entrance animations across the landing page.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
