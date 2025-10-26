'use client'

import { useState, useRef } from 'react'
import { BackupRestoreService } from '@/lib/supabase/backup-restore-service'
import { useNotifications } from '@/contexts/notification-context'

export default function RestorePage() {
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreStats, setRestoreStats] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showSuccess, showError } = useNotifications()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file)
        showSuccess(
          "✅ Fichier sélectionné",
          `Fichier: ${file.name}\nTaille: ${(file.size / 1024).toFixed(1)} KB`
        )
      } else {
        showError(
          "❌ Format non supporté",
          "Seuls les fichiers JSON (.json) sont acceptés pour la restauration."
        )
        setSelectedFile(null)
      }
    }
  }

  const handleRestore = async () => {
    if (!selectedFile) {
      showError("Aucun fichier", "Veuillez sélectionner un fichier JSON.")
      return
    }

    try {
      setIsRestoring(true)
      console.log('🔄 Début de la restauration...')
      
      // Lire le contenu du fichier
      const fileContent = await selectedFile.text()
      
      // Restaurer les données
      const result = await BackupRestoreService.restoreFromJSON(fileContent)
      
      if (result.success) {
        showSuccess(
          "✅ Restauration réussie !",
          result.message
        )
        setRestoreStats({
          success: true,
          message: result.message,
          timestamp: new Date().toLocaleString('fr-FR')
        })
      } else {
        showError(
          "❌ Erreur de restauration",
          result.message
        )
        setRestoreStats({
          success: false,
          message: result.message,
          timestamp: new Date().toLocaleString('fr-FR')
        })
      }
      
      console.log('✅ Restauration terminée:', result)
      
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error)
      showError(
        "Erreur de restauration",
        "Une erreur est survenue lors de la restauration. Vérifiez que le fichier JSON est valide."
      )
      setRestoreStats({
        success: false,
        message: `Erreur: ${error}`,
        timestamp: new Date().toLocaleString('fr-FR')
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Restauration des Données</h1>
              <p className="text-gray-600">Restaurer vos données depuis un fichier JSON</p>
            </div>
          </div>

          {/* Sélection de fichier */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sélectionner un fichier JSON de sauvegarde
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-colors font-medium"
                >
                  📁 Choisir un fichier
                </label>
                {selectedFile && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      📄 {selectedFile.name}
                    </span>
                    <button
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      ❌ Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de restauration */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRestore}
                disabled={!selectedFile || isRestoring}
                className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
                  !selectedFile || isRestoring
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isRestoring ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Restauration en cours...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🔄</span>
                    Restaurer les données
                  </>
                )}
              </button>

              {restoreStats && (
                <div className={`text-sm px-4 py-2 rounded-lg ${
                  restoreStats.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {restoreStats.success ? '✅' : '❌'} {restoreStats.timestamp}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avertissement important */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                ATTENTION : Opération destructive
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Cette opération va <strong>supprimer toutes les données existantes</strong></li>
                <li>• Assurez-vous d'avoir fait une sauvegarde récente avant de continuer</li>
                <li>• Seuls les fichiers JSON exportés depuis cette application sont supportés</li>
                <li>• Les fichiers CSV ne peuvent pas être utilisés pour la restauration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            Instructions de restauration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Format supporté :</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Fichiers JSON (.json)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span>Exportés depuis cette application</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <span>Fichiers CSV (.csv)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
                  <span>Autres formats</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Étapes :</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">1️⃣</span>
                  <span>Sélectionner le fichier JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">2️⃣</span>
                  <span>Cliquer sur "Restaurer"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">3️⃣</span>
                  <span>Attendre la confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">4️⃣</span>
                  <span>Vérifier les données restaurées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






