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
  
  // Couleurs dynamiques basées sur le montant - VERT FONCÉ
  const getSoldeColor = () => {
    if (estVide) return 'from-red-700 to-red-800'
    if (estFaible) return 'from-orange-600 to-orange-700'
    if (montant >= montantInitial * 0.8) return 'from-green-700 to-green-800'
    return 'from-green-600 to-green-700'
  }
  
  const getTextColor = () => {
    if (estVide) return 'text-white font-black'
    if (estFaible) return 'text-white font-black'
    return 'text-white font-black'
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
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-xl p-4 shadow-lg ${className}`}
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl"
            >
              {getIcon()}
            </motion.span>
            <span className={`text-sm font-black text-white uppercase tracking-wide`}>
              Solde Disponible
            </span>
          </div>
          
          {/* Indicateur de pourcentage */}
          <div className="text-right">
            <div className={`text-xs font-bold text-white opacity-90`}>
              {pourcentageUtilise.toFixed(1)}% utilisé
            </div>
            <div className="w-16 h-1.5 bg-white bg-opacity-30 rounded-full mt-1">
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
          <div className={`text-2xl font-black text-white mb-2`}>
            {formatCurrency(montant)}
          </div>
          
          {/* Barre de progression circulaire */}
          <div className="relative w-16 h-16 mx-auto mb-3">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
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
              <span className={`text-xs font-black text-white`}>
                {Math.round(100 - pourcentageUtilise)}%
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Informations supplémentaires */}
        <div className="text-center">
          <div className={`text-xs text-white font-bold opacity-90 mb-2`}>
            Montant initial: {formatCurrency(montantInitial)}
          </div>
          
          {/* Statut avec animation */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
