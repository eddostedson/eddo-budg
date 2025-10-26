-- Diagnostic des notes dans Supabase
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table notes_depenses existe
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%note%';

-- 2. Vérifier la structure de la table notes_depenses si elle existe
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS sur la table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'notes_depenses';

-- 4. Vérifier si RLS est activé
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'notes_depenses';

-- 5. Compter les notes existantes (si la table existe)
SELECT COUNT(*) as total_notes FROM notes_depenses;

-- 6. Vérifier les données récentes
SELECT 
  id, 
  libelle, 
  montant, 
  statut, 
  type, 
  created_at 
FROM notes_depenses 
ORDER BY created_at DESC 
LIMIT 5;


















