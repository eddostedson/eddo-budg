// 🧾 PAGE DÉTAIL REÇU
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
import { ArrowLeftIcon, EditIcon, TrashIcon, ReceiptIcon, CalendarIcon, DollarSignIcon, UserIcon, BuildingIcon, DownloadIcon, PrinterIcon, ShareIcon } from 'lucide-react'

interface Receipt {
  id: string
  receipt_number: string
  receipt_type: string
  amount: number
  period_start: string
  period_end: string
  payment_date: string
  payment_method: string
  pdf_url?: string
  signature_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface Property {
  id: string
  property_name: string
  property_type: string
  address: string
  city: string
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface Contract {
  id: string
  contract_number: string
  monthly_rent: number
}

export default function RecuDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    receipt_number: '',
    receipt_type: 'loyer',
    amount: '',
    period_start: '',
    period_end: '',
    payment_date: '',
    payment_method: 'espèces',
    notes: ''
  })

  useEffect(() => {
    const loadReceiptData = async () => {
      try {
        const receiptId = params.id as string
        
        // Simuler le chargement des données
        const mockReceipt: Receipt = {
          id: receiptId,
          receipt_number: '2025-001-0001',
          receipt_type: 'loyer',
          amount: 120000,
          period_start: '2025-01-01',
          period_end: '2025-01-31',
          payment_date: '2025-01-15',
          payment_method: 'espèces',
          pdf_url: '/receipts/2025-001-0001.pdf',
          signature_url: '/signatures/signature.png',
          notes: 'Paiement du loyer de janvier 2025',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const mockProperty: Property = {
          id: '1',
          property_name: 'Appartement Kennedy',
          property_type: 'appartement',
          address: 'Rue Kennedy, Cocody',
          city: 'Abidjan'
        }

        const mockTenant: Tenant = {
          id: '1',
          first_name: 'Jean',
          last_name: 'DUPONT',
          email: 'jean.dupont@email.com',
          phone: '+225 07 12 34 56 78'
        }

        const mockContract: Contract = {
          id: '1',
          contract_number: '2025-001',
          monthly_rent: 120000
        }

        setReceipt(mockReceipt)
        setProperty(mockProperty)
        setTenant(mockTenant)
        setContract(mockContract)
        setEditForm({
          receipt_number: mockReceipt.receipt_number,
          receipt_type: mockReceipt.receipt_type,
          amount: mockReceipt.amount.toString(),
          period_start: mockReceipt.period_start,
          period_end: mockReceipt.period_end,
          payment_date: mockReceipt.payment_date,
          payment_method: mockReceipt.payment_method,
          notes: mockReceipt.notes || ''
        })
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement du reçu:', error)
        setLoading(false)
      }
    }

    loadReceiptData()
  }, [params.id])

  const handleBack = () => {
    router.push('/reçus')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!receipt) return
    
    // Simuler la sauvegarde
    const updatedReceipt = {
      ...receipt,
      ...editForm,
      amount: parseFloat(editForm.amount),
      updated_at: new Date().toISOString()
    }
    
    setReceipt(updatedReceipt)
    setIsEditing(false)
    console.log('Reçu mis à jour:', updatedReceipt)
  }

  const handleCancel = () => {
    if (receipt) {
      setEditForm({
        receipt_number: receipt.receipt_number,
        receipt_type: receipt.receipt_type,
        amount: receipt.amount.toString(),
        period_start: receipt.period_start,
        period_end: receipt.period_end,
        payment_date: receipt.payment_date,
        payment_method: receipt.payment_method,
        notes: receipt.notes || ''
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!receipt) return
    
    // Simuler la suppression
    console.log('Reçu supprimé:', receipt.id)
    setShowDeleteDialog(false)
    router.push('/reçus')
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDownload = () => {
    if (receipt?.pdf_url) {
      // Simuler le téléchargement
      console.log('Téléchargement du reçu:', receipt.pdf_url)
    }
  }

  const handlePrint = () => {
    // Simuler l'impression
    console.log('Impression du reçu:', receipt?.id)
  }

  const handleShare = () => {
    // Simuler le partage
    console.log('Partage du reçu:', receipt?.id)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'loyer':
        return 'bg-blue-100 text-blue-800'
      case 'caution':
        return 'bg-green-100 text-green-800'
      case 'charges':
        return 'bg-yellow-100 text-yellow-800'
      case 'autre':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'espèces':
        return 'bg-green-100 text-green-800'
      case 'virement':
        return 'bg-blue-100 text-blue-800'
      case 'chèque':
        return 'bg-purple-100 text-purple-800'
      case 'mobile_money':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du reçu...</p>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reçu non trouvé</h1>
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
                  Reçu #{receipt.receipt_number}
                </h1>
                <p className="text-sm text-gray-500">Détails du reçu de paiement</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Imprimer
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
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
                        <DialogTitle>Supprimer le reçu</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action est irréversible.
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
                  <ReceiptIcon className="w-5 h-5 mr-2" />
                  Informations du reçu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="receipt_number">Numéro de reçu</Label>
                        <Input
                          id="receipt_number"
                          value={editForm.receipt_number}
                          onChange={(e) => handleFormChange('receipt_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="receipt_type">Type de reçu</Label>
                        <Select value={editForm.receipt_type} onValueChange={(value) => handleFormChange('receipt_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loyer">Loyer</SelectItem>
                            <SelectItem value="caution">Caution</SelectItem>
                            <SelectItem value="charges">Charges</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Montant</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => handleFormChange('amount', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_method">Méthode de paiement</Label>
                        <Select value={editForm.payment_method} onValueChange={(value) => handleFormChange('payment_method', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="espèces">Espèces</SelectItem>
                            <SelectItem value="virement">Virement</SelectItem>
                            <SelectItem value="chèque">Chèque</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="period_start">Période de début</Label>
                        <Input
                          id="period_start"
                          type="date"
                          value={editForm.period_start}
                          onChange={(e) => handleFormChange('period_start', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="period_end">Période de fin</Label>
                        <Input
                          id="period_end"
                          type="date"
                          value={editForm.period_end}
                          onChange={(e) => handleFormChange('period_end', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_date">Date de paiement</Label>
                        <Input
                          id="payment_date"
                          type="date"
                          value={editForm.payment_date}
                          onChange={(e) => handleFormChange('payment_date', e.target.value)}
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
                        <label className="text-sm font-medium text-gray-500">Numéro de reçu</label>
                        <p className="text-sm text-gray-900 font-mono">#{receipt.receipt_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <div className="mt-1">
                          <Badge className={`${getTypeColor(receipt.receipt_type)} capitalize`}>
                            {receipt.receipt_type}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Montant</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <DollarSignIcon className="w-4 h-4 mr-1" />
                          {receipt.amount.toLocaleString()} F CFA
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Méthode de paiement</label>
                        <div className="mt-1">
                          <Badge className={`${getMethodColor(receipt.payment_method)} capitalize`}>
                            {receipt.payment_method}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Période</label>
                        <p className="text-sm text-gray-900">
                          {new Date(receipt.period_start).toLocaleDateString('fr-FR')} - {new Date(receipt.period_end).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date de paiement</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(receipt.payment_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {receipt.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-sm text-gray-900">{receipt.notes}</p>
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
            {/* Statut du reçu */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Statut</span>
                    <Badge className="bg-green-100 text-green-800">Payé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Créé le</span>
                    <span className="text-sm font-medium">
                      {new Date(receipt.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Modifié le</span>
                    <span className="text-sm font-medium">
                      {new Date(receipt.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {receipt.pdf_url && (
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    PDF du reçu
                  </Button>
                )}
                {receipt.signature_url && (
                  <Button variant="outline" className="w-full justify-start">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Signature
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
