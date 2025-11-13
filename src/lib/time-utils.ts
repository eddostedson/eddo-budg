/**
 * Utilitaires pour le formatage des dates et heures
 */

/**
 * Formate un timestamp en format "Il y a X temps"
 * @param timestamp - Le timestamp à formater
 * @returns String formatée (ex: "Il y a 2h", "Il y a 30 min", "Hier")
 */
export function formatTimeAgo(timestamp: string | Date): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60)
    return `Il y a ${diffInMinutes} min`
  } else if (diffInHours < 24) {
    return `Il y a ${Math.floor(diffInHours)}h`
  } else if (diffInHours < 48) {
    return 'Hier'
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Formate un timestamp en format complet avec date et heure
 * @param timestamp - Le timestamp à formater
 * @returns String formatée (ex: "15/01/2024 à 14:30")
 */
export function formatFullDateTime(timestamp: string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formate un timestamp en format court avec seulement l'heure
 * @param timestamp - Le timestamp à formater
 * @returns String formatée (ex: "14:30")
 */
export function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}





