'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'

export default function DebugNotesPage() {
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [notes, setNotes] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const debugNotes = async () => {
      try {
        setLoading(true)
        
        // 1. Vérifier l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // 2. Tester l'accès à la table
        const { data: notesData, error: notesError } = await supabase
          .from('notes_depenses')
          .select('*')
          .order('created_at', { ascending: false })

        // 3. Tester la création d'une note
        let createResult = null
        try {
          const { data: newNote, error: createError } = await supabase
            .from('notes_depenses')
            .insert({
              libelle: 'Test Debug ' + Date.now(),
              montant: 100,
              description: 'Note de test pour debug',
              date_prevue: new Date().toISOString().split('T')[0],
              priorite: 'normale',
              type: 'depense'
            })
            .select()
            .single()
          
          createResult = { success: !createError, data: newNote, error: createError }
        } catch (createErr) {
          createResult = { success: false, error: createErr }
        }

        setDebugInfo({
          auth: {
            user: user?.id,
            email: user?.email,
            error: authError?.message
          },
          notes: {
            count: notesData?.length || 0,
            data: notesData || [],
            error: notesError?.message
          },
          create: createResult
        })

        setNotes(notesData || [])

      } catch (err) {
        console.error('Erreur debug:', err)
        setDebugInfo({ error: err instanceof Error ? err.message : 'Erreur inconnue' })
      } finally {
        setLoading(false)
      }
    }

    debugNotes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Debug des notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🐛 Debug des Notes
        </h1>

        <div className="grid gap-6">
          {/* Informations d'authentification */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Authentification</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.auth, null, 2)}
            </pre>
          </div>

          {/* Informations sur les notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Notes ({notes.length})</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.notes, null, 2)}
            </pre>
          </div>

          {/* Test de création */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">➕ Test de Création</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.create, null, 2)}
            </pre>
          </div>

          {/* Liste des notes */}
          {notes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Liste des Notes</h2>
              <div className="space-y-3">
                {notes.map((note, index) => (
                  <div key={note.id || index} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{note.libelle}</p>
                        <p className="text-sm text-gray-600">{note.description}</p>
                        <p className="text-sm text-gray-500">
                          {note.montant} FCFA • {note.type} • {note.statut} • {note.priorite}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Actions</h2>
            <div className="space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Rafraîchir
              </button>
              <button
                onClick={() => window.location.href = '/notes'}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Aller aux Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}















