'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'

export default function RapportsPage() {
  const router = useRouter()
  const { recettes } = useRecettes()
  const { depenses } = useDepenses()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // États pour les filtres
  const [filtres, setFiltres] = useState({
    dateDebut: '',
    dateFin: '',
    montantMin: '',
    montantMax: '',
    libelle: '',
    type: 'tous' // 'tous', 'recettes', 'depenses'
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Filtrer les recettes
  const recettesFiltrees = recettes.filter(recette => {
    // Filtre par type
    if (filtres.type === 'depenses') return false

    // Filtre par date
    if (filtres.dateDebut && new Date(recette.dateReception) < new Date(filtres.dateDebut)) return false
    if (filtres.dateFin && new Date(recette.dateReception) > new Date(filtres.dateFin)) return false

    // Filtre par montant
    if (filtres.montantMin && recette.montant < parseFloat(filtres.montantMin)) return false
    if (filtres.montantMax && recette.montant > parseFloat(filtres.montantMax)) return false

    // Filtre par libellé
    if (filtres.libelle && !recette.libelle.toLowerCase().includes(filtres.libelle.toLowerCase())) return false

    return true
  })

  // Filtrer les dépenses
  const depensesFiltrees = depenses.filter(depense => {
    // Filtre par type
    if (filtres.type === 'recettes') return false

    // Filtre par date
    if (filtres.dateDebut && new Date(depense.date) < new Date(filtres.dateDebut)) return false
    if (filtres.dateFin && new Date(depense.date) > new Date(filtres.dateFin)) return false

    // Filtre par montant
    if (filtres.montantMin && depense.montant < parseFloat(filtres.montantMin)) return false
    if (filtres.montantMax && depense.montant > parseFloat(filtres.montantMax)) return false

    // Filtre par libellé
    if (filtres.libelle && !depense.libelle.toLowerCase().includes(filtres.libelle.toLowerCase())) return false

    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const totalRecettesFiltrees = recettesFiltrees.reduce((sum, r) => sum + r.montant, 0)
  const totalDepensesFiltrees = depensesFiltrees.reduce((sum, d) => sum + d.montant, 0)
  const solde = totalRecettesFiltrees - totalDepensesFiltrees

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    let csv = 'Type,Date,Libellé,Description,Montant\n'
    
    recettesFiltrees.forEach(r => {
      csv += `Recette,${r.dateReception},"${r.libelle}","${r.description}",${r.montant}\n`
    })
    
    depensesFiltrees.forEach(d => {
      csv += `Dépense,${d.date},"${d.libelle}","${d.description}",${d.montant}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleReset = () => {
    setFiltres({
      dateDebut: '',
      dateFin: '',
      montantMin: '',
      montantMax: '',
      libelle: '',
      type: 'tous'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/accueil')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => router.push('/recettes')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              💰 Recettes
            </button>
            <button
              onClick={() => router.push('/depenses')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              💸 Dépenses
            </button>
          </div>

          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span className="text-5xl">📊</span>
            Rapports et États
          </h1>
          <p className="text-blue-100 text-lg">Générez des rapports personnalisés de vos finances</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🔍</span>
            Filtres de Recherche
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filtres.type}
                onChange={e => setFiltres({ ...filtres, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous</option>
                <option value="recettes">Recettes uniquement</option>
                <option value="depenses">Dépenses uniquement</option>
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
              <input
                type="date"
                value={filtres.dateDebut}
                onChange={e => setFiltres({ ...filtres, dateDebut: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
              <input
                type="date"
                value={filtres.dateFin}
                onChange={e => setFiltres({ ...filtres, dateFin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Montant min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum</label>
              <input
                type="number"
                value={filtres.montantMin}
                onChange={e => setFiltres({ ...filtres, montantMin: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Montant max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant maximum</label>
              <input
                type="number"
                value={filtres.montantMax}
                onChange={e => setFiltres({ ...filtres, montantMax: e.target.value })}
                placeholder="999999999"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Libellé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche par libellé</label>
              <input
                type="text"
                value={filtres.libelle}
                onChange={e => setFiltres({ ...filtres, libelle: e.target.value })}
                placeholder="Salaire, Loyer..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
            >
              Réinitialiser
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all flex items-center gap-2"
            >
              🖨️ Imprimer
            </button>
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all flex items-center gap-2"
            >
              📥 Exporter CSV
            </button>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="text-gray-600 text-sm font-medium mb-2">Total Recettes</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRecettesFiltrees)}</div>
            <div className="text-sm text-gray-500 mt-2">{recettesFiltrees.length} recette(s)</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="text-gray-600 text-sm font-medium mb-2">Total Dépenses</div>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDepensesFiltrees)}</div>
            <div className="text-sm text-gray-500 mt-2">{depensesFiltrees.length} dépense(s)</div>
          </div>
          <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${solde >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
            <div className="text-gray-600 text-sm font-medium mb-2">Solde Net</div>
            <div className={`text-3xl font-bold ${solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(solde)}</div>
            <div className="text-sm text-gray-500 mt-2">{solde >= 0 ? 'Positif' : 'Négatif'}</div>
          </div>
        </div>

        {/* Tableaux */}
        {(filtres.type === 'tous' || filtres.type === 'recettes') && recettesFiltrees.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
              <h3 className="text-xl font-bold">Recettes ({recettesFiltrees.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recettesFiltrees.map(recette => (
                    <tr key={recette.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{new Date(recette.dateReception).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{recette.libelle}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{recette.source}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{recette.description || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatCurrency(recette.montant)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">{formatCurrency(totalRecettesFiltrees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {(filtres.type === 'tous' || filtres.type === 'depenses') && depensesFiltrees.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4">
              <h3 className="text-xl font-bold">Dépenses ({depensesFiltrees.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {depensesFiltrees.map(depense => (
                    <tr key={depense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{new Date(depense.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{depense.libelle}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{depense.description || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatCurrency(depense.montant)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatCurrency(totalDepensesFiltrees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {recettesFiltrees.length === 0 && depensesFiltrees.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-600 mb-6">Aucune donnée ne correspond aux filtres sélectionnés</p>
            <button
              onClick={handleReset}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}































