📘 PRD — Module FACBL
(Facture Proforma, Facture Définitive, Bon de Livraison, Fiche de Travaux)

Module destiné à être intégré dans une application de gestion comptable existante.

1️⃣ Aperçu du Module

Le module FACBL automatise et centralise la chaîne complète de création documentaire d’une intervention commerciale ou technique.
Il génère successivement :

Facture Proforma (document initial renseigné via formulaire principal)

Facture Définitive (générée automatiquement à partir de la proforma validée)

Bon de Livraison (BL) (généré à partir de la facture définitive)

Fiche de Travaux (générée à partir de la facture ou du BL selon logique interne)

Chaque document repose sur un template A4 professionnel entièrement contrôlé et conforme au design exigé par l’entreprise.

Le module doit s’intégrer proprement dans l’application existante et utiliser les bases de données déjà mises en place : clients, entreprises, produits/services, utilisateurs, logs, etc.

2️⃣ Objectifs du Module
🎯 Objectifs principaux

Automatiser la génération des documents commerciaux et techniques.

Permettre la recherche, modification, suppression, duplication et impression de tous les documents générés.

Centraliser l’information : toutes les factures, BL et fiches sont stockés dans la base de données.

Permettre la gestion des clients (création, mise à jour, historique).

Permettre la gestion des entreprises émettrices (logo, coordonnées, régimes fiscaux, signatures).

Permettre la gestion des lignes standardisées (produits, fournitures, services, main d’œuvre).

Assurer une traçabilité complète du cycle Proforma → Définitive → BL → Fiche de Travaux.

3️⃣ Fonctionnalités principales proposées (améliorées)
A. Gestion des Proformas

Formulaire principal simple et réutilisable

Ajout de lignes (fournitures, main d’œuvre, prestations)

Sélection rapide depuis la base de données des lignes prédéfinies

Calcul automatique TVA, Totaux, Remises

Validation de la proforma

Génération du numéro de facture proforma selon un format configurable

Possibilité de dupliquer une proforma existante

Historique des modifications

B. Génération automatique de la Facture Définitive

Création en un clic à partir d’une proforma validée

Empêche la modification des éléments sources (sécurité)

Permet des ajustements limités si habilitation admin

Numérotation automatique des factures définitives

Template imprimable fidèle aux documents professionnels (A4)

Archivage automatique

C. Génération du Bon de Livraison (BL)

Création automatique basée sur la facture définitive

Reprend les lignes de fournitures (sans prix)

Signature client + entreprise

Numérotation automatique

Possibilité d’imprimer immédiatement

Statut : “Livré / Non Livré”

Historique des livraisons

D. Génération de la Fiche de Travaux

Créée à partir du BL ou de la facture définitive

Ajout des heures d'interventions + techniciens

Ajout signature technicien + client

Archive interne pour preuve de service rendu

Template professionnel A4 basé sur ton modèle actuel

E. Base de Données Clients

Création / modification / suppression d'un client

Champs complets :

Nom, Adresse, Téléphone, Email

RCCM / Identifiant fiscal si entreprise

Historique des documents liés

Recherche intelligente (par nom, numéro, projet)

F. Base de Données Entreprises Émettrices (si multientreprises)

Nom de l’entreprise

Logo

Régime fiscal

Mention légale

Signature par défaut

Préfixe de numérotation des documents

G. Base de Données des Lignes (Catalogue Produits/Services)

Code (optionnel)

Désignation

Unité

Prix unitaire

Catégorie : fourniture / service / MO

Peut être sélectionné automatiquement dans la proforma

Réduit drastiquement le temps de saisie

H. Moteur de Template de Documents

Le module doit inclure un système de templates fixes et non modifiables pour garantir :

✔ Respect du design
✔ Identité visuelle uniforme
✔ Impression parfaite A4

Templates requis :

Template Proforma

Template Facture Définitive

Template Bon de Livraison

Template Fiche Travaux

I. Recherche avancée

Recherche par :

Numéro de document

Client

Type de document (PF, FD, BL, FT)

Date / période

Montant

Statut (validée, livrée, annulée)

J. Sécurité & Journalisation

Verrouillage des documents validés

Journalisation des actions (création, modification, suppression)

Permissions basées sur rôles (admin, agent, superviseur)

K. API interne (Next.js + Supabase)

Endpoints prévus :

POST /proforma/create

POST /facture/create-from-proforma

POST /bl/create-from-facture

POST /fiche/create-from-bl

GET /documents/search

GET /clients/search

POST /templates/print

4️⃣ Flux Fonctionnel Principal
Client demande une facture →
Création Proforma →
Validation Proforma →
Génération Facture Définitive →
Génération Bon de Livraison →
Génération Fiche de Travaux


Chaque étape stocke le document dans Supabase et l’associe à son parent.

5️⃣ Base de Données (Schéma simplifié)
Clients
id
nom
adresse
tel
email
type (personne / entreprise)
created_at

Documents
id
type (proforma, definitive, bl, fiche)
numero
client_id
parent_id (proforma → definitive → bl → fiche)
date
montant_ht
montant_ttc
statut
created_at

Lignes Document
id
document_id
designation
quantite
prix_unitaire
type (fourniture / service / MO)

Catalogue Lignes
id
code
designation
prix_unitaire
type

Entreprises Émettrices
id
nom
logo_url
adresse
regime_fiscal
mentions_legales
prefixe_numerotation

6️⃣ Améliorations Suggerées

OCR automatique sur les documents internes (optionnel)

Génération PDF via API interne

Archivage cloud (Supabase Storage)

Ajout d’un dashboard statistique (nombre de PF, FD, BL, CA total…)

Workflow d’approbation (manager valide la PF avant FD)

QR Code sur les documents

7️⃣ Livrables du Module

Composants Next.js : formulaires, pages, printing

Templates imprimables (A4)

API interne

Base de données Supabase

Tests fonctionnels

Documentation utilisateur