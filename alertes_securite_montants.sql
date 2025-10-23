-- ALERTES DE SÉCURITÉ POUR LES MONTANTS
-- À exécuter dans Supabase SQL Editor

-- 1. FONCTION D'ALERTE POUR MONTANTS SUSPECTS
CREATE OR REPLACE FUNCTION check_suspicious_amounts()
RETURNS TABLE (
    recette_id UUID,
    description TEXT,
    amount NUMERIC,
    alert_level TEXT,
    alert_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.description,
        r.amount,
        CASE 
            WHEN r.amount < 1000 AND r.description LIKE '%EXPERTISE%' THEN '🚨 CRITIQUE'
            WHEN r.amount < 10000 AND r.description LIKE '%BSIC%' THEN '🚨 CRITIQUE'
            WHEN r.amount < 10000 AND r.description LIKE '%REVERSEMENT%' THEN '🚨 CRITIQUE'
            WHEN r.amount < 10000 AND r.description LIKE '%LOYER%' THEN '⚠️ ATTENTION'
            ELSE '✅ NORMAL'
        END as alert_level,
        CASE 
            WHEN r.amount < 1000 AND r.description LIKE '%EXPERTISE%' THEN 'Montant EXPERTISE suspect (trop bas)'
            WHEN r.amount < 10000 AND r.description LIKE '%BSIC%' THEN 'Montant BSIC suspect (trop bas)'
            WHEN r.amount < 10000 AND r.description LIKE '%REVERSEMENT%' THEN 'Montant REVERSEMENT suspect (trop bas)'
            WHEN r.amount < 10000 AND r.description LIKE '%LOYER%' THEN 'Montant LOYER suspect (trop bas)'
            ELSE 'Montant normal'
        END as alert_message
    FROM recettes r
    WHERE r.amount < 10000
    ORDER BY r.amount ASC;
END;
$$ LANGUAGE plpgsql;

-- 2. FONCTION DE VÉRIFICATION DES TOTAUX
CREATE OR REPLACE FUNCTION verify_totals()
RETURNS TABLE (
    total_recettes NUMERIC,
    total_solde_disponible NUMERIC,
    total_depenses_calculees NUMERIC,
    is_consistent BOOLEAN,
    alert_message TEXT
) AS $$
DECLARE
    total_rec NUMERIC;
    total_solde NUMERIC;
    total_dep NUMERIC;
    is_cons BOOLEAN;
BEGIN
    SELECT SUM(amount) INTO total_rec FROM recettes;
    SELECT SUM(solde_disponible) INTO total_solde FROM recettes;
    SELECT SUM(amount - solde_disponible) INTO total_dep FROM recettes;
    
    is_cons := (total_rec = total_solde + total_dep);
    
    RETURN QUERY
    SELECT 
        total_rec,
        total_solde,
        total_dep,
        is_cons,
        CASE 
            WHEN is_cons THEN '✅ Totaux cohérents'
            ELSE '🚨 ERREUR: Totaux incohérents !'
        END;
END;
$$ LANGUAGE plpgsql;

-- 3. CRÉER UNE VUE DE SURVEILLANCE
CREATE OR REPLACE VIEW surveillance_montants AS
SELECT 
    'SURVEILLANCE MONTANTS' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    CASE 
        WHEN SUM(amount) = SUM(solde_disponible) + (SUM(amount) - SUM(solde_disponible)) THEN '✅ COHÉRENT'
        ELSE '🚨 INCOHÉRENT'
    END as statut
FROM recettes;
