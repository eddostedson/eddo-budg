'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CategoryService } from '@/lib/supabase/database'
import { Category } from '@/types'

interface CategoryContextType {
  categories: Category[]
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void
  addCategory: (name: string) => Promise<Category | null>
  getCategoryByName: (name: string) => Category | undefined
  searchCategories: (query: string) => Category[]
  loading: boolean
  error: string | null
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les catégories depuis Supabase au démarrage
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const categoriesData = await CategoryService.getCategories()
      setCategories(categoriesData)
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err)
      setError('Erreur lors du chargement des catégories')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async (name: string): Promise<Category | null> => {
    try {
      // Vérifier si la catégorie existe déjà
      const existingCategory = getCategoryByName(name)
      if (existingCategory) {
        return existingCategory
      }

      // Créer une nouvelle catégorie en base de données
      const newCategory = await CategoryService.createCategory({
        name: name.trim(),
        color: 'bg-gray-500' // Couleur par défaut
      })

      if (newCategory) {
        // Mettre à jour l'état local
        setCategories(prev => [...prev, newCategory])
        return newCategory
      }

      // Si la création échoue, retourner quand même une catégorie locale temporaire
      console.warn('⚠️ Création de catégorie échouée, utilisation d\'une catégorie locale temporaire')
      const tempCategory: Category = {
        id: `temp-${Date.now()}`,
        name: name.trim(),
        color: 'bg-gray-500',
        createdAt: new Date().toISOString()
      }
      setCategories(prev => [...prev, tempCategory])
      return tempCategory
    } catch (err) {
      console.error('Erreur lors de la création de la catégorie:', err)
      setError('Erreur lors de la création de la catégorie')
      return null
    }
  }

  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase()
    )
  }

  const searchCategories = (query: string): Category[] => {
    if (!query || !query.trim()) return categories
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  const value: CategoryContextType = {
    categories,
    setCategories,
    addCategory,
    getCategoryByName,
    searchCategories,
    loading,
    error
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
