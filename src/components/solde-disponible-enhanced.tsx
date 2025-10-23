// 🎨 COMPOSANT SOLDE DISPONIBLE AMÉLIORÉ - DESIGN REMARQUABLE
'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SoldeDisponibleEnhancedProps {
  montant: number
  montantInitial: number
  className?: string
}

const SoldeDisponibleEnhanced: React.FC<SoldeDisponibleEnhancedProps> = ({ 
  montant, 
  montantInitial, 
  className = '' 
}) => {
  const pourcentageUtilise = ((montantInitial - montant) / montantInitial) * 100
  const estFaible = montant < montantInitial * 0.2 // Moins de 20% restant
  const estVide = montant === 0
  
  // Couleurs dynamiques basées sur le montant
  const getSoldeColor = () => {
    if (estVide) return 'from-red-500 to-red-600'
    if (estFaible) return 'from-orange-500 to-orange-600'
    if (montant >= montantInitial * 0.8) return 'from-green-500 to-green-600'
    return 'from-blue-500 to-blue-600'
  }
  
  const getTextColor = () => {
    if (estVide) return 'text-red-100'
    if (estFaible) return 'text-orange-100'
    return 'text-white'
  }
  
  const getIcon = () => {
    if (estVide) return '💸'
    if (estFaible) return '⚠️'
    if (montant >= montantInitial * 0.8) return '💰'
    return '💎'
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-2xl ${className}`}
    >
      {/* Arrière-plan avec dégradé animé */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getSoldeColor()} opacity-90`} />
      
      {/* Effet de brillance animé */}
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        style={{ transform: 'skewX(-20deg)' }}
      />
      
      {/* Contenu principal */}
      <div className="relative z-10">
        {/* En-tête avec icône */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl"
            >
              {getIcon()}
            </motion.span>
            <span className={`text-lg font-bold ${getTextColor()} uppercase tracking-wide`}>
              Solde Disponible
            </span>
          </div>
          
          {/* Indicateur de pourcentage */}
          <div className="text-right">
            <div className={`text-sm font-medium ${getTextColor()} opacity-80`}>
              {pourcentageUtilise.toFixed(1)}% utilisé
            </div>
            <div className="w-20 h-2 bg-white bg-opacity-30 rounded-full mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pourcentageUtilise}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>
        
        {/* Montant principal avec animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <div className={`text-4xl font-black ${getTextColor()} mb-2`}>
            {formatCurrency(montant)}
          </div>
          
          {/* Barre de progression circulaire */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Cercle de fond */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              {/* Cercle de progression */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 251.2" }}
                animate={{ strokeDasharray: `${(100 - pourcentageUtilise) * 2.512} 251.2` }}
                transition={{ duration: 2, delay: 0.5 }}
              />
            </svg>
            
            {/* Pourcentage au centre */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getTextColor()}`}>
                {Math.round(100 - pourcentageUtilise)}%
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Informations supplémentaires */}
        <div className="text-center">
          <div className={`text-sm ${getTextColor()} opacity-80 mb-2`}>
            Montant initial: {formatCurrency(montantInitial)}
          </div>
          
          {/* Statut avec animation */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              estVide 
                ? 'bg-red-500 text-white' 
                : estFaible 
                ? 'bg-orange-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {estVide ? '❌ Épuisé' : estFaible ? '⚠️ Faible' : '✅ Disponible'}
          </motion.div>
        </div>
      </div>
      
      {/* Effet de particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default SoldeDisponibleEnhanced
