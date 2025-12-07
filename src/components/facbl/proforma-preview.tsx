import React, { useMemo } from 'react'
import { montantToWordsFr } from '@/lib/facbl-utils'
import type { FacblDocumentType } from '@/lib/supabase/facbl-service'

type PreviewLigne = {
  designation: string
  quantite: number
  prixUnitaire: number
}

interface ProformaPreviewProps {
  typeDocument: FacblDocumentType
  numero: string
  clientName: string
  objet: string
  dateDocument: string
  tvaRate: number
  lignes: PreviewLigne[]
}

export const ProformaPreview: React.FC<ProformaPreviewProps> = ({
  typeDocument,
  numero,
  clientName,
  objet,
  dateDocument,
  tvaRate,
  lignes
}) => {
  const { montantHT, montantTTC } = useMemo(() => {
    const ht = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0)
    const tva = ht * (tvaRate / 100)
    return {
      montantHT: ht,
      montantTTC: ht + tva
    }
  }, [lignes, tvaRate])

  const formattedDate = useMemo(
    () =>
      dateDocument
        ? new Date(dateDocument).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR'),
    [dateDocument]
  )

  const rawMontantEnLettres = montantToWordsFr(Math.round(montantTTC))
  const montantEnLettres =
    rawMontantEnLettres && rawMontantEnLettres !== '__________________'
      ? rawMontantEnLettres.charAt(0).toUpperCase() + rawMontantEnLettres.slice(1)
      : rawMontantEnLettres

  const titre = useMemo(() => {
    switch (typeDocument) {
      case 'facture_definitive':
        return 'FACTURE DEFINITIVE'
      case 'bon_livraison':
        return 'BON DE LIVRAISON'
      case 'fiche_travaux':
        return 'FICHE DE TRAVAUX'
      case 'proforma':
      default:
        return 'FACTURE PROFORMA'
    }
  }, [typeDocument])

  return (
    <div className="bg-white text-black p-8">
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
          <span>{titre}</span>
          {numero ? <span className="ml-1">N° {numero}</span> : null}
        </div>

        <div className="mb-4 text-sm">
          <span className="font-semibold underline mr-1">Objet :</span>
          <span>{objet || '____________________'}</span>
        </div>

        <table className="w-full border-collapse border border-black text-xs mb-4">
          <thead>
            <tr className="text-center font-semibold">
              <th className="border border-black px-2 py-1 w-14">QTE</th>
              <th className="border border-black px-2 py-1">DESIGNATION</th>
              {typeDocument !== 'bon_livraison' && (
                <>
                  <th className="border border-black px-2 py-1 w-20">Prix U.</th>
                  <th className="border border-black px-2 py-1 w-24">Prix total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td
                  className="border border-black px-2 py-6 text-center"
                  colSpan={typeDocument === 'bon_livraison' ? 2 : 4}
                >
                  (Aucune ligne renseignée)
                </td>
              </tr>
            ) : (
              lignes.map((l, index) => {
                const total = l.quantite * l.prixUnitaire
                return (
                  <tr key={`${l.designation}-${index}`}>
                    <td className="border border-black px-2 py-1 text-right tabular-nums">
                      {l.quantite || ''}
                    </td>
                    <td className="border border-black px-2 py-1">{l.designation}</td>
                    {typeDocument !== 'bon_livraison' && (
                      <>
                        <td className="border border-black px-2 py-1 text-right tabular-nums">
                          {l.prixUnitaire ? l.prixUnitaire.toLocaleString('fr-FR') : ''}
                        </td>
                        <td className="border border-black px-2 py-1 text-right tabular-nums">
                          {total ? total.toLocaleString('fr-FR') : ''}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })
            )}
            {typeDocument !== 'bon_livraison' && (
              <tr className="font-semibold">
                <td className="border border-black px-2 py-1 text-center" colSpan={3}>
                  TOTAL
                </td>
                <td className="border border-black px-2 py-1 text-right tabular-nums">
                  {montantHT ? montantHT.toLocaleString('fr-FR') : '0'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {typeDocument === 'bon_livraison' ? (
          <div className="mt-12 flex justify-between text-sm px-8">
            <span className="font-semibold underline">Le Client</span>
            <span className="font-semibold underline">Le Gérant</span>
          </div>
        ) : (
          <>
            <div className="mt-6 text-sm">
              <span className="underline">Arrêté la présente facture à la somme de :</span>{' '}
              <span className="font-semibold">{montantEnLettres} Francs CFA</span>
            </div>

            <div className="mt-12 text-sm text-right pr-8">
              Le Gérant
            </div>
          </>
        )}
      </div>
    </div>
  )
}


