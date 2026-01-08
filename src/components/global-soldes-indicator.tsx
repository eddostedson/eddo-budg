'use client'

import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGlobalSoldes } from '@/hooks/use-global-soldes'
import { useMemo } from 'react'

interface GlobalSoldesIndicatorProps {
  appearance?: 'dark' | 'light'
  size?: 'compact' | 'comfortable'
  className?: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)

export function GlobalSoldesIndicator({
  appearance = 'dark',
  size = 'comfortable',
  className
}: GlobalSoldesIndicatorProps) {
  const { adjustedTotal, totalSoldes, hasExclusions, loading } = useGlobalSoldes()

  const { containerClass, iconClass, labelClass, valueClass, subClass } = useMemo(() => {
    const isDark = appearance === 'dark'
    return {
      containerClass: cn(
        'flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm transition-all duration-200',
        size === 'compact' ? 'min-w-[150px]' : 'min-w-[210px]',
        isDark
          ? 'bg-white/10 border-white/20 text-white backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900'
      ),
      iconClass: cn(
        'rounded-xl p-1.5 flex items-center justify-center',
        isDark ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600',
        size === 'compact' ? 'h-7 w-7' : 'h-9 w-9'
      ),
      labelClass: cn(
        'font-semibold uppercase tracking-wide',
        size === 'compact' ? 'text-[9px]' : 'text-[11px]',
        isDark ? 'text-white/70' : 'text-slate-500'
      ),
      valueClass: cn(
        'font-bold leading-tight',
        size === 'compact' ? 'text-sm' : 'text-base sm:text-lg'
      ),
      subClass: cn(
        'text-[10px] sm:text-[11px] leading-tight',
        isDark ? 'text-white/60' : 'text-slate-500',
        size === 'compact' ? 'hidden sm:block' : ''
      )
    }
  }, [appearance, size])

  if (loading) {
    return (
      <div className={cn(containerClass, 'animate-pulse', className)}>
        <div className={cn(iconClass, 'opacity-50')} />
        <div className="flex flex-col gap-1 flex-1">
          <div className="h-2.5 rounded bg-white/40" />
          <div className="h-4 rounded bg-white/60" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(containerClass, className)}>
      <div className={iconClass}>
        <Wallet className="h-4 w-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={labelClass}>
          {hasExclusions ? 'Soldes nets' : 'Total des soldes'}
        </span>
        <span className={valueClass}>{formatCurrency(adjustedTotal)}</span>
        {hasExclusions && (
          <span className={cn(subClass)}>
            Brut : {formatCurrency(totalSoldes)}
          </span>
        )}
      </div>
    </div>
  )
}


