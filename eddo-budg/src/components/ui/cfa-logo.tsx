'use client'

import React from 'react'

interface CFALogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CFALogo({ className = '', size = 'md' }: CFALogoProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  }

  return (
    <div className={`inline-flex items-center justify-center bg-blue-600 text-white font-bold rounded ${sizeClasses[size]} ${className}`}>
      <span className="font-mono">FCFA</span>
    </div>
  )
}

// Composant pour afficher le montant avec le logo CFA
interface CFAAmountProps {
  amount: number
  className?: string
  showLogo?: boolean
}

export function CFAAmount({ amount, className = '' }: CFAAmountProps) {
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(Math.abs(amount))

  return (
    <span className={`font-medium ${className}`}>
      {formattedAmount}
    </span>
  )
}
