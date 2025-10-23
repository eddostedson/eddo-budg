'use client'

import { ReactNode } from 'react'

interface ModernAccessibleButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function ModernAccessibleButton({ 
  children, 
  onClick, 
  disabled = false,
  ariaLabel,
  className = '' 
}: ModernAccessibleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

interface ModernAccessibleInputProps {
  label: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  error?: string
  className?: string
}

export function ModernAccessibleInput({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className = '' 
}: ModernAccessibleInputProps) {
  const id = `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}




































