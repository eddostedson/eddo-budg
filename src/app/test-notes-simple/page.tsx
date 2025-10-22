'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

export default function TestNotesSimplePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const testNotes = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Test simple des notes...')
      
      // 1. Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Utilisateur:', user?.email || 'Non connecté')
      
      if (authError || !user) {
        setResult({
          success: false,
          error: 'Non authentifié',
          details: authError
        })
        return
      }
      
      // 2. Tester l'accès à la table
      console.log('🗄️ Test d\'accès à la table notes_depenses...')
      const { data, error } = await supabase
        .from('notes_depenses')
        .select('*')
        .limit(5)
      
      console.log('📊 Résultat:', { data, error })
      
      if (error) {
        console.error('❌ Erreur:', error)
        setResult({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          tableExists: !error.message.includes('does not exist')
        })
        return
      }
      
      // 3. Tester la création d'une note
      console.log('➕ Test de création...')
      const testNote = {
        libelle: 'Test Simple ' + Date.now(),
        montant: 100,
        description: 'Note de test simple',
        type: 'depense',
        priorite: 'normale',
        statut: 'en_attente'
      }
      
      const { data: newNote, error: createError } = await supabase
        .from('notes_depenses')
        .insert(testNote)
        .select()
        .single()
      
      console.log('📝 Création:', { newNote, createError })
      
      setResult({
        success: !createError,
        notes: data || [],
        notesCount: data?.length || 0,
        createResult: {
          success: !createError,
          note: newNote,
          error: createError
        },
        user: {
          id: user.id,
          email: user.email
        }
      })
      
    } catch (err) {
      console.error('❌ Erreur générale:', err)
      setResult({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test Simple des Notes
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testNotes}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Test en cours...' : 'Tester les Notes'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Résultats</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Statut:</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? '✅ Succès' : '❌ Échec'}
                </span>
              </div>

              {result.error && (
                <div>
                  <h3 className="font-medium text-gray-700">Erreur:</h3>
                  <p className="text-red-600">{result.error}</p>
                </div>
              )}

              {result.code && (
                <div>
                  <h3 className="font-medium text-gray-700">Code d'erreur:</h3>
                  <p className="text-gray-600">{result.code}</p>
                </div>
              )}

              {result.details && (
                <div>
                  <h3 className="font-medium text-gray-700">Détails:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}

              {result.notes && (
                <div>
                  <h3 className="font-medium text-gray-700">Notes trouvées ({result.notesCount}):</h3>
                  <div className="space-y-2">
                    {result.notes.map((note: any, index: number) => (
                      <div key={note.id || index} className="border border-gray-200 rounded p-3">
                        <p className="font-medium">{note.libelle}</p>
                        <p className="text-sm text-gray-600">{note.description}</p>
                        <p className="text-sm text-gray-500">
                          {note.montant} FCFA • {note.type} • {note.statut}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.createResult && (
                <div>
                  <h3 className="font-medium text-gray-700">Test de création:</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    result.createResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.createResult.success ? '✅ Création réussie' : '❌ Création échouée'}
                  </span>
                  {result.createResult.error && (
                    <p className="text-red-600 mt-2">{result.createResult.error.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-yellow-800 mb-2">💡 Instructions</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Si vous voyez une erreur "table does not exist", exécutez le script <code>create_notes_final.sql</code> dans Supabase</li>
            <li>Si vous voyez une erreur d'authentification, connectez-vous d'abord</li>
            <li>Si tout fonctionne, les notes devraient s'afficher sur la page principale</li>
          </ol>
        </div>
      </div>
    </div>
  )
}














