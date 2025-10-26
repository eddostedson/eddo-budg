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

    console.log('🔍 Diagnostic pour l\'utilisateur:', user.id, user.email)

    // 2. Vérifier les recettes
    const { data: recettes, error: recettesError } = await supabase
      .from('recettes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Vérifier les dépenses
    const { data: depenses, error: depensesError } = await supabase
      .from('depenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 4. Vérifier les notes
    const { data: notes, error: notesError } = await supabase
      .from('notes_depenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 5. Vérifier les budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 6. Vérifier les transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      data: {
        recettes: {
          count: recettes?.length || 0,
          error: recettesError?.message,
          data: recettes || []
        },
        depenses: {
          count: depenses?.length || 0,
          error: depensesError?.message,
          data: depenses || []
        },
        notes: {
          count: notes?.length || 0,
          error: notesError?.message,
          data: notes || []
        },
        budgets: {
          count: budgets?.length || 0,
          error: budgetsError?.message,
          data: budgets || []
        },
        transactions: {
          count: transactions?.length || 0,
          error: transactionsError?.message,
          data: transactions || []
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur dans le diagnostic:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur inattendue',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}






