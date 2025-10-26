'use client'

import React, { useState, useEffect } from 'react'
import { Recette } from '@/lib/shared-data'
import { createClient } from '@/lib/supabase/browser'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface RecetteInfoCardProps {
  recetteId: string
  className?: string
}

const RecetteInfoCard: React.FC<RecetteInfoCardProps> = ({ recetteId, className = '' }) => {
  const [recette, setRecette] = useState<Recette | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecette = async () => {
      if (!recetteId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 [RecetteInfoCard] Chargement de la recette:', recetteId)
        
        const supabase = createClient()
        const { data, error } = await supabase
          .from('recettes')
          .select('*')
          .eq('id', recetteId)
          .single()

        if (error) {
          console.error('Erreur lors de la récupération de la recette:', error)
          setError('Recette non trouvée')
          return
        }

        if (data) {
          // Mapper les données de la base vers l'interface Recette
          const recetteData: Recette = {
            id: data.id,
            userId: data.user_id,
            libelle: data.description || '',
            description: data.description || '',
            montant: parseFloat(data.amount || 0),
            soldeDisponible: parseFloat(data.solde_disponible || data.amount || 0),
            source: '',
            periodicite: 'unique',
            dateReception: data.receipt_date || new Date().toISOString().split('T')[0],
            categorie: '',
            statut: 'reçue',
            createdAt: data.created_at,
            updatedAt: data.updated_at
          }
          setRecette(recetteData)
        }
      } catch (err) {
        console.error('Erreur inattendue:', err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchRecette()
  }, [recetteId])

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !recette) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-sm text-red-600 font-medium">
            {error || 'Recette non associée'}
          </span>
        </div>
      </div>
    )
  }

  const totalDepenses = recette.montant - recette.soldeDisponible
  const pourcentageUtilise = recette.montant > 0 ? (totalDepenses / recette.montant) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-blue-800 flex items-center">
          <DollarSignIcon className="h-4 w-4 mr-1" />
          Recette Associée
        </h4>
        <Badge 
          variant="outline" 
          className={`text-xs ${
            pourcentageUtilise >= 80 
              ? 'bg-red-100 text-red-700 border-red-300' 
              : pourcentageUtilise >= 50 
              ? 'bg-orange-100 text-orange-700 border-orange-300'
              : pourcentageUtilise >= 20 
              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
              : 'bg-green-100 text-green-700 border-green-300'
          }`}
        >
          {Math.round(pourcentageUtilise)}% utilisé
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-800 truncate">
          {recette.libelle}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/60 rounded-lg p-2">
            <div className="text-gray-600 mb-1">Solde Initial</div>
            <div className="font-bold text-green-700">
              {recette.montant.toLocaleString()} F CFA
            </div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-2">
            <div className="text-gray-600 mb-1">Disponible</div>
            <div className="font-bold text-blue-700">
              {recette.soldeDisponible.toLocaleString()} F CFA
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Dépensé: {totalDepenses.toLocaleString()} F CFA</span>
          <span>Date: {new Date(recette.dateReception).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default RecetteInfoCard
