import { createClient } from '@/lib/supabase/browser'

const supabase = createClient()

// Types de base pour le module FACBL

export type FacblDocumentType = 'proforma' | 'facture_definitive' | 'bon_livraison' | 'fiche_travaux'
export type FacblDocumentStatus = 'brouillon' | 'validee' | 'annulee' | 'livree'
export type FacblLigneType = 'fourniture' | 'service' | 'main_oeuvre'
export type FacblClientType = 'personne' | 'entreprise'

export interface FacblClient {
  id: string
  userId: string
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  typeClient: FacblClientType
  rccm?: string
  identifiantFiscal?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FacblEntreprise {
  id: string
  userId: string
  nom: string
  logoUrl?: string
  adresse?: string
  regimeFiscal?: string
  mentionsLegales?: string
  prefixeNumerotation?: string
  signatureParDefaut?: string
  createdAt: string
  updatedAt: string
}

export interface FacblCatalogueLigne {
  id: string
  userId: string
  code?: string
  designation: string
  unite?: string
  prixUnitaire: number
  typeLigne: FacblLigneType
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface FacblDocument {
  id: string
  userId: string
  typeDocument: FacblDocumentType
  numero: string
  clientId: string | null
  entrepriseId: string | null
  parentId: string | null
  dateDocument: string
  montantHT: number
  montantTTC: number
  tvaRate: number
  remise: number
  statut: FacblDocumentStatus
  meta?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface FacblDocumentLigne {
  id: string
  userId: string
  documentId: string
  catalogueLigneId: string | null
  designation: string
  quantite: number
  prixUnitaire: number
  typeLigne: FacblLigneType
  tvaRate: number
  ordre: number
  createdAt: string
  updatedAt: string
}

// Helpers de mapping DB → Typescript

const mapClient = (row: any): FacblClient => ({
  id: row.id,
  userId: row.user_id,
  nom: row.nom,
  adresse: row.adresse ?? undefined,
  telephone: row.telephone ?? undefined,
  email: row.email ?? undefined,
  typeClient: row.type_client as FacblClientType,
  rccm: row.rccm ?? undefined,
  identifiantFiscal: row.identifiant_fiscal ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapEntreprise = (row: any): FacblEntreprise => ({
  id: row.id,
  userId: row.user_id,
  nom: row.nom,
  logoUrl: row.logo_url ?? undefined,
  adresse: row.adresse ?? undefined,
  regimeFiscal: row.regime_fiscal ?? undefined,
  mentionsLegales: row.mentions_legales ?? undefined,
  prefixeNumerotation: row.prefixe_numerotation ?? undefined,
  signatureParDefaut: row.signature_par_defaut ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapCatalogueLigne = (row: any): FacblCatalogueLigne => ({
  id: row.id,
  userId: row.user_id,
  code: row.code ?? undefined,
  designation: row.designation,
  unite: row.unite ?? undefined,
  prixUnitaire: parseFloat(row.prix_unitaire ?? 0),
  typeLigne: row.type_ligne as FacblLigneType,
  actif: Boolean(row.actif),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapDocument = (row: any): FacblDocument => ({
  id: row.id,
  userId: row.user_id,
  typeDocument: row.type_document as FacblDocumentType,
  numero: row.numero,
  clientId: row.client_id,
  entrepriseId: row.entreprise_id,
  parentId: row.parent_id,
  dateDocument: row.date_document,
  montantHT: parseFloat(row.montant_ht ?? 0),
  montantTTC: parseFloat(row.montant_ttc ?? 0),
  tvaRate: parseFloat(row.tva_rate ?? 0),
  remise: parseFloat(row.remise ?? 0),
  statut: row.statut as FacblDocumentStatus,
  meta: row.meta ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const mapDocumentLigne = (row: any): FacblDocumentLigne => ({
  id: row.id,
  userId: row.user_id,
  documentId: row.document_id,
  catalogueLigneId: row.catalogue_ligne_id,
  designation: row.designation,
  quantite: parseFloat(row.quantite ?? 0),
  prixUnitaire: parseFloat(row.prix_unitaire ?? 0),
  typeLigne: row.type_ligne as FacblLigneType,
  tvaRate: parseFloat(row.tva_rate ?? 0),
  ordre: row.ordre ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

// ─────────────────────────────────────────────────────────────────────────────
// Service FACBL principal
// ─────────────────────────────────────────────────────────────────────────────

export const FacblService = {
  // CLIENTS ──────────────────────────────────────────────────────────────────

  async getClients(): Promise<FacblClient[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('facbl_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('nom', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement facbl_clients:', error)
      return []
    }

    return data.map(mapClient)
  },

  async createOrGetClientByName(nom: string): Promise<FacblClient | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const trimmed = nom.trim()
    if (!trimmed) return null

    // 1. Essayer de retrouver un client existant avec le même nom (insensible à la casse)
    const { data: existing, error: existingError } = await supabase
      .from('facbl_clients')
      .select('*')
      .eq('user_id', user.id)
      .ilike('nom', trimmed)
      .maybeSingle()

    if (!existingError && existing) {
      return mapClient(existing)
    }

    // 2. Sinon créer un nouveau client minimal
    const { data, error } = await supabase
      .from('facbl_clients')
      .insert({
        user_id: user.id,
        nom: trimmed
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création facbl_client (createOrGetClientByName):', error)
      return null
    }

    return mapClient(data)
  },

  async searchClients(term: string): Promise<FacblClient[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const likeTerm = `%${term}%`

    const { data, error } = await supabase
      .from('facbl_clients')
      .select('*')
      .eq('user_id', user.id)
      .or(
        `nom.ilike.${likeTerm},email.ilike.${likeTerm},adresse.ilike.${likeTerm},telephone.ilike.${likeTerm}`
      )
      .order('nom', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur recherche facbl_clients:', error)
      return []
    }

    return data.map(mapClient)
  },

  async createClient(payload: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
    typeClient?: FacblClientType
    rccm?: string
    identifiantFiscal?: string
    notes?: string
  }): Promise<FacblClient | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('facbl_clients')
      .insert({
        user_id: user.id,
        nom: payload.nom,
        adresse: payload.adresse ?? null,
        telephone: payload.telephone ?? null,
        email: payload.email ?? null,
        type_client: payload.typeClient ?? 'personne',
        rccm: payload.rccm ?? null,
        identifiant_fiscal: payload.identifiantFiscal ?? null,
        notes: payload.notes ?? null
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création facbl_client:', error)
      return null
    }

    return mapClient(data)
  },

  async updateClient(id: string, updates: Partial<Omit<FacblClient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const payload: Record<string, unknown> = {}

    if (updates.nom !== undefined) payload.nom = updates.nom
    if (updates.adresse !== undefined) payload.adresse = updates.adresse
    if (updates.telephone !== undefined) payload.telephone = updates.telephone
    if (updates.email !== undefined) payload.email = updates.email
    if (updates.typeClient !== undefined) payload.type_client = updates.typeClient
    if (updates.rccm !== undefined) payload.rccm = updates.rccm
    if (updates.identifiantFiscal !== undefined) payload.identifiant_fiscal = updates.identifiantFiscal
    if (updates.notes !== undefined) payload.notes = updates.notes

    if (Object.keys(payload).length === 0) return true

    const { error } = await supabase
      .from('facbl_clients')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur mise à jour facbl_client:', error)
      return false
    }

    return true
  },

  async deleteClient(id: string): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('facbl_clients').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur suppression facbl_client:', error)
      return false
    }

    return true
  },

  // ENTREPRISES ──────────────────────────────────────────────────────────────

  async getEntreprises(): Promise<FacblEntreprise[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('facbl_entreprises')
      .select('*')
      .eq('user_id', user.id)
      .order('nom', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement facbl_entreprises:', error)
      return []
    }

    return data.map(mapEntreprise)
  },

  async createEntreprise(payload: {
    nom: string
    logoUrl?: string
    adresse?: string
    regimeFiscal?: string
    mentionsLegales?: string
    prefixeNumerotation?: string
    signatureParDefaut?: string
  }): Promise<FacblEntreprise | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('facbl_entreprises')
      .insert({
        user_id: user.id,
        nom: payload.nom,
        logo_url: payload.logoUrl ?? null,
        adresse: payload.adresse ?? null,
        regime_fiscal: payload.regimeFiscal ?? null,
        mentions_legales: payload.mentionsLegales ?? null,
        prefixe_numerotation: payload.prefixeNumerotation ?? null,
        signature_par_defaut: payload.signatureParDefaut ?? null
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création facbl_entreprise:', error)
      return null
    }

    return mapEntreprise(data)
  },

  async updateEntreprise(
    id: string,
    updates: Partial<Omit<FacblEntreprise, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const payload: Record<string, unknown> = {}

    if (updates.nom !== undefined) payload.nom = updates.nom
    if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl
    if (updates.adresse !== undefined) payload.adresse = updates.adresse
    if (updates.regimeFiscal !== undefined) payload.regime_fiscal = updates.regimeFiscal
    if (updates.mentionsLegales !== undefined) payload.mentions_legales = updates.mentionsLegales
    if (updates.prefixeNumerotation !== undefined) payload.prefixe_numerotation = updates.prefixeNumerotation
    if (updates.signatureParDefaut !== undefined) payload.signature_par_defaut = updates.signatureParDefaut

    if (Object.keys(payload).length === 0) return true

    const { error } = await supabase
      .from('facbl_entreprises')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur mise à jour facbl_entreprise:', error)
      return false
    }

    return true
  },

  async deleteEntreprise(id: string): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('facbl_entreprises').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur suppression facbl_entreprise:', error)
      return false
    }

    return true
  },

  // CATALOGUE LIGNES ─────────────────────────────────────────────────────────

  async getCatalogueLignes(): Promise<FacblCatalogueLigne[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('facbl_catalogue_lignes')
      .select('*')
      .eq('user_id', user.id)
      .order('designation', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement facbl_catalogue_lignes:', error)
      return []
    }

    return data.map(mapCatalogueLigne)
  },

  async createCatalogueLigne(payload: {
    designation: string
    prixUnitaire: number
    typeLigne: FacblLigneType
    code?: string
    unite?: string
    actif?: boolean
  }): Promise<FacblCatalogueLigne | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('facbl_catalogue_lignes')
      .insert({
        user_id: user.id,
        designation: payload.designation,
        prix_unitaire: payload.prixUnitaire,
        type_ligne: payload.typeLigne,
        code: payload.code ?? null,
        unite: payload.unite ?? null,
        actif: payload.actif ?? true
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création facbl_catalogue_ligne:', error)
      return null
    }

    return mapCatalogueLigne(data)
  },

  async updateCatalogueLigne(
    id: string,
    updates: Partial<Omit<FacblCatalogueLigne, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const payload: Record<string, unknown> = {}

    if (updates.designation !== undefined) payload.designation = updates.designation
    if (updates.prixUnitaire !== undefined) payload.prix_unitaire = updates.prixUnitaire
    if (updates.typeLigne !== undefined) payload.type_ligne = updates.typeLigne
    if (updates.code !== undefined) payload.code = updates.code
    if (updates.unite !== undefined) payload.unite = updates.unite
    if (updates.actif !== undefined) payload.actif = updates.actif

    if (Object.keys(payload).length === 0) return true

    const { error } = await supabase
      .from('facbl_catalogue_lignes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur mise à jour facbl_catalogue_ligne:', error)
      return false
    }

    return true
  },

  async deleteCatalogueLigne(id: string): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('facbl_catalogue_lignes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur suppression facbl_catalogue_ligne:', error)
      return false
    }

    return true
  },

  // DOCUMENTS & LIGNES ───────────────────────────────────────────────────────

  async getDocumentById(id: string): Promise<FacblDocument | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('facbl_documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) {
      if (error) {
        console.error('❌ Erreur chargement facbl_document:', error)
      }
      return null
    }

    return mapDocument(data)
  },

