import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Appel léger pour vérifier l'accessibilité de Supabase.
    // Même si la session est null, c'est OK pour un "ping".
    const { error } = await supabase.auth.getSession();

    if (error) {
      // Erreur réseau/clé invalide => échec
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to reach Supabase',
          connection: 'failed',
          user: null,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Ici, data.session peut être null (pas connecté) => c’est normal.
    return NextResponse.json({
      success: true,
      message: 'Supabase répond. Clés et URL semblent valides.',
      connection: 'active',
      user: null, // pas d’auth à ce stade du MVP
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to Supabase',
        connection: 'failed',
        user: null,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
