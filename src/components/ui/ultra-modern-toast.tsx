'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Edit3, Plus, Trash2, Sparkles, Zap } from 'lucide-react'

export interface UltraModernToastProps {
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  action?: string
  duration?: number
  onClose?: () => void
  show?: boolean
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
    accentColor: 'text-emerald-600',
    glowColor: 'shadow-emerald-500/25'
  },
  error: {
    icon: XCircle,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    accentColor: 'text-red-600',
    glowColor: 'shadow-red-500/25'
  },
  info: {
    icon: Edit3,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    accentColor: 'text-blue-600',
    glowColor: 'shadow-blue-500/25'
  },
  warning: {
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    accentColor: 'text-amber-600',
    glowColor: 'shadow-amber-500/25'
  }
}

const actionIcons = {
  create: Plus,
  edit: Edit3,
  delete: Trash2,
  success: CheckCircle
}

export const UltraModernToast: React.FC<UltraModernToastProps> = ({
  type,
  title,
  message,
  action,
  duration = 4000,
  onClose,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show)
  const [progress, setProgress] = useState(100)

  const config = toastConfig[type]
  const Icon = config.icon
  const ActionIcon = action ? actionIcons[action as keyof typeof actionIcons] : null

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100))
        if (newProgress <= 0) {
          // Utiliser setTimeout pour éviter l'appel pendant le rendu
          setTimeout(() => {
            setIsVisible(false)
            onClose?.()
          }, 0)
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isVisible, duration, onClose])

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setProgress(100)
    }
  }, [show])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.6
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <motion.div
            initial={{ rotateX: -90 }}
            animate={{ rotateX: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className={`
              relative overflow-hidden rounded-2xl border-2 ${config.borderColor} 
              ${config.bgColor} backdrop-blur-xl shadow-2xl ${config.glowColor}
              transform-gpu
            `}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`} />
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  backgroundSize: '200% 200%',
                  backgroundPosition: '0% 0%'
                }}
              />
            </div>

            {/* Content */}
            <div className="relative p-6">
              {/* Header with Icon and Close */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={`
                      p-2 rounded-xl bg-gradient-to-br ${config.color} 
                      shadow-lg ${config.glowColor}
                    `}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                  
                  {ActionIcon && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="p-1.5 rounded-lg bg-white/50"
                    >
                      <ActionIcon className={`w-4 h-4 ${config.accentColor}`} />
                    </motion.div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className={`
                    p-1.5 rounded-lg hover:bg-white/20 transition-colors
                    ${config.textColor} hover:${config.accentColor}
                  `}
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-lg font-bold ${config.textColor} mb-2`}
              >
                {title}
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={`text-sm ${config.textColor} opacity-80 leading-relaxed`}
              >
                {message}
              </motion.p>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                />
              </motion.div>

              {/* Sparkle Effects */}
              <div className="absolute top-2 right-2">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className={`w-3 h-3 ${config.accentColor} opacity-60`} />
                </motion.div>
              </div>
            </div>

            {/* Shimmer Effect */}
            <motion.div
              animate={{ 
                x: ['-100%', '100%'],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook pour utiliser les toasts ultra-modernes
export const useUltraModernToast = () => {
  const [toasts, setToasts] = useState<UltraModernToastProps[]>([])

  const showToast = useCallback((toast: Omit<UltraModernToastProps, 'show'>) => {
    const id = Date.now().toString()
    const newToast = { ...toast, show: true }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== newToast))
    }, toast.duration || 4000)
  }, [])

  const hideToast = useCallback((index: number) => {
    setToasts(prev => prev.filter((_, i) => i !== index))
  }, [])

  const showSuccess = (title: string, message: string, action?: string) => {
    showToast({ type: 'success', title, message, action })
  }

  const showError = (title: string, message: string, action?: string) => {
    showToast({ type: 'error', title, message, action })
  }

  const showInfo = (title: string, message: string, action?: string) => {
    showToast({ type: 'info', title, message, action })
  }

  const showWarning = (title: string, message: string, action?: string) => {
    showToast({ type: 'warning', title, message, action })
  }

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast
  }
}

// Container pour afficher tous les toasts
export const UltraModernToastContainer: React.FC<{ toasts: UltraModernToastProps[]; onHide: (index: number) => void }> = ({ 
  toasts, 
  onHide 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast, index) => (
        <UltraModernToast
          key={index}
          {...toast}
          onClose={() => onHide(index)}
        />
      ))}
    </div>
  )
}
