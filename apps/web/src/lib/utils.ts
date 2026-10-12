import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TMDB dates are bare "YYYY-MM-DD". `new Date()` reads those as UTC midnight,
 * which lands on the previous day anywhere west of Greenwich; anchoring to
 * local midnight keeps the calendar day TMDB meant.
 */
export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}
