-- Solution temporaire : Vérifier pourquoi la suppression de dépense échoue

-- 1. Vérifier les politiques RLS sur depenses pour DELETE
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'depenses' AND cmd = 'DELETE';

-- 2. Si vous voulez supprimer une dépense manuellement, utilisez ceci :
-- DELETE FROM depenses WHERE id = VOTRE_ID_DEPENSE;
