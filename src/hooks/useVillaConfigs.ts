'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { VillaConfig } from '@/lib/shared-data'
import { LoyersService } from '@/lib/supabase/loyers-service'

interface CreateVillaPayload {
  label: string
  loyerMontant: number
  code?: string
  description?: string
}

export const useVillaConfigs = () => {
  const [villas, setVillas] = useState<VillaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await LoyersService.listVillas()
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H4',
          location: 'useVillaConfigs.ts:refresh',
          message: 'Villa list loaded',
          data: { count: data.length },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
      setVillas(data)
    } catch (err) {
      console.error('❌ useVillaConfigs refresh error', err)
      setError('Impossible de charger les villas')
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H5',
          location: 'useVillaConfigs.ts:refresh',
          message: 'Villa load failed',
          data: { error: String(err) },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
    } finally {
      setLoading(false)
    }
  }, [])

  const addVilla = useCallback(async (payload: CreateVillaPayload) => {
    const villa = await LoyersService.createVilla(payload)
    if (villa) {
      setVillas((prev) => [...prev, villa].sort((a, b) => a.label.localeCompare(b.label)))
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H6',
          location: 'useVillaConfigs.ts:addVilla',
          message: 'Villa created',
          data: { id: villa.id, label: villa.label },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
    }
    return villa
  }, [])

  useEffect(() => {
    refresh().catch(() => null)
  }, [refresh])

  const mapById = useMemo(() => {
    const map = new Map<string, VillaConfig>()
    villas.forEach((villa) => map.set(villa.id, villa))
    return map
  }, [villas])

  return {
    villas,
    loading,
    error,
    refresh,
    addVilla,
    getVillaById: (id?: string | null) => (id ? mapById.get(id) : undefined)
  }
}

