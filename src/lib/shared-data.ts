// Données partagées entre les pages
export interface Budget {
  id: string
  userId?: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending' | 'cancelled'
  budgetId?: string
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: Date
}

// ✅ Interface pour les transferts entre budgets
export interface BudgetTransfer {
  id: string
  fromBudgetId: string
  toBudgetId: string
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed' | 'refunded' // pending = prêt non remboursé, refunded = remboursé
  createdAt: Date
}

// ✅ Interface pour le JOURNAL D'ACTIVITÉ
export interface ActivityLog {
  id: string
  timestamp: string
  userId?: string
  action: 'create' | 'update' | 'delete'
  entityType: 'recette' | 'depense'
  entityId: string
  entityName: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description: string
  ipAddress?: string
  userAgent?: string
}

// ✅ Interface pour les RECETTES (Revenus)
export interface Recette {
  id: string
  userId?: string
  libelle: string
  description: string
  montant: number
  soldeDisponible: number
  source: string // Salaire, Prime, Freelance, etc.
  periodicite: 'unique' | 'mensuelle' | 'hebdomadaire' | 'annuelle'
  dateReception: string
  categorie: string
  statut: 'attendue' | 'reçue' | 'retardée' | 'annulée'
  receiptUrl?: string // URL du reçu uploadé
  receiptFileName?: string // Nom du fichier reçu original
  validationBancaire?: boolean // Nouveau: validation de conformité bancaire
  dateValidationBancaire?: string // Nouveau: date de validation bancaire
  createdAt: string
  updatedAt: string
}

// Fonction utilitaire pour vérifier si une recette est épuisée
export function isRecetteEpuisee(recette: Recette): boolean {
  return recette.soldeDisponible <= 0
}

// Fonction utilitaire pour vérifier si une recette est utilisable pour des dépenses
export function isRecetteUtilisable(recette: Recette): boolean {
  return recette.soldeDisponible > 0 && recette.statut !== 'annulée'
}

// ✅ Interface pour les COMPTES BANCAIRES (Portefeuilles)
export interface CompteBancaire {
  id: string
  userId?: string
  nom: string
  numeroCompte?: string
  banque?: string
  typeCompte: 'courant' | 'epargne' | 'entreprise' | 'operationnel'
  typePortefeuille: 'compte_bancaire' | 'mobile_money' | 'especes' | 'autre'
  soldeInitial: number
  soldeActuel: number
  excludeFromTotal: boolean
  devise: string
  actif: boolean
  createdAt: string
  updatedAt: string
}

// ✅ Interface pour les TRANSACTIONS BANCAIRES
export interface TransactionBancaire {
  id: string
  userId?: string
  compteId: string
  typeTransaction: 'credit' | 'debit'
  montant: number
  soldeAvant: number
  soldeApres: number
  libelle: string
  description?: string
  reference?: string
  categorie?: string
  dateTransaction: string
  createdAt: string
  updatedAt: string
  receiptUrl?: string // URL du reçu uploadé
  receiptFileName?: string // Nom du fichier reçu
  isInternalTransfer?: boolean
  transferGroupId?: string | null
}

// ✅ Interface pour les DÉPENSES
export interface Depense {
  id: number
  userId?: string
  recetteId?: string
  libelle: string
  montant: number
  date: string
  description: string
  categorie?: string
  receiptUrl?: string // Nouveau: URL du reçu uploadé
  receiptFileName?: string // Nouveau: nom du fichier reçu
  createdAt: string
  updatedAt: string
}

// ✅ Interface pour les REÇUS
export interface Receipt {
  id: string
  userId?: string
  transactionId?: string
  compteId: string
  nomLocataire: string
  villa: string
  periode: string // Date formatée
  montant: number
  dateTransaction: string
  libelle?: string
  description?: string
  qrCodeData?: string
  signature?: string
  loyerFactureId?: string | null
  soldeRestant?: number | null
  createdAt: string
  updatedAt: string
}

// ✅ Fonds partagés entre comptes bancaires
export interface SharedFund {
  id: string
  userId: string
  sourceCompteId: string
  primaryCompteId?: string | null
  transactionSourceId?: string | null
  libelle: string
  description?: string
  montantInitial: number
  montantRestant: number
  createdAt: string
  updatedAt: string
}

export interface SharedFundMovement {
  id: string
  sharedFundId: string
  userId: string
  compteId: string
  type: 'debit' | 'credit'
  montant: number
  transactionId?: string | null
  libelle?: string
  createdAt: string
}

// ✅ Interface pour les ALLOCATIONS (Recettes → Budgets)
export interface Allocation {
  id: number
  userId?: string
  recetteId: string
  budgetId: string
  montant: number
  dateAllocation: string
  createdAt: string
}

// Budgets par défaut (module Budgets projets)
export const defaultBudgets: Budget[] = [
  {
    id: '1',
    name: 'ACCD-PRINCIPAL',
    description: 'COMPTE PRINCIPAL',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// ✅ Module Budget Salaire (budgets mensuels autonomes)
export interface BudgetSalaireMois {
  id: string
  userId: string
  annee: number
  mois: number
  libelle: string
  revenuMensuel: number
  montantDepenseTotal: number
  createdAt: string
  updatedAt: string
}

export type TypeDepenseSalaire = 'progressive' | 'unique'
export type StatutRubriqueSalaire = 'en_cours' | 'terminee' | 'annulee'

export interface BudgetSalaireRubrique {
  id: string
  userId: string
  budgetMoisId: string
  nom: string
  montantBudgete: number
  montantDepense: number
  typeDepense: TypeDepenseSalaire
  statut: StatutRubriqueSalaire
  createdAt: string
  updatedAt: string
}

export interface BudgetSalaireMouvement {
  id: string
  userId: string
  rubriqueId: string
  dateOperation: string
  montant: number
  description?: string
  createdAt: string
}

// ✅ Référentiel de villas / logements
export interface VillaConfig {
  id: string
  userId: string
  label: string
  code?: string | null
  loyerMontant: number
  currency: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface LoyerFacture {
  id: string
  userId: string
  villaId?: string | null
  locataireNom: string
  mois: number
  annee: number
  montantTotal: number
  montantRestant: number
  statut: 'en_cours' | 'partiel' | 'solde' | 'annule'
  description?: string | null
  createdAt: string
  updatedAt: string
  villa?: VillaConfig
}

export interface LoyerReglement {
  id: string
  userId: string
  factureId: string
  receiptId?: string | null
  transactionId?: string | null
  montant: number
  soldeApres: number
  dateOperation: string
  note?: string | null
  createdAt: string
}

// Transactions par défaut (module Budgets projets)
export const defaultTransactions: Transaction[] = []
