-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SIMPLE POUR CRÉER LES TABLES COMPTES BANCAIRES
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- COPIEZ-COLLEZ CE SCRIPT DANS SUPABASE SQL EDITOR ET EXÉCUTEZ-LE
--

-- 1. CRÉER LA TABLE COMPTES_BANCAIRES
CREATE TABLE IF NOT EXISTS comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  numero_compte VARCHAR(100),
  banque VARCHAR(255),
  type_compte VARCHAR(50) DEFAULT 'courant' CHECK (type_compte IN ('courant', 'epargne', 'entreprise')),
  solde_initial DECIMAL(15,2) NOT NULL DEFAULT 0,
  solde_actuel DECIMAL(15,2) NOT NULL DEFAULT 0,
  devise VARCHAR(10) DEFAULT 'F CFA',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRÉER LA TABLE TRANSACTIONS_BANCAIRES
CREATE TABLE IF NOT EXISTS transactions_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compte_id UUID NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
  type_transaction VARCHAR(50) NOT NULL CHECK (type_transaction IN ('credit', 'debit')),
  montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
  solde_avant DECIMAL(15,2) NOT NULL,
  solde_apres DECIMAL(15,2) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  categorie VARCHAR(100),
  date_transaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRÉER LES INDEX
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_user_id ON comptes_bancaires(user_id);
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_actif ON comptes_bancaires(actif);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_user_id ON transactions_bancaires(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_compte_id ON transactions_bancaires(compte_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_type ON transactions_bancaires(type_transaction);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_date ON transactions_bancaires(date_transaction);

-- 4. FONCTION POUR METTRE À JOUR LE SOLDE AUTOMATIQUEMENT
CREATE OR REPLACE FUNCTION update_solde_compte()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type_transaction = 'credit' THEN
      UPDATE comptes_bancaires
      SET solde_actuel = solde_actuel + NEW.montant, updated_at = NOW()
      WHERE id = NEW.compte_id;
    ELSIF NEW.type_transaction = 'debit' THEN
      UPDATE comptes_bancaires
      SET solde_actuel = solde_actuel - NEW.montant, updated_at = NOW()
      WHERE id = NEW.compte_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type_transaction = 'credit' THEN
      UPDATE comptes_bancaires
      SET solde_actuel = solde_actuel - OLD.montant, updated_at = NOW()
      WHERE id = OLD.compte_id;
    ELSIF OLD.type_transaction = 'debit' THEN
      UPDATE comptes_bancaires
      SET solde_actuel = solde_actuel + OLD.montant, updated_at = NOW()
      WHERE id = OLD.compte_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. FONCTION POUR CALCULER LE SOLDE AVANT/AFTER
CREATE OR REPLACE FUNCTION calculer_soldes_transaction()
RETURNS TRIGGER AS $$
DECLARE
  solde_courant DECIMAL(15,2);
BEGIN
  SELECT solde_actuel INTO solde_courant FROM comptes_bancaires WHERE id = NEW.compte_id;
  NEW.solde_avant := solde_courant;
  IF NEW.type_transaction = 'credit' THEN
    NEW.solde_apres := solde_courant + NEW.montant;
  ELSIF NEW.type_transaction = 'debit' THEN
    NEW.solde_apres := solde_courant - NEW.montant;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CRÉER LES TRIGGERS
DROP TRIGGER IF EXISTS trigger_update_solde_compte ON transactions_bancaires;
CREATE TRIGGER trigger_update_solde_compte
  AFTER INSERT OR DELETE ON transactions_bancaires
  FOR EACH ROW EXECUTE FUNCTION update_solde_compte();

DROP TRIGGER IF EXISTS trigger_calculer_soldes_transaction ON transactions_bancaires;
CREATE TRIGGER trigger_calculer_soldes_transaction
  BEFORE INSERT ON transactions_bancaires
  FOR EACH ROW EXECUTE FUNCTION calculer_soldes_transaction();

-- 7. FONCTION POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. TRIGGERS POUR UPDATED_AT
DROP TRIGGER IF EXISTS update_comptes_bancaires_updated_at ON comptes_bancaires;
CREATE TRIGGER update_comptes_bancaires_updated_at
  BEFORE UPDATE ON comptes_bancaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_bancaires_updated_at ON transactions_bancaires;
CREATE TRIGGER update_transactions_bancaires_updated_at
  BEFORE UPDATE ON transactions_bancaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. ACTIVER RLS (Row Level Security)
ALTER TABLE comptes_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_bancaires ENABLE ROW LEVEL SECURITY;

-- 10. CRÉER LES POLITIQUES RLS POUR COMPTES_BANCAIRES
DROP POLICY IF EXISTS "Users can view their own comptes_bancaires" ON comptes_bancaires;
CREATE POLICY "Users can view their own comptes_bancaires"
  ON comptes_bancaires FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own comptes_bancaires" ON comptes_bancaires;
CREATE POLICY "Users can insert their own comptes_bancaires"
  ON comptes_bancaires FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comptes_bancaires" ON comptes_bancaires;
CREATE POLICY "Users can update their own comptes_bancaires"
  ON comptes_bancaires FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comptes_bancaires" ON comptes_bancaires;
CREATE POLICY "Users can delete their own comptes_bancaires"
  ON comptes_bancaires FOR DELETE USING (auth.uid() = user_id);

-- 11. CRÉER LES POLITIQUES RLS POUR TRANSACTIONS_BANCAIRES
DROP POLICY IF EXISTS "Users can view their own transactions_bancaires" ON transactions_bancaires;
CREATE POLICY "Users can view their own transactions_bancaires"
  ON transactions_bancaires FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions_bancaires" ON transactions_bancaires;
CREATE POLICY "Users can insert their own transactions_bancaires"
  ON transactions_bancaires FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions_bancaires" ON transactions_bancaires;
CREATE POLICY "Users can update their own transactions_bancaires"
  ON transactions_bancaires FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions_bancaires" ON transactions_bancaires;
CREATE POLICY "Users can delete their own transactions_bancaires"
  ON transactions_bancaires FOR DELETE USING (auth.uid() = user_id);

-- ✅ VÉRIFICATION FINALE
SELECT '✅ Tables créées avec succès !' as message;








