-- Créer la table depenses si elle n'existe pas
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table depenses
CREATE TABLE IF NOT EXISTS depenses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL,
    libelle VARCHAR(255) NOT NULL,
    montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_depenses_user_id ON depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_budget_id ON depenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_depenses_recette_id ON depenses(recette_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date);
CREATE INDEX IF NOT EXISTS idx_depenses_libelle ON depenses(libelle);

-- 3. Activer RLS
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

-- 4. Créer une politique RLS pour permettre l'accès aux utilisateurs authentifiés
CREATE POLICY "Users can manage their own expenses" ON depenses
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Créer le trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_depenses_updated_at ON depenses;
CREATE TRIGGER trigger_depenses_updated_at
    BEFORE UPDATE ON depenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Créer le trigger pour déduire du solde de la recette
CREATE OR REPLACE FUNCTION deduire_solde_recette()
RETURNS TRIGGER AS $$
BEGIN
    -- Lors de l'insertion d'une dépense liée à une recette
    IF (TG_OP = 'INSERT' AND NEW.recette_id IS NOT NULL) THEN
        UPDATE recettes
        SET solde_disponible = solde_disponible - NEW.montant,
            updated_at = NOW()
        WHERE id = NEW.recette_id;
    END IF;

    -- Lors de la mise à jour d'une dépense
    IF (TG_OP = 'UPDATE') THEN
        -- Si la recette a changé, rembourser l'ancienne et déduire de la nouvelle
        IF (OLD.recette_id IS DISTINCT FROM NEW.recette_id) THEN
            -- Rembourser l'ancienne recette
            IF (OLD.recette_id IS NOT NULL) THEN
                UPDATE recettes
                SET solde_disponible = solde_disponible + OLD.montant,
                    updated_at = NOW()
                WHERE id = OLD.recette_id;
            END IF;
            
            -- Déduire de la nouvelle recette
            IF (NEW.recette_id IS NOT NULL) THEN
                UPDATE recettes
                SET solde_disponible = solde_disponible - NEW.montant,
                    updated_at = NOW()
                WHERE id = NEW.recette_id;
            END IF;
        -- Si seul le montant a changé
        ELSIF (OLD.montant <> NEW.montant AND NEW.recette_id IS NOT NULL) THEN
            UPDATE recettes
            SET solde_disponible = solde_disponible + OLD.montant - NEW.montant,
                updated_at = NOW()
            WHERE id = NEW.recette_id;
        END IF;
    END IF;

    -- Lors de la suppression d'une dépense
    IF (TG_OP = 'DELETE' AND OLD.recette_id IS NOT NULL) THEN
        UPDATE recettes
        SET solde_disponible = solde_disponible + OLD.montant,
            updated_at = NOW()
        WHERE id = OLD.recette_id;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduire_solde_recette ON depenses;
CREATE TRIGGER trigger_deduire_solde_recette
AFTER INSERT OR UPDATE OR DELETE ON depenses
FOR EACH ROW
EXECUTE FUNCTION deduire_solde_recette();

-- 7. Vérifier que la table a été créée
SELECT 'Table depenses créée avec succès' as status;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;



























