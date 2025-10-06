'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { useRecettes } from '@/contexts/recette-context'
import { useDepenses } from '@/contexts/depense-context'
import { useNotes } from '@/contexts/notes-context'

export default function AccueilPage() {
  const router = useRouter()
  const { recettes, getTotalRecettes, getTotalDisponible } = useRecettes()
  const { depenses } = useDepenses()
  const { notes, getNotesByStatus } = useNotes()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
  }

  const getTotalDepenses = () => {
    return depenses.reduce((total, depense) => total + depense.montant, 0)
  }

  const getTotalNotes = () => {
    return notes.reduce((total, note) => total + note.montant, 0)
  }

  const getNotesEnAttente = () => {
    return getNotesByStatus('en_attente')
  }

  const getNotesRecettes = () => { // New function for recipe notes
    return notes.filter(note => note.type === 'recette')
  }

  const getNotesDepenses = () => { // New function for expense notes
    return notes.filter(note => note.type === 'depense')
  }

  const cards = [
    {
      title: 'Recettes',
      icon: '💰',
      description: 'Gérez vos sources de revenus',
      gradient: 'from-blue-600 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-50',
      route: '/recettes',
      stats: {
        label: 'Total des recettes',
        value: formatCurrency(getTotalRecettes()),
        count: recettes.length
      }
    },
    {
      title: 'Dépenses',
      icon: '💸',
      description: 'Suivez vos sorties d\'argent',
      gradient: 'from-red-600 to-orange-600',
      bgGradient: 'from-red-50 to-orange-50',
      route: '/depenses',
      stats: {
        label: 'Total des dépenses',
        value: formatCurrency(getTotalDepenses()),
        count: depenses.length
      }
    },
    {
      title: 'Notes',
      icon: '📝',
      description: 'Recettes et dépenses futures',
      gradient: 'from-purple-600 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      route: '/notes',
      stats: {
        label: 'Total des notes',
        value: formatCurrency(getTotalNotes()),
        count: notes.length
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMTIgMTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center text-white">
            <div className="mb-6 flex justify-center">
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl px-8 py-4 inline-flex items-center gap-3">
                <span className="text-6xl">💎</span>
                <div className="text-left">
                  <div className="text-sm font-medium opacity-90">Bienvenue sur</div>
                  <div className="text-2xl font-bold">Eddo Budget</div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Gérez votre argent<br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                en toute simplicité
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 md:mb-12 px-4">
              Une application moderne pour suivre vos recettes, organiser vos budgets et contrôler vos dépenses
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold mb-1">{formatCurrency(getTotalRecettes())}</div>
                <div className="text-sm text-blue-100">Recettes totales</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-3xl font-bold mb-1">{formatCurrency(getTotalDepenses())}</div>
                <div className="text-sm text-blue-100">Dépenses effectuées</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-3xl font-bold mb-1">{formatCurrency(getTotalNotes())}</div>
                <div className="text-sm text-blue-100">Notes de dépenses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Que souhaitez-vous faire ?
          </h2>
          <p className="text-xl text-gray-600">
            Choisissez une action pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => router.push(card.route)}
              className="group relative overflow-hidden bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${card.gradient} shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-5xl">{card.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  {card.description}
                </p>

                {/* Stats */}
                <div className="bg-white bg-opacity-60 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="text-sm text-gray-600 mb-2">{card.stats.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{card.stats.value}</div>
                  <div className="text-sm text-gray-500">
                    {card.stats.count} {card.stats.count > 1 ? 'éléments' : 'élément'}
                  </div>
                </div>

                {/* Arrow */}
                <div className={`absolute bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white text-2xl transform group-hover:translate-x-1 transition-transform`}>
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes en attente - Section spéciale */}
      {getNotesEnAttente().length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                <span className="text-5xl">📝</span>
                Notes en Attente
              </h2>
              <p className="text-xl text-gray-600">
                Vous avez {getNotesEnAttente().length} note(s) prévues
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getNotesEnAttente().slice(0, 6).map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500"
                >
                  <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{note.type === 'recette' ? '💰' : '💸'}</span>
                        <h3 className="text-lg font-bold text-gray-900">{note.libelle}</h3>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(note.montant)}</p>
                      <p className="text-sm text-gray-500">
                        {note.type === 'recette' ? 'Note de recette' : 'Note de dépense'}
                      </p>
                    </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        note.priorite === 'urgente' ? 'bg-red-100 text-red-800 border-red-300' :
                        note.priorite === 'haute' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        note.priorite === 'normale' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {note.priorite.toUpperCase()}
                      </span>
                    </div>

                    {note.description && (
                      <p className="text-gray-600 mb-4 text-sm">{note.description}</p>
                    )}

                    {note.date_prevue && (
                      <p className="text-sm text-gray-500 mb-4">
                        📅 Prévu le {new Date(note.date_prevue).toLocaleDateString('fr-FR')}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push('/notes')}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📝 Gérer
                      </button>
                      <button
                        onClick={() => router.push('/notes')}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        💰 Convertir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getNotesEnAttente().length > 6 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => router.push('/notes')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Voir toutes les notes ({getNotesEnAttente().length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Eddo Budget ?
            </h2>
            <p className="text-xl text-gray-600">
              Une solution complète pour votre gestion financière
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                ⚡
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Rapide et Simple</h3>
              <p className="text-gray-600">
                Interface intuitive pour gérer vos finances en quelques clics
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                🤖
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Intelligence Artificielle</h3>
              <p className="text-gray-600">
                Analyses et recommandations personnalisées pour optimiser vos finances
              </p>
              <button
                onClick={() => router.push('/ai-insights')}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Découvrir l'IA →
              </button>
            </div>

            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                🔒
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sécurisé</h3>
              <p className="text-gray-600">
                Vos données sont protégées et chiffrées
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

