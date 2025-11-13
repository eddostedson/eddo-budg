-- Script d'export JSON pour l'application
-- Génère un fichier JSON avec toutes les données pour faciliter la liaison

WITH recettes_data AS (
    SELECT 
        id,
        description,
        amount as montant,
        solde_disponible,
        (amount - solde_disponible) as depense_attendue,
        receipt_date as date_recette,
        created_at,
        updated_at
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
),
depenses_data AS (
    SELECT 
        id,
        libelle,
        montant,
        date,
        recette_id,
        created_at,
        updated_at
    FROM depenses 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
),
liaisons_actuelles AS (
    SELECT 
        r.id as recette_id,
        r.description as recette_description,
        r.montant as montant_recette,
        r.solde_disponible,
        d.id as depense_id,
        d.libelle as depense_libelle,
        d.montant as montant_depense
    FROM recettes_data r
    LEFT JOIN depenses_data d ON r.id = d.recette_id
)
SELECT 
    'EXPORT_JSON' as type,
    json_build_object(
        'recettes', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'description', description,
                    'montant', montant,
                    'solde_disponible', solde_disponible,
                    'depense_attendue', depense_attendue,
                    'date_recette', date_recette,
                    'created_at', created_at,
                    'updated_at', updated_at
                )
            )
            FROM recettes_data
        ),
        'depenses', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'libelle', libelle,
                    'montant', montant,
                    'date', date,
                    'recette_id', recette_id,
                    'created_at', created_at,
                    'updated_at', updated_at
                )
            )
            FROM depenses_data
        ),
        'liaisons_actuelles', (
            SELECT json_agg(
                json_build_object(
                    'recette_id', recette_id,
                    'recette_description', recette_description,
                    'montant_recette', montant_recette,
                    'solde_disponible', solde_disponible,
                    'depense_id', depense_id,
                    'depense_libelle', depense_libelle,
                    'montant_depense', montant_depense
                )
            )
            FROM liaisons_actuelles
        )
    ) as export_json;


