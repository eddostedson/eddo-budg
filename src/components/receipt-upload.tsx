'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { SimpleReceiptPreview } from './simple-receipt-preview'
import { useNotifications } from '@/contexts/notification-context'

interface ReceiptUploadProps {
  onReceiptUploaded: (receiptUrl: string, fileName: string) => void
  onReceiptRemoved: () => void
  currentReceiptUrl?: string
  currentFileName?: string
  disabled?: boolean
}

export function ReceiptUpload({ 
  onReceiptUploaded, 
  onReceiptRemoved, 
  currentReceiptUrl, 
  currentFileName,
  disabled = false 
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { showSuccess, showError } = useNotifications()

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Veuillez sélectionner une image (JPG, PNG, WebP) ou un PDF.')
      return
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximale : 5MB.')
      return
    }

    setUploading(true)

    try {
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        showError('Erreur d\'authentification', 'Vous devez être connecté pour uploader un reçu.')
        return
      }

      // Générer un nom de fichier unique avec l'ID utilisateur
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('🔄 Upload vers Supabase Storage:', filePath)
      
      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ Erreur upload Supabase:', error)
        showError('Erreur d\'upload', `Détails: ${error.message}\nCode: ${error.statusCode || 'N/A'}\nBucket: ${error.bucket || 'N/A'}`)
        return
      }

      console.log('✅ Upload réussi:', data)

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      onReceiptUploaded(publicUrl, file.name)
      
      // Marquer comme uploadé avec succès
      setUploadSuccess(true)
      setUploadedFileName(file.name)
      showSuccess('Reçu uploadé', `Le fichier "${file.name}" a été uploadé avec succès !`)
      
      // Réinitialiser l'état de succès après 3 secondes
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('❌ Erreur inattendue upload:', error)
      showError('Erreur d\'upload', `Erreur inattendue: ${error.message || 'Erreur inconnue'}`)
      setUploadSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleRemoveReceipt = async () => {
    if (currentReceiptUrl) {
      try {
        // Extraire le chemin du fichier depuis l'URL
        const urlParts = currentReceiptUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `receipts/${fileName}`

        // Supprimer le fichier du storage
        await supabase.storage
          .from('receipts')
          .remove([filePath])
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
    
    onReceiptRemoved()
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Reçu (optionnel)
      </label>
      
      {currentReceiptUrl ? (
        // Affichage du reçu existant avec aperçu au survol
        <div className="space-y-3">
          <SimpleReceiptPreview 
            receiptUrl={currentReceiptUrl} 
            fileName={currentFileName}
          />
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2">
            <a
              href={currentReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Voir
            </a>
            {!disabled && (
              <button
                onClick={handleRemoveReceipt}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      ) : (
        // Zone d'upload
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            uploadSuccess
              ? 'border-green-400 bg-green-50'
              : dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={disabled ? undefined : openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : uploadSuccess ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-green-600 font-medium">
                ✅ Upload réussi !
              </div>
              <p className="text-xs text-gray-500">
                Fichier: {uploadedFileName}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Cliquez pour uploader
                </span>
                {' '}ou glissez-déposez votre reçu
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP ou PDF (max 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
