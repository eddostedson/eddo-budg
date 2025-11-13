// 💾 PAGE RESTAURATION BACKUP - CHARGER LES RECETTES DEPUIS recettes_backup_complete
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecettes } from '@/contexts/recette-context-direct'
import { createClient } from '@/lib/supabase/browser'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeftIcon, DownloadIcon, AlertTriangleIcon, CheckCircleIcon, DatabaseIcon } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient()

interface BackupRecette {
  id: string
  user_id: string
  libelle?: string
  description?: string
  amount?: number
  montant?: number
  solde_disponible?: number
  soldeDisponible?: number
  source?: string
  periodicite?: string
  date_reception?: string
  receipt_date?: string
  date?: string
  categorie?: string
  statut?: string
  receipt_url?: string
  receipt_file_name?: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export default function RestaurerBackupPage() {
  const router = useRouter()
  const { refreshRecettes } = useRecettes()
  const [backupRecettes, setBackupRecettes] = useState<BackupRecette[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [selectedRecettes, setSelectedRecettes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBackupRecettes()
  }, [])

  const loadBackupRecettes = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error('Erreur d\'authentification')
        return
      }

      // Charger les recettes depuis la table de backup
      const { data, error } = await supabase
        .from('recettes_backup_complete')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement du backup:', error)
        toast.error('Erreur lors du chargement du backup')
        return
      }

      setBackupRecettes(data || [])
      console.log('📊 Recettes chargées depuis le backup:', data?.length || 0)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectRecette = (id: string) => {
    setSelectedRecettes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedRecettes(new Set(backupRecettes.map(r => r.id)))
  }

  const deselectAll = () => {
    setSelectedRecettes(new Set())
  }

  const restoreSelected = async () => {
    if (selectedRecettes.size === 0) {
      toast.error('Veuillez sélectionner au moins une recette à restaurer')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir restaurer ${selectedRecettes.size} recette(s) ?`)) {
      return
    }

    setRestoring(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error('Erreur d\'authentification')
        return
      }

      const recettesToRestore = backupRecettes.filter(r => selectedRecettes.has(r.id))
      let successCount = 0
      let errorCount = 0

      for (const backupRecette of recettesToRestore) {
        try {
          // Mapper les données du backup vers le format actuel
          const montant = backupRecette.amount || backupRecette.montant || 0
          const soldeDisponible = backupRecette.solde_disponible || backupRecette.soldeDisponible || montant
          
          // Préparer les données en nettoyant les valeurs undefined
          const recetteData: any = {
            user_id: user.id,
            description: backupRecette.description || backupRecette.libelle || 'Sans description',
            amount: montant,
            solde_disponible: soldeDisponible,
            receipt_date: backupRecette.receipt_date || backupRecette.date_reception || backupRecette.date || new Date().toISOString().split('T')[0]
          }

          // Ajouter les champs optionnels seulement s'ils existent
          if (backupRecette.source) recetteData.source = backupRecette.source
          if (backupRecette.periodicite) recetteData.periodicite = backupRecette.periodicite
          if (backupRecette.categorie) recetteData.categorie = backupRecette.categorie
          if (backupRecette.statut) recetteData.statut = backupRecette.statut
          if (backupRecette.receipt_url) recetteData.receipt_url = backupRecette.receipt_url
          if (backupRecette.receipt_file_name) recetteData.receipt_file_name = backupRecette.receipt_file_name
          
          // Ajouter deleted_at seulement si la colonne existe (géré par la base)
          // On ne l'ajoute pas explicitement pour éviter les erreurs

          // Utiliser upsert pour gérer automatiquement insert/update
          const { error: upsertError } = await supabase
            .from('recettes')
            .upsert({
              id: backupRecette.id, // Garder l'ID original
              ...recetteData
            }, {
              onConflict: 'id', // En cas de conflit sur l'ID, faire un update
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Erreur lors de la restauration:', {
              recetteId: backupRecette.id,
              libelle: backupRecette.description || backupRecette.libelle,
              error: upsertError
            })
            errorCount++
          } else {
            successCount++
          }
        } catch (error: any) {
          console.error('Erreur lors de la restauration d\'une recette:', {
            recetteId: backupRecette.id,
            libelle: backupRecette.description || backupRecette.libelle,
            error: error?.message || error
          })
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} recette(s) restaurée(s) avec succès !`)
        await refreshRecettes()
        await loadBackupRecettes()
        setSelectedRecettes(new Set())
      }

      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} recette(s) n'ont pas pu être restaurée(s). Vérifiez la console pour plus de détails.`)
      }

      if (successCount === 0 && errorCount > 0) {
        toast.error('Aucune recette n\'a pu être restaurée. Vérifiez les permissions et la structure de la base de données.')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la restauration')
    } finally {
      setRestoring(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Chargement du backup...</h2>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8"
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
                <h1 className="text-4xl font-bold mb-2">💾 Restaurer depuis Backup</h1>
                <p className="text-blue-100 text-lg">Charger les recettes depuis recettes_backup_complete</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-white bg-opacity-20 text-white border-white">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              {backupRecettes.length} recette{backupRecettes.length > 1 ? 's' : ''} disponible{backupRecettes.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {backupRecettes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DatabaseIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Aucune sauvegarde trouvée</h2>
            <p className="text-gray-500 mb-6">La table recettes_backup_complete est vide ou n'existe pas</p>
            <Button
              onClick={() => router.push('/recettes')}
              className="bg-blue-600 hover:bg-blue-700"
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
                        La restauration va importer les recettes depuis le backup. Les recettes existantes avec le même ID seront mises à jour.
                        Sélectionnez les recettes que vous souhaitez restaurer.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions en masse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center justify-between"
            >
              <div className="flex space-x-2">
                <Button
                  onClick={selectAll}
                  variant="outline"
                  size="sm"
                >
                  Tout sélectionner
                </Button>
                <Button
                  onClick={deselectAll}
                  variant="outline"
                  size="sm"
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {selectedRecettes.size} sélectionnée{selectedRecettes.size > 1 ? 's' : ''}
                </Badge>
                <Button
                  onClick={restoreSelected}
                  disabled={restoring || selectedRecettes.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {restoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restauration...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Restaurer les sélectionnées
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Liste des recettes du backup */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backupRecettes.map((recette, index) => {
                const isSelected = selectedRecettes.has(recette.id)
                const montant = recette.amount || recette.montant || 0
                const soldeDisponible = recette.solde_disponible || recette.soldeDisponible || montant
                const libelle = recette.description || recette.libelle || 'Sans titre'

                return (
                  <motion.div
                    key={recette.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card 
                      className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      onClick={() => toggleSelectRecette(recette.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecette(recette.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-gray-800">{libelle}</CardTitle>
                              <p className="text-sm text-gray-500">{recette.description || 'Aucune description'}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Montant */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Montant:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(montant)}</span>
                          </div>
                          
                          {/* Solde disponible */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Solde disponible:</span>
                            <span className="font-bold text-green-600">{formatCurrency(soldeDisponible)}</span>
                          </div>
                          
                          {/* Date */}
                          <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                            Créée le {new Date(recette.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

