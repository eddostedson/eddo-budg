-- Migration pour ajouter le champ type aux budgets
-- Permet de différencier les comptes principaux (verts) des comptes secondaires (couleurs)

-- Ajouter la colonne type à la table budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'secondaire' CHECK (type IN ('principal', 'secondaire'));

-- Mettre à jour les budgets existants pour qu'ils soient des comptes secondaires par défaut
UPDATE budgets SET type = 'secondaire' WHERE type IS NULL;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN budgets.type IS 'Type de compte: principal (vert, montant initial obligatoire) ou secondaire (couleur, peut commencer à 0)';

