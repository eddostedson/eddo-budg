// Types pour l'application Eddo Budget

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Recette {
  id: string
  userId: string
  libelle: string
  description: string
  montant: number
  soldeDisponible: number
  source: string
  periodicite: string
  date: string
  dateReception: string
  categorie: string
  statut: string
  receiptUrl?: string
  receiptFileName?: string
  createdAt: string
  updatedAt: string
}

export interface Depense {
  id: string
  userId: string
  libelle: string
  description: string
  montant: number
  categorie: string
  date: string
  statut: string
  budgetId?: string
  receiptUrl?: string
  receiptFileName?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  name: string
  description: string
  amount: number
  spent: number
  remaining: number
  period: string
  color: string
  source: string
  type: string
  createdAt: string
  updatedAt: string
}

export interface Allocation {
  id: string
  budgetId: string
  recetteId: string
  montant: number
  dateAllocation: string
  createdAt: string
}

export interface Receipt {
  id: string
  userId: string
  transactionId: string
  transactionType: 'recette' | 'depense'
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: string
}

export interface ReceiptFilters {
  transaction_type?: 'recette' | 'depense'
  date_from?: string
  date_to?: string
  payment_date_from?: string
  payment_date_to?: string
  payment_method?: Receipt['payment_method']
}

// Types pour les statistiques
export interface DashboardStats {
  totalRecettes: number
  totalDepenses: number
  soldeDisponible: number
  budgetsActifs: number
  recettesMensuelles: number
  depensesMensuelles: number
}

// Types pour les filtres
export interface RecetteFilters {
  dateFrom?: string
  dateTo?: string
  categorie?: string
  statut?: string
  montantMin?: number
  montantMax?: number
}

export interface DepenseFilters {
  dateFrom?: string
  dateTo?: string
  categorie?: string
  statut?: string
  budgetId?: string
  montantMin?: number
  montantMax?: number
}

// Types pour les notifications
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  createdAt: string
}

// Types pour les logs d'activité
export interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  details: Record<string, any>
  createdAt: string
}



