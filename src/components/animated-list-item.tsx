/**
 * 🎨 Composant wrapper pour micro-animations lors des suppressions
 * Utilise Framer Motion pour des animations fluides
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedListItemProps {
  id: string | number
  isDeleted?: boolean
  children: ReactNode
  onAnimationComplete?: () => void
}

export function AnimatedListItem({ 
  id, 
  isDeleted = false, 
  children, 
  onAnimationComplete 
}: AnimatedListItemProps) {
  return (
    <AnimatePresence mode="popLayout">
      {!isDeleted && (
        <motion.div
          key={id}
          layout
          initial={{ opacity: 1, height: 'auto', scale: 1 }}
          animate={{ 
            opacity: isDeleted ? 0 : 1, 
            height: isDeleted ? 0 : 'auto',
            scale: isDeleted ? 0.95 : 1
          }}
          exit={{ 
            opacity: 0, 
            height: 0,
            scale: 0.95,
            transition: { duration: 0.25, ease: 'easeInOut' }
          }}
          transition={{ 
            duration: 0.25, 
            ease: 'easeInOut',
            layout: { duration: 0.2 }
          }}
          onAnimationComplete={onAnimationComplete}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Composant pour les lignes de tableau animées
 */
interface AnimatedTableRowProps {
  id: string | number
  isDeleted?: boolean
  children: ReactNode
  onAnimationComplete?: () => void
}

export function AnimatedTableRow({ 
  id, 
  isDeleted = false, 
  children, 
  onAnimationComplete 
}: AnimatedTableRowProps) {
  return (
    <AnimatePresence mode="popLayout">
      {!isDeleted && (
        <motion.tr
          key={id}
          layout
          initial={{ opacity: 1, height: 'auto' }}
          animate={{ 
            opacity: isDeleted ? 0 : 1, 
            height: isDeleted ? 0 : 'auto'
          }}
          exit={{ 
            opacity: 0, 
            height: 0,
            transition: { duration: 0.25, ease: 'easeInOut' }
          }}
          transition={{ 
            duration: 0.25, 
            ease: 'easeInOut',
            layout: { duration: 0.2 }
          }}
          onAnimationComplete={onAnimationComplete}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.tr>
      )}
    </AnimatePresence>
  )
}

