-- SYSTÈME DE VALIDATION DES MONTANTS
-- À exécuter dans Supabase SQL Editor

-- 1. CRÉER UNE FONCTION DE VALIDATION DES MONTANTS
CREATE OR REPLACE FUNCTION validate_recette_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier que le montant est positif
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'ERREUR SÉCURITÉ: Le montant doit être positif (valeur: %)', NEW.amount;
    END IF;
    
    -- Vérifier que le montant n'est pas suspect (trop petit)
    IF NEW.amount < 1000 AND NEW.description LIKE '%EXPERTISE%' THEN
        RAISE EXCEPTION 'ERREUR SÉCURITÉ: Montant suspect pour EXPERTISE (valeur: %)', NEW.amount;
    END IF;
    
    -- Vérifier que le montant n'est pas suspect (trop petit)
    IF NEW.amount < 10000 AND NEW.description LIKE '%BSIC%' THEN
        RAISE EXCEPTION 'ERREUR SÉCURITÉ: Montant suspect pour BSIC (valeur: %)', NEW.amount;
    END IF;
    
    -- Vérifier que le montant n'est pas suspect (trop petit)
    IF NEW.amount < 10000 AND NEW.description LIKE '%REVERSEMENT%' THEN
        RAISE EXCEPTION 'ERREUR SÉCURITÉ: Montant suspect pour REVERSEMENT (valeur: %)', NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CRÉER UN TRIGGER DE VALIDATION (SÉCURISÉ)
CREATE TRIGGER trigger_validate_recette_amount
    BEFORE INSERT OR UPDATE ON recettes
    FOR EACH ROW
    EXECUTE FUNCTION validate_recette_amount();

-- 3. CRÉER UNE FONCTION DE SURVEILLANCE
CREATE OR REPLACE FUNCTION monitor_recette_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log des changements suspects
    IF OLD.amount != NEW.amount THEN
        INSERT INTO recette_change_log (
            recette_id,
            old_amount,
            new_amount,
            change_reason,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.amount,
            NEW.amount,
            'CHANGEMENT DE MONTANT DÉTECTÉ',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRÉER UNE TABLE DE LOG POUR SURVEILLER LES CHANGEMENTS
CREATE TABLE IF NOT EXISTS recette_change_log (
    id SERIAL PRIMARY KEY,
    recette_id UUID,
    old_amount NUMERIC,
    new_amount NUMERIC,
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 5. CRÉER UN TRIGGER DE SURVEILLANCE
CREATE TRIGGER trigger_monitor_recette_changes
    AFTER UPDATE ON recettes
    FOR EACH ROW
    EXECUTE FUNCTION monitor_recette_changes();
