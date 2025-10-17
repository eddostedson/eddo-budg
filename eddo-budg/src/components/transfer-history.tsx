'use client'

import { useBudgets } from '@/contexts/budget-context'
import { useTransfers } from '@/contexts/transfer-context'
import { CFAAmount } from '@/components/ui/cfa-logo'
import { Button } from '@/components/ui/button'

interface TransferHistoryProps {
  budgetId?: string // Si fourni, affiche uniquement les transferts de ce budget
}

export function TransferHistory({ budgetId }: TransferHistoryProps) {
  const { budgets, updateBudget } = useBudgets()
  const { transfers, updateTransferStatus, getTransfersByBudget, getPendingTransfers, getDebtSummary } = useTransfers()

  const displayTransfers = budgetId
    ? getTransfersByBudget(budgetId)
    : transfers

  const handleRefund = async (transferId: string, transfer: { fromBudgetId: string, toBudgetId: string, amount: number }) => {
    // Marquer le transfert comme remboursé
    await updateTransferStatus(transferId, 'refunded')

    // Inverser le transfert dans les budgets
    const fromBudget = budgets.find(b => b.id === transfer.fromBudgetId)
    const toBudget = budgets.find(b => b.id === transfer.toBudgetId)

    if (fromBudget && toBudget) {
      // Rendre l'argent au budget source
      await updateBudget(transfer.fromBudgetId, {
        spent: fromBudget.spent - transfer.amount,
        remaining: fromBudget.remaining + transfer.amount
      })

      // Retirer l'argent du budget destination
      await updateBudget(transfer.toBudgetId, {
        amount: toBudget.amount - transfer.amount,
        remaining: toBudget.remaining - transfer.amount
      })
    }

    alert('✅ Remboursement effectué avec succès')
  }

  // Afficher le résumé des dettes si on est sur un budget spécifique
  const debtSummary = budgetId ? getDebtSummary(budgetId) : null
  const pendingTransfers = budgetId ? getPendingTransfers(budgetId) : null

  return (
    <div className="space-y-6">
      {/* Résumé des dettes */}
      {debtSummary && budgetId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 mb-1">💸 Emprunté (à rembourser)</div>
            <div className="text-2xl font-bold text-red-700">
              <CFAAmount amount={debtSummary.totalBorrowed} />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">💰 Prêté (à recevoir)</div>
            <div className="text-2xl font-bold text-green-700">
              <CFAAmount amount={debtSummary.totalLent} />
            </div>
          </div>
          <div className={`border rounded-lg p-4 ${
            debtSummary.netDebt > 0
              ? 'bg-red-50 border-red-200'
              : debtSummary.netDebt < 0
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-sm text-gray-600 mb-1">📊 Solde net</div>
            <div className={`text-2xl font-bold ${
              debtSummary.netDebt > 0
                ? 'text-red-700'
                : debtSummary.netDebt < 0
                  ? 'text-green-700'
                  : 'text-gray-700'
            }`}>
              {debtSummary.netDebt > 0 ? '+' : ''}<CFAAmount amount={Math.abs(debtSummary.netDebt)} />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {debtSummary.netDebt > 0
                ? 'Vous devez rembourser'
                : debtSummary.netDebt < 0
                  ? 'On vous doit'
                  : 'Aucune dette'}
            </div>
          </div>
        </div>
      )}

      {/* Transferts en attente de remboursement */}
      {pendingTransfers && (pendingTransfers.borrowed.length > 0 || pendingTransfers.lent.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">🔄 En attente de remboursement</h3>
          
          {pendingTransfers.borrowed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">💸 Vous avez emprunté :</h4>
              <div className="space-y-2">
                {pendingTransfers.borrowed.map(transfer => {
                  const fromBudget = budgets.find(b => b.id === transfer.fromBudgetId)
                  return (
                    <div key={transfer.id} className="flex items-center justify-between bg-white rounded p-2">
                      <div>
                        <div className="text-sm text-gray-900">
                          <CFAAmount amount={transfer.amount} /> de <strong>{fromBudget?.name}</strong>
                        </div>
                        <div className="text-xs text-gray-500">{transfer.date} - {transfer.description}</div>
                      </div>
                      <Button
                        onClick={() => handleRefund(transfer.id, transfer)}
                        className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                      >
                        ✅ Rembourser
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pendingTransfers.lent.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-700 mb-2">💰 Vous avez prêté :</h4>
              <div className="space-y-2">
                {pendingTransfers.lent.map(transfer => {
                  const toBudget = budgets.find(b => b.id === transfer.toBudgetId)
                  return (
                    <div key={transfer.id} className="flex items-center justify-between bg-white rounded p-2">
                      <div>
                        <div className="text-sm text-gray-900">
                          <CFAAmount amount={transfer.amount} /> à <strong>{toBudget?.name}</strong>
                        </div>
                        <div className="text-xs text-gray-500">{transfer.date} - {transfer.description}</div>
                      </div>
                      <Button
                        onClick={() => handleRefund(transfer.id, transfer)}
                        className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600"
                      >
                        ↩️ Marquer comme remboursé
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique complet */}
      {displayTransfers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">📜 Historique des transferts</h3>
          <div className="space-y-2">
            {displayTransfers.map(transfer => {
              const fromBudget = budgets.find(b => b.id === transfer.fromBudgetId)
              const toBudget = budgets.find(b => b.id === transfer.toBudgetId)
              
              return (
                <div
                  key={transfer.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    transfer.status === 'pending'
                      ? 'bg-yellow-50 border-yellow-200'
                      : transfer.status === 'refunded'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {transfer.status === 'pending' ? '🔄' : transfer.status === 'refunded' ? '✅' : '💸'}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {fromBudget?.name} → {toBudget?.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {transfer.date} - {transfer.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {transfer.status === 'pending' && '⏳ En attente de remboursement'}
                      {transfer.status === 'refunded' && '✅ Remboursé'}
                      {transfer.status === 'completed' && '✅ Transfert définitif'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      <CFAAmount amount={transfer.amount} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {displayTransfers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>Aucun transfert pour le moment</p>
        </div>
      )}
    </div>
  )
}
