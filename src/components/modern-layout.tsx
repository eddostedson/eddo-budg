'use client'

import { ReactNode } from 'react'
import { ModernNavbar } from './modern-navbar'
import { ModernFooter } from './modern-footer'
import { ModernSidebar } from './modern-sidebar'
import { useState } from 'react'

interface ModernLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showFooter?: boolean
  className?: string
}

export function ModernLayout({ 
  children, 
  showSidebar = true, 
  showFooter = true,
  className = '' 
}: ModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <ModernNavbar />
      
      <div className="flex">
        {showSidebar && (
          <ModernSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}
        
        <main className={`flex-1 ${className}`}>
          {children}
        </main>
      </div>
      
      {showFooter && <ModernFooter />}
    </div>
  )
}

interface ModernPageProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
}

export function ModernPage({ 
  children, 
  title, 
  description,
  className = '' 
}: ModernPageProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      {(title || description) && (
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg p-6">
          <div className="max-w-7xl mx-auto">
            {title && (
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface ModernContainerProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function ModernContainer({ 
  children, 
  size = 'lg',
  className = '' 
}: ModernContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  }

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  )
}

interface ModernSectionProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
}

export function ModernSection({ 
  children, 
  title, 
  description,
  className = '' 
}: ModernSectionProps) {
  return (
    <section className={`py-8 ${className}`}>
      {(title || description) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

interface ModernGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernGrid({ 
  children, 
  cols = 3,
  gap = 'md',
  className = '' 
}: ModernGridProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface ModernFlexProps {
  children: ReactNode
  direction?: 'row' | 'col'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  wrap?: boolean
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernFlex({ 
  children, 
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md',
  className = '' 
}: ModernFlexProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  }

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={`flex ${directionClasses[direction]} ${justifyClasses[justify]} ${alignClasses[align]} ${wrap ? 'flex-wrap' : ''} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}




























