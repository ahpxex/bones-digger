import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatConfidence(v: number): string {
  return `${Math.round(v * 1000) / 10}%`;
}

const CN_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function toChineseNumeral(n: number): string {
  if (n <= 0) return CN_DIGITS[0]!;
  if (n < 10) return CN_DIGITS[n]!;
  if (n < 20) return `十${n === 10 ? "" : CN_DIGITS[n - 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${CN_DIGITS[tens]}十${ones === 0 ? "" : CN_DIGITS[ones]}`;
  }
  return String(n);
}

export function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
