'use client'

import { useCallback, useEffect, useState } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface NotificationProps {
  notification: Notification
  onRemove: (id: string) => void
}

export function ModernNotification({ notification, onRemove }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(notification.id)
    }, 300)
  }, [notification.id, onRemove])

  useEffect(() => {
    // Auto-suppression après la durée spécifiée
    const duration = notification.duration || 4000
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [handleClose, notification.duration])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'bg-green-500'
        }
      case 'error':
        return {
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'bg-red-500'
        }
      case 'warning':
        return {
          bg: 'from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'bg-yellow-500'
        }
      case 'info':
        return {
          bg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'bg-blue-500'
        }
      default:
        return {
          bg: 'from-gray-50 to-slate-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'bg-gray-500'
        }
    }
  }

  const colors = getColors()

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div
        className={`
          bg-gradient-to-r ${colors.bg} 
          border-2 ${colors.border}
          rounded-2xl shadow-2xl backdrop-blur-lg
          p-4 relative overflow-hidden
        `}
      >
        {/* Barre de progression */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
        
        {/* Contenu */}
        <div className="flex items-start gap-4">
          {/* Icône */}
          <div className={`
            w-12 h-12 ${colors.icon} 
            rounded-xl flex items-center justify-center
            shadow-lg flex-shrink-0
          `}>
            <span className="text-2xl">{getIcon()}</span>
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-lg ${colors.text} mb-1`}>
              {notification.title}
            </h4>
            <p className={`text-sm ${colors.text} opacity-90`}>
              {notification.message}
            </p>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            className={`
              w-8 h-8 rounded-full 
              ${colors.text} opacity-60 hover:opacity-100
              hover:bg-white hover:bg-opacity-20
              flex items-center justify-center
              transition-all duration-200
              flex-shrink-0
            `}
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-5 pointer-events-none"></div>
      </div>
    </div>
  )
}

// Container pour toutes les notifications
interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <ModernNotification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}