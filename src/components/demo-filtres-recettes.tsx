'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FilterIcon, SearchIcon, CalendarIcon } from 'lucide-react'

interface RecetteDemo {
  id: number
  libelle: string
  montant: number
  soldeDisponible: number
  date: string
  description: string
}

export const DemoFiltresRecettes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pleine' | 'utilisee' | 'vide'>('all')

  // Données de démonstration
  const recettesDemo: RecetteDemo[] = [
    {
      id: 1,
      libelle: 'Salaire Mensuel',
      montant: 500000,
      soldeDisponible: 500000,
      date: '2024-01-01',
      description: 'Salaire de janvier'
    },
    {
      id: 2,
      libelle: 'Prime Performance',
      montant: 100000,
      soldeDisponible: 75000,
      date: '2024-01-15',
      description: 'Prime de performance'
    },
    {
      id: 3,
      libelle: 'Vente Matériel',
      montant: 50000,
      soldeDisponible: 0,
      date: '2024-01-20',
      description: 'Vente d\'ancien matériel'
    },
    {
      id: 4,
      libelle: 'Freelance Projet',
      montant: 200000,
      soldeDisponible: 200000,
      date: '2024-02-01',
      description: 'Projet freelance'
    },
    {
      id: 5,
      libelle: 'Bonus Annuel',
      montant: 300000,
      soldeDisponible: 150000,
      date: '2024-02-10',
      description: 'Bonus de fin d\'année'
    }
  ]

  // Calculs des statistiques
  const totalRecettes = recettesDemo.length
  const recettesPleines = recettesDemo.filter(r => r.soldeDisponible === r.montant).length
  const recettesUtilisees = recettesDemo.filter(r => r.soldeDisponible < r.montant && r.soldeDisponible > 0).length
  const recettesVides = recettesDemo.filter(r => r.soldeDisponible === 0).length

  // Logique de filtrage
  const filteredRecettes = recettesDemo.filter(recette => {
    const matchesSearch = searchTerm === '' || 
      recette.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recette.montant.toString().includes(searchTerm) ||
      recette.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDateFrom = dateFrom === '' || recette.date >= dateFrom
    const matchesDateTo = dateTo === '' || recette.date <= dateTo
    
    // Filtre par statut de la recette
    let matchesStatus = true
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pleine':
          matchesStatus = recette.soldeDisponible === recette.montant
          break
        case 'utilisee':
          matchesStatus = recette.soldeDisponible < recette.montant && recette.soldeDisponible > 0
          break
        case 'vide':
          matchesStatus = recette.soldeDisponible === 0
          break
      }
    }
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('all')
  }

  const getStatusColor = (recette: RecetteDemo) => {
    if (recette.soldeDisponible === 0) return 'bg-red-100 text-red-800'
    if (recette.soldeDisponible === recette.montant) return 'bg-green-100 text-green-800'
    return 'bg-orange-100 text-orange-800'
  }

  const getStatusText = (recette: RecetteDemo) => {
    if (recette.soldeDisponible === 0) return 'Vide'
    if (recette.soldeDisponible === recette.montant) return 'Pleine'
    return 'Utilisée'
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            🔍 Démonstration Filtres Recettes
          </motion.h1>
          <p className="text-gray-600 text-lg">
            Testez les filtres par statut : pleines, utilisées et vides
          </p>
        </div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="text-3xl font-bold">{recettesPleines}</div>
              <p className="text-sm opacity-90">Recettes Pleines</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="text-3xl font-bold">{recettesUtilisees}</div>
              <p className="text-sm opacity-90">Recettes Utilisées</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="text-3xl font-bold">{recettesVides}</div>
              <p className="text-sm opacity-90">Recettes Vides</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl">
            <CardContent className="p-4">
              <div className="text-3xl font-bold">{totalRecettes}</div>
              <p className="text-sm opacity-90">Total Recettes</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-blue-600" />
              Filtres et Recherche
            </h3>
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Effacer les filtres
            </Button>
          </div>

          {/* Affichage des résultats par statut */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Toutes : <span className="font-bold text-gray-900">{totalRecettes}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Pleines : <span className="font-bold text-green-600">{recettesPleines}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Utilisées : <span className="font-bold text-orange-600">{recettesUtilisees}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Épuisées : <span className="font-bold text-red-600">{recettesVides}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Résultats : <span className="font-bold text-blue-600">{filteredRecettes.length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Recherche */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par libellé, montant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date de début */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                placeholder="Date de début"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date de fin */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                placeholder="Date de fin"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtre par statut */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pleine' | 'utilisee' | 'vide')}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pleine">Recettes pleines</option>
                <option value="utilisee">Recettes utilisées</option>
                <option value="vide">Recettes épuisées</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-sm">
              {filteredRecettes.length} recette(s) trouvée(s)
            </Badge>
          </div>
        </motion.div>

        {/* Filtres rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FilterIcon className="h-5 w-5 mr-2 text-blue-600" />
            Filtres Rapides par Statut
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Toutes ({totalRecettes})</span>
            </Button>
            
            <Button
              onClick={() => setStatusFilter('pleine')}
              variant={statusFilter === 'pleine' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                statusFilter === 'pleine' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-green-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Pleines ({recettesPleines})</span>
            </Button>
            
            <Button
              onClick={() => setStatusFilter('utilisee')}
              variant={statusFilter === 'utilisee' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                statusFilter === 'utilisee' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Utilisées ({recettesUtilisees})</span>
            </Button>
            
            <Button
              onClick={() => setStatusFilter('vide')}
              variant={statusFilter === 'vide' ? 'default' : 'outline'}
              className={`flex items-center space-x-2 ${
                statusFilter === 'vide' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Épuisées ({recettesVides})</span>
            </Button>
          </div>
        </motion.div>

        {/* Liste des recettes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredRecettes.map((recette) => (
            <Card key={recette.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {recette.libelle}
                  </CardTitle>
                  <Badge className={getStatusColor(recette)}>
                    {getStatusText(recette)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Montant:</span>
                    <span className="font-semibold">{recette.montant.toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Disponible:</span>
                    <span className="font-semibold text-green-600">{recette.soldeDisponible.toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilisé:</span>
                    <span className="font-semibold text-red-600">{(recette.montant - recette.soldeDisponible).toLocaleString()} F CFA</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(recette.soldeDisponible / recette.montant) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
