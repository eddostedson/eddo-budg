'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Notification, NotificationContainer } from '@/components/modern-notification'

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  showSuccess: (title: string, message: string, duration?: number) => void
  showError: (title: string, message: string, duration?: number) => void
  showWarning: (title: string, message: string, duration?: number) => void
  showInfo: (title: string, message: string, duration?: number) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 4000
    }
    
    setNotifications(prev => [...prev, newNotification])
  }

  const showSuccess = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration
    })
  }

  const showError = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration
    })
  }

  const showWarning = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  const showInfo = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
