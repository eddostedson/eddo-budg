/**
 * 🚀 Module de notifications modernes avec Sonner
 * Système complet avec option UNDO et micro-animations
 */

import { toast } from 'sonner'

/**
 * Affiche une notification de succès
 */
export const notifySuccess = (message: string, title?: string) => {
  if (title) {
    toast.success(title, {
      description: message,
      duration: 3000,
    })
  } else {
    toast.success(message, {
      duration: 3000,
    })
  }
}

/**
 * Affiche une notification d'erreur
 */
export const notifyError = (message: string, title?: string) => {
  if (title) {
    toast.error(title, {
      description: message,
      duration: 4000,
    })
  } else {
    toast.error(message, {
      duration: 4000,
    })
  }
}

/**
 * Affiche une notification d'information
 */
export const notifyInfo = (message: string, title?: string) => {
  if (title) {
    toast.info(title, {
      description: message,
      duration: 3000,
    })
  } else {
    toast(message, {
      duration: 3000,
    })
  }
}

/**
 * Affiche une notification d'avertissement
 */
export const notifyWarning = (message: string, title?: string) => {
  if (title) {
    toast.warning(title, {
      description: message,
      duration: 3000,
    })
  } else {
    toast.warning(message, {
      duration: 3000,
    })
  }
}

/**
 * Affiche une notification avec option UNDO (Annuler)
 * Utilisé principalement pour les suppressions
 */
export const notifyUndo = (
  message: string,
  undoCallback: () => void | Promise<void>,
  title?: string
) => {
  const displayMessage = title ? `${title}: ${message}` : message
  
  toast(displayMessage, {
    duration: 5000,
    action: {
      label: 'Annuler',
      onClick: async () => {
        await undoCallback()
        notifySuccess('Action annulée', 'Suppression annulée avec succès !')
      },
    },
  })
}

/**
 * Notification de succès pour création
 */
export const notifyCreated = (itemName: string) => {
  notifySuccess(`${itemName} créé(e) avec succès !`, '✅ Création réussie')
}

/**
 * Notification de succès pour modification
 */
export const notifyUpdated = (itemName: string) => {
  notifySuccess(`${itemName} modifié(e) avec succès !`, '✅ Modification réussie')
}

/**
 * Notification de suppression avec UNDO
 */
export const notifyDeleted = (
  itemName: string,
  undoCallback: () => void | Promise<void>
) => {
  notifyUndo(
    `${itemName} supprimé(e)`,
    undoCallback,
    '🗑️ Suppression'
  )
}

