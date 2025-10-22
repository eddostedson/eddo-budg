/**
 * Utilitaires de validation pour éviter les doublons et redondances
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Nettoie et normalise un texte pour éviter les doublons
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s\-.,]/g, '') // Supprimer les caractères spéciaux sauf tirets et points
    .toLowerCase()
}

/**
 * Vérifie si deux textes sont similaires (évite les doublons)
 */
export function isSimilarText(text1: string, text2: string, threshold: number = 0.8): boolean {
  const normalized1 = normalizeText(text1)
  const normalized2 = normalizeText(text2)
  
  // Si l'un contient l'autre, c'est un doublon potentiel
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true
  }
  
  // Calcul de similarité basique (ratio de caractères communs)
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1
  
  if (longer.length === 0) return false
  
  const editDistance = levenshteinDistance(normalized1, normalized2)
  const similarity = (longer.length - editDistance) / longer.length
  
  return similarity >= threshold
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Valide une dépense (sans vérification de doublons)
 * Affiche les dépenses similaires comme aide à la navigation
 */
export function validateDepense(
  libelle: string, 
  description: string, 
  existingDepenses: Array<{ libelle: string, description?: string, date?: string }>,
  currentDate?: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 1. Vérifier si le libellé est vide
  if (!libelle.trim()) {
    errors.push('Le libellé est obligatoire')
    return { isValid: false, errors, warnings }
  }
  
  // 2. Trouver les dépenses similaires pour aide à la navigation
  const normalizedLibelle = normalizeText(libelle)
  const similarDepenses: string[] = []
  
  for (const existing of existingDepenses) {
    const existingLibelle = normalizeText(existing.libelle)
    
    // Vérifier si le libellé est similaire (pour aide à la navigation)
    if (isSimilarText(libelle, existing.libelle, 0.7)) {
      similarDepenses.push(`"${existing.libelle}"${existing.date ? ` (${existing.date})` : ''}`)
    }
  }
  
  // 3. Afficher les dépenses similaires comme aide (pas d'erreur)
  if (similarDepenses.length > 0) {
    warnings.push(`💡 Dépenses similaires trouvées (pour vous aider à vous retrouver) :`)
    similarDepenses.forEach(depense => {
      warnings.push(`   • ${depense}`)
    })
    warnings.push(`✅ Vous pouvez continuer - aucune restriction sur les doublons`)
  }
  
  // 4. Vérifier si la description contient le libellé (redondance)
  if (description && normalizeText(description).includes(normalizeText(libelle))) {
    warnings.push('La description contient le libellé. Cela peut créer de la duplication à l\'affichage.')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valide une recette pour éviter les doublons
 */
export function validateRecette(
  libelle: string,
  existingRecettes: Array<{ libelle: string }>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!libelle.trim()) {
    errors.push('Le libellé est obligatoire')
    return { isValid: false, errors, warnings }
  }
  
  const normalizedLibelle = normalizeText(libelle)
  
  for (const existing of existingRecettes) {
    if (isSimilarText(libelle, existing.libelle, 0.9)) {
      errors.push(`Ce libellé est très similaire à une recette existante : "${existing.libelle}"`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Nettoie une description pour éviter les redondances
 */
export function cleanDescription(libelle: string, description: string): string | undefined {
  if (!description || !description.trim()) return undefined
  
  const normalizedLibelle = normalizeText(libelle)
  const normalizedDescription = normalizeText(description)
  
  // Si la description contient le libellé, la nettoyer
  if (normalizedDescription.includes(normalizedLibelle)) {
    return undefined // Supprimer la description redondante
  }
  
  // Si la description est très similaire au libellé, la supprimer
  if (isSimilarText(description, libelle, 0.8)) {
    return undefined
  }
  
  return description.trim()
}

/**
 * Suggère des libellés alternatifs pour éviter les doublons
 */
export function suggestAlternativeLabels(
  originalLibelle: string, 
  existingDepenses: Array<{ libelle: string, date?: string }>,
  currentDate?: string
): string[] {
  const suggestions: string[] = []
  
  // Vérifier s'il y a des dépenses similaires le même jour
  const sameDayDepenses = existingDepenses.filter(dep => 
    dep.date === currentDate && isSimilarText(originalLibelle, dep.libelle, 0.9)
  )
  
  if (sameDayDepenses.length > 0) {
    // Suggérer des variantes avec numérotation
    suggestions.push(`${originalLibelle} - 2ème fois`)
    suggestions.push(`${originalLibelle} - Matin`)
    suggestions.push(`${originalLibelle} - Après-midi`)
    suggestions.push(`${originalLibelle} - Soir`)
    
    // Suggérer des variantes avec quantité
    suggestions.push(`${originalLibelle} - Plus grande quantité`)
    suggestions.push(`${originalLibelle} - Petite quantité`)
    
    // Suggérer des variantes avec lieu
    suggestions.push(`${originalLibelle} - Marché central`)
    suggestions.push(`${originalLibelle} - Supermarché`)
  }
  
  return suggestions.slice(0, 3) // Limiter à 3 suggestions
}