  /**
   * Génère un numéro de proforma du type FAC-PF-JJ-MM-AAAA-XXX
   * en se basant sur la date fournie et sur les proformas déjà existantes.
   * Exemple: FAC-PF-07-12-2025-004
   */
  async generateProformaNumero(dateISO?: string): Promise<string | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const targetDate = dateISO ? new Date(dateISO) : new Date()
    if (Number.isNaN(targetDate.getTime())) return null

    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(targetDate.getDate())
    const month = pad(targetDate.getMonth() + 1)
    const year = targetDate.getFullYear()
    const dateKey = `${day}-${month}-${year}` // format utilisé dans le numéro

    // Récupérer les derniers numéros de proforma de l'utilisateur
    const { data, error } = await supabase
      .from('facbl_documents')
      .select('numero')
      .eq('user_id', user.id)
      .eq('type_document', 'proforma')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Erreur récupération numéros proforma:', error)
      // En cas d'erreur, on retourne quand même un numéro de base
      return `FAC-PF-${dateKey}-001`
    }

    let maxSuffix = 0

    for (const row of data ?? []) {
      const numero: string | null = (row as any)?.numero ?? null
      if (!numero) continue

      const match = numero.match(/^FAC-PF-(\d{2})-(\d{2})-(\d{4})-(\d{3})$/)
      if (!match) continue

      const existingKey = `${match[1]}-${match[2]}-${match[3]}`
      if (existingKey !== dateKey) continue

      const suffix = parseInt(match[4], 10)
      if (!Number.isNaN(suffix) && suffix > maxSuffix) {
        maxSuffix = suffix
      }
    }

