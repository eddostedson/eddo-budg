'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Receipt } from '@/lib/shared-data'
import { toast } from 'sonner'

const supabase = createClient()

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setReceipts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('date_transaction', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des reçus:', error)
        toast.error('Erreur lors de la récupération des reçus')
        setReceipts([])
        return
      }

      const mappedReceipts: Receipt[] = (data || []).map((receipt) => ({
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
        createdAt: receipt.created_at,
        updatedAt: receipt.updated_at
      }))

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
        toast.error('Erreur d\'authentification')
        return null
      }

      // Générer les données pour le QR code
      const qrCodeData = JSON.stringify({
        nom: receipt.nomLocataire,
        villa: receipt.villa,
        periode: receipt.periode,
        montant: receipt.montant,
        date: receipt.dateTransaction,
        bailleur: 'EDDO Stéphane',
        telephone: '0709363699'
      })

      const { data, error } = await supabase
        .from('receipts')
        .insert({
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
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la création du reçu:', error)
        toast.error('Erreur lors de la création du reçu')
        return null
      }

      await refreshReceipts()
      toast.success('✅ Reçu créé avec succès !')
      return data.id
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue lors de la création du reçu')
      return null
    }
  }

  const updateReceipt = async (id: string, updates: Partial<Receipt>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
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

      // Mettre à jour le QR code si nécessaire
      if (updates.nomLocataire || updates.villa || updates.periode || updates.montant || updates.dateTransaction) {
        const receipt = receipts.find(r => r.id === id)
        if (receipt) {
          const updatedReceipt = { ...receipt, ...updates }
          const qrCodeData = JSON.stringify({
            nom: updatedReceipt.nomLocataire,
            villa: updatedReceipt.villa,
            periode: updatedReceipt.periode,
            montant: updatedReceipt.montant,
            date: updatedReceipt.dateTransaction,
            bailleur: 'EDDO Stéphane',
            telephone: '0709363699'
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
        toast.error('Erreur lors de la mise à jour du reçu')
        return false
      }

      await refreshReceipts()
      toast.success('✅ Reçu modifié avec succès !')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue lors de la mise à jour du reçu')
      return false
    }
  }

  const deleteReceipt = async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Erreur d\'authentification')
        return false
      }

      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Erreur lors de la suppression du reçu:', error)
        toast.error('Erreur lors de la suppression du reçu')
        return false
      }

      await refreshReceipts()
      toast.success('✅ Reçu supprimé avec succès !')
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      toast.error('Erreur inattendue lors de la suppression du reçu')
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

