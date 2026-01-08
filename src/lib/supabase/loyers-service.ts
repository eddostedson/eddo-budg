'use client'

import { createClient } from '@/lib/supabase/browser'
import { LoyerFacture, LoyerReglement, VillaConfig } from '@/lib/shared-data'

const supabase = createClient()

const mapVilla = (row: any): VillaConfig => ({
  id: row.id,
  userId: row.user_id,
  label: row.label,
  code: row.code,
  loyerMontant: parseFloat(row.loyer_montant ?? 0),
  currency: row.currency ?? 'F CFA',
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapFacture = (row: any): LoyerFacture => ({
  id: row.id,
  userId: row.user_id,
  villaId: row.villa_id,
  locataireNom: row.locataire_nom,
  mois: row.mois,
  annee: row.annee,
  montantTotal: parseFloat(row.montant_total ?? 0),
  montantRestant: parseFloat(row.montant_restant ?? 0),
  statut: row.statut as LoyerFacture['statut'],
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  villa: row.villa_configs ? mapVilla(row.villa_configs) : undefined
})

const mapReglement = (row: any): LoyerReglement => ({
  id: row.id,
  userId: row.user_id,
  factureId: row.facture_id,
  receiptId: row.receipt_id,
  transactionId: row.transaction_id,
  montant: parseFloat(row.montant ?? 0),
  soldeApres: parseFloat(row.solde_apres ?? 0),
  dateOperation: row.date_operation,
  note: row.note,
  createdAt: row.created_at
})

export const LoyersService = {
  async listVillas(): Promise<VillaConfig[]> {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []

    const { data, error } = await supabase
      .from('villa_configs')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('label', { ascending: true })

    if (error) {
      console.error('❌ listVillas error', error)
      return []
    }

    return (data ?? []).map(mapVilla)
  },

  async createVilla(payload: {
    label: string
    loyerMontant: number
    code?: string
    description?: string
  }): Promise<VillaConfig | null> {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data, error } = await supabase
      .from('villa_configs')
      .insert({
        user_id: auth.user.id,
        label: payload.label,
        code: payload.code ?? null,
        loyer_montant: payload.loyerMontant,
        description: payload.description ?? null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ createVilla error', error)
      return null
    }

    return mapVilla(data)
  },

  async ensureFacture(params: {
    villaId?: string | null
    locataireNom: string
    periodeMois: number
    periodeAnnee: number
    montantTotal: number
  }): Promise<LoyerFacture | null> {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const baseQuery = supabase
      .from('loyer_factures')
      .select('*, villa_configs(*)')
      .eq('user_id', auth.user.id)
      .eq('locataire_nom', params.locataireNom)
      .eq('mois', params.periodeMois)
      .eq('annee', params.periodeAnnee)

    const query = params.villaId ? baseQuery.eq('villa_id', params.villaId) : baseQuery.is('villa_id', null)

    const { data: existing, error: selectError } = await query.maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ ensureFacture select error', selectError)
      return null
    }

    if (existing) {
      return mapFacture(existing)
    }

    const { data, error } = await supabase
      .from('loyer_factures')
      .insert({
        user_id: auth.user.id,
        villa_id: params.villaId ?? null,
        locataire_nom: params.locataireNom,
        mois: params.periodeMois,
        annee: params.periodeAnnee,
        montant_total: params.montantTotal,
        montant_restant: params.montantTotal,
        statut: 'en_cours'
      })
      .select('*, villa_configs(*)')
      .single()

    if (error) {
      console.error('❌ ensureFacture insert error', error)
      return null
    }

    return mapFacture(data)
  },

  async registerReglement(params: {
    factureId: string
    montant: number
    receiptId?: string
    transactionId?: string
    note?: string
    dateOperation?: string
  }): Promise<{ reglement: LoyerReglement; updatedFacture: LoyerFacture } | null> {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data: facture, error: factureError } = await supabase
      .from('loyer_factures')
      .select('*')
      .eq('id', params.factureId)
      .eq('user_id', auth.user.id)
      .single()

    if (factureError || !facture) {
      console.error('❌ registerReglement facture error', factureError)
      return null
    }

    const montantRestant = parseFloat(facture.montant_restant ?? 0)
    const montantTotal = parseFloat(facture.montant_total ?? 0)
    const montantRegle = Math.min(params.montant, montantRestant)
    const nouveauSolde = Math.max(montantRestant - montantRegle, 0)
    const statut =
      nouveauSolde <= 0 ? 'solde' : nouveauSolde < montantTotal ? 'partiel' : 'en_cours'

    const { data: reglementData, error: insertError } = await supabase
      .from('loyer_reglements')
      .insert({
        user_id: auth.user.id,
        facture_id: params.factureId,
        montant: montantRegle,
        solde_apres: nouveauSolde,
        receipt_id: params.receiptId ?? null,
        transaction_id: params.transactionId ?? null,
        note: params.note ?? null,
        date_operation: params.dateOperation ?? new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ registerReglement insert error', insertError)
      return null
    }

    const { data: updatedFactureData, error: updateError } = await supabase
      .from('loyer_factures')
      .update({
        montant_restant: nouveauSolde,
        statut
      })
      .eq('id', params.factureId)
      .eq('user_id', auth.user.id)
      .select('*, villa_configs(*)')
      .single()

    if (updateError || !updatedFactureData) {
      console.error('❌ registerReglement update facture error', updateError)
      return null
    }

    return {
      reglement: mapReglement(reglementData),
      updatedFacture: mapFacture(updatedFactureData)
    }
  }
}


