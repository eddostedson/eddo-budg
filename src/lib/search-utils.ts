/**
 * Utilitaires pour améliorer la recherche numérique
 */

/**
 * Normalise un montant pour la recherche
 * @param amount - Le montant à normaliser
 * @returns Le montant normalisé
 */
export function normalizeAmount(amount: number): number {
  return Math.round(amount * 100) / 100 // Arrondir à 2 décimales
}

/**
 * Vérifie si un montant correspond exactement à une recherche
 * @param amount - Le montant à vérifier
 * @param searchValue - La valeur de recherche
 * @returns true si le montant correspond exactement
 */
export function isExactAmountMatch(amount: number, searchValue: string): boolean {
  const searchNum = parseFloat(searchValue)
  
  if (isNaN(searchNum)) {
    return false
  }
  
  // Recherche exacte avec tolérance de 0.01 pour les erreurs de virgule flottante
  return Math.abs(normalizeAmount(amount) - normalizeAmount(searchNum)) < 0.01
}

/**
 * Vérifie si un montant contient une recherche textuelle
 * @param amount - Le montant à vérifier
 * @param searchValue - La valeur de recherche textuelle
 * @returns true si le montant contient la recherche
 */
export function isTextAmountMatch(amount: number, searchValue: string): boolean {
  const amountText = amount.toString().toLowerCase()
  const searchText = searchValue.toLowerCase().trim()
  
  return amountText.includes(searchText)
}

/**
 * Recherche intelligente de montant
 * @param amount - Le montant à vérifier
 * @param searchValue - La valeur de recherche
 * @returns true si le montant correspond à la recherche
 */
export function smartAmountSearch(amount: number, searchValue: string): boolean {
  const trimmedSearch = searchValue.trim()
  
  // Si la recherche est vide, tout correspond
  if (!trimmedSearch) {
    return true
  }
  
  // Si la recherche est un nombre, faire une recherche exacte
  const searchNum = parseFloat(trimmedSearch)
  if (!isNaN(searchNum)) {
    return isExactAmountMatch(amount, trimmedSearch)
  }
  
  // Sinon, faire une recherche textuelle
  return isTextAmountMatch(amount, trimmedSearch)
}

/**
 * Recherche de plage de montants
 * @param amount - Le montant à vérifier
 * @param minAmount - Montant minimum (optionnel)
 * @param maxAmount - Montant maximum (optionnel)
 * @returns true si le montant est dans la plage
 */
export function isAmountInRange(amount: number, minAmount?: number, maxAmount?: number): boolean {
  if (minAmount !== undefined && amount < minAmount) {
    return false
  }
  
  if (maxAmount !== undefined && amount > maxAmount) {
    return false
  }
  
  return true
}








