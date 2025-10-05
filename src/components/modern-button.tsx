'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
  gradient?: boolean
}

export function ModernButton({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading = false, 
  gradient = true,
  children, 
  className = '', 
  ...props 
}: ModernButtonProps) {
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: gradient 
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 focus:ring-blue-500'
      : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: gradient
      ? 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white shadow-gray-500/25 focus:ring-gray-500'
      : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
    success: gradient
      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25 focus:ring-green-500'
      : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    danger: gradient
      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-red-500/25 focus:ring-red-500'
      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    warning: gradient
      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-yellow-500/25 focus:ring-yellow-500'
      : 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: gradient
      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25 focus:ring-cyan-500'
      : 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500'
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          icon && <span>{icon}</span>
        )}
        {children && <span>{children}</span>}
      </div>
    </button>
  )
}

export function ModernIconButton({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading = false, 
  gradient = true,
  className = '', 
  ...props 
}: Omit<ModernButtonProps, 'children'>) {
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const variantClasses = {
    primary: gradient 
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 focus:ring-blue-500'
      : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: gradient
      ? 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white shadow-gray-500/25 focus:ring-gray-500'
      : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
    success: gradient
      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25 focus:ring-green-500'
      : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    danger: gradient
      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-red-500/25 focus:ring-red-500'
      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    warning: gradient
      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-yellow-500/25 focus:ring-yellow-500'
      : 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: gradient
      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25 focus:ring-cyan-500'
      : 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500'
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        icon
      )}
    </button>
  )
}

