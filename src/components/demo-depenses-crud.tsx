'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useDepenses } from '@/contexts/depense-context'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import { Plus, Edit3, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

export const DemoDepensesCRUD: React.FC = () => {
  const { addDepense, updateDepense, deleteDepense, depenses } = useDepenses()
  const { showSuccess, showError, showInfo } = useUltraModernToastContext()

  const testDepenses = [
    {
      id: 1,
      libelle: 'Test Dépense 1',
      montant: 5000,
      date: new Date().toISOString().split('T')[0],
      description: 'Test de dépense 1',
      categorie: 'Test',
      recetteId: '',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      libelle: 'Test Dépense 2',
      montant: 10000,
      date: new Date().toISOString().split('T')[0],
      description: 'Test de dépense 2',
      categorie: 'Test',
      recetteId: '',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const handleTestCreate = async () => {
    try {
      const testDepense = {
        libelle: `Test Dépense ${Date.now()}`,
        montant: 15000,
        date: new Date().toISOString().split('T')[0],
        description: 'Dépense de test créée',
        categorie: 'Test',
        recetteId: '',
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDepense(testDepense)
      showSuccess("💰 Dépense Créée !", `${testDepense.libelle} ajoutée pour ${testDepense.montant.toLocaleString()} F CFA`)
    } catch (error) {
      showError("Erreur de Création", `Impossible de créer la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleTestUpdate = async () => {
    try {
      if (depenses.length === 0) {
        showError("Aucune Dépense", "Créez d'abord une dépense pour tester la modification")
        return
      }

      const depenseToUpdate = depenses[0]
      const updates = {
        libelle: `${depenseToUpdate.libelle} (Modifiée)`,
        montant: depenseToUpdate.montant + 5000,
        description: 'Dépense modifiée par test'
      }

      await updateDepense(depenseToUpdate.id, updates)
      showInfo("✨ Dépense Modifiée !", `${updates.libelle} mise à jour avec un montant de ${updates.montant.toLocaleString()} F CFA`)
    } catch (error) {
      showError("Erreur de Modification", `Impossible de modifier la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleTestDelete = async () => {
    try {
      if (depenses.length === 0) {
        showError("Aucune Dépense", "Créez d'abord une dépense pour tester la suppression")
        return
      }

      const depenseToDelete = depenses[0]
      await deleteDepense(depenseToDelete.id)
      showError("🗑️ Dépense Supprimée !", `${depenseToDelete.libelle} a été supprimée définitivement`)
    } catch (error) {
      showError("Erreur de Suppression", `Impossible de supprimer la dépense: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const tests = [
    {
      title: 'Création de Dépense',
      description: 'Test du toast de création',
      icon: Plus,
      action: handleTestCreate,
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Modification de Dépense',
      description: 'Test du toast de modification',
      icon: Edit3,
      action: handleTestUpdate,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Suppression de Dépense',
      description: 'Test du toast de suppression',
      icon: Trash2,
      action: handleTestDelete,
      color: 'bg-red-500 hover:bg-red-600'
    }
  ]

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4"
          >
            💰 Test CRUD Dépenses
          </motion.h1>
          <p className="text-gray-600 text-lg">
            Testez toutes les fonctionnalités des dépenses avec toasts ultra-modernes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tests.map((test, index) => (
            <motion.div
              key={test.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-xl ${test.color} text-white`}>
                  <test.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {test.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {test.description}
              </p>
              
              <Button
                onClick={test.action}
                className={`w-full ${test.color} text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg`}
              >
                Tester
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            📊 État Actuel des Dépenses
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">📈 Statistiques</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Nombre de dépenses: {depenses.length}</li>
                <li>• Total des dépenses: {depenses.reduce((sum, d) => sum + d.montant, 0).toLocaleString()} F CFA</li>
                <li>• Dernière dépense: {depenses.length > 0 ? depenses[0].libelle : 'Aucune'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">🎯 Fonctionnalités Testées</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ✅ Création avec validation</li>
                <li>• ✅ Modification avec mise à jour</li>
                <li>• ✅ Suppression avec confirmation</li>
                <li>• ✅ Toasts ultra-modernes</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}


