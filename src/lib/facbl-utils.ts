// Utilitaires partagés pour le module FACBL


// Conversion très simplifiée pour les montants en F CFA (jusqu'aux millions)
export function montantToWordsFr(amount: number): string {
  const units = [
    'zéro',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize'
  ]

  const tens = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante',
    'quatre-vingt',
    'quatre-vingt'
  ]

  const toWords0_99 = (n: number): string => {
    if (n < 17) return units[n]
    if (n < 20) return 'dix-' + units[n - 10]
    const t = Math.floor(n / 10)
    const u = n % 10
    if (t === 7 || t === 9) {
      const base = t === 7 ? 60 : 80
      return toWords0_99(base + u)
    }
    if (u === 0) return tens[t]
    if (u === 1 && (t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6 || t === 8)) {
      return `${tens[t]} et un`
    }
    return `${tens[t]}-${units[u]}`
  }

  const toWords0_999 = (n: number): string => {
    if (n < 100) return toWords0_99(n)
    const h = Math.floor(n / 100)
    const r = n % 100
    const hundredWord = h === 1 ? 'cent' : `${units[h]} cent`
    if (r === 0) return hundredWord + (h > 1 ? 's' : '')
    return `${hundredWord} ${toWords0_99(r)}`
  }

  if (amount === 0) return 'zéro'

  const millions = Math.floor(amount / 1_000_000)
  const thousands = Math.floor((amount % 1_000_000) / 1_000)
  const rest = amount % 1_000

  const parts: string[] = []

  if (millions > 0) {
    parts.push(millions === 1 ? 'un million' : `${toWords0_999(millions)} millions`)
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille')
    } else {
      parts.push(`${toWords0_999(thousands)} mille`)
    }
  }

  if (rest > 0) {
    parts.push(toWords0_999(rest))
  }

  return parts.join(' ')
}




