'use client'

import { useMemo } from 'react'
import { useComptesBancaires } from '@/contexts/compte-bancaire-context'

export const useGlobalSoldes = () => {
  const { comptes, loading, getTotalSoldes } = useComptesBancaires()

  const totalSoldes = getTotalSoldes()

  const { adjustedTotal, excludedTotal } = useMemo(() => {
    if (!comptes || comptes.length === 0) {
      return { adjustedTotal: totalSoldes, excludedTotal: 0 }
    }

    const excluded = comptes.reduce((sum, compte) => {
      if (!compte.excludeFromTotal) return sum
      return sum + (compte.soldeActuel || 0)
    }, 0)

    return {
      adjustedTotal: totalSoldes - excluded,
      excludedTotal: excluded
    }
  }, [comptes, totalSoldes])

  const hasExclusions = excludedTotal > 0

  return {
    loading: loading && comptes.length === 0,
    totalSoldes,
    adjustedTotal,
    excludedTotal,
    hasExclusions
  }
}


