'use client'

import { ReactNode, useState, useEffect } from 'react'

interface ModernResponsiveProps {
  children: ReactNode
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export function ModernResponsive({ 
  children, 
  breakpoint = 'md',
  className = '' 
}: ModernResponsiveProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
      }
      
      setIsVisible(width >= breakpoints[breakpoint])
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [breakpoint])

  if (!isVisible) return null

  return (
    <div className={className}>
      {children}
    </div>
  )
}

interface ModernMobileProps {
  children: ReactNode
  className?: string
}

export function ModernMobile({ children, className = '' }: ModernMobileProps) {
  return (
    <div className={`block md:hidden ${className}`}>
      {children}
    </div>
  )
}

interface ModernDesktopProps {
  children: ReactNode
  className?: string
}

export function ModernDesktop({ children, className = '' }: ModernDesktopProps) {
  return (
    <div className={`hidden md:block ${className}`}>
      {children}
    </div>
  )
}

interface ModernTabletProps {
  children: ReactNode
  className?: string
}

export function ModernTablet({ children, className = '' }: ModernTabletProps) {
  return (
    <div className={`hidden sm:block lg:hidden ${className}`}>
      {children}
    </div>
  )
}

interface ModernGridProps {
  children: ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 'md',
  className = '' 
}: ModernGridProps) {
  const colsClasses = {
    sm: cols.sm ? `grid-cols-${cols.sm}` : '',
    md: cols.md ? `md:grid-cols-${cols.md}` : '',
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={`grid ${colsClasses.sm} ${colsClasses.md} ${colsClasses.lg} ${colsClasses.xl} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface ModernFlexProps {
  children: ReactNode
  direction?: {
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  wrap?: boolean
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ModernFlex({ 
  children, 
  direction = { sm: 'col', md: 'row' },
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md',
  className = '' 
}: ModernFlexProps) {
  const directionClasses = {
    sm: direction.sm ? `flex-${direction.sm}` : '',
    md: direction.md ? `md:flex-${direction.md}` : '',
    lg: direction.lg ? `lg:flex-${direction.lg}` : ''
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
    <div className={`flex ${directionClasses.sm} ${directionClasses.md} ${directionClasses.lg} ${justifyClasses[justify]} ${alignClasses[align]} ${wrap ? 'flex-wrap' : ''} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface ModernContainerProps {
  children: ReactNode
  size?: {
    sm?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    md?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    lg?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  }
  className?: string
}

export function ModernContainer({ 
  children, 
  size = { sm: 'full', md: 'lg', lg: 'xl' },
  className = '' 
}: ModernContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  }

  const responsiveClasses = {
    sm: size.sm ? sizeClasses[size.sm] : '',
    md: size.md ? `md:${sizeClasses[size.md]}` : '',
    lg: size.lg ? `lg:${sizeClasses[size.lg]}` : ''
  }

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${responsiveClasses.sm} ${responsiveClasses.md} ${responsiveClasses.lg} ${className}`}>
      {children}
    </div>
  )
}

interface ModernTextProps {
  children: ReactNode
  size?: {
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  }
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'indigo'
  className?: string
}

export function ModernText({ 
  children, 
  size = { sm: 'base', md: 'lg', lg: 'xl' },
  weight = 'normal',
  color = 'gray',
  className = '' 
}: ModernTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  }

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black'
  }

  const colorClasses = {
    gray: 'text-gray-900',
    blue: 'text-blue-900',
    green: 'text-green-900',
    red: 'text-red-900',
    yellow: 'text-yellow-900',
    purple: 'text-purple-900',
    pink: 'text-pink-900',
    indigo: 'text-indigo-900'
  }

  const responsiveClasses = {
    sm: size.sm ? sizeClasses[size.sm] : '',
    md: size.md ? `md:${sizeClasses[size.md]}` : '',
    lg: size.lg ? `lg:${sizeClasses[size.lg]}` : ''
  }

  return (
    <div className={`${responsiveClasses.sm} ${responsiveClasses.md} ${responsiveClasses.lg} ${weightClasses[weight]} ${colorClasses[color]} ${className}`}>
      {children}
    </div>
  )
}










































