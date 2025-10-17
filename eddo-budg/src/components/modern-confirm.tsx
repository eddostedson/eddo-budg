'use client'

import { useState, useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'warning' | 'danger' | 'info'
}

export function ModernConfirm({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleConfirm = () => {
    setIsVisible(false)
    setTimeout(() => {
      onConfirm()
    }, 200)
  }

  const handleCancel = () => {
    setIsVisible(false)
    setTimeout(() => {
      onCancel()
    }, 200)
  }

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '🔥',
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700',
          text: 'text-red-800'
        }
      case 'warning':
        return {
          icon: '⚠️',
          bg: 'from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          text: 'text-yellow-800'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          bg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-800'
        }
      default:
        return {
          icon: '⚠️',
          bg: 'from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          text: 'text-yellow-800'
        }
    }
  }

  const colors = getColors()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`
          bg-gradient-to-br ${colors.bg} 
          border-2 ${colors.border}
          rounded-3xl shadow-2xl max-w-md w-full
          transform transition-all duration-300 ease-out
          ${isVisible 
            ? 'scale-100 opacity-100' 
            : 'scale-95 opacity-0'
          }
        `}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">{colors.icon}</span>
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${colors.text}`}>
                {title}
              </h3>
            </div>
          </div>
          
          <p className={`text-lg ${colors.text} opacity-90 leading-relaxed`}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-white/50 hover:bg-white/70 text-gray-700 font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-3 ${colors.button} text-white font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg transform hover:scale-105 active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook pour utiliser la confirmation
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger' | 'info'
    onConfirm?: () => void
    onCancel?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'warning'
  })

  const confirm = (
    title: string,
    message: string,
    options?: {
      confirmText?: string
      cancelText?: string
      type?: 'warning' | 'danger' | 'info'
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText: options?.confirmText || 'Confirmer',
        cancelText: options?.cancelText || 'Annuler',
        type: options?.type || 'warning',
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }

  const ConfirmDialog = () => (
    <ModernConfirm
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      type={confirmState.type}
      onConfirm={confirmState.onConfirm || (() => {})}
      onCancel={confirmState.onCancel || (() => {})}
    />
  )

  return { confirm, ConfirmDialog }
}
