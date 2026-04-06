# BudgiBook Local

Logiciel local de gestion d'élevage de perruches ondulées.

## Démarrage rapide

```bash
# 1. Installer les dépendances (une seule fois)
npm install

# 2. Lancer l'application
npm start

# 3. Ouvrir dans le navigateur
# → http://localhost:3000
```

## Fonctionnalités

- **Tableau de bord** — statistiques de l'élevage
- **Mes Oiseaux** — fiches complètes avec photo, généalogie, mutation, statut
- **Nichées** — suivi des accouplements, ponte, éclos, poussins
- **Pedigree** — arbre généalogique sur 3 générations
- **Mon Élevage** — profil et logo de l'élevage
- **Sauvegarde** — export/import JSON complet

## Stack

- Node.js + Express
- SQLite (better-sqlite3)
- HTML / CSS / JavaScript vanilla

## Données

- Base de données : `budgibook.db` (créée automatiquement au premier lancement)
- Photos : dossier `uploads/`

Pour sauvegarder, copiez `budgibook.db` + `uploads/`.
