'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { NotesService } from '@/lib/supabase/notes-service'

export default function TestNotesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const testNotes = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Tester l'authentification
        console.log('🔐 Test de l\'authentification...')
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        setAuthStatus({ user, authError })
        console.log('👤 Utilisateur:', user?.id, user?.email)
        console.log('❌ Erreur auth:', authError)

        if (authError || !user) {
          setError('Utilisateur non authentifié')
          return
        }

        // 2. Tester l'accès direct à la table
        console.log('🗄️ Test d\'accès direct à la table...')
        const { data: directData, error: directError } = await supabase
          .from('notes_depenses')
          .select('*')
          .limit(5)

        console.log('📊 Données directes:', directData)
        console.log('❌ Erreur directe:', directError)

        // 3. Tester le service des notes
        console.log('🔧 Test du service des notes...')
        const serviceNotes = await NotesService.getNotes()
        console.log('📝 Notes du service:', serviceNotes)
        setNotes(serviceNotes)

        // 4. Tester la création d'une note de test
        console.log('➕ Test de création d\'une note...')
        try {
          const testNote = await NotesService.createNote({
            libelle: 'Note de test ' + Date.now(),
            montant: 100,
            description: 'Description de test',
            date_prevue: new Date().toISOString().split('T')[0],
            priorite: 'normale',
            type: 'depense'
          })
          console.log('✅ Note créée:', testNote)
        } catch (createError) {
          console.error('❌ Erreur création:', createError)
        }

        // 5. Récupérer les informations sur la table
        const { data: tableData, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_name', 'notes_depenses')

        setTableInfo({ tableData, tableError })

      } catch (err) {
        console.error('❌ Erreur générale:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    testNotes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test des notes en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Diagnostic des Notes
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Erreur</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Statut d'authentification */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Authentification</h2>
            <div className="space-y-2">
              <p><strong>Utilisateur ID:</strong> {authStatus?.user?.id || 'Non connecté'}</p>
              <p><strong>Email:</strong> {authStatus?.user?.email || 'Non connecté'}</p>
              <p><strong>Erreur:</strong> {authStatus?.authError?.message || 'Aucune'}</p>
            </div>
          </div>

          {/* Informations sur la table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🗄️ Table notes_depenses</h2>
            <div className="space-y-2">
              <p><strong>Table existe:</strong> {tableInfo?.tableData?.length > 0 ? 'Oui' : 'Non'}</p>
              <p><strong>Erreur table:</strong> {tableInfo?.tableError?.message || 'Aucune'}</p>
            </div>
          </div>

          {/* Notes récupérées */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Notes ({notes.length})</h2>
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note, index) => (
                  <div key={note.id || index} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{note.libelle}</p>
                        <p className="text-sm text-gray-600">{note.description}</p>
                        <p className="text-sm text-gray-500">
                          {note.montant} FCFA • {note.type} • {note.statut}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Aucune note trouvée</p>
            )}
          </div>

          {/* Actions de test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🧪 Actions de Test</h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    const testNote = await NotesService.createNote({
                      libelle: 'Note de test ' + Date.now(),
                      montant: Math.floor(Math.random() * 1000),
                      description: 'Description de test automatique',
                      date_prevue: new Date().toISOString().split('T')[0],
                      priorite: 'normale',
                      type: 'depense'
                    })
                    console.log('Note créée:', testNote)
                    alert('Note créée avec succès!')
                    window.location.reload()
                  } catch (err) {
                    console.error('Erreur création:', err)
                    alert('Erreur: ' + (err instanceof Error ? err.message : 'Inconnue'))
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Créer une note de test
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors ml-3"
              >
                Rafraîchir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}














