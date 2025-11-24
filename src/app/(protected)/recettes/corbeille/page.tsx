// 🗑️ PAGE CORBEILLE - RESTAURATION DES RECETTES SUPPRIMÉES
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecettes } from '@/contexts/recette-context-direct'
import { Recette } from '@/lib/shared-data'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeftIcon, TrashIcon, RotateCcwIcon, AlertTriangleIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function CorbeillePage() {
  const router = useRouter()
  const { restoreRecette, permanentlyDeleteRecette, getDeletedRecettes } = useRecettes()
  const [deletedRecettes, setDeletedRecettes] = useState<Recette[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeletedRecettes()
  }, [])

  const loadDeletedRecettes = async () => {
    setLoading(true)
    try {
      const recettes = await getDeletedRecettes()
      setDeletedRecettes(recettes)
    } catch (error) {
      console.error('Erreur lors du chargement de la corbeille:', error)
      toast.error('Erreur lors du chargement de la corbeille')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const success = await restoreRecette(id)
      if (success) {
        toast.success('✅ Recette restaurée avec succès !')
        await loadDeletedRecettes()
      } else {
        toast.error('❌ Erreur lors de la restauration')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur inattendue')
    }
  }

  const handlePermanentlyDelete = async (id: string, libelle: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${libelle}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      const success = await permanentlyDeleteRecette(id)
      if (success) {
        toast.success('✅ Recette supprimée définitivement')
        await loadDeletedRecettes()
      } else {
        toast.error('❌ Erreur lors de la suppression définitive')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur inattendue')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement de la corbeille...</h2>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/recettes')}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-4xl font-bold mb-2">🗑️ Corbeille</h1>
                <p className="text-gray-200 text-lg">Recettes supprimées - Restauration possible</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-white bg-opacity-20 text-white border-white">
              {deletedRecettes.length} recette{deletedRecettes.length > 1 ? 's' : ''} supprimée{deletedRecettes.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {deletedRecettes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrashIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Corbeille vide</h2>
            <p className="text-gray-500 mb-6">Aucune recette supprimée pour le moment</p>
            <Button
              onClick={() => router.push('/recettes')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour aux Recettes
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Avertissement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-yellow-50 border-yellow-300">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-1">⚠️ Avertissement</h3>
                      <p className="text-sm text-yellow-700">
                        Les recettes supprimées sont conservées dans la corbeille. Vous pouvez les restaurer ou les supprimer définitivement.
                        Les dépenses liées seront également restaurées si vous restaurez une recette.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Liste des recettes supprimées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deletedRecettes.map((recette, index) => (
                <motion.div
                  key={recette.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">🗑️</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-800">{recette.libelle}</CardTitle>
                            <p className="text-sm text-gray-500">{recette.description || 'Aucune description'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          Supprimée
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Montant */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Montant initial:</span>
                          <span className="font-bold text-gray-800">{formatCurrency(recette.montant)}</span>
                        </div>
                        
                        {/* Solde disponible */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Solde disponible:</span>
                          <span className="font-bold text-green-600">{formatCurrency(recette.soldeDisponible)}</span>
                        </div>
                        
                        {/* Date de suppression */}
                        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                          Supprimée le {new Date(recette.updatedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="flex space-x-2 mt-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={() => handleRestore(recette.id)}
                        >
                          <RotateCcwIcon className="h-4 w-4 mr-1" />
                          Restaurer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          onClick={() => handlePermanentlyDelete(recette.id, recette.libelle)}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}











