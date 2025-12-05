# 🚀 Implémentation d’un Système Moderne de Notifications (Sonner + Animations + Undo)

Ce document décrit toutes les étapes nécessaires pour implémenter un système complet, moderne et professionnel de notifications dans un projet **Next.js + TypeScript + Tailwind + Sonner**, avec option Undo et micro-animations.

Cursor doit appliquer **strictement** toutes les instructions suivantes.

---

# 1️⃣ Installation & Configuration Initiale

## ➤ Installer la librairie Sonner
```bash
pnpm add sonner

➤ Ajouter le Toaster global

Dans layout.tsx (App Router) ou _app.tsx (Pages Router) :

import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Toaster position="top-right" richColors closeButton duration={3000} />
        {children}
      </body>
    </html>
  );
}

2️⃣ Créer un module de notifications réutilisable

Créer un fichier :
lib/notify.ts

import { toast } from "sonner";

export const notifySuccess = (message: string) =>
  toast.success(message);

export const notifyError = (message: string) =>
  toast.error(message);

export const notifyInfo = (message: string) =>
  toast(message);

export const notifyUndo = (
  message: string,
  undoCallback: () => void
) => {
  toast(message, {
    action: {
      label: "Annuler",
      onClick: undoCallback,
    },
  });
};

3️⃣ Intégration dans les actions CRUD
✔ Ajout
notifySuccess("Élément ajouté avec succès !");

✔ Modification
notifySuccess("Modification enregistrée !");

✔ Suppression avec UNDO
notifyUndo("Élément supprimé", async () => {
  await restoreItem(id);
  notifySuccess("Suppression annulée !");
});

✔ Erreurs
notifyError("Une erreur est survenue.");

4️⃣ Ajouter une micro-animation lors de la suppression d’un élément

Installer Framer Motion si nécessaire :

pnpm add framer-motion


Dans un composant de liste ou tableau :

import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 1, height: "auto" }}
  animate={{
    opacity: isDeleted ? 0 : 1,
    height: isDeleted ? 0 : "auto",
  }}
  transition={{ duration: 0.25 }}
>
  {children}
</motion.div>


L'élément doit disparaître visuellement avant d’être retiré du DOM.

5️⃣ Exemple d’intégration complète dans un composant CRUD

Cursor doit :

Ajouter les notifications Sonner

Ajouter l’Undo sur la suppression

Ajouter la micro-animation

Nettoyer le code

Remplacer les alert() et console.log

Rendre le code professionnel, lisible et réutilisable

Exemple à appliquer dans n’importe quel composant :

const handleDelete = async (id: string) => {
  setIsDeleted(true);

  notifyUndo("Élément supprimé", async () => {
    await restoreItem(id);
    setIsDeleted(false);
    notifySuccess("Suppression annulée !");
  });

  await deleteItem(id);
};

6️⃣ Exigences techniques strictes à respecter

Cursor doit impérativement respecter :

Next.js App Router

TypeScript strict

Tailwind CSS

Architecture propre (lib/, components/, hooks/)

Pas d’alert() ni de console inutiles

UX moderne inspirée de Notion, Linear et Vercel Dashboard

Code commenté et bien organisé

Composants réutilisables

🎯 Résultat Final Attendu

À la fin de l’implémentation :

Le projet doit disposer d’un système complet de notifications modernes

Toutes les actions CRUD doivent afficher des toasts élégants

Les suppressions doivent proposer une option UNDO

Les éléments supprimés doivent disparaître via une micro-animation propre

Le système doit être réutilisable dans tous les modules de l'application

Le code doit être professionnel, minimaliste et cohérent