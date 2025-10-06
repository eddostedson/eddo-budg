import { createClient } from './browser'
import { Transfert } from '@/types/transfer'

const supabase = createClient()

export class TransfertService {
  // Récupérer tous les transferts de l'utilisateur
  static async getTransferts(): Promise<Transfert[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return []
      }

      const { data, error } = await supabase
        .from('transferts')
        .select(`
          *,
          recette_source:recettes!transferts_recette_source_id_fkey(libelle),
          recette_destination:recettes!transferts_recette_destination_id_fkey(libelle)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des transferts:', error)
        return []
      }

      return (data || []).map(transfert => ({
        id: transfert.id,
        userId: transfert.user_id,
        recetteSourceId: transfert.recette_source_id,
        recetteDestinationId: transfert.recette_destination_id,
        montant: parseFloat(transfert.montant),
        description: transfert.description || '',
        dateTransfert: transfert.date_transfert,
        createdAt: transfert.created_at,
        updatedAt: transfert.updated_at
      }))
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      return []
    }
  }

  // Créer un nouveau transfert
  static async createTransfert(transfert: Omit<Transfert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Transfert | null> {
    try {
      console.log('🔄 === DÉBUT CRÉATION TRANSFERT ===')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        throw new Error("Erreur d'authentification")
      }
      
      console.log('✅ Utilisateur authentifié:', user.id)
      console.log('📦 Données du transfert:', transfert)

      // 1. Créer l'enregistrement de transfert
      const { data: transfertData, error: transfertError } = await supabase
        .from('transferts')
        .insert({
          user_id: user.id,
          recette_source_id: transfert.recetteSourceId,
          recette_destination_id: transfert.recetteDestinationId,
          montant: transfert.montant,
          description: transfert.description,
          date_transfert: transfert.dateTransfert
        })
        .select()
        .single()

      if (transfertError) {
        console.error('❌ Erreur lors de la création du transfert:', transfertError)
        throw transfertError
      }

      console.log('✅ Transfert créé:', transfertData.id)

      // 2. Mettre à jour le solde de la recette source (diminuer)
      const { error: sourceError } = await supabase.rpc('decrementer_solde_recette', {
        recette_id: transfert.recetteSourceId,
        montant: transfert.montant
      })

      if (sourceError) {
        console.error('❌ Erreur lors de la mise à jour de la recette source:', sourceError)
        throw sourceError
      }

      console.log('✅ Solde de la recette source mis à jour')

      // 3. Mettre à jour le solde de la recette destination (augmenter)
      const { error: destError } = await supabase.rpc('incrementer_solde_recette', {
        recette_id: transfert.recetteDestinationId,
        montant: transfert.montant
      })

      if (destError) {
        console.error('❌ Erreur lors de la mise à jour de la recette destination:', destError)
        throw destError
      }

      console.log('✅ Solde de la recette destination mis à jour')
      console.log('🔄 === FIN CRÉATION TRANSFERT ===')

      return {
        id: transfertData.id,
        userId: transfertData.user_id,
        recetteSourceId: transfertData.recette_source_id,
        recetteDestinationId: transfertData.recette_destination_id,
        montant: parseFloat(transfertData.montant),
        description: transfertData.description || '',
        dateTransfert: transfertData.date_transfert,
        createdAt: transfertData.created_at,
        updatedAt: transfertData.updated_at
      }
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la création du transfert:', error)
      return null
    }
  }

  // Supprimer un transfert (avec remboursement)
  static async deleteTransfert(id: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Erreur d\'authentification:', authError)
        return false
      }

      // 1. Récupérer les détails du transfert
      const { data: transfert, error: fetchError } = await supabase
        .from('transferts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !transfert) {
        console.error('❌ Transfert non trouvé:', fetchError)
        return false
      }

      // 2. Rembourser la recette source
      const { error: sourceError } = await supabase.rpc('incrementer_solde_recette', {
        recette_id: transfert.recette_source_id,
        montant: transfert.montant
      })

      if (sourceError) {
        console.error('❌ Erreur lors du remboursement de la recette source:', sourceError)
        return false
      }

      // 3. Diminuer la recette destination
      const { error: destError } = await supabase.rpc('decrementer_solde_recette', {
        recette_id: transfert.recette_destination_id,
        montant: transfert.montant
      })

      if (destError) {
        console.error('❌ Erreur lors de la diminution de la recette destination:', destError)
        return false
      }

      // 4. Supprimer l'enregistrement de transfert
      const { error: deleteError } = await supabase
        .from('transferts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('❌ Erreur lors de la suppression du transfert:', deleteError)
        return false
      }

      console.log('✅ Transfert supprimé avec remboursement:', id)
      return true
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la suppression du transfert:', error)
      return false
    }
  }
}

