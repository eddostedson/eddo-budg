-- Script pour forcer la suppression d'une dépense avec son reçu
-- Utilisez ce script si une dépense refuse de se supprimer normalement

-- 1. Remplacer 'DEPENSE_ID' par l'ID de la dépense à supprimer
-- 2. Remplacer 'USER_ID' par l'ID de l'utilisateur

-- Vérifier la dépense avant suppression
SELECT 
  id,
  libelle,
  receipt_url,
  receipt_file_name,
  created_at
FROM depenses 
WHERE id = 'DEPENSE_ID'  -- Remplacez par l'ID réel
  AND user_id = 'USER_ID';  -- Remplacez par l'ID utilisateur réel

-- Supprimer la dépense (cela supprimera aussi le reçu grâce au code mis à jour)
DELETE FROM depenses 
WHERE id = 'DEPENSE_ID'  -- Remplacez par l'ID réel
  AND user_id = 'USER_ID';  -- Remplacez par l'ID utilisateur réel

-- Vérifier que la suppression a bien eu lieu
SELECT COUNT(*) as remaining_depenses
FROM depenses 
WHERE id = 'DEPENSE_ID'  -- Remplacez par l'ID réel
  AND user_id = 'USER_ID';  -- Remplacez par l'ID utilisateur réel














