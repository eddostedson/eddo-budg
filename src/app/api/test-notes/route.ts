import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non authentifié',
        authError: authError?.message,
        user: null
      }, { status: 401 })
    }

    // 2. Tester l'accès à la table notes_depenses
    const { data: notes, error: notesError } = await supabase
      .from('notes_depenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (notesError) {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de la récupération des notes',
        error: notesError.message,
        code: notesError.code,
        details: notesError.details,
        hint: notesError.hint
      }, { status: 500 })
    }

    // 3. Tester la création d'une note
    const testNote = {
      libelle: 'Test API ' + Date.now(),
      montant: 100,
      description: 'Note créée via API de test',
      date_prevue: new Date().toISOString().split('T')[0],
      priorite: 'normale',
      type: 'depense'
    }

    const { data: createdNote, error: createError } = await supabase
      .from('notes_depenses')
      .insert({
        user_id: user.id,
        ...testNote
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      message: 'Test des notes réussi',
      user: {
        id: user.id,
        email: user.email
      },
      notes: {
        count: notes?.length || 0,
        data: notes || []
      },
      testCreation: {
        success: !createError,
        note: createdNote,
        error: createError?.message
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur dans l\'API test-notes:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}















