import { createClient } from '@/lib/supabase/browser'
import type { SharedFund, SharedFundMovement } from '@/lib/shared-data'

const supabase = createClient()

const mapFundRow = (row: any): SharedFund => ({
  id: row.id,
  userId: row.user_id,
  sourceCompteId: row.source_compte_id,
  primaryCompteId: row.primary_compte_id,
  transactionSourceId: row.transaction_source_id,
  libelle: row.libelle,
  description: row.description ?? undefined,
  montantInitial: parseFloat(row.montant_initial ?? 0),
  montantRestant: parseFloat(row.montant_restant ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapMovementRow = (row: any): SharedFundMovement => ({
  id: row.id,
  sharedFundId: row.shared_fund_id,
  userId: row.user_id,
  compteId: row.compte_id,
  type: row.type,
  montant: parseFloat(row.montant ?? 0),
  transactionId: row.transaction_id,
  libelle: row.libelle ?? undefined,
  createdAt: row.created_at
})

export const SharedFundsService = {
  // Créer un fonds partagé lié à une transaction de crédit existante
  async createFundFromCredit(params: {
    transactionId: string
    sourceCompteId: string
    primaryCompteId?: string
    montant: number
    libelle: string
    description?: string
  }): Promise<SharedFund | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('shared_funds')
      .insert({
        user_id: user.id,
        source_compte_id: params.sourceCompteId,
        primary_compte_id: params.primaryCompteId ?? null,
        transaction_source_id: params.transactionId,
        libelle: params.libelle,
        description: params.description ?? null,
        montant_initial: params.montant,
        montant_restant: params.montant
      })
      .select()

    if (error) {
      console.error('❌ Erreur création fonds partagé:', {
        message: (error as any).message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      })
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return mapFundRow(row)
  },

  // Charger les fonds encore disponibles pour un compte donné
  async getFundsForCompte(compteId: string): Promise<SharedFund[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('shared_funds')
      .select('*')
      .eq('user_id', user.id)
      .or(
        `source_compte_id.eq.${compteId},primary_compte_id.eq.${compteId}`
      )
      .gt('montant_restant', 0)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('❌ Erreur chargement fonds partagés:', error)
      return []
    }

    return data.map(mapFundRow)
  },

  // Enregistrer un mouvement (ex: dépense) sur un fonds
  async registerMovement(params: {
    sharedFundId: string
    compteId: string
    type: 'debit' | 'credit'
    montant: number
    transactionId?: string
    libelle?: string
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: fund, error: fundError } = await supabase
      .from('shared_funds')
      .select('*')
      .eq('id', params.sharedFundId)
      .eq('user_id', user.id)
      .single()

    if (fundError || !fund) {
      console.error('❌ Fonds partagé introuvable:', fundError)
      return false
    }

    const currentRemaining = parseFloat(fund.montant_restant ?? 0)
    const newRemaining =
      params.type === 'debit'
        ? currentRemaining - params.montant
        : currentRemaining + params.montant

    if (params.type === 'debit' && newRemaining < -0.01) {
      console.error('❌ Fonds partagé insuffisant')
      return false
    }

    const { error: insertError } = await supabase
      .from('shared_fund_movements')
      .insert({
        shared_fund_id: params.sharedFundId,
        user_id: user.id,
        compte_id: params.compteId,
        type: params.type,
        montant: params.montant,
        transaction_id: params.transactionId ?? null,
        libelle: params.libelle ?? null
      })

    if (insertError) {
      console.error('❌ Erreur enregistrement mouvement fonds partagé:', insertError)
      return false
    }

    const { error: updateError } = await supabase
      .from('shared_funds')
      .update({ montant_restant: newRemaining, updated_at: new Date().toISOString() })
      .eq('id', params.sharedFundId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Erreur mise à jour montant_restant fonds partagé:', updateError)
      return false
    }

    return true
  }
}


