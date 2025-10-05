'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'auto' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'auto') {
        setActualTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      } else {
        setActualTheme(theme)
      }
    }

    updateActualTheme()

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateActualTheme)
      return () => mediaQuery.removeEventListener('change', updateActualTheme)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [actualTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Clair', icon: '☀️' },
    { value: 'dark', label: 'Sombre', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' }
  ]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`px-3 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
            theme === t.value
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={t.label}
        >
          <span className="text-lg">{t.icon}</span>
        </button>
      ))}
    </div>
  )
}

interface ThemeCardProps {
  children: ReactNode
  className?: string
}

export function ThemeCard({ children, className = '' }: ThemeCardProps) {
  const { actualTheme } = useTheme()

  return (
    <div className={`${
      actualTheme === 'dark' 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    } border rounded-3xl shadow-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  )
}

interface ThemeButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function ThemeButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  onClick
}: ThemeButtonProps) {
  const { actualTheme } = useTheme()

  const baseClasses = 'font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: actualTheme === 'dark' 
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: actualTheme === 'dark'
      ? 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500'
      : 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
    success: actualTheme === 'dark'
      ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
      : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    danger: actualTheme === 'dark'
      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    warning: actualTheme === 'dark'
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
      : 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: actualTheme === 'dark'
      ? 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500'
      : 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500'
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface ThemeInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export function ThemeInput({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '' 
}: ThemeInputProps) {
  const { actualTheme } = useTheme()

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 ${
        actualTheme === 'dark'
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
      } ${className}`}
    />
  )
}





