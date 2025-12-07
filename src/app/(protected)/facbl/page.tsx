'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FacblDocument, FacblDocumentLigne, FacblDocumentType, FacblService } from '@/lib/supabase/facbl-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProformaForm, ProformaFormValues } from '@/components/facbl/proforma-form'
import { ProformaPreview } from '@/components/facbl/proforma-preview'
import { useUltraModernToastContext } from '@/contexts/ultra-modern-toast-context'
import * as XLSX from 'xlsx'
import { HighlightText } from '@/lib/highlight-utils'
import { cn } from '@/lib/utils'
import {
  ArrowLeftIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  PrinterIcon,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'

type FilterType = 'tous' | FacblDocumentType

export default function FacblDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<FacblDocument[]>([])
  const [filterType, setFilterType] = useState<FilterType>('tous')
  const [searchTerm, setSearchTerm] = useState('')
  const [showProformaForm, setShowProformaForm] = useState(false)
  const [currentProformaNumber, setCurrentProformaNumber] = useState<string | null>(null)
  const [editingDocument, setEditingDocument] = useState<FacblDocument | null>(null)
  const [initialProformaValues, setInitialProformaValues] = useState<ProformaFormValues | null>(null)
  const [previewDocument, setPreviewDocument] = useState<FacblDocument | null>(null)
  const [previewLignes, setPreviewLignes] = useState<FacblDocumentLigne[]>([])
  const { showSuccess, showError, showInfo } = useUltraModernToastContext()
  const [objetSearch, setObjetSearch] = useState('')
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchPrintDocs, setBatchPrintDocs] = useState<
    { doc: FacblDocument; lignes: FacblDocumentLigne[] }[]
  >([])
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false)
  const [batchPrinting, setBatchPrinting] = useState(false)

  // Map proformaId -> facture définitive liée
  const proformaFactures = useMemo(() => {
    const map = new Map<string, FacblDocument>()
    documents.forEach((doc) => {
      if (doc.typeDocument === 'facture_definitive' && doc.parentId) {
        map.set(doc.parentId, doc)
      }
    })
    return map
  }, [documents])

  // Ensemble des factures qui ont déjà un BL
  const facturesAvecBL = useMemo(() => {
    const set = new Set<string>()
    documents.forEach((doc) => {
      if (doc.typeDocument === 'bon_livraison' && doc.parentId) {
        set.add(doc.parentId)
      }
    })
    return set
  }, [documents])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await FacblService.searchDocuments({
        type: filterType === 'tous' ? undefined : filterType,
        term: searchTerm || undefined
      })
      setDocuments(docs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // On charge les documents à chaque changement de filtre ou recherche
    void loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType])

  const objetSuggestions = useMemo(() => {
    const values = new Set<string>()
    documents.forEach((d) => {
      const objet = ((d.meta as any)?.objet as string | undefined)?.trim()
      if (!objet) return
      const match = objet.match(/^(\S+)\s*-\s*(.+)$/)
      if (match) {
        const code = match[1]
        const label = match[2]
        values.add(`${code} - ${label}`)
        values.add(`${label} (${code})`)
      } else {
        values.add(objet)
      }
    })
    return Array.from(values)
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const objetTerm = objetSearch.trim().toLowerCase()

    const typeRank: Record<FacblDocumentType, number> = {
      proforma: 0,
      facture_definitive: 1,
      bon_livraison: 2,
      fiche_travaux: 3
    }

    const filtered = documents.filter((d) => {
      const generalMatch =
        !term ||
        d.numero.toLowerCase().includes(term) ||
        (d.meta && JSON.stringify(d.meta).toLowerCase().includes(term))

      const rawObjet = ((d.meta as any)?.objet as string | undefined)?.toLowerCase() ?? ''
      const [codePart, labelPart = ''] = rawObjet.split('-').map((s) => s.trim())
      const objetMatch =
        !objetTerm ||
        rawObjet.includes(objetTerm) ||
        codePart.includes(objetTerm) ||
        labelPart.includes(objetTerm)

      return generalMatch && objetMatch
    })

    const parseNumero = (doc: FacblDocument) => {
      const match = doc.numero.match(/(\d{2})-(\d{2})-(\d{4})-(\d{3})$/)
      let dateKey: string
      if (match) {
        dateKey = `${match[3]}${match[2]}${match[1]}`
      } else if (doc.dateDocument) {
        const d = new Date(doc.dateDocument)
        dateKey = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
          .getDate()
          .toString()
          .padStart(2, '0')}`
      } else {
        dateKey = '00000000'
      }
      const suffix = match ? parseInt(match[4], 10) || 0 : 0
      return { dateKey, suffix }
    }

    return filtered.sort((a, b) => {
      const pa = parseNumero(a)
      const pb = parseNumero(b)

      // D'abord par date (plus ancienne en haut)
      if (pa.dateKey !== pb.dateKey) {
        return pa.dateKey.localeCompare(pb.dateKey)
      }

      // Ensuite par suffixe de numéro (004 avant 005, 006, etc.)
      if (pa.suffix !== pb.suffix) {
        return pa.suffix - pb.suffix
      }

      // Enfin, ordre logique à l'intérieur du groupe : Proforma, Définitive, BL, Fiche
      return typeRank[a.typeDocument] - typeRank[b.typeDocument]
    })
  }, [documents, searchTerm, objetSearch])

  const handleSubmitProforma = async (values: ProformaFormValues) => {
    const numero = values.numero.trim() || currentProformaNumber
    if (!numero) {
      console.error('❌ Numéro de proforma manquant')
      return
    }

    const montantHT = values.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0)
    const tva = montantHT * (values.tvaRate / 100)
    const montantTTC = montantHT + tva

    // Créer / récupérer le client pour les futures proformas
    const client =
      values.clientName.trim().length > 0
        ? await FacblService.createOrGetClientByName(values.clientName)
        : null

    if (editingDocument) {
      // Mise à jour d'une proforma existante
      await FacblService.updateDocument(editingDocument.id, {
        dateDocument: values.dateDocument,
        montantHT,
        montantTTC,
        tvaRate: values.tvaRate,
        remise: 0,
        // On n'autorise le changement de numéro que tant que la proforma est en brouillon
        numero: editingDocument.statut === 'brouillon' ? numero : undefined,
        meta: {
          client_name: values.clientName,
          objet: values.objet
        }
      })

      await FacblService.upsertDocumentLignes(
        editingDocument.id,
        values.lignes.map((l, index) => ({
          catalogueLigneId: null,
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          typeLigne: l.typeLigne,
          tvaRate: values.tvaRate,
          ordre: index
        }))
      )

      // Si la proforma est déjà validée, mettre aussi à jour la facture définitive et le BL liés
      if (editingDocument.statut === 'validee') {
        await FacblService.ensureFactureFromProforma(editingDocument.id)
        await FacblService.ensureBonLivraisonFromProforma(editingDocument.id)
      }

      showInfo(
        '✨ Proforma mise à jour',
        `La proforma ${numero} a été mise à jour et synchronisée avec ses documents liés.`
      )
    } else {
      // Création d'une nouvelle proforma
      const document = await FacblService.createDocument({
        typeDocument: 'proforma',
        numero,
        clientId: client?.id,
        entrepriseId: undefined,
        dateDocument: values.dateDocument,
        montantHT,
        montantTTC,
        tvaRate: values.tvaRate,
        remise: 0,
        statut: 'brouillon',
        meta: {
          client_name: values.clientName,
          objet: values.objet
        }
      })

      if (!document) return

      await FacblService.upsertDocumentLignes(
        document.id,
        values.lignes.map((l, index) => ({
          catalogueLigneId: null,
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          typeLigne: l.typeLigne,
          tvaRate: values.tvaRate,
          ordre: index
        }))
      )

      showSuccess(
        '🎉 Proforma créée',
        `La proforma ${numero} a été créée avec succès.`
      )
    }

    setShowProformaForm(false)
    setCurrentProformaNumber(null)
    setEditingDocument(null)
    setInitialProformaValues(null)
    await loadDocuments()
  }

  const openNewProformaForm = async () => {
    // Numéro de proforma par défaut basé sur la dernière proforma existante
    const todayISO = new Date().toISOString().slice(0, 10)
    let numero = await FacblService.generateProformaNumero(todayISO)

    if (!numero) {
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const dateKey = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
      numero = `FAC-PF-${dateKey}-001`
    }

    setCurrentProformaNumber(numero)
    setShowProformaForm(true)
    setEditingDocument(null)
    setInitialProformaValues(null)
  }

  const handleEditProforma = async (doc: FacblDocument) => {
    if (doc.typeDocument !== 'proforma') return
    const lignes = await FacblService.getDocumentLignes(doc.id)

    const initial: ProformaFormValues = {
      numero: doc.numero,
      clientName: ((doc.meta as any)?.client_name as string) ?? '',
      objet: ((doc.meta as any)?.objet as string) ?? '',
      dateDocument: doc.dateDocument,
      tvaRate: doc.tvaRate,
      lignes: lignes.map((l) => ({
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        typeLigne: l.typeLigne
      }))
    }

    setEditingDocument(doc)
    setInitialProformaValues(initial)
    setCurrentProformaNumber(doc.numero)
    setShowProformaForm(true)
  }

  const handleDeleteProforma = async (doc: FacblDocument) => {
    const ok = window.confirm('Supprimer définitivement cette proforma ?')
    if (!ok) return
    await FacblService.deleteDocument(doc.id)
    await loadDocuments()

    showError(
      '🗑️ Proforma supprimée',
      `La proforma ${doc.numero} a été supprimée définitivement.`
    )
  }

  const handleValidateProforma = async (doc: FacblDocument) => {
    if (doc.typeDocument !== 'proforma') return

    setValidatingId(doc.id)
    try {
      // 1. Mettre à jour le statut de la proforma
      await FacblService.updateDocument(doc.id, {
        statut: 'validee'
      })

      // 2. Créer ou mettre à jour la facture définitive associée
      await FacblService.ensureFactureFromProforma(doc.id)

      // 3. Créer ou mettre à jour le BL associé
      await FacblService.ensureBonLivraisonFromProforma(doc.id)

      await loadDocuments()

      showSuccess(
        '✅ Proforma validée',
        `La proforma ${doc.numero} a été validée. Facture définitive et BL sont générés / mis à jour.`
      )
    } catch (error) {
      console.error('❌ Erreur lors de la validation de la proforma:', error)
      showError(
        'Erreur validation',
        `Impossible de valider la proforma ${doc.numero}. Vérifiez votre connexion puis réessayez.`
      )
    } finally {
      setValidatingId(null)
    }
  }

  const handlePreviewProforma = async (doc: FacblDocument) => {
    // Aperçu pour tous les types de documents FACBL (proforma, facture, BL, fiche)
    const lignes = await FacblService.getDocumentLignes(doc.id)
    setPreviewDocument(doc)
    setPreviewLignes(lignes)
  }

  const handleExportExcel = async (doc: FacblDocument) => {
    try {
      const lignes = await FacblService.getDocumentLignes(doc.id)

      const clientName = (doc.meta as any)?.client_name ?? ''
      const objet = (doc.meta as any)?.objet ?? ''

      const rows: (string | number)[][] = []
      rows.push(['Type', typeLabel(doc.typeDocument)])
      rows.push(['Numéro', doc.numero])
      rows.push(['Client', clientName])
      rows.push(['Objet', objet])
      rows.push(['Date', doc.dateDocument])
      rows.push([])

      if (doc.typeDocument === 'bon_livraison') {
        rows.push(['QTE', 'DESIGNATION'])
        lignes.forEach((l) => {
          rows.push([l.quantite, l.designation])
        })
      } else {
        rows.push(['QTE', 'DESIGNATION', 'Prix U.', 'Prix total'])
        lignes.forEach((l) => {
          const total = l.quantite * l.prixUnitaire
          rows.push([l.quantite, l.designation, l.prixUnitaire, total])
        })
        rows.push([])
        rows.push(['TOTAL', '', '', doc.montantTTC])
      }

      const ws = XLSX.utils.aoa_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Document')

      const safeFilename = doc.numero.replace(/\s+/g, '_')
      XLSX.writeFile(wb, `${safeFilename}.xlsx`)

      showSuccess('📊 Export Excel', `Le document ${doc.numero} a été exporté en .xlsx.`)
    } catch (error) {
      console.error('❌ Erreur export Excel FACBL:', error)
      showError(
        'Erreur export',
        `Impossible d'exporter le document ${doc.numero} en Excel (.xlsx).`
      )
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllCurrent = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = filteredDocuments.every((d) => next.has(d.id))
      if (allSelected) {
        filteredDocuments.forEach((d) => next.delete(d.id))
      } else {
        filteredDocuments.forEach((d) => next.add(d.id))
      }
      return next
    })
  }

  const handleBatchPrint = async () => {
    if (selectedIds.size === 0) {
      showInfo('Sélection vide', 'Sélectionnez au moins un document à imprimer.')
      return
    }

    setBatchPrinting(true)
    try {
      const docsToPrint = documents.filter((d) => selectedIds.has(d.id))
      const lignesArrays = await Promise.all(
        docsToPrint.map((d) => FacblService.getDocumentLignes(d.id))
      )
      setBatchPrintDocs(docsToPrint.map((doc, index) => ({ doc, lignes: lignesArrays[index] })))
      setShowBatchPrintModal(true)
    } catch (error) {
      console.error('❌ Erreur préparation impression multiple FACBL:', error)
      showError(
        'Erreur impression',
        'Impossible de préparer les documents pour impression. Réessayez plus tard.'
      )
    } finally {
      setBatchPrinting(false)
    }
  }

  const typeLabel = (type: FacblDocumentType): string => {
    switch (type) {
      case 'proforma':
        return 'Proforma'
      case 'facture_definitive':
        return 'Facture définitive'
      case 'bon_livraison':
        return 'Bon de livraison'
      case 'fiche_travaux':
        return 'Fiche de travaux'
      default:
        return type
    }
  }

  const statutLabel = (statut: FacblDocument['statut']): string => {
    switch (statut) {
      case 'brouillon':
        return 'Brouillon'
      case 'validee':
        return 'Validée'
      case 'annulee':
        return 'Annulée'
      case 'livree':
        return 'Livrée'
      default:
        return statut
    }
  }

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await loadDocuments()
  }

  const handleResetFilters = async () => {
    setSearchTerm('')
    setObjetSearch('')
    setFilterType('tous')
    await loadDocuments()
  }

  const totalMontantTTC = useMemo(
    () =>
      filteredDocuments
        .filter((d) => d.typeDocument === 'proforma')
        .reduce((sum, d) => sum + d.montantTTC, 0),
    [filteredDocuments]
  )

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 md:px-8">
      {(validatingId || batchPrinting) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 animate-pulse" />
        </div>
      )}

      {showBatchPrintModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
          onClick={() => setShowBatchPrintModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Aperçu multi-documents ({batchPrintDocs.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-full border-slate-300"
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Imprimer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBatchPrintModal(false)}
                  className="h-8 px-3 rounded-full border-slate-300"
                >
                  Fermer
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {batchPrintDocs.map(({ doc, lignes }) => {
                const clientName =
                  (doc.meta as any)?.client_name ?? (doc.meta as any)?.client ?? '—'
                const objet = (doc.meta as any)?.objet ?? ''

                return (
                  <div
                    key={doc.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 print:bg-white print:border-0 print:p-0 print:break-after-page"
                  >
                    <ProformaPreview
                      numero={doc.numero}
                      clientName={clientName}
                      objet={objet}
                      dateDocument={doc.dateDocument}
                      tvaRate={doc.tvaRate}
                      lignes={lignes}
                      typeDocument={doc.typeDocument}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/accueil')}
              className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <FileTextIcon className="h-6 w-6 text-slate-700" />
              Module FACBL – Documents & Proformas
            </h2>
          </div>
          <Button
            onClick={openNewProformaForm}
            className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle Proforma
          </Button>
        </div>

        {/* Filtres & résumé */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4 mb-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-4">
              <form
                onSubmit={handleManualSearch}
                className="flex flex-col gap-3 items-stretch"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par numéro, client, texte…"
                      className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="w-full md:w-52">
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                      <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Type de document" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous les documents</SelectItem>
                        <SelectItem value="proforma">Proformas</SelectItem>
                        <SelectItem value="facture_definitive">Factures définitives</SelectItem>
                        <SelectItem value="bon_livraison">Bons de livraison</SelectItem>
                        <SelectItem value="fiche_travaux">Fiches de travaux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="submit"
                      variant="outline"
                      className="rounded-xl border-slate-300 bg-white hover:bg-slate-50"
                    >
                      Filtrer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      onClick={async () => {
                        await handleResetFilters()
                        setSelectedIds(new Set())
                      }}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={selectedIds.size === 0 || batchPrinting}
                      onClick={handleBatchPrint}
                      className="rounded-xl border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {batchPrinting ? 'Préparation…' : 'Imprimer la sélection'}
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <Input
                    value={objetSearch}
                    onChange={(e) => setObjetSearch(e.target.value)}
                    placeholder="Rechercher un code ou un objet (ex: 601990, Autres achats …)"
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
                    list="facbl-objet-suggestions"
                  />
                  <datalist id="facbl-objet-suggestions">
                    {objetSuggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-900">
                Synthèse actuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 text-sm text-emerald-900">
                <div className="flex justify-between">
                  <span>Documents trouvés :</span>
                  <span className="font-semibold">{filteredDocuments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total TTC (liste affichée) :</span>
                  <span className="font-semibold">
                    {totalMontantTTC.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}{' '}
                    F&nbsp;CFA
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des documents */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">
              {filterType === 'proforma'
                ? 'Factures proforma'
                : filterType === 'tous'
                ? 'Tous les documents FACBL'
                : `Documents : ${typeLabel(filterType as FacblDocumentType)}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                    <th className="text-center px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3 accent-emerald-600"
                        checked={
                          filteredDocuments.length > 0 &&
                          filteredDocuments.every((d) => selectedIds.has(d.id))
                        }
                        onChange={toggleSelectAllCurrent}
                      />
                    </th>
                    <th className="text-left px-3 py-2">N°</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Client / Objet</th>
                    <th className="text-right px-3 py-2">Montant TTC</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Statut</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                        Chargement des documents…
                      </td>
                    </tr>
                  ) : filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                        Aucun document trouvé pour les filtres actuels.
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const clientName =
                        (doc.meta as any)?.client_name ?? (doc.meta as any)?.client ?? '—'
                      const objet = (doc.meta as any)?.objet ?? ''
                      const dateLabel = doc.dateDocument
                        ? new Date(doc.dateDocument).toLocaleDateString('fr-FR')
                        : '—'

                      return (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-3 py-2 text-center align-top">
                            <input
                              type="checkbox"
                              className="h-3 w-3 accent-emerald-600"
                              checked={selectedIds.has(doc.id)}
                              onChange={() => toggleSelect(doc.id)}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{doc.numero}</td>
                          <td className="px-3 py-2 text-slate-700">{typeLabel(doc.typeDocument)}</td>
                          <td className="px-3 py-2">
                            <div className="text-slate-800 text-sm">
                              <HighlightText text={clientName} searchTerm={searchTerm} />
                            </div>
                            {objet && (
                              <div className="text-xs text-slate-500 line-clamp-1">
                                <HighlightText text={objet} searchTerm={objetSearch || searchTerm} />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">
                            {doc.montantTTC.toLocaleString('fr-FR', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </td>
                          <td className="px-3 py-2 text-slate-700 text-xs">{dateLabel}</td>
                          <td className="px-3 py-2 text-xs">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                                doc.statut === 'brouillon' && 'bg-slate-100 text-slate-700',
                                doc.statut === 'validee' && 'bg-emerald-100 text-emerald-800',
                                doc.statut === 'annulee' && 'bg-red-100 text-red-700',
                                doc.statut === 'livree' && 'bg-blue-100 text-blue-800'
                              )}
                            >
                              {statutLabel(doc.statut)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-full p-0 border-slate-300 bg-white hover:bg-slate-50"
                                onClick={() => handlePreviewProforma(doc)}
                                title="Aperçu / Imprimer (PDF)"
                              >
                                <PrinterIcon className="h-4 w-4 text-slate-700" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-full p-0 border-slate-300 bg-white hover:bg-slate-50"
                                onClick={() => handleExportExcel(doc)}
                                title="Exporter en Excel (CSV)"
                              >
                                <FileSpreadsheet className="h-4 w-4 text-slate-700" />
                              </Button>
                              {(() => {
                                if (doc.typeDocument !== 'proforma') return null
                                const factureLiee = proformaFactures.get(doc.id)
                                const blExiste =
                                  factureLiee && facturesAvecBL.has(factureLiee.id)

                                const doitAfficherBouton =
                                  doc.statut === 'brouillon' || !blExiste

                                if (!doitAfficherBouton) return null

                                const title =
                                  doc.statut === 'brouillon'
                                    ? 'Valider la proforma (et générer Facture + BL)'
                                    : 'Générer le BL à partir de cette proforma'

                                return (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 w-8 rounded-full p-0 border-emerald-300 bg-white hover:bg-emerald-50 disabled:opacity-60"
                                    onClick={() => handleValidateProforma(doc)}
                                    disabled={validatingId === doc.id}
                                    title={title}
                                  >
                                    {validatingId === doc.id ? (
                                      <Loader2 className="h-4 w-4 text-emerald-700 animate-spin" />
                                    ) : (
                                      '✓'
                                    )}
                                  </Button>
                                )
                              })()}
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-full p-0 border-slate-300 bg-white hover:bg-slate-50"
                                onClick={() => handleEditProforma(doc)}
                                title="Ouvrir / modifier"
                              >
                                <PencilIcon className="h-4 w-4 text-slate-700" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-full p-0 border-red-200 bg-white hover:bg-red-50"
                                onClick={() => handleDeleteProforma(doc)}
                                title="Supprimer"
                              >
                                <Trash2Icon className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de création Proforma */}
        {showProformaForm && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowProformaForm(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-slate-50 p-4 md:p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowProformaForm(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
              <ProformaForm
                onSubmit={handleSubmitProforma}
                proformaNumber={currentProformaNumber ?? undefined}
                initialValues={initialProformaValues ?? undefined}
                mode={editingDocument ? 'edit' : 'create'}
              />
            </div>
          </div>
        )}

        {/* Aperçu / lecture seule de la proforma */}
        {previewDocument && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setPreviewDocument(null)
              setPreviewLignes([])
            }}
          >
            <div
              className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 md:p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setPreviewDocument(null)
                  setPreviewLignes([])
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-xl leading-none"
                aria-label="Fermer l'aperçu"
              >
                ×
              </button>
              <ProformaPreview
                typeDocument={previewDocument.typeDocument}
                numero={previewDocument.numero}
                clientName={
                  (previewDocument.meta as any)?.client_name ??
                  (previewDocument.meta as any)?.client ??
                  ''
                }
                objet={(previewDocument.meta as any)?.objet ?? ''}
                dateDocument={previewDocument.dateDocument}
                tvaRate={previewDocument.tvaRate}
                lignes={previewLignes.map((l) => ({
                  designation: l.designation,
                  quantite: l.quantite,
                  prixUnitaire: l.prixUnitaire
                }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


