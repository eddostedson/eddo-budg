'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Category {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface CategoryContextType {
  categories: Category[]
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void
  addCategory: (name: string) => Category
  getCategoryByName: (name: string) => Category | undefined
  searchCategories: (query: string) => Category[]
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

// ✅ Plus de données par défaut - état vide uniquement

export function CategoryProvider({ children }: { children: ReactNode }) {
  // ✅ État vide par défaut - pas de données fictives
  const [categories, setCategories] = useState<Category[]>([])

  // Charger les catégories sauvegardées au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCategories = localStorage.getItem('categories')
      if (savedCategories) {
        try {
          const parsedCategories = JSON.parse(savedCategories)
          const categoriesWithDates = parsedCategories.map((category: Category & { createdAt: string }) => ({
            ...category,
            createdAt: new Date(category.createdAt)
          }))
          setCategories(categoriesWithDates)
        } catch (error) {
          console.error('Erreur lors du chargement des catégories:', error)
          // ✅ En cas d'erreur, garder l'état vide
          setCategories([])
        }
      } else {
        // ✅ Pas de données sauvegardées - état vide
        setCategories([])
      }
    }
  }, [])

  // Sauvegarder dans LocalStorage à chaque changement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('categories', JSON.stringify(categories))
    }
  }, [categories])

  const addCategory = (name: string): Category => {
    // Vérifier si la catégorie existe déjà
    const existingCategory = getCategoryByName(name)
    if (existingCategory) {
      return existingCategory
    }

    // Créer une nouvelle catégorie
    const newCategory: Category = {
      id: Date.now().toString(),
      name: name.trim(),
      color: 'bg-gray-500', // Couleur par défaut
      createdAt: new Date()
    }

    setCategories(prev => [...prev, newCategory])
    return newCategory
  }

  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase()
    )
  }

  const searchCategories = (query: string): Category[] => {
    if (!query.trim()) return categories
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  const value: CategoryContextType = {
    categories,
    setCategories,
    addCategory,
    getCategoryByName,
    searchCategories
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
}
