-- Migration: Ajouter recette_id à la table depenses et créer un trigger pour déduire du solde

-- 1. Ajouter la colonne recette_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'depenses' AND column_name = 'recette_id'
    ) THEN
        ALTER TABLE depenses 
        ADD COLUMN recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Créer une fonction pour déduire automatiquement du solde_disponible
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

-- 3. Créer le trigger
DROP TRIGGER IF EXISTS trigger_deduire_solde_recette ON depenses;
CREATE TRIGGER trigger_deduire_solde_recette
AFTER INSERT OR UPDATE OR DELETE ON depenses
FOR EACH ROW
EXECUTE FUNCTION deduire_solde_recette();

-- Message de confirmation
SELECT 'Migration terminée : recette_id ajouté et trigger de déduction créé.' AS status;






































