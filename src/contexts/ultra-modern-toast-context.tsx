'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useUltraModernToast, UltraModernToastContainer } from '@/components/ui/ultra-modern-toast'

interface UltraModernToastContextType {
  showSuccess: (title: string, message: string, action?: string) => void
  showError: (title: string, message: string, action?: string) => void
  showInfo: (title: string, message: string, action?: string) => void
  showWarning: (title: string, message: string, action?: string) => void
  showRecetteCreated: (libelle: string, montant: number) => void
  showRecetteUpdated: (libelle: string, montant: number) => void
  showRecetteDeleted: (libelle: string) => void
}

const UltraModernToastContext = createContext<UltraModernToastContextType | undefined>(undefined)

export const UltraModernToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toasts, showSuccess, showError, showInfo, showWarning, hideToast } = useUltraModernToast()

  const showRecetteCreated = (libelle: string, montant: number) => {
    showSuccess(
      '🎉 Recette Créée !',
      `${libelle} a été ajoutée avec succès pour ${montant.toLocaleString()} F CFA`,
      'create'
    )
  }

  const showRecetteUpdated = (libelle: string, montant: number) => {
    showInfo(
      '✨ Recette Modifiée !',
      `${libelle} a été mise à jour avec un montant de ${montant.toLocaleString()} F CFA`,
      'edit'
    )
  }

  const showRecetteDeleted = (libelle: string) => {
    showError(
      '🗑️ Recette Supprimée !',
      `${libelle} a été supprimée définitivement de votre budget`,
      'delete'
    )
  }

  return (
    <UltraModernToastContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showRecetteCreated,
        showRecetteUpdated,
        showRecetteDeleted
      }}
    >
      {children}
      <UltraModernToastContainer toasts={toasts} onHide={hideToast} />
    </UltraModernToastContext.Provider>
  )
}

export const useUltraModernToastContext = () => {
  const context = useContext(UltraModernToastContext)
  if (!context) {
    throw new Error('useUltraModernToastContext must be used within UltraModernToastProvider')
  }
  return context
}


