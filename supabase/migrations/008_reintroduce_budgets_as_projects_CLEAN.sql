-- migration_name: reintroduce_budgets_as_projects_v4_clean
-- description: Script avec nettoyage complet avant recréation pour éviter les conflits RLS

-- ============================================
-- PHASE 1 : NETTOYAGE COMPLET
-- ============================================

-- Supprimer toutes les politiques RLS existantes (au cas où)
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres budgets" ON public.budgets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lier des recettes à leurs budgets" ON public.budget_recettes;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lier des dépenses à leurs budgets" ON public.budget_depenses;

-- Supprimer la fonction helper si elle existe
DROP FUNCTION IF EXISTS public.is_budget_owner(UUID);

-- Supprimer les tables de liaison si elles existent (dans le bon ordre)
DROP TABLE IF EXISTS public.budget_depenses CASCADE;
DROP TABLE IF EXISTS public.budget_recettes CASCADE;

-- Supprimer la table budgets si elle existe
DROP TABLE IF EXISTS public.budgets CASCADE;


-- ============================================
-- PHASE 2 : RECRÉATION PROPRE
-- ============================================

-- 1. Recréer la table `budgets`
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaire pour la table
COMMENT ON TABLE public.budgets IS 'Table des budgets (projets/dossiers) regroupant des recettes et dépenses';

-- Activer RLS sur budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Créer la politique RLS simple pour budgets
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres budgets"
ON public.budgets FOR ALL
USING (auth.uid() = user_id);


-- 2. Créer la table de liaison `budget_recettes` (SANS RLS)
CREATE TABLE public.budget_recettes (
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    recette_id UUID NOT NULL REFERENCES public.recettes(id) ON DELETE CASCADE,
    PRIMARY KEY (budget_id, recette_id)
);

COMMENT ON TABLE public.budget_recettes IS 'Table de liaison Many-to-Many entre budgets et recettes';

-- Pas de RLS sur cette table pour le moment
ALTER TABLE public.budget_recettes DISABLE ROW LEVEL SECURITY;


-- 3. Créer la table de liaison `budget_depenses` (SANS RLS)
CREATE TABLE public.budget_depenses (
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    depense_id BIGINT NOT NULL REFERENCES public.depenses(id) ON DELETE CASCADE,
    PRIMARY KEY (budget_id, depense_id)
);

COMMENT ON TABLE public.budget_depenses IS 'Table de liaison Many-to-Many entre budgets et dépenses';

-- Pas de RLS sur cette table pour le moment
ALTER TABLE public.budget_depenses DISABLE ROW LEVEL SECURITY;


-- ============================================
-- PHASE 3 : INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_budget_recettes_budget ON public.budget_recettes(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_recettes_recette ON public.budget_recettes(recette_id);
CREATE INDEX IF NOT EXISTS idx_budget_depenses_budget ON public.budget_depenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_depenses_depense ON public.budget_depenses(depense_id);


-- ============================================
-- MESSAGE DE FIN
-- ============================================
SELECT 'Migration (V4 CLEAN) terminée avec succès ! Tables budgets, budget_recettes et budget_depenses créées.' AS status;











