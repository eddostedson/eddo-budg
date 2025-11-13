// 🏢 PAGE DÉTAIL PROPRIÉTÉ
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeftIcon, EditIcon, TrashIcon, BuildingIcon, MapPinIcon, DollarSignIcon, CalendarIcon, UserIcon, ReceiptIcon, AlertTriangleIcon } from 'lucide-react'

interface Property {
  id: string
  property_name: string
  property_type: string
  address: string
  city: string
  postal_code?: string
  country: string
  rent_amount: number
  currency: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  is_active: boolean
}

interface Contract {
  id: string
  contract_number: string
  start_date: string
  end_date?: string
  monthly_rent: number
  contract_status: string
  tenant: Tenant
}

export default function ProprieteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    property_name: '',
    property_type: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Côte d\'Ivoire',
    rent_amount: '',
    currency: 'F CFA',
    description: ''
  })

  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        const propertyId = params.id as string
        
        // Simuler le chargement des données
        const mockProperty: Property = {
          id: propertyId,
          property_name: 'Appartement Kennedy',
          property_type: 'appartement',
          address: 'Rue Kennedy, Cocody',
          city: 'Abidjan',
          postal_code: '00225',
          country: 'Côte d\'Ivoire',
          rent_amount: 120000,
          currency: 'F CFA',
          description: 'Bel appartement de 3 pièces avec balcon, proche des commodités',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const mockTenants: Tenant[] = [
          {
            id: '1',
            first_name: 'Jean',
            last_name: 'DUPONT',
            email: 'jean.dupont@email.com',
            phone: '+225 07 12 34 56 78',
            is_active: true
          },
          {
            id: '2',
            first_name: 'Marie',
            last_name: 'KOUAME',
            email: 'marie.kouame@email.com',
            phone: '+225 07 23 45 67 89',
            is_active: true
          }
        ]

        const mockContracts: Contract[] = [
          {
            id: '1',
            contract_number: '2025-001',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            monthly_rent: 120000,
            contract_status: 'active',
            tenant: mockTenants[0]
          }
        ]

        setProperty(mockProperty)
        setTenants(mockTenants)
        setContracts(mockContracts)
        setEditForm({
          property_name: mockProperty.property_name,
          property_type: mockProperty.property_type,
          address: mockProperty.address,
          city: mockProperty.city,
          postal_code: mockProperty.postal_code || '',
          country: mockProperty.country,
          rent_amount: mockProperty.rent_amount.toString(),
          currency: mockProperty.currency,
          description: mockProperty.description || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement de la propriété:', error)
        setLoading(false)
      }
    }

    loadPropertyData()
  }, [params.id])

  const handleBack = () => {
    router.push('/proprietes')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!property) return
    
    // Simuler la sauvegarde
    const updatedProperty = {
      ...property,
      ...editForm,
      rent_amount: parseFloat(editForm.rent_amount),
      updated_at: new Date().toISOString()
    }
    
    setProperty(updatedProperty)
    setIsEditing(false)
    console.log('Propriété mise à jour:', updatedProperty)
  }

  const handleCancel = () => {
    if (property) {
      setEditForm({
        property_name: property.property_name,
        property_type: property.property_type,
        address: property.address,
        city: property.city,
        postal_code: property.postal_code || '',
        country: property.country,
        rent_amount: property.rent_amount.toString(),
        currency: property.currency,
        description: property.description || ''
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!property) return
    
    // Simuler la suppression
    console.log('Propriété supprimée:', property.id)
    setShowDeleteDialog(false)
    router.push('/proprietes')
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
          <p className="mt-4 text-gray-600">Chargement de la propriété...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Propriété non trouvée</h1>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {property.property_name}
                </h1>
                <p className="text-sm text-gray-500">Détails de la propriété</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <EditIcon className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Supprimer la propriété</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Êtes-vous sûr de vouloir supprimer cette propriété ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Annuler
                          </Button>
                          <Button variant="destructive" onClick={handleDelete}>
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sauvegarder
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BuildingIcon className="w-5 h-5 mr-2" />
                  Informations de la propriété
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="property_name">Nom de la propriété</Label>
                        <Input
                          id="property_name"
                          value={editForm.property_name}
                          onChange={(e) => handleFormChange('property_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="property_type">Type de propriété</Label>
                        <Select value={editForm.property_type} onValueChange={(value) => handleFormChange('property_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appartement">Appartement</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="bureau">Bureau</SelectItem>
                            <SelectItem value="commerce">Commerce</SelectItem>
                            <SelectItem value="terrain">Terrain</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <div>
                        <Label htmlFor="postal_code">Code postal</Label>
                        <Input
                          id="postal_code"
                          value={editForm.postal_code}
                          onChange={(e) => handleFormChange('postal_code', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Pays</Label>
                        <Input
                          id="country"
                          value={editForm.country}
                          onChange={(e) => handleFormChange('country', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rent_amount">Loyer mensuel</Label>
                        <Input
                          id="rent_amount"
                          type="number"
                          value={editForm.rent_amount}
                          onChange={(e) => handleFormChange('rent_amount', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Devise</Label>
                        <Select value={editForm.currency} onValueChange={(value) => handleFormChange('currency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="F CFA">F CFA</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom</label>
                        <p className="text-sm text-gray-900">{property.property_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm text-gray-900 capitalize">{property.property_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Adresse</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {property.address}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ville</label>
                        <p className="text-sm text-gray-900">{property.city}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Code postal</label>
                        <p className="text-sm text-gray-900">{property.postal_code || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pays</label>
                        <p className="text-sm text-gray-900">{property.country}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Loyer mensuel</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <DollarSignIcon className="w-4 h-4 mr-1" />
                          {property.rent_amount.toLocaleString()} {property.currency}
                        </p>
                      </div>
                    </div>
                    {property.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm text-gray-900">{property.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locataires actuels */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Locataires actuels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun locataire actuel</p>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{contract.tenant.first_name} {contract.tenant.last_name}</p>
                            <p className="text-sm text-gray-500">Contrat #{contract.contract_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{contract.monthly_rent.toLocaleString()} {property.currency}</p>
                          <Badge variant="outline">{contract.contract_status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={property.is_active ? "default" : "secondary"}>
                  {property.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Locataires actuels</span>
                  <span className="font-medium">{contracts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Revenus mensuels</span>
                  <span className="font-medium">
                    {contracts.reduce((sum, contract) => sum + contract.monthly_rent, 0).toLocaleString()} {property.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Taux d'occupation</span>
                  <span className="font-medium">
                    {contracts.length > 0 ? '100%' : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>

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
                  <UserIcon className="w-4 h-4 mr-2" />
                  Ajouter un locataire
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