    const nextSuffix = (maxSuffix + 1).toString().padStart(3, '0')
    return `FAC-PF-${dateKey}-${nextSuffix}`
  },

  async updateDocument(
    id: string,
    updates: Partial<
      Pick<
        FacblDocument,
        'dateDocument' | 'montantHT' | 'montantTTC' | 'tvaRate' | 'remise' | 'statut' | 'meta' | 'numero'
      >
    >
  ): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const payload: Record<string, unknown> = {}
    if (updates.dateDocument !== undefined) payload.date_document = updates.dateDocument
    if (updates.montantHT !== undefined) payload.montant_ht = updates.montantHT
    if (updates.montantTTC !== undefined) payload.montant_ttc = updates.montantTTC
    if (updates.tvaRate !== undefined) payload.tva_rate = updates.tvaRate
    if (updates.remise !== undefined) payload.remise = updates.remise
    if (updates.statut !== undefined) payload.statut = updates.statut
    if (updates.numero !== undefined) payload.numero = updates.numero
    if (updates.meta !== undefined) payload.meta = updates.meta

    if (Object.keys(payload).length === 0) return true

    const { error } = await supabase
      .from('facbl_documents')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur mise à jour facbl_document:', error)
      return false
    }

    return true
  },

  async getDocumentLignes(documentId: string): Promise<FacblDocumentLigne[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('facbl_document_lignes')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('ordre', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur chargement facbl_document_lignes:', error)
      return []
    }

    return data.map(mapDocumentLigne)
  },

  async deleteDocument(id: string): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('facbl_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Erreur suppression facbl_document:', error)
      return false
    }

    return true
  },

  async searchDocuments(params: {
    term?: string
    type?: FacblDocumentType
    clientId?: string
    statut?: FacblDocumentStatus
    dateFrom?: string
    dateTo?: string
  }): Promise<FacblDocument[]> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase.from('facbl_documents').select('*').eq('user_id', user.id)

    if (params.type) query = query.eq('type_document', params.type)
    if (params.clientId) query = query.eq('client_id', params.clientId)
    if (params.statut) query = query.eq('statut', params.statut)
    if (params.dateFrom) query = query.gte('date_document', params.dateFrom)
    if (params.dateTo) query = query.lte('date_document', params.dateTo)

    if (params.term && params.term.trim().length > 0) {
      const likeTerm = `%${params.term.trim()}%`
      query = query.or(`numero.ilike.${likeTerm}`)
    }

    const { data, error } = await query.order('date_document', { ascending: true })

    if (error || !data) {
      console.error('❌ Erreur recherche facbl_documents:', error)
      return []
    }

    return data.map(mapDocument)
  },

  async createDocument(payload: {
    typeDocument: FacblDocumentType
    numero: string
    clientId?: string
    entrepriseId?: string
    dateDocument?: string
    montantHT?: number
    montantTTC?: number
    tvaRate?: number
    remise?: number
    statut?: FacblDocumentStatus
    parentId?: string
    meta?: Record<string, unknown>
  }): Promise<FacblDocument | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('facbl_documents')
      .insert({
        user_id: user.id,
        type_document: payload.typeDocument,
        numero: payload.numero,
        client_id: payload.clientId ?? null,
        entreprise_id: payload.entrepriseId ?? null,
        parent_id: payload.parentId ?? null,
        date_document: payload.dateDocument ?? new Date().toISOString().slice(0, 10),
        montant_ht: payload.montantHT ?? 0,
        montant_ttc: payload.montantTTC ?? 0,
        tva_rate: payload.tvaRate ?? 0,
        remise: payload.remise ?? 0,
        statut: payload.statut ?? 'brouillon',
        meta: payload.meta ?? null
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ Erreur création facbl_document:', error)
      return null
    }

    return mapDocument(data)
  },

  async upsertDocumentLignes(documentId: string, lignes: Array<Omit<FacblDocumentLigne, 'id' | 'userId' | 'documentId' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return false

    // Stratégie simple V1 : supprimer les lignes existantes puis réinsérer
    const { error: deleteError } = await supabase
      .from('facbl_document_lignes')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Erreur suppression anciennes lignes FACBL:', deleteError)
      return false
    }

    if (lignes.length === 0) {
      return true
    }

    const insertPayload = lignes.map((l) => ({
      user_id: user.id,
      document_id: documentId,
      catalogue_ligne_id: l.catalogueLigneId ?? null,
      designation: l.designation,
      quantite: l.quantite,
      prix_unitaire: l.prixUnitaire,
      type_ligne: l.typeLigne,
      tva_rate: l.tvaRate,
      ordre: l.ordre
    }))

    const { error: insertError } = await supabase.from('facbl_document_lignes').insert(insertPayload)

    if (insertError) {
      console.error('❌ Erreur insertion lignes FACBL:', insertError)
      return false
    }

    return true
  },

  // Génération en chaîne des documents : PF → FD → BL → Fiche

  async createFactureFromProforma(params: {
    proformaId: string
    numero: string
    dateDocument?: string
  }): Promise<FacblDocument | null> {
    const proforma = await this.getDocumentById(params.proformaId)
    if (!proforma || proforma.typeDocument !== 'proforma') {
      console.error('❌ Impossible de créer une facture : proforma introuvable ou invalide')
      return null
    }

    const lignes = await this.getDocumentLignes(proforma.id)

    const montantHT = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0)
    const tvaRate = proforma.tvaRate ?? 0
    const montantTVA = montantHT * (tvaRate / 100)
    const montantTTC = montantHT + montantTVA - (proforma.remise ?? 0)

    const proformaMeta: any = proforma.meta ?? {}

    const facture = await this.createDocument({
      typeDocument: 'facture_definitive',
      numero: params.numero,
      clientId: proforma.clientId ?? undefined,
      entrepriseId: proforma.entrepriseId ?? undefined,
      parentId: proforma.id,
      dateDocument: params.dateDocument,
      montantHT,
      montantTTC,
      tvaRate,
      remise: proforma.remise,
      statut: 'validee',
      meta: {
        source_type: 'proforma',
        source_id: proforma.id,
        // recopier les infos principales de la proforma pour l'affichage
        client_name: proformaMeta.client_name ?? null,
        objet: proformaMeta.objet ?? null
      }
    })

    if (!facture) return null

    await this.upsertDocumentLignes(
      facture.id,
      lignes.map((l) => ({
        catalogueLigneId: l.catalogueLigneId,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        typeLigne: l.typeLigne,
        tvaRate: l.tvaRate,
        ordre: l.ordre
      }))
    )

    return facture
  },

  /**
   * Crée ou met à jour la facture définitive liée à une proforma.
   * Utilisé lors de la validation initiale et lors des modifications ultérieures de la proforma.
   */
  async ensureFactureFromProforma(proformaId: string): Promise<FacblDocument | null> {
    const proforma = await this.getDocumentById(proformaId)
    if (!proforma || proforma.typeDocument !== 'proforma') {
      console.error('❌ ensureFactureFromProforma: proforma introuvable ou invalide')
      return null
    }

    const defNumero = proforma.numero.replace(/^FAC-PF/, 'FAC-DEF')
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: existing, error } = await supabase
      .from('facbl_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type_document', 'facture_definitive')
      .eq('parent_id', proforma.id)
      .maybeSingle()

    const lignes = await this.getDocumentLignes(proforma.id)
    const montantHT = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0)
    const tvaRate = proforma.tvaRate ?? 0
    const montantTVA = montantHT * (tvaRate / 100)
    const montantTTC = montantHT + montantTVA - (proforma.remise ?? 0)
    const proformaMeta: any = proforma.meta ?? {}

    if (error) {
      console.error('❌ Erreur recherche facture_definitive existante:', error)
    }

    if (!existing) {
      // Pas encore de facture définitive → la créer
      return this.createFactureFromProforma({
        proformaId: proforma.id,
        numero: defNumero,
        dateDocument: proforma.dateDocument
      })
    }

    // Mettre à jour la facture existante
    await this.updateDocument(existing.id, {
      numero: defNumero,
      dateDocument: proforma.dateDocument,
      montantHT,
      montantTTC,
      tvaRate,
      remise: proforma.remise,
      statut: 'validee',
      meta: {
        ...(existing.meta as any),
        source_type: 'proforma',
        source_id: proforma.id,
        client_name: proformaMeta.client_name ?? null,
        objet: proformaMeta.objet ?? null
      }
    })

    await this.upsertDocumentLignes(
      existing.id,
      lignes.map((l) => ({
        catalogueLigneId: l.catalogueLigneId,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        typeLigne: l.typeLigne,
        tvaRate: l.tvaRate,
        ordre: l.ordre
      }))
    )

    return this.getDocumentById(existing.id)
  },

  /**
   * Crée ou met à jour le BON DE LIVRAISON lié à une proforma.
   * Le BL est basé sur la facture définitive correspondante (quantités + désignations, sans prix).
   */
  async ensureBonLivraisonFromProforma(proformaId: string): Promise<FacblDocument | null> {
    const facture = await this.ensureFactureFromProforma(proformaId)
    if (!facture || facture.typeDocument !== 'facture_definitive') {
      console.error('❌ ensureBonLivraisonFromProforma: facture définitive introuvable')
      return null
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return null

    const blNumero =
      facture.numero.startsWith('FAC-DEF-')
        ? facture.numero.replace(/^FAC-DEF-/, 'BL-')
        : `BL-${facture.numero}`

    const { data: existing, error } = await supabase
      .from('facbl_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type_document', 'bon_livraison')
      .eq('parent_id', facture.id)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur recherche BL existant:', error)
    }

    const factureMeta: any = facture.meta ?? {}
    const lignesFacture = await this.getDocumentLignes(facture.id)

    if (!existing) {
      // Pas encore de BL → création à partir de la facture définitive
      return this.createBonLivraisonFromFacture({
        factureId: facture.id,
        numero: blNumero,
        dateDocument: facture.dateDocument
      })
    }

    // Mise à jour d'un BL existant (quantités + désignations, sans prix)
    await this.updateDocument(existing.id, {
      numero: blNumero,
      dateDocument: facture.dateDocument,
      montantHT: 0,
      montantTTC: 0,
      tvaRate: 0,
      remise: 0,
      statut: 'livree',
      meta: {
        ...(existing.meta as any),
        source_type: 'facture_definitive',
        source_id: facture.id,
        client_name: factureMeta.client_name ?? null,
        objet: factureMeta.objet ?? null
      }
    })

    await this.upsertDocumentLignes(
      existing.id,
      lignesFacture.map((l, index) => ({
        catalogueLigneId: l.catalogueLigneId,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: 0,
        typeLigne: l.typeLigne,
        tvaRate: 0,
        ordre: index
      }))
    )

    return this.getDocumentById(existing.id)
  },

  async createBonLivraisonFromFacture(params: {
    factureId: string
    numero: string
    dateDocument?: string
  }): Promise<FacblDocument | null> {
    const facture = await this.getDocumentById(params.factureId)
    if (!facture || facture.typeDocument !== 'facture_definitive') {
      console.error('❌ Impossible de créer un BL : facture introuvable ou invalide')
      return null
    }

    const factureMeta: any = facture.meta ?? {}
    const lignesFacture = await this.getDocumentLignes(facture.id)

    // Le BL reprend les fournitures sans prix (montant = 0), uniquement quantités / désignations
    const bl = await this.createDocument({
      typeDocument: 'bon_livraison',
      numero: params.numero,
      clientId: facture.clientId ?? undefined,
      entrepriseId: facture.entrepriseId ?? undefined,
      parentId: facture.id,
      dateDocument: params.dateDocument,
      montantHT: 0,
      montantTTC: 0,
      tvaRate: 0,
      remise: 0,
      statut: 'livree',
      meta: {
        source_type: 'facture_definitive',
        source_id: facture.id,
        client_name: factureMeta.client_name ?? null,
        objet: factureMeta.objet ?? null
      }
    })

    if (!bl) return null

    await this.upsertDocumentLignes(
      bl.id,
      lignesFacture.map((l, index) => ({
        catalogueLigneId: l.catalogueLigneId,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: 0,
        typeLigne: l.typeLigne,
        tvaRate: 0,
        ordre: index
      }))
    )

    return bl
  },

  async createFicheTravauxFromBL(params: {
    blId: string
    numero: string
    dateDocument?: string
  }): Promise<FacblDocument | null> {
    const bl = await this.getDocumentById(params.blId)
    if (!bl || bl.typeDocument !== 'bon_livraison') {
      console.error('❌ Impossible de créer une fiche de travaux : BL introuvable ou invalide')
      return null
    }

    const fiche = await this.createDocument({
      typeDocument: 'fiche_travaux',
      numero: params.numero,
      clientId: bl.clientId ?? undefined,
      entrepriseId: bl.entrepriseId ?? undefined,
      parentId: bl.id,
      dateDocument: params.dateDocument,
      montantHT: 0,
      montantTTC: 0,
      tvaRate: 0,
      remise: 0,
      statut: 'validee',
      meta: {
        source_type: 'bon_livraison',
        source_id: bl.id
      }
    })

    // On ne copie pas forcément les lignes pour la fiche de travaux V1.
    return fiche
  }
}


