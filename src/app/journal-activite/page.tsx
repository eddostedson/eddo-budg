// 📝 PAGE JOURNAL D'ACTIVITÉ
'use client'

import React from 'react'
import ActivityLogComponent from '@/components/activity-log'
import { motion } from 'framer-motion'

export default function JournalActivitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📝 Journal d'Activité
            </h1>
            <p className="text-gray-600">
              Suivi complet de toutes les transactions et modifications
            </p>
          </div>

          <ActivityLogComponent />
        </motion.div>
      </div>
    </div>
  )
}
