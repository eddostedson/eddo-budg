'use client'

import { useState } from 'react'
import { AIAnalytics } from '@/components/ai-analytics'
import { AIAssistant } from '@/components/ai-assistant'
import { SmartCategorizer } from '@/components/smart-categorizer'
import { Button } from '@/components/ui/button'

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'categorizer'>('analytics')

  return (
    <div className="space-y-8">
      {/* Navigation tabs */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-white">🧠 Intelligence Artificielle</h1>
        <div className="flex gap-2 ml-auto">
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className={`rounded-xl ${
              activeTab === 'analytics' 
                ? 'app-icon text-white' 
                : 'text-slate-300 hover:text-white hover:glass-card'
            }`}
          >
            📊 Analyse & Prédictions
          </Button>
          <Button
            variant={activeTab === 'categorizer' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('categorizer')}
            className={`rounded-xl ${
              activeTab === 'categorizer' 
                ? 'app-icon text-white' 
                : 'text-slate-300 hover:text-white hover:glass-card'
            }`}
          >
            🤖 Classification Auto
          </Button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'analytics' ? (
        <AIAnalytics />
      ) : (
        <SmartCategorizer />
      )}

      {/* Assistant IA always visible */}
      <AIAssistant />
    </div>
  )
}
