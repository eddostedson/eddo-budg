// Script de diagnostic corrigé pour les notes
import { createClient } from './supabase/browser'

const supabase = createClient()

export async function debugNotesFixed() {
  console.log('🔧 Début du diagnostic des notes (version corrigée)...')
  
  try {
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Utilisateur:', user ? user.email : 'Non connecté')
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError)
      return { success: false, error: 'Erreur d\'authentification', details: authError }
    }
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté')
      return { success: false, error: 'Aucun utilisateur connecté' }
    }
    
    // 2. Vérifier si la table existe en testant une requête simple
    console.log('🗄️ Vérification de l\'existence de la table...')
    const { data: tableTest, error: tableError } = await supabase
      .from('notes_depenses')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Erreur table notes_depenses:', tableError)
      console.error('🔍 Détails de l\'erreur:', {
        message: tableError.message,
        code: tableError.code,
        details: tableError.details,
        hint: tableError.hint
      })
      
      // Vérifier si c'est une erreur de table inexistante
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Table notes_depenses n\'existe pas', 
          solution: 'Exécutez le script create_notes_final.sql dans Supabase SQL Editor'
        }
      }
      
      return { 
        success: false, 
        error: `Erreur table: ${tableError.message}`, 
        details: tableError 
      }
    }
    
    console.log('✅ Table notes_depenses accessible')
    
    // 3. Compter les notes de l'utilisateur
    const { count, error: countError } = await supabase
      .from('notes_depenses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (countError) {
      console.error('❌ Erreur count:', countError)
      return { success: false, error: `Erreur count: ${countError.message}`, details: countError }
    }
    
    console.log(`📊 Nombre de notes: ${count || 0}`)
    
    // 4. Récupérer toutes les notes
    const { data: notes, error: notesError } = await supabase
      .from('notes_depenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (notesError) {
      console.error('❌ Erreur récupération notes:', notesError)
      return { success: false, error: `Erreur récupération: ${notesError.message}`, details: notesError }
    }
    
    console.log(`📝 Notes récupérées: ${notes?.length || 0}`)
    
    if (notes && notes.length > 0) {
      console.log('📋 Détails des notes:')
      notes.forEach((note, index) => {
        console.log(`  ${index + 1}. ${note.libelle} - ${note.montant} FCFA (${note.type}, ${note.statut})`)
      })
    }
    
    // 5. Test de création d'une note (optionnel)
    console.log('🧪 Test de création d\'une note...')
    const testNote = {
      libelle: 'Test Debug Note ' + Date.now(),
      montant: 50.00,
      description: 'Note de test pour diagnostic',
      type: 'depense' as const,
      priorite: 'normale' as const,
      statut: 'en_attente' as const
    }
    
    const { data: newNote, error: createError } = await supabase
      .from('notes_depenses')
      .insert(testNote)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erreur création note test:', createError)
      console.error('🔍 Détails de l\'erreur de création:', {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint
      })
      return { 
        success: false, 
        error: `Erreur création: ${createError.message}`, 
        details: createError 
      }
    }
    
    console.log('✅ Note de test créée:', newNote.id)
    
    // Supprimer la note de test
    const { error: deleteError } = await supabase
      .from('notes_depenses')
      .delete()
      .eq('id', newNote.id)
    
    if (deleteError) {
      console.error('⚠️ Erreur suppression note test:', deleteError)
    } else {
      console.log('🗑️ Note de test supprimée')
    }
    
    return { 
      success: true, 
      notesCount: notes?.length || 0,
      notes: notes || [],
      message: 'Diagnostic terminé avec succès'
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return { 
      success: false, 
      error: `Erreur générale: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    }
  }
}

// Exposer la fonction globalement pour le debug
if (typeof window !== 'undefined') {
  (window as any).debugNotesFixed = debugNotesFixed
}





















