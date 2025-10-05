'use client'

import { ReactNode, useState, useEffect } from 'react'

interface ModernAnimationProps {
  children: ReactNode
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'flipIn' | 'zoomIn'
  delay?: number
  duration?: number
  className?: string
}

export function ModernAnimation({ 
  children, 
  animation = 'fadeIn',
  delay = 0,
  duration = 300,
  className = '' 
}: ModernAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const animationClasses = {
    fadeIn: 'opacity-0 translate-y-4',
    slideIn: 'opacity-0 translate-x-4',
    scaleIn: 'opacity-0 scale-95',
    bounceIn: 'opacity-0 scale-75',
    flipIn: 'opacity-0 rotate-y-90',
    zoomIn: 'opacity-0 scale-50'
  }

  const visibleClasses = {
    fadeIn: 'opacity-100 translate-y-0',
    slideIn: 'opacity-100 translate-x-0',
    scaleIn: 'opacity-100 scale-100',
    bounceIn: 'opacity-100 scale-100',
    flipIn: 'opacity-100 rotate-y-0',
    zoomIn: 'opacity-100 scale-100'
  }

  return (
    <div 
      className={`transition-all duration-${duration} ease-out ${
        isVisible ? visibleClasses[animation] : animationClasses[animation]
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface ModernFadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ModernFadeIn({ children, delay = 0, duration = 300, className = '' }: ModernFadeInProps) {
  return (
    <ModernAnimation 
      animation="fadeIn" 
      delay={delay} 
      duration={duration} 
      className={className}
    >
      {children}
    </ModernAnimation>
  )
}

interface ModernSlideInProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
}

export function ModernSlideIn({ 
  children, 
  direction = 'left',
  delay = 0, 
  duration = 300, 
  className = '' 
}: ModernSlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    left: 'translate-x-4',
    right: '-translate-x-4',
    up: 'translate-y-4',
    down: '-translate-y-4'
  }

  const visibleClasses = {
    left: 'translate-x-0',
    right: 'translate-x-0',
    up: 'translate-y-0',
    down: 'translate-y-0'
  }

  return (
    <div 
      className={`transition-all duration-${duration} ease-out ${
        isVisible ? visibleClasses[direction] : directionClasses[direction]
      } ${className}`}
    >
      {children}
    </div>
  )
}

interface ModernScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ModernScaleIn({ children, delay = 0, duration = 300, className = '' }: ModernScaleInProps) {
  return (
    <ModernAnimation 
      animation="scaleIn" 
      delay={delay} 
      duration={duration} 
      className={className}
    >
      {children}
    </ModernAnimation>
  )
}

interface ModernBounceInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ModernBounceIn({ children, delay = 0, duration = 300, className = '' }: ModernBounceInProps) {
  return (
    <ModernAnimation 
      animation="bounceIn" 
      delay={delay} 
      duration={duration} 
      className={className}
    >
      {children}
    </ModernAnimation>
  )
}

interface ModernFlipInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ModernFlipIn({ children, delay = 0, duration = 300, className = '' }: ModernFlipInProps) {
  return (
    <ModernAnimation 
      animation="flipIn" 
      delay={delay} 
      duration={duration} 
      className={className}
    >
      {children}
    </ModernAnimation>
  )
}

interface ModernZoomInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ModernZoomIn({ children, delay = 0, duration = 300, className = '' }: ModernZoomInProps) {
  return (
    <ModernAnimation 
      animation="zoomIn" 
      delay={delay} 
      duration={duration} 
      className={className}
    >
      {children}
    </ModernAnimation>
  )
}

interface ModernStaggerProps {
  children: ReactNode[]
  staggerDelay?: number
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'flipIn' | 'zoomIn'
  className?: string
}

export function ModernStagger({ 
  children, 
  staggerDelay = 100,
  animation = 'fadeIn',
  className = '' 
}: ModernStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ModernAnimation 
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </ModernAnimation>
      ))}
    </div>
  )
}

interface ModernHoverProps {
  children: ReactNode
  scale?: number
  rotate?: number
  duration?: number
  className?: string
}

export function ModernHover({ 
  children, 
  scale = 1.05,
  rotate = 0,
  duration = 300,
  className = '' 
}: ModernHoverProps) {
  return (
    <div 
      className={`transition-all duration-${duration} ease-out hover:scale-${scale} hover:rotate-${rotate} ${className}`}
    >
      {children}
    </div>
  )
}

interface ModernPulseProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function ModernPulse({ children, duration = 1000, className = '' }: ModernPulseProps) {
  return (
    <div 
      className={`animate-pulse ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

interface ModernSpinProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function ModernSpin({ children, duration = 1000, className = '' }: ModernSpinProps) {
  return (
    <div 
      className={`animate-spin ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}






