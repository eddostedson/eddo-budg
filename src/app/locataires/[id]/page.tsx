// 🏠 PAGE DÉTAIL LOCATAIRE
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, EditIcon, TrashIcon, ReceiptIcon, CalendarIcon, DollarSignIcon, PhoneIcon, MailIcon, MapPinIcon, UserIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  id_number?: string
  id_type?: string
  occupation?: string
  employer?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Property {
  id: string
  property_name: string
  property_type: string
  address: string
  city: string
  rent_amount: number
  currency: string
}

interface Contract {
  id: string
  contract_number: string
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_amount: number
  contract_status: string
  contract_notes?: string
}

export default function LocataireDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showSuccess, showError, showInfo } = useUltraModernToastContext()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    id_number: '',
    id_type: '',
    occupation: '',
    employer: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  })

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        const tenantId = params.id as string
        
        // Charger depuis localStorage ou utiliser des données par défaut
        const savedTenants = JSON.parse(localStorage.getItem('tenants') || '[]')
        let tenantData = savedTenants.find((t: any) => t.id === tenantId)
        
        // Si pas trouvé dans localStorage, créer des données par défaut
        if (!tenantData) {
          tenantData = {
            id: tenantId,
            first_name: 'Jean',
            last_name: 'DUPONT',
            email: 'jean.dupont@email.com',
            phone: '+225 07 12 34 56 78',
            address: 'Rue Kennedy, Cocody',
            city: 'Abidjan',
            id_number: 'CI123456789',
            id_type: 'CNI',
            occupation: 'Ingénieur',
            employer: 'Société ABC',
            emergency_contact_name: 'Marie DUPONT',
            emergency_contact_phone: '+225 07 98 76 54 32',
            notes: 'Locataire modèle, toujours à jour avec ses paiements',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Sauvegarder les données par défaut
          const updatedTenants = [...savedTenants, tenantData]
          localStorage.setItem('tenants', JSON.stringify(updatedTenants))
        }
        
        const mockTenant: Tenant = tenantData

        const mockProperty: Property = {
          id: 'property-1',
          property_name: 'Appartement Kennedy',
          property_type: 'appartement',
          address: 'Rue Kennedy, Cocody',
          city: 'Abidjan',
          rent_amount: 120000,
          currency: 'F CFA'
        }

        const mockContract: Contract = {
          id: 'contract-1',
          contract_number: '2025-001',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          monthly_rent: 120000,
          deposit_amount: 240000,
          contract_status: 'active',
          contract_notes: 'Contrat de location standard'
        }

        setTenant(mockTenant)
        setProperty(mockProperty)
        setContract(mockContract)
        setEditForm({
          first_name: mockTenant.first_name,
          last_name: mockTenant.last_name,
          email: mockTenant.email || '',
          phone: mockTenant.phone || '',
          address: mockTenant.address || '',
          city: mockTenant.city || '',
          id_number: mockTenant.id_number || '',
          id_type: mockTenant.id_type || '',
          occupation: mockTenant.occupation || '',
          employer: mockTenant.employer || '',
          emergency_contact_name: mockTenant.emergency_contact_name || '',
          emergency_contact_phone: mockTenant.emergency_contact_phone || '',
          notes: mockTenant.notes || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement du locataire:', error)
        setLoading(false)
      }
    }

    loadTenantData()
  }, [params.id])

  // Vérifier si on doit activer le mode édition
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && tenant) {
      setIsEditing(true)
      // Mettre à jour le formulaire d'édition avec les données du locataire
      setEditForm({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        id_type: tenant.id_type || '',
        id_number: tenant.id_number || '',
        occupation: tenant.occupation || '',
        employer: tenant.employer || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        notes: tenant.notes || ''
      })
    }
  }, [searchParams, tenant])

  const handleBack = () => {
    router.push('/locataires')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!tenant) return
    
    // Validation des champs obligatoires
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      showError('❌ Erreur de validation', 'Le prénom et le nom sont obligatoires.')
      return
    }
    
    // Simuler la sauvegarde
    const updatedTenant = {
      ...tenant,
      ...editForm,
      updated_at: new Date().toISOString()
    }
    
    // Mettre à jour l'état local
    setTenant(updatedTenant)
    setIsEditing(false)
    
    // Sauvegarder dans le localStorage pour la persistance
    const existingTenants = JSON.parse(localStorage.getItem('tenants') || '[]')
    const updatedTenants = existingTenants.map((t: any) => 
      t.id === updatedTenant.id ? updatedTenant : t
    )
    localStorage.setItem('tenants', JSON.stringify(updatedTenants))
    
    showSuccess('✅ Locataire modifié !', `${updatedTenant.first_name} ${updatedTenant.last_name} a été mis à jour avec succès.`)
    console.log('Locataire mis à jour:', updatedTenant)
  }

  const handleCancel = () => {
    if (tenant) {
      setEditForm({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        id_number: tenant.id_number || '',
        id_type: tenant.id_type || '',
        occupation: tenant.occupation || '',
        employer: tenant.employer || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        notes: tenant.notes || ''
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!tenant) return
    
    // Supprimer du localStorage
    const existingTenants = JSON.parse(localStorage.getItem('tenants') || '[]')
    const updatedTenants = existingTenants.filter((t: any) => t.id !== tenant.id)
    localStorage.setItem('tenants', JSON.stringify(updatedTenants))
    
    console.log('Locataire supprimé:', tenant.id)
    setShowDeleteDialog(null)
    showSuccess('🗑️ Locataire supprimé !', `${tenant.first_name} ${tenant.last_name} a été supprimé avec succès.`)
    
    // Rediriger vers la liste après un délai pour voir la notification
    setTimeout(() => {
      router.push('/locataires')
    }, 1500)
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du locataire...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Locataire non trouvé</h1>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-2xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-6 hover:bg-blue-50 transition-all duration-300 group"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                Retour
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {tenant.first_name} {tenant.last_name}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Détails du locataire</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    <EditIcon className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    Modifier
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteDialog(tenant.id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <TrashIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Supprimer
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-gray-50 transition-all duration-300 shadow-lg"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSave} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <span className="group-hover:scale-105 transition-transform duration-300">Sauvegarder</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog === tenant?.id} onOpenChange={(open) => setShowDeleteDialog(open ? tenant?.id || null : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le locataire</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer le locataire "{tenant?.first_name} {tenant?.last_name}" ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations personnelles */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
                  <CardTitle className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <Label htmlFor="first_name" className="text-sm font-semibold text-gray-700 mb-2 block">Prénom</Label>
                        <Input
                          id="first_name"
                          value={editForm.first_name}
                          onChange={(e) => handleFormChange('first_name', e.target.value)}
                          className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Nom</Label>
                        <Input
                          id="last_name"
                          value={editForm.last_name}
                          onChange={(e) => handleFormChange('last_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleFormChange('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Adresse</Label>
                        <Input
                          id="address"
                          value={editForm.address}
                          onChange={(e) => handleFormChange('address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={editForm.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Prénom</label>
                      <p className="text-sm text-gray-900">{tenant.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom</label>
                      <p className="text-sm text-gray-900">{tenant.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <MailIcon className="w-4 h-4 mr-1" />
                        {tenant.email || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Téléphone</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {tenant.phone || 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Adresse</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {tenant.address || 'Non renseignée'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ville</label>
                      <p className="text-sm text-gray-900">{tenant.city || 'Non renseignée'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations professionnelles */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Informations professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="occupation">Profession</Label>
                        <Input
                          id="occupation"
                          value={editForm.occupation}
                          onChange={(e) => handleFormChange('occupation', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employer">Employeur</Label>
                        <Input
                          id="employer"
                          value={editForm.employer}
                          onChange={(e) => handleFormChange('employer', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="id_type">Type de pièce d'identité</Label>
                        <Select value={editForm.id_type} onValueChange={(value) => handleFormChange('id_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CNI">CNI</SelectItem>
                            <SelectItem value="Passeport">Passeport</SelectItem>
                            <SelectItem value="Permis de conduire">Permis de conduire</SelectItem>
                            <SelectItem value="Carte d'étudiant">Carte d'étudiant</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="id_number">Numéro de pièce d'identité</Label>
                        <Input
                          id="id_number"
                          value={editForm.id_number}
                          onChange={(e) => handleFormChange('id_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Profession</label>
                      <p className="text-sm text-gray-900">{tenant.occupation || 'Non renseignée'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employeur</label>
                      <p className="text-sm text-gray-900">{tenant.employer || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type de pièce d'identité</label>
                      <p className="text-sm text-gray-900">{tenant.id_type || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Numéro de pièce d'identité</label>
                      <p className="text-sm text-gray-900">{tenant.id_number || 'Non renseigné'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact d'urgence */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact d'urgence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency_contact_name">Nom du contact</Label>
                        <Input
                          id="emergency_contact_name"
                          value={editForm.emergency_contact_name}
                          onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_contact_phone">Téléphone du contact</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={editForm.emergency_contact_phone}
                          onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom du contact</label>
                        <p className="text-sm text-gray-900">{tenant.emergency_contact_name || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Téléphone du contact</label>
                        <p className="text-sm text-gray-900">{tenant.emergency_contact_phone || 'Non renseigné'}</p>
                      </div>
                    </div>
                    {tenant.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-sm text-gray-900">{tenant.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>

            {/* Informations professionnelles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
                  <CardTitle className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    Informations professionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                          <Label htmlFor="occupation" className="text-sm font-semibold text-gray-700 mb-2 block">Profession</Label>
                          <Input
                            id="occupation"
                            value={editForm.occupation}
                            onChange={(e) => handleFormChange('occupation', e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                          />
                        </div>
                        <div className="group">
                          <Label htmlFor="employer" className="text-sm font-semibold text-gray-700 mb-2 block">Employeur</Label>
                          <Input
                            id="employer"
                            value={editForm.employer}
                            onChange={(e) => handleFormChange('employer', e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                          />
                        </div>
                        <div className="group">
                          <Label htmlFor="id_type" className="text-sm font-semibold text-gray-700 mb-2 block">Type de pièce d'identité</Label>
                          <Select value={editForm.id_type} onValueChange={(value) => handleFormChange('id_type', value)}>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CNI">CNI</SelectItem>
                              <SelectItem value="Passeport">Passeport</SelectItem>
                              <SelectItem value="Permis de conduire">Permis de conduire</SelectItem>
                              <SelectItem value="Carte d'étudiant">Carte d'étudiant</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="group">
                          <Label htmlFor="id_number" className="text-sm font-semibold text-gray-700 mb-2 block">Numéro de pièce d'identité</Label>
                          <Input
                            id="id_number"
                            value={editForm.id_number}
                            onChange={(e) => handleFormChange('id_number', e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profession</label>
                        <p className="text-sm text-gray-900">{tenant.occupation || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Employeur</label>
                        <p className="text-sm text-gray-900">{tenant.employer || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type de pièce d'identité</label>
                        <p className="text-sm text-gray-900">{tenant.id_type || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Numéro de pièce d'identité</label>
                        <p className="text-sm text-gray-900">{tenant.id_number || 'Non renseigné'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact d'urgence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
                  <CardTitle className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <PhoneIcon className="w-4 h-4 text-white" />
                    </div>
                    Contact d'urgence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group">
                          <Label htmlFor="emergency_contact_name" className="text-sm font-semibold text-gray-700 mb-2 block">Nom du contact</Label>
                          <Input
                            id="emergency_contact_name"
                            value={editForm.emergency_contact_name}
                            onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                          />
                        </div>
                        <div className="group">
                          <Label htmlFor="emergency_contact_phone" className="text-sm font-semibold text-gray-700 mb-2 block">Téléphone du contact</Label>
                          <Input
                            id="emergency_contact_phone"
                            value={editForm.emergency_contact_phone}
                            onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                          />
                        </div>
                      </div>
                      <div className="group">
                        <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 mb-2 block">Notes</Label>
                        <Textarea
                          id="notes"
                          value={editForm.notes}
                          onChange={(e) => handleFormChange('notes', e.target.value)}
                          rows={3}
                          className="bg-white/80 backdrop-blur-sm border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nom du contact</label>
                          <p className="text-sm text-gray-900">{tenant.emergency_contact_name || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Téléphone du contact</label>
                          <p className="text-sm text-gray-900">{tenant.emergency_contact_phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                      {tenant.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Notes</label>
                          <p className="text-sm text-gray-900">{tenant.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/20">
                  <CardTitle className="flex items-center text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <UserIcon className="w-3 h-3 text-white" />
                    </div>
                    Statut
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Badge 
                    variant={tenant.is_active ? "default" : "secondary"}
                    className={`${tenant.is_active 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
                    } px-4 py-2 text-sm font-semibold`}
                  >
                    {tenant.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Propriété */}
            {property && (
              <Card>
                <CardHeader>
                  <CardTitle>Propriété</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{property.property_name}</p>
                    <p className="text-sm text-gray-500">{property.address}</p>
                    <p className="text-sm text-gray-500">{property.city}</p>
                    <p className="text-sm font-medium text-green-600">
                      {property.rent_amount.toLocaleString()} {property.currency}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contrat */}
            {contract && (
              <Card>
                <CardHeader>
                  <CardTitle>Contrat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">#{contract.contract_number}</p>
                    <p className="text-sm text-gray-500">
                      Du {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                    </p>
                    {contract.end_date && (
                      <p className="text-sm text-gray-500">
                        Au {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <Badge variant="outline">{contract.contract_status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <ReceiptIcon className="w-4 h-4 mr-2" />
                  Voir les reçus
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Historique des paiements
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSignIcon className="w-4 h-4 mr-2" />
                  Nouveau paiement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
