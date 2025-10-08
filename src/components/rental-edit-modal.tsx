'use client'

import { useState, useEffect } from 'react'
import { useRecettes } from '@/contexts/recette-context'
import { useNotifications } from '@/contexts/notification-context'
import { formatCurrency } from '@/lib/utils'
import { Recette } from '@/lib/shared-data'
import FilePreviewTooltip from './file-preview-tooltip'

interface RentalProperty {
  id: string
  name: string
  amount: number
  description?: string
  tenantName?: string
  tenantContact?: string
  tenantIdDocument?: File | null
  tenantIdDocumentUrl?: string
  // Nouveaux champs pour les reçus
  paymentReceipt?: File | null
  paymentReceiptUrl?: string
  acknowledgmentReceipt?: File | null
  acknowledgmentReceiptUrl?: string
}

interface RentalEditModalProps {
  isOpen: boolean
  onClose: () => void
  recette: Recette | null
  onSuccess?: () => void
}

export default function RentalEditModal({ isOpen, onClose, recette, onSuccess }: RentalEditModalProps) {
  const { updateRecette } = useRecettes()
  const { showSuccess, showError } = useNotifications()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
    dateReception: '',
    source: 'Loyers',
    periodicite: 'mensuelle' as const,
    statut: 'reçue' as const
  })

  const [properties, setProperties] = useState<RentalProperty[]>([])

  // Parser les informations de la recette existante
  useEffect(() => {
    if (recette && isOpen) {
      setFormData({
        libelle: recette.libelle,
        description: recette.description.split('\n\nDétail des loyers:')[0] || '',
        dateReception: new Date(recette.dateReception).toISOString().split('T')[0],
        source: recette.source,
        periodicite: recette.periodicite,
        statut: recette.statut
      })

      // Parser les propriétés depuis la description
      const detailSection = recette.description.split('\n\nDétail des loyers:')[1]
      if (detailSection) {
        const propertyLines = detailSection.split('\n').filter(line => line.startsWith('•'))
        const parsedProperties: RentalProperty[] = propertyLines.map((line, index) => {
          // Regex améliorée pour capturer le montant avec formatage français
          const match = line.match(/• (.+?):\s*([\d\s,]+)\s*(?:FCFA|F CFA|€|\$)?(?:\s+\((.+?)\))?/)
          if (match) {
            const [, name, amountStr, description] = match
            
            // Parser le montant formaté français - version robuste
            let amount = 0
            if (amountStr) {
              // Gérer tous les formats possibles : "126 350 FCFA", "126350 F CFA", "126,350 FCFA"
              const cleanAmount = amountStr
                .replace(/[^\d,]/g, '') // Garder seulement les chiffres et virgules
                .replace(/,/g, '.') // Remplacer virgule par point pour parseFloat
              amount = parseFloat(cleanAmount) || 0
            }
            
            // Extraire les informations du locataire des lignes suivantes
            const nextLines = detailSection.split('\n').slice(propertyLines.indexOf(line) + 1)
            let tenantName = ''
            let tenantContact = ''
            let tenantIdDocument = null
            
            for (const nextLine of nextLines) {
              if (nextLine.includes('👤 Locataire:')) {
                tenantName = nextLine.replace('👤 Locataire:', '').trim()
              } else if (nextLine.includes('📞 Contact:')) {
                tenantContact = nextLine.replace('📞 Contact:', '').trim()
              } else if (nextLine.includes('📄 Pièce d\'identité:')) {
                // Note: Les fichiers ne peuvent pas être restaurés depuis la description
                // L'utilisateur devra les re-uploader
              } else if (nextLine.startsWith('•')) {
                break // Nouvelle propriété
              }
            }
            
            return {
              id: (index + 1).toString(),
              name,
              amount,
              description: description || '',
              tenantName,
              tenantContact,
              tenantIdDocument: null
            }
          }
          return {
            id: (index + 1).toString(),
            name: `Propriété ${index + 1}`,
            amount: 0,
            description: '',
            tenantName: '',
            tenantContact: '',
            tenantIdDocument: null
          }
        })
        
        setProperties(parsedProperties.length > 0 ? parsedProperties : [
          { id: '1', name: 'Villa A', amount: 0, description: '', tenantName: '', tenantContact: '', tenantIdDocument: null },
          { id: '2', name: 'Villa B', amount: 0, description: '', tenantName: '', tenantContact: '', tenantIdDocument: null },
          { id: '3', name: 'Villa C', amount: 0, description: '', tenantName: '', tenantContact: '', tenantIdDocument: null },
          { id: '4', name: 'Villa D', amount: 0, description: '', tenantName: '', tenantContact: '', tenantIdDocument: null },
          { id: '5', name: 'Villa E', amount: 0, description: '', tenantName: '', tenantContact: '', tenantIdDocument: null }
        ])
      }
    }
  }, [recette, isOpen])

  const totalAmount = properties.reduce((sum, property) => sum + property.amount, 0)

  const handlePropertyChange = (id: string, field: keyof RentalProperty, value: string | number) => {
    setProperties(prev => prev.map(prop => 
      prop.id === id ? { ...prop, [field]: value } : prop
    ))
  }

  const handleFileUpload = (id: string, file: File | null) => {
    setProperties(prev => prev.map(prop => 
      prop.id === id ? { ...prop, tenantIdDocument: file } : prop
    ))
  }

  const handleFileRemove = (id: string) => {
    setProperties(prev => prev.map(prop => 
      prop.id === id ? { ...prop, tenantIdDocument: null } : prop
    ))
  }

  const addProperty = () => {
    const newId = (properties.length + 1).toString()
    setProperties(prev => [...prev, { 
      id: newId, 
      name: `Villa ${String.fromCharCode(64 + properties.length + 1)}`, 
      amount: 0, 
      description: '',
      tenantName: '',
      tenantContact: '',
      tenantIdDocument: null
    }])
  }

  const removeProperty = (id: string) => {
    if (properties.length > 1) {
      setProperties(prev => prev.filter(prop => prop.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recette) return

    if (totalAmount === 0) {
      showError('Erreur', 'Veuillez saisir au moins un montant pour une propriété')
      return
    }

    setLoading(true)
    
    try {
      // Créer la recette mise à jour
      const recetteData = {
        ...formData,
        montant: totalAmount,
        description: `${formData.description}\n\nDétail des loyers:\n${properties
          .filter(p => p.amount > 0)
          .map(p => {
            let detail = `• ${p.name}: ${formatCurrency(p.amount)}`
            if (p.description) detail += ` (${p.description})`
            if (p.tenantName) detail += `\n  👤 Locataire: ${p.tenantName}`
            if (p.tenantContact) detail += `\n  📞 Contact: ${p.tenantContact}`
            if (p.tenantIdDocument) detail += `\n  📄 Pièce d'identité: ${p.tenantIdDocument.name}`
            return detail
          })
          .join('\n')}`
      }

      await updateRecette(recette.id, recetteData)
      
      showSuccess(
        'Loyers modifiés !',
        `Vos loyers ont été mis à jour avec succès`
      )
      
      onClose()
      onSuccess?.()
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue lors de la modification des loyers')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !recette) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/30 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl w-full max-w-4xl border-2 border-blue-100 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-blue-500 to-orange-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">✏️</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  ✏️ Modifier les Loyers
                </h2>
                <p className="text-orange-100 text-sm">Modifiez les informations de vos loyers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Informations générales */}
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-6 border-2 border-blue-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Informations générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg">🏷️</span>
                  Libellé de la recette
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.libelle} 
                  onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                  placeholder="Ex: Loyers - Janvier 2025"
                  required 
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg">📅</span>
                  Date de réception
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={formData.dateReception} 
                  onChange={(e) => setFormData(prev => ({ ...prev, dateReception: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                  required 
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <span className="text-lg">📝</span>
                Description (optionnel)
              </label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none" 
                placeholder="Ajoutez des détails sur vos loyers..."
              />
            </div>
          </div>


          {/* Détail des propriétés */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🏘️</span>
                Détail par propriété
              </h3>
              <button
                type="button"
                onClick={addProperty}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                <span>+</span>
                Ajouter une propriété
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property, index) => (
                <div key={property.id} className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-green-300 transition-all relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏠</span>
                      <h4 className="font-bold text-gray-800">Propriété {index + 1}</h4>
                    </div>
                    {properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProperty(property.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all"
                        title="Supprimer cette propriété"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Nom/Adresse de la propriété
                      </label>
                      <input 
                        type="text" 
                        value={property.name} 
                        onChange={(e) => handlePropertyChange(property.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-medium" 
                        placeholder="Ex: Villa A, Rue X..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Montant du loyer
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={property.amount || ''} 
                          onChange={(e) => handlePropertyChange(property.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 pr-16 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm font-bold" 
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">
                          FCFA
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Notes (optionnel)
                      </label>
                      <input 
                        type="text" 
                        value={property.description} 
                        onChange={(e) => handlePropertyChange(property.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm" 
                        placeholder="Ex: Paiement en retard..."
                      />
                    </div>
                    
                    {/* Informations du locataire */}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">👤</span>
                        <h5 className="font-semibold text-gray-700 text-sm">Informations du locataire</h5>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-1 block">
                            Nom du locataire
                          </label>
                          <input 
                            type="text" 
                            value={property.tenantName || ''} 
                            onChange={(e) => handlePropertyChange(property.id, 'tenantName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium" 
                            placeholder="Ex: Mme Nguessan"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-1 block">
                            Contact (téléphone/email)
                          </label>
                          <input 
                            type="text" 
                            value={property.tenantContact || ''} 
                            onChange={(e) => handlePropertyChange(property.id, 'tenantContact', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm" 
                            placeholder="Ex: +225 07 12 34 56 78"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-1 block">
                            Pièce d'identité
                          </label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => handleFileUpload(property.id, e.target.files?.[0] || null)}
                              data-property-id={property.id}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {property.tenantIdDocument && (
                              <div className="mt-3">
                                <FilePreviewTooltip file={property.tenantIdDocument}>
                                  <div className="text-sm text-green-700 flex items-center gap-2 cursor-pointer hover:bg-green-100 p-3 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <span className="text-lg">✅</span>
                                    <span className="font-semibold flex-1">{property.tenantIdDocument.name}</span>
                                    <span className="text-blue-600 text-lg hover:scale-110 transition-transform">👁️</span>
                                  </div>
                                </FilePreviewTooltip>
                                
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleFileRemove(property.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
                                  >
                                    <span>🗑️</span>
                                    <span>Supprimer</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => document.querySelector(`input[type="file"][data-property-id="${property.id}"]`)?.click()}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
                                  >
                                    <span>🔄</span>
                                    <span>Remplacer</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Résumé
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">Propriétés avec loyer</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => p.amount > 0).length} / {properties.length}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Montant total</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Moyenne par propriété</div>
                <div className="text-2xl font-bold text-blue-600">
                  {properties.filter(p => p.amount > 0).length > 0 
                    ? formatCurrency(totalAmount / properties.filter(p => p.amount > 0).length)
                    : formatCurrency(0)
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              disabled={loading || totalAmount === 0}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 via-blue-500 to-orange-600 hover:from-orange-700 hover:via-blue-600 hover:to-orange-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {loading ? '⏳ Modification...' : '✏️ Modifier les Loyers'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
