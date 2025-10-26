import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M F CFA`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K F CFA`
  } else {
    return `${amount.toLocaleString('fr-FR')} F CFA`
  }
}

export function formatCurrencyHarmonized(amount: number): string {
  // Format harmonisé pour l'affichage dans les tuiles
  const formatted = new Intl.NumberFormat('fr-FR').format(amount)
  return `${formatted} F CFA`
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}
