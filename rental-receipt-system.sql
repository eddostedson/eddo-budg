-- =====================================================
-- 🏠 SYSTÈME DE RECEIPTS DE LOYER AUTOMATIQUE
-- =====================================================
-- Ce script crée un système complet pour lier les recettes de loyers
-- aux propriétés et locataires avec génération automatique de reçus

-- =====================================================
-- 1. MODIFIER LA TABLE RECETTES POUR SUPPORTER LES LOYERS
-- =====================================================

-- Ajouter des colonnes pour la gestion locative
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS is_rental BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES rental_contracts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rental_month VARCHAR(7), -- Format: YYYY-MM (ex: 2025-01)
ADD COLUMN IF NOT EXISTS rental_year INTEGER,
ADD COLUMN IF NOT EXISTS rental_period_start DATE,
ADD COLUMN IF NOT EXISTS rental_period_end DATE;

-- Index pour les requêtes de loyers
CREATE INDEX IF NOT EXISTS idx_recettes_is_rental ON recettes(is_rental);
CREATE INDEX IF NOT EXISTS idx_recettes_property_id ON recettes(property_id);
CREATE INDEX IF NOT EXISTS idx_recettes_tenant_id ON recettes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recettes_contract_id ON recettes(contract_id);
CREATE INDEX IF NOT EXISTS idx_recettes_rental_month ON recettes(rental_month);
CREATE INDEX IF NOT EXISTS idx_recettes_rental_year ON recettes(rental_year);

