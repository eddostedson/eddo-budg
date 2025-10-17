'use client'

import { ReactNode } from 'react'

interface ModernFormProps {
  children: ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export function ModernForm({ children, onSubmit, className = '' }: ModernFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {children}
    </form>
  )
}

interface ModernFormGroupProps {
  children: ReactNode
  className?: string
}

export function ModernFormGroup({ children, className = '' }: ModernFormGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  )
}

interface ModernLabelProps {
  children: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export function ModernLabel({ children, htmlFor, required = false, className = '' }: ModernLabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-semibold text-gray-700 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

interface ModernInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  name?: string
}

export function ModernInput({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  disabled = false, 
  required = false,
  className = '',
  id,
  name
}: ModernInputProps) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  )
}

interface ModernTextareaProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  required?: boolean
  rows?: number
  className?: string
  id?: string
  name?: string
}

export function ModernTextarea({ 
  placeholder, 
  value, 
  onChange, 
  disabled = false, 
  required = false,
  rows = 4,
  className = '',
  id,
  name
}: ModernTextareaProps) {
  return (
    <textarea
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      rows={rows}
      className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${className}`}
    />
  )
}

interface ModernSelectProps {
  children: ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  name?: string
}

export function ModernSelect({ 
  children, 
  value, 
  onChange, 
  disabled = false, 
  required = false,
  className = '',
  id,
  name
}: ModernSelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </select>
  )
}

interface ModernCheckboxProps {
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  name?: string
}

export function ModernCheckbox({ 
  checked, 
  onChange, 
  disabled = false, 
  required = false,
  className = '',
  id,
  name
}: ModernCheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-blue-500/30 focus:ring-2 ${className}`}
    />
  )
}

