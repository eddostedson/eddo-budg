'use client'

import { ReactNode } from 'react'

interface ModernChartProps {
  children: ReactNode
  title?: string
  className?: string
}

export function ModernChart({ children, title, className = '' }: ModernChartProps) {
  return (
    <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      )}
      {children}
    </div>
  )
}

interface ModernPieChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  className?: string
}

export function ModernPieChart({ data, size = 200, className = '' }: ModernPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const startAngle = (cumulativePercentage / 100) * 360
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360
          
          cumulativePercentage += percentage

          const radius = size / 2 - 10
          const centerX = size / 2
          const centerY = size / 2

          const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
          const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
          const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
          const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

          const largeArcFlag = percentage > 50 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ')

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ModernBarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxValue?: number
  className?: string
}

export function ModernBarChart({ data, maxValue, className = '' }: ModernBarChartProps) {
  const max = maxValue || Math.max(...data.map(item => item.value))
  const maxHeight = 200

  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((item, index) => {
        const height = (item.value / max) * maxHeight
        const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`

        return (
          <div key={index} className="flex items-end space-x-3">
            <div className="w-20 text-sm text-gray-700 truncate">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div 
                className="rounded-t-lg transition-all duration-500 ease-out hover:opacity-80"
                style={{ 
                  height: `${height}px`,
                  backgroundColor: color
                }}
              />
              <div className="absolute -top-6 left-0 text-xs font-medium text-gray-900">
                {item.value}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ModernLineChartProps {
  data: { x: string; y: number }[]
  className?: string
}

export function ModernLineChart({ data, className = '' }: ModernLineChartProps) {
  const maxY = Math.max(...data.map(item => item.y))
  const minY = Math.min(...data.map(item => item.y))
  const rangeY = maxY - minY

  const width = 400
  const height = 200
  const padding = 40

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding
    const y = height - padding - ((item.y - minY) / rangeY) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={`${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-sm"
        />
        
        {/* Points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * (width - 2 * padding) + padding
          const y = height - padding - ((item.y - minY) / rangeY) * (height - 2 * padding)
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              className="hover:r-6 transition-all duration-200"
            />
          )
        })}
      </svg>
    </div>
  )
}










































