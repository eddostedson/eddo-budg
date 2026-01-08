'use client'

import React, { useState, useMemo } from 'react'
import { useReceipts } from '@/contexts/receipt-context'
import { Receipt } from '@/lib/shared-data'
import { ReceiptPreview } from '@/components/receipt-preview'
import { ReceiptFormDialog } from '@/components/receipt-form-dialog'
import { ReceiptBulkFormDialog } from '@/components/receipt-bulk-form-dialog'
import { ReceiptSodeciDialog } from '@/components/receipt-sodeci-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2, 
  Download,
  Calendar,
  Wallet,
  Building2,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReceiptsPage() {
  const { receipts, loading, deleteReceipt } = useReceipts()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  
  // Dialog states
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [receiptToEdit, setReceiptToEdit] = useState<Receipt | null>(null)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showSodeciForm, setShowSodeciForm] = useState(false)

  // Derived state
  const uniquePeriods = useMemo(() => {
    const periods = new Set(receipts.map(r => r.periode))
    return Array.from(periods).sort().reverse()
  }, [receipts])

  const filteredAndSortedReceipts = useMemo(() => {
    let result = [...receipts]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(r => 
        r.nomLocataire.toLowerCase().includes(query) ||
        r.villa.toLowerCase().includes(query) ||
        (r.libelle && r.libelle.toLowerCase().includes(query))
      )
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      result = result.filter(r => r.periode === filterPeriod)
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.dateTransaction).getTime()
      const dateB = new Date(b.dateTransaction).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [receipts, searchQuery, filterPeriod, sortOrder])

  // Stats
  const stats = useMemo(() => {
    const totalAmount = receipts.reduce((sum, r) => sum + r.montant, 0)
    const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
    const thisMonthReceipts = receipts.filter(r => r.periode.toLowerCase().includes(currentMonth.split(' ')[0].toLowerCase())) // Simple check
    
    return {
      totalReceipts: receipts.length,
      totalAmount,
      thisMonthCount: thisMonthReceipts.length,
      averageAmount: receipts.length > 0 ? totalAmount / receipts.length : 0
    }
  }, [receipts])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleDelete = async (receipt: Receipt) => {
    if (confirm(`Voulez-vous vraiment supprimer le reçu de ${receipt.nomLocataire} ?`)) {
      await deleteReceipt(receipt.id)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Chargement de vos reçus...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reçus & Paiements</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Gérez l'ensemble des preuves de paiement et factures de vos locataires.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowSodeciForm(true)}
            className="h-10 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
          >
            <Wallet className="mr-2 h-4 w-4" />
            SODECI & CIE
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkForm(true)}
            className="h-10 bg-white hover:bg-slate-50 transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            Génération groupée
          </Button>
          <Button 
            onClick={() => {
              setReceiptToEdit(null)
              setShowForm(true)
            }}
            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau reçu
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Reçus</CardTitle>
            <FileText className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReceipts}</div>
            <p className="text-xs text-blue-100 mt-1">documents générés à ce jour</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Volume Total</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-slate-500 mt-1">cumulé sur tous les reçus</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ce mois-ci</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.thisMonthCount}</div>
            <p className="text-xs text-slate-500 mt-1">reçus émis sur la période en cours</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Moyenne</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.averageAmount)}</div>
            <p className="text-xs text-slate-500 mt-1">valeur moyenne par reçu</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher (nom, villa, libellé)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  {uniquePeriods.map((period) => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="rounded-lg"
              title="Vue liste"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-lg"
              title="Vue grille"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content View */}
        <AnimatePresence mode="wait">
          {filteredAndSortedReceipts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200"
            >
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Aucun résultat trouvé</h3>
              <p className="text-slate-500 mt-2 max-w-sm text-center">
                Aucun reçu ne correspond à votre recherche. Essayez de modifier vos filtres ou créez un nouveau reçu.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setSearchQuery('')
                  setFilterPeriod('all')
                }}
              >
                Réinitialiser les filtres
              </Button>
            </motion.div>
          ) : viewMode === 'table' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Villa / Appartement</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReceipts.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => {
                      setSelectedReceipt(receipt)
                      setShowPreview(true)
                    }}>
                      <TableCell className="font-medium text-slate-600">
                        {format(new Date(receipt.dateTransaction), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{receipt.nomLocataire}</div>
                        {receipt.libelle && <div className="text-xs text-slate-500 truncate max-w-[200px]">{receipt.libelle}</div>}
                        {typeof receipt.soldeRestant === 'number' && (
                          <div
                            className={`text-[11px] font-semibold ${
                              receipt.soldeRestant > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            Reste à payer : {formatCurrency(receipt.soldeRestant)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 font-normal">
                          {receipt.villa}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{receipt.periode}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(receipt.montant)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedReceipt(receipt)
                              setShowPreview(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" /> Voir le reçu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setReceiptToEdit(receipt)
                              setShowForm(true)
                            }}>
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => handleDelete(receipt)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredAndSortedReceipts.map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-slate-100 group">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold leading-none text-slate-900">
                          {receipt.nomLocataire}
                        </CardTitle>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {receipt.villa}
                        </p>
                      </div>
                      <Badge variant={receipt.montant > 0 ? "default" : "secondary"} className={receipt.montant > 0 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" : ""}>
                        {formatCurrency(receipt.montant)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <span className="text-xs font-medium uppercase text-slate-400">Période</span>
                          <span className="font-medium">{receipt.periode}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-50">
                          <span className="text-xs font-medium uppercase text-slate-400">Date</span>
                          <span>{format(new Date(receipt.dateTransaction), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                        {typeof receipt.soldeRestant === 'number' && (
                          <div className="flex items-center justify-between py-1 text-sm">
                            <span className="text-xs font-medium uppercase text-slate-400">Reste dû</span>
                            <span
                              className={`font-semibold ${
                                receipt.soldeRestant > 0 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {formatCurrency(receipt.soldeRestant)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-2 pt-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 text-slate-600 bg-slate-50 hover:bg-slate-100"
                          onClick={() => {
                            setSelectedReceipt(receipt)
                            setShowPreview(true)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                          onClick={() => {
                            setReceiptToEdit(receipt)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50"
                          onClick={() => handleDelete(receipt)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      {showPreview && selectedReceipt && (
        <ReceiptPreview
          receipt={selectedReceipt}
          onClose={() => {
            setShowPreview(false)
            setSelectedReceipt(null)
          }}
        />
      )}

      {showForm && (
        <ReceiptFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setReceiptToEdit(null)
          }}
          receiptToEdit={receiptToEdit}
        />
      )}

      {showBulkForm && (
        <ReceiptBulkFormDialog
          open={showBulkForm}
          onOpenChange={setShowBulkForm}
        />
      )}

      {showSodeciForm && (
        <ReceiptSodeciDialog
          open={showSodeciForm}
          onOpenChange={setShowSodeciForm}
        />
      )}
    </div>
  )
}