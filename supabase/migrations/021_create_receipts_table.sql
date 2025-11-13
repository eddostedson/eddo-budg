-- Migration pour créer la table des reçus
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions_bancaires(id) ON DELETE SET NULL,
  compte_id UUID NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
  nom_locataire VARCHAR(255) NOT NULL,
  villa VARCHAR(255) NOT NULL,
  periode VARCHAR(100) NOT NULL, -- Format: "mai 2025"
  montant DECIMAL(15,2) NOT NULL,
  date_transaction TIMESTAMP WITH TIME ZONE NOT NULL,
  libelle VARCHAR(255),
  description TEXT,
  qr_code_data TEXT, -- Données encodées dans le QR code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_compte_id ON receipts(compte_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date_transaction ON receipts(date_transaction);

-- RLS Policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres reçus
CREATE POLICY "Users can view their own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres reçus
CREATE POLICY "Users can create their own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres reçus
CREATE POLICY "Users can update their own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres reçus
CREATE POLICY "Users can delete their own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_receipts_updated_at();

