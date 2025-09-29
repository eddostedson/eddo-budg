'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastProps } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }, [removeToast])

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ type: 'success', title, description })
  }, [showToast])

  const showError = useCallback((title: string, description?: string) => {
    showToast({ type: 'error', title, description })
  }, [showToast])

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ type: 'info', title, description })
  }, [showToast])

  const showWarning = useCallback((title: string, description?: string) => {
    showToast({ type: 'warning', title, description })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showSuccess, 
      showError, 
      showInfo, 
      showWarning 
    }}>
      {children}
      
      {/* Container des toasts */}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

