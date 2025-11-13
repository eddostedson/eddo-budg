'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DiagnosticData {
  user: {
    id: string
    email: string
    created_at: string
  }
  data: {
    recettes: { count: number; error?: string; data: any[] }
    depenses: { count: number; error?: string; data: any[] }
    notes: { count: number; error?: string; data: any[] }
    budgets: { count: number; error?: string; data: any[] }
    transactions: { count: number; error?: string; data: any[] }
  }
}

export default function DebugDataPage() {
  const [loading, setLoading] = useState(true)
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Vérifier l'authentification
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Utilisateur non authentifié: ' + (authError?.message || 'Aucun utilisateur'))
          setLoading(false)
          return
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

        setDiagnostic({
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
          }
        })

      } catch (err) {
        console.error('❌ Erreur dans le diagnostic:', err)
        setError('Erreur inattendue: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
      } finally {
        setLoading(false)
      }
    }

    runDiagnostic()
  }, [supabase.auth])

  const createTestData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Utilisateur non authentifié')
        return
      }

      // Créer une recette de test
      const { error: recetteError } = await supabase
        .from('recettes')
        .insert({
          user_id: user.id,
          libelle: 'Test Recette - ' + new Date().toLocaleString(),
          montant: 100000,
          solde_disponible: 100000,
          source: 'Test',
          date_reception: new Date().toISOString().split('T')[0],
          statut: 'reçue'
        })

      // Créer une dépense de test
      const { error: depenseError } = await supabase
        .from('depenses')
        .insert({
          user_id: user.id,
          libelle: 'Test Dépense - ' + new Date().toLocaleString(),
          montant: 25000,
          date: new Date().toISOString().split('T')[0],
          description: 'Dépense de test'
        })

      if (recetteError || depenseError) {
        setError('Erreur lors de la création des données de test: ' + (recetteError?.message || depenseError?.message))
      } else {
        // Recharger le diagnostic
        window.location.reload()
      }
    } catch (err) {
      setError('Erreur lors de la création des données de test: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Diagnostic en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Diagnostic des Données</h1>
          <p className="text-gray-600">Vérification de l'état de vos données dans la base de données</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-red-800">
                <strong>❌ Erreur:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {diagnostic && (
          <>
            {/* Informations utilisateur */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>👤 Informations Utilisateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <strong>ID:</strong> {diagnostic.user.id}
                  </div>
                  <div>
                    <strong>Email:</strong> {diagnostic.user.email}
                  </div>
                  <div>
                    <strong>Créé le:</strong> {new Date(diagnostic.user.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Résumé des données */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className={diagnostic.data.recettes.count > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-lg">💰 Recettes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{diagnostic.data.recettes.count}</div>
                  {diagnostic.data.recettes.error && (
                    <div className="text-red-600 text-sm mt-2">❌ {diagnostic.data.recettes.error}</div>
                  )}
                </CardContent>
              </Card>

              <Card className={diagnostic.data.depenses.count > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-lg">💸 Dépenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{diagnostic.data.depenses.count}</div>
                  {diagnostic.data.depenses.error && (
                    <div className="text-red-600 text-sm mt-2">❌ {diagnostic.data.depenses.error}</div>
                  )}
                </CardContent>
              </Card>

              <Card className={diagnostic.data.notes.count > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-lg">📝 Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{diagnostic.data.notes.count}</div>
                  {diagnostic.data.notes.error && (
                    <div className="text-red-600 text-sm mt-2">❌ {diagnostic.data.notes.error}</div>
                  )}
                </CardContent>
              </Card>

              <Card className={diagnostic.data.budgets.count > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Budgets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{diagnostic.data.budgets.count}</div>
                  {diagnostic.data.budgets.error && (
                    <div className="text-red-600 text-sm mt-2">❌ {diagnostic.data.budgets.error}</div>
                  )}
                </CardContent>
              </Card>

              <Card className={diagnostic.data.transactions.count > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-lg">🔄 Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{diagnostic.data.transactions.count}</div>
                  {diagnostic.data.transactions.error && (
                    <div className="text-red-600 text-sm mt-2">❌ {diagnostic.data.transactions.error}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Button onClick={() => window.location.reload()}>
                🔄 Actualiser le diagnostic
              </Button>
              <Button onClick={createTestData} variant="outline">
                🧪 Créer des données de test
              </Button>
              <Button onClick={() => router.push('/accueil')} variant="outline">
                🏠 Retour à l'accueil
              </Button>
            </div>

            {/* Détails des données */}
            {Object.entries(diagnostic.data).map(([tableName, tableData]) => (
              <Card key={tableName} className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {tableName} ({tableData.count} éléments)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tableData.error ? (
                    <div className="text-red-600">❌ Erreur: {tableData.error}</div>
                  ) : tableData.count === 0 ? (
                    <div className="text-gray-500">Aucune donnée trouvée</div>
                  ) : (
                    <div className="space-y-2">
                      {tableData.data.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{item.libelle || item.name || `Item ${index + 1}`}</div>
                          {item.montant && <div className="text-sm text-gray-600">{item.montant} FCFA</div>}
                          {item.created_at && (
                            <div className="text-xs text-gray-500">
                              Créé le {new Date(item.created_at).toLocaleString('fr-FR')}
                            </div>
                          )}
                        </div>
                      ))}
                      {tableData.count > 3 && (
                        <div className="text-sm text-gray-500">
                          ... et {tableData.count - 3} autres éléments
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}









