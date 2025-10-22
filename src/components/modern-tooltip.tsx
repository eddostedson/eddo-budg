'use client'

import { ReactNode, useState } from 'react'

interface ModernTooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function ModernTooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 200,
  className = '' 
}: ModernTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  )
}

interface ModernPopoverProps {
  children: ReactNode
  content: ReactNode
  isOpen: boolean
  onClose: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function ModernPopover({ 
  children, 
  content, 
  isOpen, 
  onClose,
  position = 'bottom',
  className = '' 
}: ModernPopoverProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-white',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-white',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-white',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-white'
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <div className={`absolute z-50 ${positionClasses[position]}`}>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 max-w-sm">
              {content}
            </div>
            <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`} />
          </div>
        </>
      )}
    </div>
  )
}

interface ModernDropdownProps {
  children: ReactNode
  content: ReactNode
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export function ModernDropdown({ 
  children, 
  content, 
  isOpen, 
  onToggle,
  className = '' 
}: ModernDropdownProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <div onClick={onToggle}>
        {children}
      </div>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onToggle}
          />
          <div className="absolute top-full left-0 mt-2 z-50">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 min-w-48">
              {content}
            </div>
          </div>
        </>
      )}
    </div>
  )
}



































