// Types pour les transferts entre recettes
export interface Transfert {
  id: string
  userId: string
  recetteSourceId: string
  recetteDestinationId: string
  montant: number
  description: string
  dateTransfert: string
  createdAt: string
  updatedAt: string
}

export interface TransfertFormData {
  recetteSourceId: string
  recetteDestinationId: string
  montant: number
  description: string
  dateTransfert: string
}




























