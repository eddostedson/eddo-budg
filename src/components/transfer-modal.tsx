'use client'

import { useState, useEffect } from 'react'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { useTransferts } from '@/contexts/transfer-context'
import { useNotifications } from '@/contexts/notification-context'
import { formatCurrency } from '@/lib/utils'
import { TransfertFormData } from '@/types/transfer'

interface TransfertModalProps {
  isOpen: boolean
  onClose: () => void
  recetteSourceId?: string
  montantDisponible?: number
}

export default function TransfertModal({ 
  isOpen, 
  onClose, 
  recetteSourceId, 
  montantDisponible 
}: TransfertModalProps) {
  const { recettes, refreshRecettes } = useRecettes()
  const { depenses, refreshDepenses } = useDepenses()
  const { addTransfert } = useTransferts()
  const { showSuccess, showError, showWarning } = useNotifications()
  
  const [formData, setFormData] = useState<TransfertFormData>({
    recetteSourceId: recetteSourceId || '',
    recetteDestinationId: '',
    montant: montantDisponible || 0,
    description: '',
    dateTransfert: new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)

  // Rafraîchir les données quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      refreshRecettes()
      refreshDepenses()
    }
  }, [isOpen, refreshRecettes, refreshDepenses])

  useEffect(() => {
    if (recetteSourceId) {
      setFormData(prev => ({
        ...prev,
        recetteSourceId,
        montant: montantDisponible || 0
      }))
    }
  }, [recetteSourceId, montantDisponible])

  // Filtrer les recettes disponibles (exclure la recette source)
  const recettesDisponibles = recettes.filter(r => r.id !== formData.recetteSourceId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.recetteSourceId || !formData.recetteDestinationId) {
      showWarning("Sélection requise", "Veuillez sélectionner les recettes source et destination.")
      return
    }

    if (formData.montant <= 0) {
      showWarning("Montant invalide", "Le montant doit être supérieur à 0.")
      return
    }

    if (formData.montant > (montantDisponible || 0)) {
      showWarning("Montant insuffisant", "Le montant ne peut pas dépasser le solde disponible.")
      return
    }

    setLoading(true)
    try {
      await addTransfert(formData)
      
      showSuccess(
        "Transfert effectué",
        `Le transfert de ${formatCurrency(formData.montant)} a été effectué avec succès !`
      )
      
      // Rafraîchir les données
      await refreshRecettes()
      await refreshDepenses()
      
      // Fermer le modal
      onClose()
      
      // Réinitialiser le formulaire
      setFormData({
        recetteSourceId: '',
        recetteDestinationId: '',
        montant: 0,
        description: '',
        dateTransfert: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      showError(
        "Erreur de transfert",
        "Une erreur est survenue lors du transfert. Veuillez réessayer."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-blue-100 overflow-hidden">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">🔄</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  Transfert de Solde
                </h2>
                <p className="text-blue-100 text-sm">Transférez le solde restant vers une autre recette</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Recette Source - Card moderne */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">📤</span>
              Recette Source
            </label>
            <div className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl font-medium text-gray-800">
              {recettes.find(r => r.id === formData.recetteSourceId)?.libelle || 'Chargement...'}
            </div>
          </div>

          {/* Solde Disponible - Card moderne */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">💰</span>
              Solde Disponible à Transférer
            </label>
            <div className="w-full px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl font-bold text-green-700 text-xl text-center shadow-lg">
              {formatCurrency(montantDisponible || 0)}
            </div>
          </div>

          {/* Montant à Transférer */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">💸</span>
              Montant à Transférer
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
              className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all font-medium"
              placeholder="Ex: 10000"
              required
              min="0.01"
              step="0.01"
              max={montantDisponible || 0}
            />
            <p className="text-xs text-gray-500 mt-2">
              Maximum : {formatCurrency(montantDisponible || 0)}
            </p>
          </div>

          {/* Recette Destination */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">📥</span>
              Recette Destination
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.recetteDestinationId}
                onChange={(e) => setFormData(prev => ({ ...prev, recetteDestinationId: e.target.value }))}
                className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none cursor-pointer font-medium text-gray-800 pr-12"
                required
              >
                <option value="">Sélectionnez une recette destination</option>
                {recettesDisponibles.map(recette => {
                  // Calculer le solde réel en temps réel
                  const depensesLiees = depenses.filter(d => d.recetteId === recette.id)
                  const totalDepenses = depensesLiees.reduce((total, depense) => total + depense.montant, 0)
                  const soldeCorrect = recette.montant - totalDepenses
                  
                  return (
                    <option key={recette.id} value={recette.id}>
                      {recette.libelle} • {formatCurrency(soldeCorrect)} disponible
                    </option>
                  )
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                <span className="text-gray-400 text-xl">▼</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">📅</span>
              Date du Transfert
            </label>
            <input
              type="date"
              value={formData.dateTransfert}
              onChange={(e) => setFormData(prev => ({ ...prev, dateTransfert: e.target.value }))}
              className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <span className="text-xl">📝</span>
              Description (Optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium resize-none"
              placeholder="Raison du transfert, commentaires..."
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-4 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Transfert en cours...
                </>
              ) : (
                <>
                  <span className="text-2xl">🔄</span>
                  Effectuer le Transfert
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}