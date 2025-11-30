import { createClient } from '@/lib/supabase/browser'
import {
  BudgetSalaireMois,
  BudgetSalaireRubrique,
  BudgetSalaireMouvement,
  StatutRubriqueSalaire,
  TypeDepenseSalaire
} from '@/lib/shared-data'

const supabase = createClient()

const mapBudgetMois = (row: any): BudgetSalaireMois => ({
  id: row.id,
  userId: row.user_id,
  annee: row.annee,
  mois: row.mois,
  libelle: row.libelle,
  revenuMensuel: parseFloat(row.revenu_mensuel ?? 0),
  montantDepenseTotal: parseFloat(row.montant_depense_total ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapRubrique = (row: any): BudgetSalaireRubrique => ({
  id: row.id,
  userId: row.user_id,
  budgetMoisId: row.budget_mois_id,
  nom: row.nom,
  montantBudgete: parseFloat(row.montant_budgete ?? 0),
  montantDepense: parseFloat(row.montant_depense ?? 0),
  typeDepense: row.type_depense as TypeDepenseSalaire,
  statut: row.statut as StatutRubriqueSalaire,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapMouvement = (row: any): BudgetSalaireMouvement => ({
  id: row.id,
  userId: row.user_id,
  rubriqueId: row.rubrique_id,
  dateOperation: row.date_operation,
  montant: parseFloat(row.montant ?? 0),
  description: row.description ?? undefined,
  createdAt: row.created_at
})

export const BudgetSalaireService = {
  async getOrCreateBudgetMois(annee: number, mois: number, revenuMensuel?: number): Promise<BudgetSalaireMois | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('budget_salaire_mois')
      .select('*')
      .eq('user_id', user.id)
      .eq('annee', annee)
      .eq('mois', mois)
      .maybeSingle()

    if (!error && data) {
      return mapBudgetMois(data)
    }

    if (revenuMensuel === undefined) {
      // Pas de budget pour ce mois et aucun revenu fourni → l'UI décidera quoi faire
      return null
    }

    const { data: inserted, error: insertError } = await supabase
      .from('budget_salaire_mois')
      .insert({
        user_id: user.id,
        annee,
        mois,
        libelle: `Salaire ${mois.toString().padStart(2, '0')}/${annee}`,
        revenu_mensuel: revenuMensuel,
        montant_depense_total: 0
      })
      .select()
      .single()

    if (insertError || !inserted) {
      console.error('❌ Erreur création budget salaire mois:', insertError)
      return null
    }

    return mapBudgetMois(inserted)
  },

  async updateRevenu(budgetMoisId: string, revenuMensuel: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('budget_salaire_mois')
      .update({
        revenu_mensuel: revenuMensuel,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetMoisId)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur mise à jour revenu mensuel:', error)
      return false
    }
    return true
  },

  async getRubriques(budgetMoisId: string): Promise<BudgetSalaireRubrique[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('budget_salaire_rubriques')
      .select('*')
      .eq('user_id', user.id)
      .eq('budget_mois_id', budgetMoisId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement rubriques budget salaire:', error)
      return []
    }

    return data.map(mapRubrique)
  },

  async createRubrique(params: {
    budgetMoisId: string
    nom: string
    montantBudgete: number
    typeDepense: TypeDepenseSalaire
  }): Promise<BudgetSalaireRubrique | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('budget_salaire_rubriques')
      .insert({
        user_id: user.id,
        budget_mois_id: params.budgetMoisId,
        nom: params.nom,
        montant_budgete: params.montantBudgete,
        montant_depense: 0,
        type_depense: params.typeDepense,
        statut: 'en_cours'
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création rubrique budget salaire:', error)
      return null
    }

    return mapRubrique(data)
  },

  async addMouvement(params: {
    rubrique: BudgetSalaireRubrique
    budgetMois: BudgetSalaireMois
    montant: number
    dateOperation: string
    description?: string
  }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // 1. Insérer le mouvement
    const { error: insertError } = await supabase
      .from('budget_salaire_mouvements')
      .insert({
        user_id: user.id,
        rubrique_id: params.rubrique.id,
        date_operation: params.dateOperation,
        montant: params.montant,
        description: params.description ?? null
      })

    if (insertError) {
      console.error('❌ Erreur ajout mouvement budget salaire:', insertError)
      return false
    }

    // 2. Mettre à jour la rubrique (montant_depense + statut)
    const nouveauMontantRubrique = params.rubrique.montantDepense + params.montant
    let nouveauStatut: StatutRubriqueSalaire = params.rubrique.statut
    if (nouveauMontantRubrique >= params.rubrique.montantBudgete && params.rubrique.statut !== 'annulee') {
      nouveauStatut = 'terminee'
    } else if (params.rubrique.statut === 'terminee' && nouveauMontantRubrique < params.rubrique.montantBudgete) {
      nouveauStatut = 'en_cours'
    }

    const { error: updateRubriqueError } = await supabase
      .from('budget_salaire_rubriques')
      .update({
        montant_depense: nouveauMontantRubrique,
        statut: nouveauStatut,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.rubrique.id)
      .eq('user_id', user.id)

    if (updateRubriqueError) {
      console.error('❌ Erreur mise à jour rubrique budget salaire:', updateRubriqueError)
      return false
    }

    // 3. Mettre à jour le total du budget mensuel
    const nouveauTotalBudget = params.budgetMois.montantDepenseTotal + params.montant

    const { error: updateBudgetError } = await supabase
      .from('budget_salaire_mois')
      .update({
        montant_depense_total: nouveauTotalBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.budgetMois.id)
      .eq('user_id', user.id)

    if (updateBudgetError) {
      console.error('❌ Erreur mise à jour total budget salaire mois:', updateBudgetError)
      return false
    }

    return true
  },

  async getMouvementsPourBudget(budgetMoisId: string): Promise<BudgetSalaireMouvement[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // On joint via les rubriques
    const { data, error } = await supabase
      .from('budget_salaire_mouvements')
      .select('*, budget_salaire_rubriques!inner(budget_mois_id)')
      .eq('user_id', user.id)
      .eq('budget_salaire_rubriques.budget_mois_id', budgetMoisId)
      .order('date_operation', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement mouvements budget salaire:', error)
      return []
    }

    return data.map(mapMouvement)
  }
}


