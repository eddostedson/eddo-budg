'use client'

import { ReactNode } from 'react'

interface ModernTableProps {
  children: ReactNode
  className?: string
}

export function ModernTable({ children, className = '' }: ModernTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  )
}

interface ModernTableHeaderProps {
  children: ReactNode
  className?: string
}

export function ModernTableHeader({ children, className = '' }: ModernTableHeaderProps) {
  return (
    <thead className={`bg-gradient-to-r from-gray-50 to-gray-100 ${className}`}>
      {children}
    </thead>
  )
}

interface ModernTableBodyProps {
  children: ReactNode
  className?: string
}

export function ModernTableBody({ children, className = '' }: ModernTableBodyProps) {
  return (
    <tbody className={`divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  )
}

interface ModernTableRowProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function ModernTableRow({ children, className = '', hover = true }: ModernTableRowProps) {
  return (
    <tr className={`${hover ? 'hover:bg-gray-50' : ''} transition-colors duration-200 ${className}`}>
      {children}
    </tr>
  )
}

interface ModernTableHeaderCellProps {
  children: ReactNode
  className?: string
  sortable?: boolean
  onClick?: () => void
}

export function ModernTableHeaderCell({ children, className = '', sortable = false, onClick }: ModernTableHeaderCellProps) {
  return (
    <th 
      className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${sortable ? 'cursor-pointer hover:text-blue-600' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && <span className="text-gray-400">↕️</span>}
      </div>
    </th>
  )
}

interface ModernTableCellProps {
  children: ReactNode
  className?: string
}

export function ModernTableCell({ children, className = '' }: ModernTableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  )
}

interface ModernTableFooterProps {
  children: ReactNode
  className?: string
}

export function ModernTableFooter({ children, className = '' }: ModernTableFooterProps) {
  return (
    <tfoot className={`bg-gradient-to-r from-gray-50 to-gray-100 ${className}`}>
      {children}
    </tfoot>
  )
}

interface ModernDataTableProps {
  data: Record<string, unknown>[]
  columns: {
    key: string
    label: string
    sortable?: boolean
    render?: (value: unknown, row: Record<string, unknown>) => ReactNode
  }[]
  className?: string
}

export function ModernDataTable({ data, columns, className = '' }: ModernDataTableProps) {
  return (
    <ModernTable className={className}>
      <ModernTableHeader>
        <ModernTableRow>
          {columns.map((column) => (
            <ModernTableHeaderCell key={column.key} sortable={column.sortable}>
              {column.label}
            </ModernTableHeaderCell>
          ))}
        </ModernTableRow>
      </ModernTableHeader>
      <ModernTableBody>
        {data.map((row, index) => (
          <ModernTableRow key={index}>
            {columns.map((column) => (
              <ModernTableCell key={column.key}>
                {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
              </ModernTableCell>
            ))}
          </ModernTableRow>
        ))}
      </ModernTableBody>
    </ModernTable>
  )
}





