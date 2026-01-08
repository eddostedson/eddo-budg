-- ✅ Référentiels de villas avec loyer par défaut
CREATE TABLE IF NOT EXISTS villa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  code TEXT,
  loyer_montant NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'F CFA',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, label)
);

ALTER TABLE villa_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own villa configs"
  ON villa_configs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own villa configs"
  ON villa_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own villa configs"
  ON villa_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own villa configs"
  ON villa_configs
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_villa_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_villa_configs_updated_at
  BEFORE UPDATE ON villa_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_villa_configs_updated_at();

CREATE INDEX IF NOT EXISTS idx_villa_configs_user_id ON villa_configs(user_id);

-- ✅ Factures de loyers (un loyer par locataire / villa / mois)
CREATE TABLE IF NOT EXISTS loyer_factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  villa_id UUID REFERENCES villa_configs(id) ON DELETE SET NULL,
  locataire_nom TEXT NOT NULL,
  mois SMALLINT NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee SMALLINT NOT NULL CHECK (annee BETWEEN 2000 AND 2100),
  montant_total NUMERIC(15,2) NOT NULL,
  montant_restant NUMERIC(15,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_cours', -- en_cours | partiel | solde | annule
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, villa_id, locataire_nom, mois, annee)
);

ALTER TABLE loyer_factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rent invoices"
  ON loyer_factures
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rent invoices"
  ON loyer_factures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rent invoices"
  ON loyer_factures
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rent invoices"
  ON loyer_factures
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_loyer_factures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_loyer_factures_updated_at
  BEFORE UPDATE ON loyer_factures
  FOR EACH ROW
  EXECUTE FUNCTION update_loyer_factures_updated_at();

CREATE INDEX IF NOT EXISTS idx_loyer_factures_user_period
  ON loyer_factures(user_id, annee, mois);

-- ✅ Règlements (acomptes) d'une facture de loyer
CREATE TABLE IF NOT EXISTS loyer_reglements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facture_id UUID NOT NULL REFERENCES loyer_factures(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions_bancaires(id) ON DELETE SET NULL,
  montant NUMERIC(15,2) NOT NULL,
  solde_apres NUMERIC(15,2) NOT NULL,
  date_operation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE loyer_reglements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rent payments"
  ON loyer_reglements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rent payments"
  ON loyer_reglements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rent payments"
  ON loyer_reglements
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_loyer_reglements_facture_id
  ON loyer_reglements(facture_id);

-- ✅ Lier les reçus aux factures de loyer & stocker le reste dû
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS loyer_facture_id UUID REFERENCES loyer_factures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS solde_restant NUMERIC(15,2);



