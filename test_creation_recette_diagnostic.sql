-- 🧪 TEST DE CRÉATION DE RECETTE - DIAGNOSTIC
-- Exécutez cette requête dans Supabase SQL Editor pour tester manuellement

-- 1️⃣ Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2️⃣ Vérifier votre user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- 3️⃣ Test d'insertion manuelle (REMPLACEZ 'VOTRE_USER_ID' par votre ID réel)
INSERT INTO recettes (
    user_id,
    libelle,
    description,
    amount,
    solde_disponible,
    receipt_date,
    statut
) VALUES (
    'VOTRE_USER_ID', -- ⚠️ REMPLACEZ PAR VOTRE USER_ID
    'Test Recette SQL',
    'Ceci est un test depuis SQL',
    75000,
    75000,
    CURRENT_DATE,
    'Reçue'
) RETURNING *;

-- 4️⃣ Vérifier que la recette a été créée
SELECT * FROM recettes ORDER BY created_at DESC LIMIT 5;

-- 5️⃣ Si l'insertion échoue, vérifier les contraintes
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE 
        WHEN con.contype = 'c' THEN pg_get_constraintdef(con.oid)
        ELSE NULL
    END AS check_clause
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'recettes';

