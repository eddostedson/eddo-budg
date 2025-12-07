'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FacblLigneType, FacblService } from '@/lib/supabase/facbl-service'
import { montantToWordsFr } from '@/lib/facbl-utils'
import { cn } from '@/lib/utils'

type ProformaLigneInput = {
  id: string
  designation: string
  quantite: string
  prixUnitaire: string
  typeLigne: FacblLigneType
}

export interface ProformaFormValues {
  numero: string
  clientName: string
  objet: string
  dateDocument: string
  tvaRate: number
  lignes: {
    designation: string
    quantite: number
    prixUnitaire: number
    typeLigne: FacblLigneType
  }[]
}

interface ProformaFormProps {
  onSubmit: (values: ProformaFormValues) => Promise<void> | void
  loading?: boolean
  proformaNumber?: string
  initialValues?: ProformaFormValues
  mode?: 'create' | 'edit'
}

const createEmptyLigne = (): ProformaLigneInput => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  designation: '',
  quantite: '',
  prixUnitaire: '',
  typeLigne: 'fourniture'
})

export const ProformaForm: React.FC<ProformaFormProps> = ({
  onSubmit,
  loading,
  proformaNumber,
  initialValues,
  mode = 'create'
}) => {
  const today = new Date().toISOString().slice(0, 10)

  const [numero, setNumero] = useState(proformaNumber ?? '')
  const [clientName, setClientName] = useState('')
  const [objet, setObjet] = useState('')
  const [dateDocument, setDateDocument] = useState(today)
  const [tvaRate, setTvaRate] = useState('0')
  const [lignes, setLignes] = useState<ProformaLigneInput[]>([createEmptyLigne()])
  const [submitting, setSubmitting] = useState(false)

  const [clientSuggestions, setClientSuggestions] = useState<string[]>([])
  const [objetSuggestions, setObjetSuggestions] = useState<string[]>([])
  const [designationSuggestions, setDesignationSuggestions] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const [clients, catalogue, proformas] = await Promise.all([
          FacblService.getClients(),
          FacblService.getCatalogueLignes(),
          FacblService.searchDocuments({ type: 'proforma' })
        ])

        setClientSuggestions(Array.from(new Set(clients.map((c) => c.nom).filter(Boolean))))

        setDesignationSuggestions(
          Array.from(new Set(catalogue.map((l) => l.designation).filter(Boolean)))
        )

        const objets = proformas
          .map((d) => (d.meta as any)?.objet as string | undefined)
          .filter((o) => o && o.trim().length > 0) as string[]
        setObjetSuggestions(Array.from(new Set(objets)))
      } catch (error) {
        console.error('❌ Erreur chargement suggestions FACBL:', error)
      }
    })()
  }, [])

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (!initialValues) return
    setNumero(initialValues.numero)
    setClientName(initialValues.clientName)
    setObjet(initialValues.objet)
    setDateDocument(initialValues.dateDocument)
    setTvaRate(String(initialValues.tvaRate))
    setLignes(
      initialValues.lignes.map((l) => ({
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        designation: l.designation,
        quantite: String(l.quantite),
        prixUnitaire: String(l.prixUnitaire),
        typeLigne: l.typeLigne
      }))
    )
  }, [initialValues])

  const totals = useMemo(() => {
    const montantHT = lignes.reduce((sum, l) => {
      const qte = parseFloat(l.quantite.replace(',', '.')) || 0
      const pu = parseFloat(l.prixUnitaire.replace(',', '.')) || 0
      return sum + qte * pu
    }, 0)
    const tva = montantHT * ((parseFloat(tvaRate.replace(',', '.')) || 0) / 100)
    const montantTTC = montantHT + tva
    return { montantHT, tva, montantTTC }
  }, [lignes, tvaRate])

  const handleChangeLigne = (id: string, field: keyof ProformaLigneInput, value: string) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const handleAddLigne = () => {
    setLignes((prev) => [...prev, createEmptyLigne()])
  }

  const handleRemoveLigne = (id: string) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    window.print()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numero.trim()) return
    if (!clientName.trim()) return
    if (lignes.every((l) => !l.designation.trim())) return

    const cleanLignes = lignes
      .filter((l) => l.designation.trim())
      .map((l) => ({
        designation: l.designation.trim(),
        quantite: parseFloat(l.quantite.replace(',', '.')) || 0,
        prixUnitaire: parseFloat(l.prixUnitaire.replace(',', '.')) || 0,
        typeLigne: l.typeLigne
      }))

    setSubmitting(true)
    try {
      await onSubmit({
        numero: numero.trim(),
        clientName: clientName.trim(),
        objet: objet.trim(),
        dateDocument,
        tvaRate: parseFloat(tvaRate.replace(',', '.')) || 0,
        lignes: cleanLignes
      })
    } finally {
      setSubmitting(false)
    }
  }

  const printableLignes = useMemo(
    () =>
      lignes
        .filter((l) => l.designation.trim())
        .map((l) => {
          const quantite = parseFloat(l.quantite.replace(',', '.')) || 0
          const prixUnitaire = parseFloat(l.prixUnitaire.replace(',', '.')) || 0
          const total = quantite * prixUnitaire
          return {
            designation: l.designation.trim(),
            quantite,
            prixUnitaire,
            total
          }
        }),
    [lignes]
  )

  const formattedDate = useMemo(
    () =>
      dateDocument
        ? new Date(dateDocument).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR'),
    [dateDocument]
  )

  return (
    <>
      {/* Version édition (écran) */}
      <Card className="border-slate-300 shadow-lg max-w-5xl mx-auto print:hidden">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="text-center text-lg font-semibold tracking-wide">
          FACTURE PROFORMA
        </CardTitle>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Numéro de proforma
            </label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="FAC-PF-07-12-2025-004"
              className="h-9 rounded-md font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              className="h-9 rounded-md"
              list="facbl-clients"
            />
            <datalist id="facbl-clients">
              {clientSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <Input
                type="date"
                value={dateDocument}
                onChange={(e) => setDateDocument(e.target.value)}
                className="h-9 rounded-md"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-500 mb-1">TVA %</label>
              <Input
                value={tvaRate}
                onChange={(e) => setTvaRate(e.target.value)}
                className="h-9 rounded-md text-right"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Objet</label>
            <Input
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="601990 – Autres achats de fournitures"
              className="h-9 rounded-md text-sm"
              list="facbl-objets"
            />
            <datalist id="facbl-objets">
              {objetSuggestions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border border-slate-300 rounded-md overflow-hidden">
            <div className="grid grid-cols-[60px,1fr,120px,140px,40px] bg-slate-100 text-xs font-semibold text-slate-700">
              <div className="px-2 py-2 text-center border-r border-slate-300">QTE</div>
              <div className="px-2 py-2 border-r border-slate-300">DESIGNATION</div>
              <div className="px-2 py-2 text-right border-r border-slate-300">Prix U.</div>
              <div className="px-2 py-2 text-right border-r border-slate-300">Prix total</div>
              <div className="px-2 py-2 text-center">-</div>
            </div>

            {lignes.map((ligne, index) => {
              const qte = parseFloat(ligne.quantite.replace(',', '.')) || 0
              const pu = parseFloat(ligne.prixUnitaire.replace(',', '.')) || 0
              const total = qte * pu

              return (
                <div
                  key={ligne.id}
                  className={cn(
                    'grid grid-cols-[60px,1fr,120px,140px,40px] border-t border-slate-200 text-xs',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  )}
                >
                  <div className="border-r border-slate-200 px-1.5 py-1.5">
                    <Input
                      value={ligne.quantite}
                      onChange={(e) => handleChangeLigne(ligne.id, 'quantite', e.target.value)}
                      className="h-7 text-xs text-right rounded-sm"
                    />
                  </div>
                  <div className="border-r border-slate-200 px-1.5 py-1.5">
                    <Input
                      value={ligne.designation}
                      onChange={(e) => handleChangeLigne(ligne.id, 'designation', e.target.value)}
                      className="h-7 text-xs rounded-sm"
                      placeholder="Désignation de la fourniture / service"
                      list="facbl-designations"
                    />
                  </div>
                  <div className="border-r border-slate-200 px-1.5 py-1.5">
                    <Input
                      value={ligne.prixUnitaire}
                      onChange={(e) => handleChangeLigne(ligne.id, 'prixUnitaire', e.target.value)}
                      className="h-7 text-xs text-right rounded-sm"
                    />
                  </div>
                  <div className="border-r border-slate-200 px-1.5 py-1.5 flex items-center justify-end font-semibold text-[11px] tabular-nums">
                    {total ? total.toLocaleString('fr-FR') : ''}
                  </div>
                  <div className="px-1.5 py-1.5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLigne(ligne.id)}
                      className="text-slate-400 hover:text-red-500 text-xs"
                      aria-label="Supprimer la ligne"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLigne}
              className="rounded-md border-slate-300"
            >
              Ajouter une ligne
            </Button>

            <div className="space-y-1 text-right">
              <div>
                <span className="font-medium mr-2">Total HT :</span>
                <span className="tabular-nums">
                  {totals.montantHT ? totals.montantHT.toLocaleString('fr-FR') : '0'}
                </span>
              </div>
              <div>
                <span className="font-medium mr-2">TVA :</span>
                <span className="tabular-nums">
                  {totals.tva ? totals.tva.toLocaleString('fr-FR') : '0'}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-semibold mr-2">TOTAL TTC :</span>
                <span className="tabular-nums">
                  {totals.montantTTC ? totals.montantTTC.toLocaleString('fr-FR') : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Datalist partagée pour les désignations */}
          <datalist id="facbl-designations">
            {designationSuggestions.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="rounded-md border-slate-300"
            >
              Imprimer
            </Button>

            <Button
              type="submit"
              disabled={submitting || loading}
              className="rounded-md px-6"
            >
              {submitting || loading
                ? 'Enregistrement…'
                : mode === 'edit'
                ? 'Mettre à jour la proforma'
                : 'Enregistrer la proforma'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

      {/* Version impression (mise en page proche du modèle fourni) */}
      <div className="hidden print:block bg-white text-black p-8 facbl-print-area">
        <div className="max-w-[190mm] mx-auto text-xs leading-relaxed">
          <div className="text-right mb-6 text-sm">
            <span className="font-semibold mr-1">Bouaké le</span>
            <span>{formattedDate}</span>
          </div>

          <div className="mb-1 text-sm">
            <span className="font-semibold underline mr-1">Client :</span>
            <span>{clientName || '____________________'}</span>
          </div>

          <div className="mb-1 text-sm font-semibold">
            <span>FACTURE PROFORMA</span>
            {proformaNumber ? <span className="ml-1">N° {proformaNumber}</span> : null}
          </div>

          <div className="mb-4 text-sm">
            <span className="font-semibold underline mr-1">Objet :</span>
            <span>{objet || '____________________'}</span>
          </div>

          {/* Tableau principal */}
          <table className="w-full border-collapse border border-black text-xs mb-4">
            <thead>
              <tr className="text-center font-semibold">
                <th className="border border-black px-2 py-1 w-14">QTE</th>
                <th className="border border-black px-2 py-1">DESIGNATION</th>
                <th className="border border-black px-2 py-1 w-20">Prix U.</th>
                <th className="border border-black px-2 py-1 w-24">Prix total</th>
              </tr>
            </thead>
            <tbody>
              {printableLignes.length === 0 ? (
                <tr>
                  <td className="border border-black px-2 py-6 text-center" colSpan={4}>
                    (Aucune ligne renseignée)
                  </td>
                </tr>
              ) : (
                printableLignes.map((l, index) => (
                  <tr key={`${l.designation}-${index}`}>
                    <td className="border border-black px-2 py-1 text-right tabular-nums">
                      {l.quantite || ''}
                    </td>
                    <td className="border border-black px-2 py-1">{l.designation}</td>
                    <td className="border border-black px-2 py-1 text-right tabular-nums">
                      {l.prixUnitaire ? l.prixUnitaire.toLocaleString('fr-FR') : ''}
                    </td>
                    <td className="border border-black px-2 py-1 text-right tabular-nums">
                      {l.total ? l.total.toLocaleString('fr-FR') : ''}
                    </td>
                  </tr>
                ))
              )}
              {/* Ligne total */}
              <tr className="font-semibold">
                <td className="border border-black px-2 py-1 text-center" colSpan={3}>
                  TOTAL
                </td>
                <td className="border border-black px-2 py-1 text-right tabular-nums">
                  {totals.montantHT ? totals.montantHT.toLocaleString('fr-FR') : '0'}
                </td>
              </tr>
            </tbody>
          </table>

          <NumberToWordsLine montant={totals.montantTTC} />

          <div className="mt-12 text-sm text-right pr-8">
            Le Gérant
          </div>
        </div>
      </div>
    </>
  )
}

interface NumberToWordsLineProps {
  montant: number
}

const NumberToWordsLine: React.FC<NumberToWordsLineProps> = ({ montant }) => {
  const rawText = montant > 0 ? montantToWordsFr(montant) : '__________________'
  const text =
    rawText === '__________________'
      ? rawText
      : rawText.charAt(0).toUpperCase() + rawText.slice(1)
  return (
    <div className="mt-6 text-sm">
      <span className="underline">Arrêté la présente facture à la somme de :</span>{' '}
      <span className="font-semibold">{text} Francs CFA</span>
    </div>
  )
}




