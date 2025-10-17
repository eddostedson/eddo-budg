'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface FilePreviewTooltipProps {
  file: File | null
  fileUrl?: string | null
  children: ReactNode
  className?: string
}

export default function FilePreviewTooltip({ file, fileUrl, children, className = '' }: FilePreviewTooltipProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'document' | 'unknown'>('unknown')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Déterminer le type de fichier
      const fileType = file.type.toLowerCase()
      if (fileType.startsWith('image/')) {
        setPreviewType('image')
      } else if (fileType === 'application/pdf') {
        setPreviewType('pdf')
      } else if (fileType.includes('document') || fileType.includes('text') || fileType.includes('msword')) {
        setPreviewType('document')
      } else {
        setPreviewType('unknown')
      }
    } else if (fileUrl) {
      setPreviewUrl(fileUrl)
      
      // Déterminer le type basé sur l'extension
      const extension = fileUrl.toLowerCase().split('.').pop()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        setPreviewType('image')
      } else if (extension === 'pdf') {
        setPreviewType('pdf')
      } else if (['doc', 'docx', 'txt'].includes(extension || '')) {
        setPreviewType('document')
      } else {
        setPreviewType('unknown')
      }
    } else {
      setPreviewUrl(null)
      setPreviewType('unknown')
    }

    return () => {
      if (previewUrl && file) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [file, fileUrl])

  const handleMouseEnter = () => {
    if ((file || fileUrl) && previewUrl) {
      timeoutRef.current = setTimeout(() => {
        setShowPreview(true)
      }, 500) // Délai de 500ms avant d'afficher
    }
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowPreview(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current && showPreview) {
      const tooltip = tooltipRef.current
      const rect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Positionner le tooltip pour qu'il reste visible
      let left = e.clientX + 10
      let top = e.clientY - 10
      
      if (left + rect.width > viewportWidth) {
        left = e.clientX - rect.width - 10
      }
      
      if (top + rect.height > viewportHeight) {
        top = e.clientY - rect.height - 10
      }
      
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
    }
  }

  const renderPreview = () => {
    if (!previewUrl || (!file && !fileUrl)) return null

    switch (previewType) {
      case 'image':
        return (
          <div className="max-w-md max-h-96 overflow-hidden rounded-lg shadow-lg">
            <img 
              src={previewUrl} 
              alt={file ? file.name : (fileUrl ? fileUrl.split('/').pop() : 'Image')}
              className="w-full h-auto object-contain"
            />
          </div>
        )
      
      case 'pdf':
        return (
          <div className="max-w-sm max-h-80 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📄</span>
              <div>
                <span className="font-bold text-lg text-gray-800">PDF</span>
                <div className="text-xs text-gray-500">Document PDF</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 mb-3 font-medium">
              {file ? file.name : (fileUrl ? fileUrl.split('/').pop() : 'Fichier PDF')}
            </div>
            {file && (
              <div className="text-sm text-gray-600 mb-3">
                Taille: {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-700 font-medium">
                👆 Cliquez pour ouvrir le document
              </div>
            </div>
          </div>
        )
      
      case 'document':
        return (
          <div className="max-w-sm max-h-80 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📝</span>
              <div>
                <span className="font-bold text-lg text-gray-800">Document</span>
                <div className="text-xs text-gray-500">Fichier de texte</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 mb-3 font-medium">
              {file ? file.name : (fileUrl ? fileUrl.split('/').pop() : 'Document')}
            </div>
            {file && (
              <div className="text-sm text-gray-600 mb-3">
                Taille: {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-700 font-medium">
                👆 Cliquez pour ouvrir le document
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="max-w-sm max-h-80 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📎</span>
              <div>
                <span className="font-bold text-lg text-gray-800">Fichier</span>
                <div className="text-xs text-gray-500">Fichier générique</div>
              </div>
            </div>
            <div className="text-sm text-gray-700 mb-3 font-medium">
              {file ? file.name : (fileUrl ? fileUrl.split('/').pop() : 'Fichier')}
            </div>
            {file && (
              <div className="text-sm text-gray-600 mb-3">
                Taille: {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-700 font-medium">
                👆 Cliquez pour ouvrir le fichier
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}
      
      {showPreview && previewUrl && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white border-2 border-gray-300 rounded-2xl shadow-2xl p-4 pointer-events-none backdrop-blur-sm"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '400px',
            maxHeight: '500px'
          }}
        >
          {renderPreview()}
        </div>
      )}
    </div>
  )
}
