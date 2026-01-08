'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [recettes, setRecettes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClient()

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }, [])

  const loadRecettes = useCallback(async () => {
    if (!user) return
    
    try {
      addLog('🔄 Chargement des recettes...')
      const { data, error } = await supabase
        .from('recettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        addLog(`❌ Erreur recettes: ${error.message}`)
      } else {
        addLog(`✅ Recettes trouvées: ${data?.length || 0}`)
        setRecettes(data || [])
      }
    } catch (err) {
      addLog(`❌ Erreur: ${err}`)
    }
  }, [addLog, supabase, user])

  const checkAuth = useCallback(async () => {
    try {
      addLog('🔄 Vérification de l\'authentification...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        addLog('❌ Non connecté')
        setUser(null)
      } else {
        addLog(`✅ Connecté: ${user.email}`)
        setUser(user)
        await loadRecettes()
      }
    } catch (err) {
      addLog(`❌ Erreur auth: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [addLog, loadRecettes, supabase])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const createTestData = async () => {
    if (!user) return
    
    try {
      addLog('🔄 Création des données de test...')
      
      const testRecettes = [
        {
          description: 'Salaire Octobre 2024',
          amount: 750000,
          solde_disponible: 750000,
          receipt_date: '2024-10-01'
        },
        {
          description: 'Prime Performance',
          amount: 150000,
          solde_disponible: 150000,
          receipt_date: '2024-10-15'
        },
        {
          description: 'Vente Produit',
          amount: 200000,
          solde_disponible: 200000,
          receipt_date: '2024-10-20'
        }
      ]
      
      for (const recette of testRecettes) {
        const { error } = await supabase
          .from('recettes')
          .insert({
            user_id: user.id,
            ...recette
          })
        
        if (error) {
          addLog(`❌ Erreur création ${recette.description}: ${error.message}`)
        } else {
          addLog(`✅ Créé: ${recette.description}`)
        }
      }
      
      await loadRecettes()
    } catch (err) {
      addLog(`❌ Erreur: ${err}`)
    }
  }

  const clearData = async () => {
    if (!user || !confirm('Supprimer toutes les recettes ?')) return
    
    try {
      addLog('🔄 Suppression des données...')
      const { error } = await supabase
        .from('recettes')
        .delete()
        .eq('user_id', user.id)
      
      if (error) {
        addLog(`❌ Erreur suppression: ${error.message}`)
      } else {
        addLog('✅ Données supprimées')
        await loadRecettes()
      }
    } catch (err) {
      addLog(`❌ Erreur: ${err}`)
    }
  }

  const totalRecettes = recettes.reduce((sum, r) => sum + (r.amount || 0), 0)
  const totalDisponible = recettes.reduce((sum, r) => sum + (r.solde_disponible || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Debug Recettes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 État Actuel</h2>
            <div className="space-y-2">
              <p><strong>Utilisateur:</strong> {user ? user.email : 'Non connecté'}</p>
              <p><strong>Recettes:</strong> {recettes.length}</p>
              <p><strong>Total Recettes:</strong> {totalRecettes.toLocaleString()} F CFA</p>
              <p><strong>Solde Disponible:</strong> {totalDisponible.toLocaleString()} F CFA</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🔧 Actions</h2>
            <div className="space-y-2">
              <Button onClick={checkAuth} className="w-full">
                🔄 Vérifier Auth
              </Button>
              <Button onClick={loadRecettes} className="w-full">
                📥 Charger Recettes
              </Button>
              <Button onClick={createTestData} className="w-full bg-green-600">
                ➕ Créer Données Test
              </Button>
              <Button onClick={clearData} className="w-full bg-red-600">
                🗑️ Nettoyer
              </Button>
            </div>
          </Card>
        </div>

        {recettes.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Recettes ({recettes.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Montant</th>
                    <th className="text-right p-2">Solde</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recettes.map((recette, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{recette.description || recette.libelle || 'N/A'}</td>
                      <td className="p-2 text-right">{recette.amount || recette.montant || 0} F CFA</td>
                      <td className="p-2 text-right">{recette.solde_disponible || 0} F CFA</td>
                      <td className="p-2">{recette.receipt_date || recette.date_reception || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
