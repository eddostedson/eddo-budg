-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 022 : Module FACBL (Proforma, Facture Définitive, BL, Fiche)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Ce module est conçu pour être INDÉPENDANT du reste de l'application tout en
-- partageant les mêmes utilisateurs (auth.users) et la même instance Supabase.
--
-- Tables créées :
--   - facbl_clients              : Base clients (personnes / entreprises)
--   - facbl_entreprises          : Entreprises émettrices
--   - facbl_catalogue_lignes     : Catalogue de lignes (produits / services / MO)
--   - facbl_documents            : Proformas, Factures définitives, BL, Fiches
--   - facbl_document_lignes      : Lignes associées à chaque document
--
-- Toutes les tables sont sécurisées par RLS et liées à auth.users via user_id.
--
-- Remarque : aucun lien n'est créé avec les tables de budget ou de comptes
-- bancaires pour préserver l'indépendance fonctionnelle du module.
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. TABLE : facbl_clients
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facbl_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(50),
  email VARCHAR(255),
  type_client VARCHAR(20) NOT NULL DEFAULT 'personne' CHECK (type_client IN ('personne', 'entreprise')),
  rccm VARCHAR(100),
  identifiant_fiscal VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facbl_clients_user_id ON facbl_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_facbl_clients_nom ON facbl_clients(nom);

COMMENT ON TABLE facbl_clients IS 'Clients utilisés par le module FACBL (documents commerciaux).';
COMMENT ON COLUMN facbl_clients.type_client IS 'Type de client: personne ou entreprise.';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. TABLE : facbl_entreprises (émettrices)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facbl_entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  logo_url TEXT,
  adresse TEXT,
  regime_fiscal TEXT,
  mentions_legales TEXT,
  prefixe_numerotation VARCHAR(50),
  signature_par_defaut TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facbl_entreprises_user_id ON facbl_entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_facbl_entreprises_nom ON facbl_entreprises(nom);

COMMENT ON TABLE facbl_entreprises IS 'Entreprises émettrices pour les documents FACBL.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLE : facbl_catalogue_lignes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facbl_catalogue_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(50),
  designation TEXT NOT NULL,
  unite VARCHAR(50),
  prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
  type_ligne VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (type_ligne IN ('fourniture', 'service', 'main_oeuvre')),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facbl_catalogue_lignes_user_id ON facbl_catalogue_lignes(user_id);
CREATE INDEX IF NOT EXISTS idx_facbl_catalogue_lignes_code ON facbl_catalogue_lignes(code);
CREATE INDEX IF NOT EXISTS idx_facbl_catalogue_lignes_designation ON facbl_catalogue_lignes(designation);

COMMENT ON TABLE facbl_catalogue_lignes IS 'Catalogue de lignes standard (produits, services, main d''œuvre) pour FACBL.';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABLE : facbl_documents
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facbl_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_document VARCHAR(30) NOT NULL CHECK (type_document IN ('proforma', 'facture_definitive', 'bon_livraison', 'fiche_travaux')),
  numero VARCHAR(100) NOT NULL,
  client_id UUID REFERENCES facbl_clients(id) ON DELETE SET NULL,
  entreprise_id UUID REFERENCES facbl_entreprises(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES facbl_documents(id) ON DELETE SET NULL,
  date_document DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(15,2) NOT NULL DEFAULT 0,
  tva_rate DECIMAL(5,2) DEFAULT 0,
  remise DECIMAL(15,2) DEFAULT 0,
  statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'validee', 'annulee', 'livree')),
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_facbl_documents_user_numero
  ON facbl_documents(user_id, type_document, numero);

CREATE INDEX IF NOT EXISTS idx_facbl_documents_user_id ON facbl_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_facbl_documents_client_id ON facbl_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_facbl_documents_type ON facbl_documents(type_document);
CREATE INDEX IF NOT EXISTS idx_facbl_documents_date ON facbl_documents(date_document);

COMMENT ON TABLE facbl_documents IS 'Documents du module FACBL : proformas, factures définitives, bons de livraison, fiches de travaux.';
COMMENT ON COLUMN facbl_documents.parent_id IS 'Lien hiérarchique : proforma → facture → BL → fiche.';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. TABLE : facbl_document_lignes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facbl_document_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES facbl_documents(id) ON DELETE CASCADE,
  catalogue_ligne_id UUID REFERENCES facbl_catalogue_lignes(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  quantite DECIMAL(15,3) NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
  type_ligne VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (type_ligne IN ('fourniture', 'service', 'main_oeuvre')),
  tva_rate DECIMAL(5,2) DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facbl_document_lignes_user_id ON facbl_document_lignes(user_id);
CREATE INDEX IF NOT EXISTS idx_facbl_document_lignes_document_id ON facbl_document_lignes(document_id);

COMMENT ON TABLE facbl_document_lignes IS 'Lignes (fournitures, services, main d''œuvre) rattachées à un document FACBL.';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE facbl_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE facbl_entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE facbl_catalogue_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE facbl_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE facbl_document_lignes ENABLE ROW LEVEL SECURITY;

-- Politiques génériques : chaque utilisateur ne voit que ses données FACBL

-- facbl_clients
CREATE POLICY "Users can view their own facbl_clients"
  ON facbl_clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facbl_clients"
  ON facbl_clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facbl_clients"
  ON facbl_clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facbl_clients"
  ON facbl_clients FOR DELETE
  USING (auth.uid() = user_id);

-- facbl_entreprises
CREATE POLICY "Users can view their own facbl_entreprises"
  ON facbl_entreprises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facbl_entreprises"
  ON facbl_entreprises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facbl_entreprises"
  ON facbl_entreprises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facbl_entreprises"
  ON facbl_entreprises FOR DELETE
  USING (auth.uid() = user_id);

-- facbl_catalogue_lignes
CREATE POLICY "Users can view their own facbl_catalogue_lignes"
  ON facbl_catalogue_lignes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facbl_catalogue_lignes"
  ON facbl_catalogue_lignes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facbl_catalogue_lignes"
  ON facbl_catalogue_lignes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facbl_catalogue_lignes"
  ON facbl_catalogue_lignes FOR DELETE
  USING (auth.uid() = user_id);

-- facbl_documents
CREATE POLICY "Users can view their own facbl_documents"
  ON facbl_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facbl_documents"
  ON facbl_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facbl_documents"
  ON facbl_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facbl_documents"
  ON facbl_documents FOR DELETE
  USING (auth.uid() = user_id);

-- facbl_document_lignes
CREATE POLICY "Users can view their own facbl_document_lignes"
  ON facbl_document_lignes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facbl_document_lignes"
  ON facbl_document_lignes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facbl_document_lignes"
  ON facbl_document_lignes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facbl_document_lignes"
  ON facbl_document_lignes FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. TRIGGERS UPDATED_AT
-- ────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_facbl_clients_updated_at
  BEFORE UPDATE ON facbl_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facbl_entreprises_updated_at
  BEFORE UPDATE ON facbl_entreprises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facbl_catalogue_lignes_updated_at
  BEFORE UPDATE ON facbl_catalogue_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facbl_documents_updated_at
  BEFORE UPDATE ON facbl_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facbl_document_lignes_updated_at
  BEFORE UPDATE ON facbl_document_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────────
-- 8. MESSAGE DE FIN
-- ────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 022 FACBL créée avec succès.';
  RAISE NOTICE '📄 Tables facbl_clients, facbl_entreprises, facbl_catalogue_lignes, facbl_documents, facbl_document_lignes prêtes.';
END $$;


