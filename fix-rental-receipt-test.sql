-- =====================================================
-- 🔧 CORRECTION DU SCRIPT DE TEST
-- =====================================================
-- Ce script corrige les erreurs dans le test du système de reçus de loyer

-- =====================================================
-- 1. VÉRIFIER ET CRÉER LA TABLE RENTAL_INCOME_LINKS
-- =====================================================

-- Vérifier si la table existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_income_links') THEN
        -- Créer la table si elle n'existe pas
        CREATE TABLE rental_income_links (
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
        
        -- Créer les index
        CREATE INDEX idx_rental_links_user_id ON rental_income_links(user_id);
        CREATE INDEX idx_rental_links_recette_id ON rental_income_links(recette_id);
        CREATE INDEX idx_rental_links_property_id ON rental_income_links(property_id);
        CREATE INDEX idx_rental_links_tenant_id ON rental_income_links(tenant_id);
        CREATE INDEX idx_rental_links_contract_id ON rental_income_links(contract_id);
        CREATE INDEX idx_rental_links_month ON rental_income_links(rental_month);
        CREATE INDEX idx_rental_links_year ON rental_income_links(rental_year);
        
        -- Activer RLS
        ALTER TABLE rental_income_links ENABLE ROW LEVEL SECURITY;
        
        -- Créer les politiques RLS
        CREATE POLICY "Users can view their own rental income links" ON rental_income_links
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own rental income links" ON rental_income_links
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own rental income links" ON rental_income_links
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own rental income links" ON rental_income_links
          FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Table rental_income_links créée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ Table rental_income_links existe déjà';
    END IF;
END $$;

-- =====================================================
-- 2. VÉRIFIER LES COLONNES DE LA TABLE RECETTES
-- =====================================================

-- Ajouter les colonnes manquantes à la table recettes si nécessaire
DO $$
BEGIN
    -- Vérifier et ajouter is_rental
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'is_rental') THEN
        ALTER TABLE recettes ADD COLUMN is_rental BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Colonne is_rental ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter property_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'property_id') THEN
        ALTER TABLE recettes ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne property_id ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter tenant_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'tenant_id') THEN
        ALTER TABLE recettes ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne tenant_id ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter contract_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'contract_id') THEN
        ALTER TABLE recettes ADD COLUMN contract_id UUID REFERENCES rental_contracts(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne contract_id ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter rental_month
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'rental_month') THEN
        ALTER TABLE recettes ADD COLUMN rental_month VARCHAR(7);
        RAISE NOTICE '✅ Colonne rental_month ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter rental_year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'rental_year') THEN
        ALTER TABLE recettes ADD COLUMN rental_year INTEGER;
        RAISE NOTICE '✅ Colonne rental_year ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter rental_period_start
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'rental_period_start') THEN
        ALTER TABLE recettes ADD COLUMN rental_period_start DATE;
        RAISE NOTICE '✅ Colonne rental_period_start ajoutée à la table recettes';
    END IF;
    
    -- Vérifier et ajouter rental_period_end
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recettes' AND column_name = 'rental_period_end') THEN
        ALTER TABLE recettes ADD COLUMN rental_period_end DATE;
        RAISE NOTICE '✅ Colonne rental_period_end ajoutée à la table recettes';
    END IF;
END $$;

-- =====================================================
-- 3. VÉRIFIER LES FONCTIONS NÉCESSAIRES
-- =====================================================

-- Vérifier si les fonctions existent, sinon les créer
DO $$
BEGIN
    -- Vérifier extract_rental_period_from_libelle
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'extract_rental_period_from_libelle') THEN
        RAISE NOTICE '⚠️ Fonction extract_rental_period_from_libelle manquante - exécutez rental-receipt-system.sql';
    END IF;
    
    -- Vérifier is_rental_income
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_rental_income') THEN
        RAISE NOTICE '⚠️ Fonction is_rental_income manquante - exécutez rental-receipt-system.sql';
    END IF;
    
    -- Vérifier generate_rental_receipt
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_rental_receipt') THEN
        RAISE NOTICE '⚠️ Fonction generate_rental_receipt manquante - exécutez rental-receipt-system.sql';
    END IF;
    
    -- Vérifier get_rental_income_with_details
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_rental_income_with_details') THEN
        RAISE NOTICE '⚠️ Fonction get_rental_income_with_details manquante - exécutez rental-receipt-system.sql';
    END IF;
    
    -- Vérifier generate_manual_rental_receipt
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_manual_rental_receipt') THEN
        RAISE NOTICE '⚠️ Fonction generate_manual_rental_receipt manquante - exécutez rental-receipt-system.sql';
    END IF;
END $$;

-- =====================================================
-- 4. VÉRIFIER LES TABLES DE GESTION LOCATIVE
-- =====================================================

-- Vérifier que les tables de gestion locative existent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
        RAISE NOTICE '⚠️ Table properties manquante - exécutez create-rental-management-tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE '⚠️ Table tenants manquante - exécutez create-rental-management-tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_contracts') THEN
        RAISE NOTICE '⚠️ Table rental_contracts manquante - exécutez create-rental-management-tables.sql';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
        RAISE NOTICE '⚠️ Table receipts manquante - exécutez create-rental-management-tables.sql';
    END IF;
END $$;

-- =====================================================
-- 5. MESSAGE FINAL
-- =====================================================

SELECT 
  'CORRECTION TERMINÉE' as status,
  'Vous pouvez maintenant exécuter test-rental-receipt-system.sql' as message;





