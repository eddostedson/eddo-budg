'use client'

import React from 'react'

// Fonction pour surligner le texte avec JSX
export function HighlightText({ text, searchTerm, className = '' }: { 
  text: string, 
  searchTerm: string, 
  className?: string 
}) {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>
  }
  
  const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'))
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchTerm.toLowerCase()
        return isMatch ? (
          <mark key={index} className="bg-green-200 text-green-900 px-1 rounded font-medium">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function shouldHighlight(text: string, searchTerm: string): boolean {
  if (!searchTerm || !text) return false
  return text.toLowerCase().includes(searchTerm.toLowerCase())
}














