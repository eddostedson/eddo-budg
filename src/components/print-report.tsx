'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Budget } from '@/lib/shared-data'
import { formatDate } from '@/lib/utils'

interface PrintReportProps {
  title: string
  budgets: Budget[]
  totalAmount: number
  totalSpent: number
  totalRemaining: number
  onClose: () => void
}

export function PrintReport({ 
  title, 
  budgets, 
  totalAmount, 
  totalSpent, 
  totalRemaining, 
  onClose 
}: PrintReportProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                @media print {
                  body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #000;
                    background: white;
                  }
                  .print-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                  }
                  .print-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                  }
                  .print-date {
                    font-size: 14px;
                    color: #666;
                  }
                  .print-summary {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                  }
                  .print-summary-item {
                    text-align: center;
                  }
                  .print-summary-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                  }
                  .print-summary-value {
                    font-size: 18px;
                    font-weight: bold;
                  }
                  .print-budgets {
                    margin-top: 30px;
                  }
                  .print-budget-item {
                    border: 1px solid #ddd;
                    margin-bottom: 15px;
                    border-radius: 8px;
                    overflow: hidden;
                  }
                  .print-budget-header {
                    padding: 15px;
                    color: white;
                    font-weight: bold;
                  }
                  .print-budget-content {
                    padding: 15px;
                    background: white;
                  }
                  .print-budget-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 10px;
                  }
                  .print-budget-details {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                  }
                  .print-footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                  }
                  @page {
                    margin: 1cm;
                    size: A4;
                  }
                }
                @media screen {
                  .print-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                  }
                  .print-content {
                    background: white;
                    border-radius: 8px;
                    padding: 30px;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div ref={printRef}>
          {/* En-tête d'impression */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2px solid #000',
            paddingBottom: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>{title}</div>
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>Généré le {formatDate(new Date().toISOString())}</div>
          </div>

          {/* Résumé global */}
          <div style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px'
          }}>
            <div style={{textAlign: 'center'}}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '5px'
              }}>Total des budgets</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold'
              }}>{totalAmount.toLocaleString()} F CFA</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '5px'
              }}>Total dépensé</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#dc2626'
              }}>{totalSpent.toLocaleString()} F CFA</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '5px'
              }}>Total restant</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#16a34a'
              }}>{totalRemaining.toLocaleString()} F CFA</div>
            </div>
          </div>

          {/* Détail des budgets */}
          <div style={{marginTop: '30px'}}>
            <h3 style={{marginBottom: '20px', fontSize: '18px', fontWeight: 'bold'}}>Détail des budgets</h3>
            {budgets.map((budget) => (
              <div key={budget.id} style={{
                border: '1px solid #ddd',
                marginBottom: '15px',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    padding: '15px',
                    color: 'white',
                    fontWeight: 'bold',
                    backgroundColor: budget.color === 'bg-green-500' ? '#10b981' : 
                                   budget.color === 'bg-purple-500' ? '#8b5cf6' :
                                   budget.color === 'bg-blue-500' ? '#3b82f6' :
                                   budget.color === 'bg-orange-500' ? '#f97316' :
                                   budget.color === 'bg-red-500' ? '#ef4444' :
                                   budget.color === 'bg-indigo-500' ? '#6366f1' :
                                   budget.color === 'bg-pink-500' ? '#ec4899' :
                                   budget.color === 'bg-teal-500' ? '#14b8a6' : '#6b7280'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '20px'}}>
                      {budget.type === 'principal' ? '🏦' : '💰'}
                    </span>
                    <span>{budget.name}</span>
                    <span style={{fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px'}}>
                      {budget.type === 'principal' ? 'PRINCIPAL' : 'SECONDAIRE'}
                    </span>
                  </div>
                </div>
                <div style={{padding: '15px', background: 'white'}}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '15px',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Montant initial</div>
                      <div style={{fontWeight: 'bold'}}>{budget.amount.toLocaleString()} F CFA</div>
                    </div>
                    <div>
                      <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Dépensé</div>
                      <div style={{fontWeight: 'bold', color: '#dc2626'}}>{budget.spent.toLocaleString()} F CFA</div>
                    </div>
                    <div>
                      <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>Restant</div>
                      <div style={{fontWeight: 'bold', color: '#16a34a'}}>{budget.remaining.toLocaleString()} F CFA</div>
                    </div>
                  </div>
                  {budget.description && (
                    <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                      <strong>Description:</strong> {budget.description}
                    </div>
                  )}
                  {budget.source && (
                    <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                      <strong>Source:</strong> {budget.source}
                    </div>
                  )}
                  <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                    <strong>Période:</strong> {budget.period}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pied de page */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
            borderTop: '1px solid #ddd',
            paddingTop: '20px'
          }}>
            <div>Rapport généré par Eddo Budget Manager</div>
            <div>Page 1 sur 1</div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center'}}>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            🖨️ Imprimer
          </Button>
          <Button onClick={onClose} variant="outline">
            ❌ Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}
