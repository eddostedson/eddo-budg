'use client'

import { useState } from 'react'
import { FastDepenseService } from '@/lib/supabase/fast-depense-service'

export default function TestPerformancePage() {
  const [results, setResults] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runPerformanceTest = async () => {
    setIsLoading(true)
    const testResults: number[] = []
    
    // Effectuer 5 tests de performance
    for (let i = 0; i < 5; i++) {
      const time = await FastDepenseService.performanceTest()
      testResults.push(time)
      setResults([...testResults])
      
      // Attendre 1 seconde entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setIsLoading(false)
  }

  const averageTime = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test de Performance - Enregistrement Dépenses
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Résultats des Tests</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Temps Moyen</h3>
              <p className="text-2xl font-bold text-blue-600">
                {averageTime.toFixed(0)}ms
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Tests Effectués</h3>
              <p className="text-2xl font-bold text-green-600">
                {results.length}/5
              </p>
            </div>
          </div>
          
          <button
            onClick={runPerformanceTest}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Test en cours...' : 'Lancer le Test de Performance'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Détails des Tests</h3>
            <div className="space-y-2">
              {results.map((time, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Test {index + 1}</span>
                  <span className={`font-bold ${time > 2000 ? 'text-red-600' : time > 1000 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {time.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-semibold mb-2">Analyse des Résultats :</h4>
              <ul className="text-sm space-y-1">
                <li>• <span className="text-green-600">Vert (&lt;1000ms)</span> : Excellent</li>
                <li>• <span className="text-yellow-600">Jaune (1000-2000ms)</span> : Acceptable</li>
                <li>• <span className="text-red-600">Rouge (&gt;2000ms)</span> : Problématique</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
