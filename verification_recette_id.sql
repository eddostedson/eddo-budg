-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 VÉRIFICATION RAPIDE DE LA COLONNE recette_id
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier si la colonne recette_id existe dans la table depenses
SELECT 
    '🔍 LA COLONNE recette_id EXISTE-T-ELLE ?' as question,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'depenses' 
            AND column_name = 'recette_id'
        ) THEN '✅ OUI, elle existe'
        ELSE '❌ NON, elle n''existe pas'
    END as reponse;

-- 2. Compter les dépenses avec et sans recette_id
SELECT 
    '📊 STATISTIQUES DES LIAISONS' as titre,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as avec_recette_id,
    COUNT(*) - COUNT(recette_id) as sans_recette_id
FROM depenses;

-- 3. Afficher quelques exemples de dépenses avec leur recette_id
SELECT 
    '📋 EXEMPLES DE DÉPENSES' as titre,
    d.id,
    d.libelle,
    d.montant,
    d.recette_id,
    CASE 
        WHEN d.recette_id IS NOT NULL THEN '✅ Liée'
        ELSE '❌ Non liée'
    END as statut
FROM depenses d
ORDER BY d.created_at DESC
LIMIT 10;

-- 4. Si des recette_id existent, vérifier leur validité
SELECT 
    '🔗 VÉRIFICATION DES LIAISONS EXISTANTES' as titre,
    d.libelle as depense,
    d.montant,
    d.recette_id,
    r.description as recette_trouvee,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ Recette valide'
        WHEN d.recette_id IS NOT NULL THEN '⚠️ Recette introuvable (ID invalide)'
        ELSE '❌ Pas de liaison'
    END as validite
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
WHERE d.recette_id IS NOT NULL
LIMIT 20;


