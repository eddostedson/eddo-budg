// 📋 PAGE DÉTAIL CONTRAT
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
import { ArrowLeftIcon, EditIcon, TrashIcon, FileTextIcon, CalendarIcon, DollarSignIcon, UserIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'

interface Contract {
  id: string
  contract_number: string
  start_date: string
  end_date?: string
  monthly_rent: number
  deposit_amount: number
  payment_due_day: number
  contract_status: string
  contract_notes?: string
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

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
}

export default function ContratDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    contract_number: '',
    start_date: '',
    end_date: '',
    monthly_rent: '',
    deposit_amount: '',
    payment_due_day: '',
    contract_status: 'active',
    contract_notes: ''
  })

  useEffect(() => {
    const loadContractData = async () => {
      try {
        const contractId = params.id as string
        
        // Simuler le chargement des données
        const mockContract: Contract = {
          id: contractId,
          contract_number: '2025-001',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          monthly_rent: 120000,
          deposit_amount: 240000,
          payment_due_day: 1,
          contract_status: 'active',
          contract_notes: 'Contrat de location standard avec clause de renouvellement automatique',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const mockProperty: Property = {
          id: '1',
          property_name: 'Appartement Kennedy',
          property_type: 'appartement',
          address: 'Rue Kennedy, Cocody',
          city: 'Abidjan',
          rent_amount: 120000,
          currency: 'F CFA'
        }

        const mockTenant: Tenant = {
          id: '1',
          first_name: 'Jean',
          last_name: 'DUPONT',
          email: 'jean.dupont@email.com',
          phone: '+225 07 12 34 56 78',
          address: 'Rue Kennedy, Cocody',
          city: 'Abidjan'
        }

        setContract(mockContract)
        setProperty(mockProperty)
        setTenant(mockTenant)
        setEditForm({
          contract_number: mockContract.contract_number,
          start_date: mockContract.start_date,
          end_date: mockContract.end_date || '',
          monthly_rent: mockContract.monthly_rent.toString(),
          deposit_amount: mockContract.deposit_amount.toString(),
          payment_due_day: mockContract.payment_due_day.toString(),
          contract_status: mockContract.contract_status,
          contract_notes: mockContract.contract_notes || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement du contrat:', error)
        setLoading(false)
      }
    }

    loadContractData()
  }, [params.id])

  const handleBack = () => {
    router.push('/contrats')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!contract) return
    
    // Simuler la sauvegarde
    const updatedContract = {
      ...contract,
      ...editForm,
      monthly_rent: parseFloat(editForm.monthly_rent),
      deposit_amount: parseFloat(editForm.deposit_amount),
      payment_due_day: parseInt(editForm.payment_due_day),
      updated_at: new Date().toISOString()
    }
    
    setContract(updatedContract)
    setIsEditing(false)
    console.log('Contrat mis à jour:', updatedContract)
  }

  const handleCancel = () => {
    if (contract) {
      setEditForm({
        contract_number: contract.contract_number,
        start_date: contract.start_date,
        end_date: contract.end_date || '',
        monthly_rent: contract.monthly_rent.toString(),
        deposit_amount: contract.deposit_amount.toString(),
        payment_due_day: contract.payment_due_day.toString(),
        contract_status: contract.contract_status,
        contract_notes: contract.contract_notes || ''
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!contract) return
    
    // Simuler la suppression
    console.log('Contrat supprimé:', contract.id)
    setShowDeleteDialog(false)
    router.push('/contrats')
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'terminated':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'expired':
        return <AlertTriangleIcon className="w-4 h-4" />
      case 'terminated':
        return <AlertTriangleIcon className="w-4 h-4" />
      case 'suspended':
        return <AlertTriangleIcon className="w-4 h-4" />
      default:
        return <AlertTriangleIcon className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du contrat...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contrat non trouvé</h1>
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
                  Contrat #{contract.contract_number}
                </h1>
                <p className="text-sm text-gray-500">Détails du contrat de location</p>
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
                        <DialogTitle>Supprimer le contrat</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
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
                  <FileTextIcon className="w-5 h-5 mr-2" />
                  Informations du contrat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contract_number">Numéro de contrat</Label>
                        <Input
                          id="contract_number"
                          value={editForm.contract_number}
                          onChange={(e) => handleFormChange('contract_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contract_status">Statut</Label>
                        <Select value={editForm.contract_status} onValueChange={(value) => handleFormChange('contract_status', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="expired">Expiré</SelectItem>
                            <SelectItem value="terminated">Résilié</SelectItem>
                            <SelectItem value="suspended">Suspendu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="start_date">Date de début</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => handleFormChange('start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">Date de fin</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => handleFormChange('end_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthly_rent">Loyer mensuel</Label>
                        <Input
                          id="monthly_rent"
                          type="number"
                          value={editForm.monthly_rent}
                          onChange={(e) => handleFormChange('monthly_rent', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deposit_amount">Montant de la caution</Label>
                        <Input
                          id="deposit_amount"
                          type="number"
                          value={editForm.deposit_amount}
                          onChange={(e) => handleFormChange('deposit_amount', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_due_day">Jour d'échéance</Label>
                        <Input
                          id="payment_due_day"
                          type="number"
                          min="1"
                          max="31"
                          value={editForm.payment_due_day}
                          onChange={(e) => handleFormChange('payment_due_day', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contract_notes">Notes du contrat</Label>
                      <Textarea
                        id="contract_notes"
                        value={editForm.contract_notes}
                        onChange={(e) => handleFormChange('contract_notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Numéro de contrat</label>
                        <p className="text-sm text-gray-900 font-mono">#{contract.contract_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Statut</label>
                        <div className="flex items-center mt-1">
                          <Badge className={`${getStatusColor(contract.contract_status)} flex items-center`}>
                            {getStatusIcon(contract.contract_status)}
                            <span className="ml-1 capitalize">{contract.contract_status}</span>
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date de début</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date de fin</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'Non définie'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Loyer mensuel</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <DollarSignIcon className="w-4 h-4 mr-1" />
                          {contract.monthly_rent.toLocaleString()} {property?.currency}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Caution</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <DollarSignIcon className="w-4 h-4 mr-1" />
                          {contract.deposit_amount.toLocaleString()} {property?.currency}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Jour d'échéance</label>
                        <p className="text-sm text-gray-900">Le {contract.payment_due_day} de chaque mois</p>
                      </div>
                    </div>
                    {contract.contract_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-sm text-gray-900">{contract.contract_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parties impliquées */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Parties impliquées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Locataire */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Locataire
                    </h4>
                    {tenant ? (
                      <div className="space-y-2">
                        <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
                        <p className="text-sm text-gray-500">{tenant.email}</p>
                        <p className="text-sm text-gray-500">{tenant.phone}</p>
                        <p className="text-sm text-gray-500">{tenant.address}, {tenant.city}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun locataire assigné</p>
                    )}
                  </div>

                  {/* Propriété */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BuildingIcon className="w-4 h-4 mr-2" />
                      Propriété
                    </h4>
                    {property ? (
                      <div className="space-y-2">
                        <p className="font-medium">{property.property_name}</p>
                        <p className="text-sm text-gray-500 capitalize">{property.property_type}</p>
                        <p className="text-sm text-gray-500">{property.address}</p>
                        <p className="text-sm text-gray-500">{property.city}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucune propriété assignée</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Durée du contrat */}
            <Card>
              <CardHeader>
                <CardTitle>Durée du contrat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Début</span>
                    <span className="text-sm font-medium">
                      {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Fin</span>
                    <span className="text-sm font-medium">
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fr-FR') : 'Non définie'}
                    </span>
                  </div>
                  {contract.end_date && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Durée restante</span>
                        <span className="text-sm font-medium">
                          {Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paiements */}
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Loyer mensuel</span>
                  <span className="font-medium">
                    {contract.monthly_rent.toLocaleString()} {property?.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Caution</span>
                  <span className="font-medium">
                    {contract.deposit_amount.toLocaleString()} {property?.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total initial</span>
                  <span className="font-medium">
                    {(contract.monthly_rent + contract.deposit_amount).toLocaleString()} {property?.currency}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Échéance</span>
                    <span className="text-sm font-medium">
                      Le {contract.payment_due_day} de chaque mois
                    </span>
                  </div>
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
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Télécharger le contrat
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
