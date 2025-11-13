'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import { Plus, Edit3, Trash2, Sparkles, Zap } from 'lucide-react'

export const DemoUltraModernToasts: React.FC = () => {
  const { 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning,
    showRecetteCreated,
    showRecetteUpdated,
    showRecetteDeleted
  } = useUltraModernToastContext()

  const demos = [
    {
      title: 'Création de Recette',
      description: 'Test du toast de création',
      icon: Plus,
      action: () => showRecetteCreated('Salaire Mensuel', 500000),
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Modification de Recette',
      description: 'Test du toast de modification',
      icon: Edit3,
      action: () => showRecetteUpdated('Salaire Mensuel', 600000),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Suppression de Recette',
      description: 'Test du toast de suppression',
      icon: Trash2,
      action: () => showRecetteDeleted('Ancienne Recette'),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Succès Générique',
      description: 'Test du toast de succès',
      icon: Sparkles,
      action: () => showSuccess('Opération Réussie !', 'Votre action a été exécutée avec succès', 'success'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Erreur Générique',
      description: 'Test du toast d\'erreur',
      icon: Zap,
      action: () => showError('Erreur Détectée !', 'Une erreur s\'est produite lors de l\'opération', 'delete'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Information',
      description: 'Test du toast d\'information',
      icon: Edit3,
      action: () => showInfo('Information', 'Voici une information importante pour vous', 'edit'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
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
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            🎨 Toasts Ultra-Modernes
          </motion.h1>
          <p className="text-gray-600 text-lg">
            Découvrez les notifications les plus avancées avec animations fluides
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-xl ${demo.color} text-white`}>
                  <demo.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {demo.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {demo.description}
              </p>
              
              <Button
                onClick={demo.action}
                className={`w-full ${demo.color} text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:shadow-lg`}
              >
                Tester le Toast
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              ✨ Fonctionnalités Avancées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">🎭 Animations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Entrée avec effet de ressort</li>
                  <li>• Rotation 3D au chargement</li>
                  <li>• Effet shimmer en continu</li>
                  <li>• Barre de progression animée</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">🎨 Design</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gradients dynamiques</li>
                  <li>• Effets de flou (backdrop-blur)</li>
                  <li>• Ombres colorées</li>
                  <li>• Icônes animées</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}





