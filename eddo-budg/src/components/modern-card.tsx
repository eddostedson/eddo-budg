'use client'

import { ReactNode } from 'react'

interface ModernCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'gradient' | 'solid'
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export function ModernCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  padding = 'md'
}: ModernCardProps) {
  const baseClasses = 'rounded-3xl shadow-lg transition-all duration-300'
  
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30',
    gradient: 'bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/30',
    solid: 'bg-white border border-gray-200'
  }

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const hoverClasses = hover ? 'hover:shadow-2xl hover:scale-105' : ''

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}

interface ModernCardHeaderProps {
  children: ReactNode
  className?: string
}

export function ModernCardHeader({ children, className = '' }: ModernCardHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  )
}

interface ModernCardContentProps {
  children: ReactNode
  className?: string
}

export function ModernCardContent({ children, className = '' }: ModernCardContentProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  )
}

interface ModernCardFooterProps {
  children: ReactNode
  className?: string
}

export function ModernCardFooter({ children, className = '' }: ModernCardFooterProps) {
  return (
    <div className={`mt-6 pt-6 border-t border-gray-200/50 ${className}`}>
      {children}
    </div>
  )
}

interface ModernStatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function ModernStatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className = '' 
}: ModernStatCardProps) {
  return (
    <ModernCard className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      {trend && (
        <div className={`text-sm font-medium ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.isPositive ? '↗️' : '↘️'} {Math.abs(trend.value)}%
        </div>
      )}
    </ModernCard>
  )
}

