import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: (id: string) => void
}

const toastVariants = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800", 
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800"
}

const toastIcons = {
  success: "✅",
  error: "❌", 
  info: "ℹ️",
  warning: "⚠️"
}

export function Toast({ id, title, description, type, duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)

  const handleClose = React.useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }, [id, onClose])

  React.useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 10)
    
    // Auto-fermeture
    const closeTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [duration, handleClose])

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-96 max-w-sm p-4 border rounded-lg shadow-lg transition-all duration-300 transform",
        toastVariants[type],
        isVisible && !isLeaving ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">
          {toastIcons[type]}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-semibold text-sm mb-1">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
      
      {/* Barre de progression */}
      <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-current opacity-30 transition-all ease-linear"
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
