# 🐦 BudgiBook

**BudgiBook** est un outil de suivi d'élevage de perruches ondulées multi-utilisateurs, hébergeable sur Hostinger.

---

## ✨ Fonctionnalités

- **Pages publiques** : Accueil, annuaire des éleveurs, vitrine de chaque éleveur
- **Espace éleveur** : Tableau de bord, gestion des oiseaux (fiches complètes avec photos), accouplements & nichées, arbre pedigree sur 3 générations, gestion du profil
- **Espace administrateur** : Statistiques globales, gestion des comptes éleveurs
- **Emplacements publicitaires** Google AdSense prêts sur toutes les pages publiques
- **Export des données** en JSON depuis le profil
- **Architecture extensible** : le champ `species` sur les oiseaux permet d'ajouter d'autres espèces facilement

---

## 🛠 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend   | Node.js + Express |
| Base de données | SQLite (better-sqlite3) |
| Sessions  | express-session + connect-sqlite3 |
| Frontend  | HTML + CSS + JavaScript vanilla |
| Auth      | bcrypt |

---

## 🚀 Installation locale

### Prérequis
- Node.js ≥ 16
- npm

### Étapes

```bash
# 1. Cloner ou copier le projet
cd budgibook

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start

# (Développement avec rechargement automatique)
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

### Compte administrateur par défaut
- Email : `admin@budgibook.fr`
- Mot de passe : `admin123`

> ⚠️ **Changez ce mot de passe dès la première connexion !**

---

## 🌐 Déploiement sur Hostinger

### 1. Préparer le projet

Vérifiez que votre `package.json` contient bien :
```json
"engines": { "node": ">=16.0.0" }
```

### 2. Hébergement Node.js sur Hostinger

1. Connectez-vous à votre panel Hostinger
2. Allez dans **Sites Web** → votre domaine → **Node.js**
3. Activez Node.js et sélectionnez la version ≥ 16
4. Définissez le **fichier d'entrée** : `server.js`

### 3. Uploader les fichiers

Utilisez le **Gestionnaire de fichiers** Hostinger ou FTP/SFTP pour uploader tous les fichiers du projet dans le dossier racine de votre site.

Fichiers à uploader :
```
budgibook/
├── server.js
├── database.js
├── package.json
├── routes/
└── public/
```

> ⚠️ **N'uploadez pas** `node_modules/` — Hostinger les installera automatiquement.

### 4. Installer les dépendances sur le serveur

Dans le terminal Hostinger (SSH ou panel) :
```bash
cd /home/votre_compte/public_html
npm install --production
```

### 5. Variables d'environnement

Dans le panel Hostinger → **Variables d'environnement**, définissez :

| Variable | Valeur |
|----------|--------|
| `SESSION_SECRET` | Une chaîne longue et aléatoire (ex : `abc123...xyz`) |
| `PORT` | `3000` (ou la valeur imposée par Hostinger) |

Pour générer un secret sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Démarrer l'application

Dans le panel Hostinger → Node.js → **Démarrer**

### 7. Configurer le domaine

Hostinger configure automatiquement le proxy entre votre domaine et le port Node.js.

---

## 🔧 Configuration avancée

### Changer le mot de passe admin

Connectez-vous avec `admin@budgibook.fr` / `admin123` puis modifiez le mot de passe depuis le tableau de bord admin.

### Base de données

Le fichier SQLite `budgibook.db` est créé automatiquement au premier démarrage dans le dossier racine du projet. Pensez à l'inclure dans vos sauvegardes régulières.

### AdSense

Les emplacements publicitaires sont des `<div>` avec le commentaire `<!-- Google AdSense -->` dans les fichiers HTML :
- `public/index.html`
- `public/directory.html`
- `public/breeder.html`

Remplacez le contenu de ces `<div>` par votre code AdSense.

---

## 📁 Structure du projet

```
budgibook/
├── server.js          # Point d'entrée, config Express
├── database.js        # Initialisation SQLite, schéma
├── routes/
│   ├── middleware.js  # Auth middleware
│   ├── auth.js        # Inscription, connexion, déconnexion
│   ├── birds.js       # CRUD oiseaux + pedigree + export
│   ├── pairings.js    # Accouplements & nichées
│   ├── profile.js     # Profil éleveur
│   ├── public.js      # API publique (annuaire, vitrines)
│   └── admin.js       # API administration
├── public/
│   ├── css/style.css  # Styles globaux
│   ├── js/
│   │   ├── app.js     # Utilitaires partagés (toast, api, etc.)
│   │   └── sidebar.js # Composant sidebar
│   ├── index.html        # Accueil public
│   ├── directory.html    # Annuaire des éleveurs
│   ├── breeder.html      # Vitrine éleveur
│   ├── dashboard.html    # Tableau de bord éleveur
│   ├── birds.html        # Gestion des oiseaux
│   ├── pairings.html     # Accouplements & nichées
│   ├── pedigree.html     # Arbre généalogique
│   ├── profile.html      # Profil & vitrine
│   └── admin.html        # Tableau de bord admin
├── package.json
└── README.md
```

---

## 🔮 Évolutions possibles

- **Autres espèces** : Le champ `species` sur la table `birds` permet d'étendre BudgiBook à d'autres espèces (inséparables, calopsites, etc.) sans changer la structure de la base de données.
- **Système de messagerie** entre éleveurs
- **Réinitialisation de mot de passe** par email
- **Exportation en PDF** des fiches oiseaux / pedigrees
- **Notifications** pour les dates importantes (envols prévus, etc.)

---

## 📄 Licence

ISC — Libre d'utilisation et de modification.