-- =====================================================
-- 2. TABLE DE LIAISON RECETTES-PROPRIÉTÉS-LOCATAIRES
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_income_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recette_id UUID REFERENCES recettes(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES rental_contracts(id) ON DELETE CASCADE,
  rental_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  rental_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  receipt_generated BOOLEAN DEFAULT FALSE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes d'unicité
  UNIQUE(recette_id),
  UNIQUE(property_id, tenant_id, rental_month)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_rental_links_user_id ON rental_income_links(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_links_recette_id ON rental_income_links(recette_id);
CREATE INDEX IF NOT EXISTS idx_rental_links_property_id ON rental_income_links(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_links_tenant_id ON rental_income_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_links_contract_id ON rental_income_links(contract_id);
CREATE INDEX IF NOT EXISTS idx_rental_links_month ON rental_income_links(rental_month);
CREATE INDEX IF NOT EXISTS idx_rental_links_year ON rental_income_links(rental_year);

-- =====================================================
-- 3. FONCTIONS UTILITAIRES POUR LA GESTION DES LOYERS
-- =====================================================

-- Fonction pour extraire le mois et l'année du libellé
CREATE OR REPLACE FUNCTION extract_rental_period_from_libelle(libelle TEXT)
RETURNS TABLE(rental_month VARCHAR(7), rental_year INTEGER, period_start DATE, period_end DATE) AS $$
DECLARE
  month_names TEXT[] := ARRAY['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                             'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  month_abbr TEXT[] := ARRAY['jan', 'fév', 'mar', 'avr', 'mai', 'jun',
                             'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  current_year INTEGER;
  found_month INTEGER := 0;
  found_year INTEGER := 0;
  libelle_lower TEXT;
  i INTEGER;
  period_start_date DATE;
  period_end_date DATE;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  libelle_lower := LOWER(libelle);
  
  -- Chercher l'année dans le libellé (format 4 chiffres)
  IF libelle ~ '\b(20\d{2})\b' THEN
    found_year := (regexp_match(libelle, '\b(20\d{2})\b'))[1]::INTEGER;
  ELSE
    found_year := current_year;
  END IF;
  
  -- Chercher le mois dans le libellé
  FOR i IN 1..12 LOOP
    IF libelle_lower LIKE '%' || month_names[i] || '%' OR 
       libelle_lower LIKE '%' || month_abbr[i] || '%' OR
       libelle_lower LIKE '%' || i || '%' THEN
      found_month := i;
      EXIT;
    END IF;
  END LOOP;
  
  -- Si aucun mois trouvé, utiliser le mois actuel
  IF found_month = 0 THEN
    found_month := EXTRACT(MONTH FROM CURRENT_DATE);
  END IF;
  
  -- Calculer les dates de début et fin de période
  period_start_date := DATE(found_year || '-' || LPAD(found_month::TEXT, 2, '0') || '-01');
  period_end_date := (period_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Retourner les résultats
  rental_month := found_year || '-' || LPAD(found_month::TEXT, 2, '0');
  rental_year := found_year;
  period_start := period_start_date;
  period_end := period_end_date;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour détecter si une recette est un loyer
CREATE OR REPLACE FUNCTION is_rental_income(libelle TEXT, description TEXT DEFAULT '')
RETURNS BOOLEAN AS $$
DECLARE
  text_to_check TEXT;
  rental_keywords TEXT[] := ARRAY['loyer', 'rent', 'location', 'appartement', 'villa', 'bureau', 'commerce'];
  i INTEGER;
BEGIN
  text_to_check := LOWER(COALESCE(libelle, '') || ' ' || COALESCE(description, ''));
  
  FOR i IN 1..array_length(rental_keywords, 1) LOOP
    IF text_to_check LIKE '%' || rental_keywords[i] || '%' THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer automatiquement un reçu de loyer
CREATE OR REPLACE FUNCTION generate_rental_receipt(
  p_recette_id UUID,
  p_property_id UUID,
  p_tenant_id UUID,
  p_contract_id UUID,
  p_rental_month VARCHAR(7),
  p_period_start DATE,
  p_period_end DATE,
  p_amount DECIMAL(15,2),
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_user_id UUID;
  v_property_name TEXT;
  v_tenant_name TEXT;
  v_contract_number TEXT;
BEGIN
  -- Récupérer les informations nécessaires
  SELECT user_id INTO v_user_id FROM recettes WHERE id = p_recette_id;
  SELECT property_name INTO v_property_name FROM properties WHERE id = p_property_id;
  SELECT CONCAT(first_name, ' ', last_name) INTO v_tenant_name FROM tenants WHERE id = p_tenant_id;
  SELECT contract_number INTO v_contract_number FROM rental_contracts WHERE id = p_contract_id;
  
  -- Générer un numéro de reçu unique
  v_receipt_number := generate_receipt_number();
  
  -- Créer le reçu
  INSERT INTO receipts (
    user_id,
    recette_id,
    property_id,
    tenant_id,
    contract_id,
    receipt_number,
    receipt_type,
    amount,
    period_start,
    period_end,
    payment_date,
    payment_method,
    notes
  ) VALUES (
    v_user_id,
    p_recette_id,
    p_property_id,
    p_tenant_id,
    p_contract_id,
    v_receipt_number,
    'loyer',
    p_amount,
    p_period_start,
    p_period_end,
    p_payment_date,
    'espèces',
    'Reçu généré automatiquement pour ' || v_property_name || ' - ' || v_tenant_name
  ) RETURNING id INTO v_receipt_id;
  
  RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGERS POUR LA GÉNÉRATION AUTOMATIQUE
-- =====================================================

-- Trigger pour détecter et traiter automatiquement les recettes de loyer
CREATE OR REPLACE FUNCTION process_rental_income()
RETURNS TRIGGER AS $$
DECLARE
  v_is_rental BOOLEAN;
  v_rental_period RECORD;
  v_property_id UUID;
  v_tenant_id UUID;
  v_contract_id UUID;
  v_receipt_id UUID;
  v_link_id UUID;
BEGIN
  -- Vérifier si c'est une recette de loyer
  v_is_rental := is_rental_income(NEW.libelle, NEW.description);
  
  IF v_is_rental THEN
    -- Extraire la période du libellé
    SELECT * INTO v_rental_period 
    FROM extract_rental_period_from_libelle(NEW.libelle);
    
    -- Mettre à jour la recette avec les informations de loyer
    UPDATE recettes SET
      is_rental = TRUE,
      rental_month = v_rental_period.rental_month,
      rental_year = v_rental_period.rental_year,
      rental_period_start = v_rental_period.period_start,
      rental_period_end = v_rental_period.period_end
    WHERE id = NEW.id;
    
    -- Essayer de trouver la propriété et le locataire correspondants
    -- (Cette logique peut être améliorée selon vos besoins)
    SELECT p.id, t.id, c.id
    INTO v_property_id, v_tenant_id, v_contract_id
    FROM properties p
    LEFT JOIN tenants t ON t.property_id = p.id
    LEFT JOIN rental_contracts c ON c.property_id = p.id AND c.tenant_id = t.id
    WHERE p.user_id = NEW.user_id
    AND c.contract_status = 'active'
    LIMIT 1;
    
    -- Si on trouve une correspondance, créer le lien et générer le reçu
    IF v_property_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
      -- Créer le lien
      INSERT INTO rental_income_links (
        user_id, recette_id, property_id, tenant_id, contract_id,
        rental_month, rental_year, period_start, period_end, amount
      ) VALUES (
        NEW.user_id, NEW.id, v_property_id, v_tenant_id, v_contract_id,
        v_rental_period.rental_month, v_rental_period.rental_year,
        v_rental_period.period_start, v_rental_period.period_end, NEW.montant
      ) RETURNING id INTO v_link_id;
      
      -- Générer le reçu automatiquement
      v_receipt_id := generate_rental_receipt(
        NEW.id, v_property_id, v_tenant_id, v_contract_id,
        v_rental_period.rental_month, v_rental_period.period_start,
        v_rental_period.period_end, NEW.montant, NEW.date_reception
      );
      
      -- Mettre à jour le lien avec l'ID du reçu
      UPDATE rental_income_links 
      SET receipt_id = v_receipt_id, receipt_generated = TRUE
      WHERE id = v_link_id;
      
      -- Mettre à jour la recette avec les IDs
      UPDATE recettes SET
        property_id = v_property_id,
        tenant_id = v_tenant_id,
        contract_id = v_contract_id
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_process_rental_income ON recettes;
CREATE TRIGGER trigger_process_rental_income
  AFTER INSERT ON recettes
  FOR EACH ROW
  EXECUTE FUNCTION process_rental_income();

-- =====================================================
-- 5. FONCTIONS DE REQUÊTE POUR L'INTERFACE
-- =====================================================

-- Fonction pour récupérer les recettes de loyer avec détails
CREATE OR REPLACE FUNCTION get_rental_income_with_details(p_user_id UUID)
RETURNS TABLE(
  recette_id UUID,
  libelle TEXT,
  montant DECIMAL(15,2),
  date_reception DATE,
  rental_month VARCHAR(7),
  property_name TEXT,
  tenant_name TEXT,
  contract_number TEXT,
  receipt_id UUID,
  receipt_number TEXT,
  receipt_generated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.libelle,
    r.montant,
    r.date_reception,
    r.rental_month,
    p.property_name,
    CONCAT(t.first_name, ' ', t.last_name),
    c.contract_number,
    ril.receipt_id,
    rc.receipt_number,
    ril.receipt_generated
  FROM recettes r
  LEFT JOIN rental_income_links ril ON ril.recette_id = r.id
  LEFT JOIN properties p ON p.id = r.property_id
  LEFT JOIN tenants t ON t.id = r.tenant_id
  LEFT JOIN rental_contracts c ON c.id = r.contract_id
  LEFT JOIN receipts rc ON rc.id = ril.receipt_id
  WHERE r.user_id = p_user_id
  AND r.is_rental = TRUE
  ORDER BY r.date_reception DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un reçu manuellement
CREATE OR REPLACE FUNCTION generate_manual_rental_receipt(
  p_recette_id UUID,
  p_property_id UUID,
  p_tenant_id UUID,
  p_contract_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_recette RECORD;
  v_receipt_id UUID;
BEGIN
  -- Récupérer les informations de la recette
  SELECT * INTO v_recette FROM recettes WHERE id = p_recette_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recette non trouvée';
  END IF;
  
  -- Générer le reçu
  v_receipt_id := generate_rental_receipt(
    p_recette_id,
    p_property_id,
    p_tenant_id,
    p_contract_id,
    v_recette.rental_month,
    v_recette.rental_period_start,
    v_recette.rental_period_end,
    v_recette.montant,
    v_recette.date_reception
  );
  
  -- Mettre à jour le lien
  UPDATE rental_income_links 
  SET receipt_id = v_receipt_id, receipt_generated = TRUE
  WHERE recette_id = p_recette_id;
  
  RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

-- Activer RLS sur la nouvelle table
ALTER TABLE rental_income_links ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rental_income_links
CREATE POLICY "Users can view their own rental income links" ON rental_income_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rental income links" ON rental_income_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rental income links" ON rental_income_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rental income links" ON rental_income_links
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer des données de test si nécessaire
-- (Décommentez les lignes suivantes pour ajouter des données de test)

/*
-- Exemple de recette de loyer de test
INSERT INTO recettes (user_id, libelle, description, montant, date_reception, is_rental)
VALUES (
  auth.uid(),
  'Loyer Appartement Kennedy - Janvier 2025',
  'Loyer mensuel pour l''appartement Kennedy',
  120000,
  CURRENT_DATE,
  TRUE
);
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Le système de reçus de loyer automatique est maintenant configuré.
-- 
-- FONCTIONNALITÉS :
-- 1. Détection automatique des recettes de loyer
-- 2. Extraction du mois/année depuis le libellé
-- 3. Liaison automatique avec propriétés et locataires
-- 4. Génération automatique de reçus
-- 5. Fonctions de requête pour l'interface utilisateur
--
-- UTILISATION :
-- 1. Créez des propriétés et des locataires
-- 2. Ajoutez des recettes avec des libellés contenant "loyer" + mois
-- 3. Le système générera automatiquement les reçus





