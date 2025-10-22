'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useCategories } from '@/contexts/category-context'
import { cn } from '@/lib/utils'

interface CategoryComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CategoryCombobox({ 
  value, 
  onChange, 
  placeholder = "Sélectionner une catégorie...",
  className 
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  
  const { categories, addCategory, searchCategories } = useCategories()
  
  // Filtrer les catégories basées sur la recherche
  const filteredCategories = searchCategories(searchQuery || '')
  
  // Vérifier si la valeur actuelle existe dans les catégories
  const currentCategory = categories.find(cat => cat.name === value)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    onChange(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchQuery(value)
  }

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur une option
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredCategories.length ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
          handleSelectCategory(filteredCategories[highlightedIndex].name)
        } else if (value.trim()) {
          handleCreateNewCategory()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleSelectCategory = (categoryName: string) => {
    onChange(categoryName)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const handleCreateNewCategory = async () => {
    if (value.trim()) {
      try {
        const newCategory = await addCategory(value.trim())
        if (newCategory) {
          setIsOpen(false)
          setHighlightedIndex(-1)
          inputRef.current?.blur()
        }
      } catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error)
      }
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500",
          className
        )}
      />
      
      {/* Icône de dropdown */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg 
          className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Liste déroulante */}
      {isOpen && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Catégories existantes */}
          {filteredCategories.map((category, index) => (
            <div
              key={category.id}
              onClick={() => handleSelectCategory(category.name)}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2",
                highlightedIndex === index && "bg-blue-100",
                index === 0 && "rounded-t-lg"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full", category.color)}></div>
              <span className="text-gray-900">{category.name}</span>
            </div>
          ))}
          
          {/* Option pour créer une nouvelle catégorie */}
          {value.trim() && !currentCategory && (
            <div
              onClick={handleCreateNewCategory}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-green-100 flex items-center gap-2 border-t border-gray-200",
                highlightedIndex === filteredCategories.length && "bg-green-100"
              )}
            >
              <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              <span className="text-green-700 font-medium">
                Créer &quot;{value.trim()}&quot;
              </span>
            </div>
          )}
          
          {/* Message si aucune catégorie trouvée */}
          {filteredCategories.length === 0 && !value.trim() && (
            <div className="px-3 py-2 text-gray-500 text-center">
              Aucune catégorie trouvée
            </div>
          )}
        </div>
      )}
    </div>
  )
}
