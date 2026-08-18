import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ANIMAL_EMOJIS = ["🐼", "🦊", "🐯", "🐶", "🐱", "🦁", "🐨", "🐸", "🦉", "🐵", "🐺", "🦄", "🐙", "🦋", "🐢"];

export function emojiForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ANIMAL_EMOJIS[hash % ANIMAL_EMOJIS.length];
}

export function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function timeAgo(date: Date | string, locale: "pl" | "en" = "pl") {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (locale === "en") {
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  if (seconds < 60) return "przed chwilą";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} tyg. temu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mies. temu`;
  return `${Math.floor(days / 365)} lat temu`;
}
