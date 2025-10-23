'use client'

import { ReactNode } from 'react'

interface ModernBadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernBadge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: ModernBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-300'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  }

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface ModernStatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed'
  className?: string
}

export function ModernStatusBadge({ status, className = '' }: ModernStatusBadgeProps) {
  const statusConfig = {
    active: { label: 'Actif', variant: 'success' as const, icon: '✅' },
    inactive: { label: 'Inactif', variant: 'default' as const, icon: '⏸️' },
    pending: { label: 'En attente', variant: 'warning' as const, icon: '⏳' },
    completed: { label: 'Terminé', variant: 'success' as const, icon: '✅' },
    failed: { label: 'Échec', variant: 'danger' as const, icon: '❌' }
  }

  const config = statusConfig[status]

  return (
    <ModernBadge variant={config.variant} className={className}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </ModernBadge>
  )
}

interface ModernCountBadgeProps {
  count: number
  max?: number
  className?: string
}

export function ModernCountBadge({ count, max, className = '' }: ModernCountBadgeProps) {
  const displayCount = max ? `${count}/${max}` : count.toString()
  const variant = max && count >= max ? 'danger' : 'primary'

  return (
    <ModernBadge variant={variant} className={className}>
      {displayCount}
    </ModernBadge>
  )
}

interface ModernIconBadgeProps {
  icon: ReactNode
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernIconBadge({ 
  icon, 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: ModernIconBadgeProps) {
  return (
    <ModernBadge variant={variant} size={size} className={className}>
      <span className="mr-1">{icon}</span>
      {children}
    </ModernBadge>
  )
}




































