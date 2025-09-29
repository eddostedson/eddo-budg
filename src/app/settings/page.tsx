'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { DataManagement } from '@/components/ui/data-management'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReports: true,
    goalReminders: true,
    emailDigest: false
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-blue-500">⚙️</span>
            Paramètres
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Profile settings */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Profil Utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user?.email || 'Utilisateur'}</h3>
                <p className="text-sm text-gray-500">Membre depuis janvier 2024</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <Input 
                  placeholder="Votre nom complet"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input 
                  placeholder="Votre numéro de téléphone"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            
            <Button 
              onClick={() => alert('Profil mis à jour avec succès !')}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Mettre à jour le profil
            </Button>
          </CardContent>
        </Card>

        {/* Notification settings */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {key === 'budgetAlerts' && 'Alertes de budget'}
                    {key === 'weeklyReports' && 'Rapports hebdomadaires'}
                    {key === 'goalReminders' && 'Rappels d\'objectifs'}
                    {key === 'emailDigest' && 'Résumé par email'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {key === 'budgetAlerts' && 'Recevoir des alertes quand un budget est dépassé'}
                    {key === 'weeklyReports' && 'Rapport automatique chaque dimanche'}
                    {key === 'goalReminders' && 'Rappels pour vos objectifs d\'épargne'}
                    {key === 'emailDigest' && 'Résumé mensuel par email'}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget preferences */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Préférences Budgétaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise par défaut
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période de budget
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="monthly">Mensuel</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectif d'épargne mensuel
              </label>
              <Input 
                type="number"
                placeholder="300"
                className="border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security settings */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Sécurité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => alert('Ouverture du formulaire de changement de mot de passe')}
              variant="outline" 
              className="w-full justify-start"
            >
              🔒 Changer le mot de passe
            </Button>
            <Button 
              onClick={() => alert('Configuration de l\'authentification à deux facteurs')}
              variant="outline" 
              className="w-full justify-start"
            >
              📱 Activer l'authentification à deux facteurs
            </Button>
            <Button 
              onClick={() => alert('Téléchargement des données en cours...')}
              variant="outline" 
              className="w-full justify-start"
            >
              📊 Télécharger mes données
            </Button>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="bg-red-50 border border-red-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-900">Zone de Danger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Gérer les Données</h4>
                <p className="text-sm text-red-700">Supprimer les budgets, transactions ou toutes les données.</p>
              </div>
              <DataManagement />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Supprimer le compte</h4>
                <p className="text-sm text-red-700">Cette action est irréversible. Toutes vos données seront supprimées.</p>
              </div>
              <Button 
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                    alert('Suppression du compte initiée. Un email de confirmation a été envoyé.');
                  }
                }}
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Supprimer
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Se déconnecter</h4>
                <p className="text-sm text-red-700">Vous serez redirigé vers la page de connexion.</p>
              </div>
              <Button 
                onClick={signOut}
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
