import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

const LOWERCASE_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "if",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "up",
  "yet",
]);

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      // Always capitalize the first word, regardless of what it is
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);

      // Keep specified words lowercase unless they're part of a proper name/game title
      return LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
