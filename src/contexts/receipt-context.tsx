'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Receipt } from '@/lib/shared-data'
import { notifySuccess, notifyError, notifyCreated, notifyUpdated, notifyDeleted } from '@/lib/notify'

const supabase = createClient()

const buildReceiptSignature = (payload: {
  nom: string
  villa: string
  periode: string
  montant: number
  date: string
  bailleur: string
  telephone: string
}): string => {
  const base = `${payload.nom}|${payload.villa}|${payload.periode}|${payload.montant}|${payload.date}|${payload.bailleur}|${payload.telephone}`
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0
  }
  return `EDDO-${hash.toString(16).toUpperCase().padStart(8, '0')}`
}

interface ReceiptContextType {
  receipts: Receipt[]
  loading: boolean
  refreshReceipts: () => Promise<void>
  createReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<boolean>
  deleteReceipt: (id: string) => Promise<boolean>
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined)

export function ReceiptProvider({ children }: { children: React.ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const refreshReceipts = async () => {
    try {
      // Vérifier l'authentification avec plus de détails
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Erreur d\'authentification:', authError)
        notifyError('Erreur d\'authentification. Veuillez vous reconnecter.')
        setReceipts([])
        setLoading(false)
        return
      }
      
      if (!user) {
        console.warn('⚠️ Aucun utilisateur authentifié')
        setReceipts([])
        setLoading(false)
        return
      }

      console.log('🔄 Chargement des reçus pour l\'utilisateur:', user.id)

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('date_transaction', { ascending: false })

      if (error) {
        // Améliorer le logging pour capturer tous les types d'erreurs
        const errorDetails = {
          message: error.message || String(error),
          code: error.code || 'UNKNOWN',
          details: error.details || null,
          hint: error.hint || null,
          fullError: error,
          errorType: typeof error,
          errorString: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }
        
        console.error('❌ Erreur lors de la récupération des reçus:', errorDetails)
        console.error('❌ Erreur brute:', error)
        console.error('❌ Type d\'erreur:', typeof error)
        console.error('❌ Erreur stringifiée:', JSON.stringify(error, null, 2))
        
        // Afficher un message d'erreur plus informatif
        const errorMessage = error.message || error.code || 'Erreur inconnue lors du chargement'
        notifyError(`Erreur lors de la récupération des reçus: ${errorMessage}`)
        setReceipts([])
        return
      }
      
      console.log('📊 Résultat de la requête reçus:', { 
        dataCount: data?.length || 0, 
        hasError: !!error
      })
      const mappedReceipts: Receipt[] = (data || []).map((receipt) => {
        let signature: string | undefined
        if (receipt.qr_code_data) {
          try {
            const parsed = JSON.parse(receipt.qr_code_data)
            if (typeof parsed.signature === 'string') {
              signature = parsed.signature
            }
          } catch (error) {
            console.warn('⚠️ Impossible de parser qr_code_data pour le reçu', receipt.id, error)
          }
        }

        return {
          id: receipt.id,
          userId: receipt.user_id,
          transactionId: receipt.transaction_id,
          compteId: receipt.compte_id,
          nomLocataire: receipt.nom_locataire,
          villa: receipt.villa,
          periode: receipt.periode,
          montant: parseFloat(receipt.montant || 0),
          dateTransaction: receipt.date_transaction,
          libelle: receipt.libelle,
          description: receipt.description,
          qrCodeData: receipt.qr_code_data,
          receiptUrl: receipt.receipt_url || undefined,
          receiptFileName: receipt.receipt_file_name || undefined,
          signature,
          createdAt: receipt.created_at,
          updatedAt: receipt.updated_at
        }
      })

      setReceipts(mappedReceipts)
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }

  const createReceipt = async (receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return null
      }

      // Validation des champs requis
      if (!receipt.compteId) {
        console.error('❌ compteId manquant')
        notifyError('Erreur: compteId manquant')
        return null
      }
      if (!receipt.nomLocataire || receipt.nomLocataire.trim() === '') {
        console.error('❌ nomLocataire manquant')
        notifyError('Erreur: nom du locataire manquant')
        return null
      }
      if (!receipt.villa || receipt.villa.trim() === '') {
        console.error('❌ villa manquante')
        notifyError('Erreur: villa manquante')
        return null
      }
      if (!receipt.periode || receipt.periode.trim() === '') {
        console.error('❌ periode manquante')
        notifyError('Erreur: période manquante')
        return null
      }
      if (!receipt.montant || receipt.montant <= 0) {
        console.error('❌ montant invalide:', receipt.montant)
        notifyError('Erreur: montant invalide')
        return null
      }
      if (!receipt.dateTransaction) {
        console.error('❌ dateTransaction manquante')
        notifyError('Erreur: date de transaction manquante')
        return null
      }

      // Générer les données pour le QR code + signature numérique
      const qrPayload = {
        nom: receipt.nomLocataire,
        villa: receipt.villa,
        periode: receipt.periode,
        montant: receipt.montant,
        date: receipt.dateTransaction,
        bailleur: 'EDDO Stéphane',
        telephone: '0709363699'
      }
      const signature = buildReceiptSignature(qrPayload)
      const qrCodeData = JSON.stringify({
        ...qrPayload,
        signature
      })

      // Préparer les données d'insertion (uniquement les colonnes qui existent dans la table)
      const insertData: Record<string, any> = {
        user_id: user.id,
        transaction_id: receipt.transactionId || null,
        compte_id: receipt.compteId,
        nom_locataire: receipt.nomLocataire,
        villa: receipt.villa,
        periode: receipt.periode,
        montant: receipt.montant,
        date_transaction: receipt.dateTransaction,
        libelle: receipt.libelle || null,
        description: receipt.description || null,
        qr_code_data: qrCodeData
      }

      // Ajouter receipt_url et receipt_file_name seulement s'ils existent dans la table
      // (Ces colonnes peuvent ne pas exister dans toutes les versions de la table)
      if (receipt.receiptUrl) {
        insertData.receipt_url = receipt.receiptUrl
      }
      if (receipt.receiptFileName) {
        insertData.receipt_file_name = receipt.receiptFileName
      }

      const { data, error } = await supabase
        .from('receipts')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la création du reçu:', error)
        console.error('❌ Détails de l\'erreur:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('❌ Données envoyées:', {
          user_id: user.id,
          transaction_id: receipt.transactionId || null,
          compte_id: receipt.compteId,
          nom_locataire: receipt.nomLocataire,
          villa: receipt.villa,
          periode: receipt.periode,
          montant: receipt.montant,
          date_transaction: receipt.dateTransaction,
          libelle: receipt.libelle || null,
          description: receipt.description || null
        })
        notifyError(`Erreur lors de la création du reçu: ${error.message || 'Erreur inconnue'}`)
        return null
      }

      await refreshReceipts()
      notifyCreated('Reçu')
      return data.id
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la création du reçu')
      return null
    }
  }

  const updateReceipt = async (id: string, updates: Partial<Receipt>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      const updateData: Record<string, any> = {}
      if (updates.nomLocataire !== undefined) updateData.nom_locataire = updates.nomLocataire
      if (updates.villa !== undefined) updateData.villa = updates.villa
      if (updates.periode !== undefined) updateData.periode = updates.periode
      if (updates.montant !== undefined) updateData.montant = updates.montant
      if (updates.dateTransaction !== undefined) updateData.date_transaction = updates.dateTransaction
      if (updates.libelle !== undefined) updateData.libelle = updates.libelle
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl
      if (updates.receiptFileName !== undefined) updateData.receipt_file_name = updates.receiptFileName

      // Mettre à jour le QR code si nécessaire
      if (updates.nomLocataire || updates.villa || updates.periode || updates.montant || updates.dateTransaction) {
        const receipt = receipts.find(r => r.id === id)
        if (receipt) {
          const updatedReceipt = { ...receipt, ...updates }
          const qrPayload = {
            nom: updatedReceipt.nomLocataire,
            villa: updatedReceipt.villa,
            periode: updatedReceipt.periode,
            montant: updatedReceipt.montant,
            date: updatedReceipt.dateTransaction,
            bailleur: 'EDDO Stéphane',
            telephone: '0709363699'
          }
          const signature = buildReceiptSignature(qrPayload)
          const qrCodeData = JSON.stringify({
            ...qrPayload,
            signature
          })
          updateData.qr_code_data = qrCodeData
        }
      }

      const { error } = await supabase
        .from('receipts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du reçu:', error)
        notifyError('Erreur lors de la mise à jour du reçu')
        return false
      }

      await refreshReceipts()
      notifyUpdated('Reçu')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la mise à jour du reçu')
      return false
    }
  }

  const deleteReceipt = async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        notifyError('Erreur d\'authentification')
        return false
      }

      // Sauvegarder les données du reçu pour l'UNDO
      const receiptToDelete = receipts.find(r => r.id === id)
      if (!receiptToDelete) {
        notifyError('Reçu non trouvé')
        return false
      }

      const receiptData = {
        user_id: user.id,
        compte_id: receiptToDelete.compteId,
        nom_locataire: receiptToDelete.nomLocataire,
        villa: receiptToDelete.villa,
        periode: receiptToDelete.periode,
        montant: receiptToDelete.montant,
        date_transaction: receiptToDelete.dateTransaction,
        libelle: receiptToDelete.libelle || null,
        description: receiptToDelete.description || null,
        receipt_url: receiptToDelete.receiptUrl || null,
        receipt_file_name: receiptToDelete.receiptFileName || null,
        qr_code_data: receiptToDelete.qrCodeData || null
      }

      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression du reçu:', error)
        notifyError('Erreur lors de la suppression du reçu')
        return false
      }

      // Notification avec UNDO
      notifyDeleted('Reçu', async () => {
        // Restaurer le reçu
        const { error: restoreError } = await supabase
          .from('receipts')
          .insert(receiptData)

        if (!restoreError) {
          await refreshReceipts()
        }
      })

      await refreshReceipts()
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      notifyError('Erreur inattendue lors de la suppression du reçu')
      return false
    }
  }

  useEffect(() => {
    refreshReceipts()
  }, [])

  return (
    <ReceiptContext.Provider
      value={{
        receipts,
        loading,
        refreshReceipts,
        createReceipt,
        updateReceipt,
        deleteReceipt
      }}
    >
      {children}
    </ReceiptContext.Provider>
  )
}

export function useReceipts() {
  const context = useContext(ReceiptContext)
  if (context === undefined) {
    throw new Error('useReceipts must be used within a ReceiptProvider')
  }
  return context
}

