import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Créer le profil s'il n'existe pas
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Erreur création profil:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la création du profil' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, user_id: user.id })
  } catch (error) {
    console.error('Erreur ensure-profile:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

