/**
 * BudgiBook - Serveur principal
 * Node.js + Express
 * Compatible avec un hébergement Hostinger standard (Node.js shared hosting)
 */

const express = require('express');
const session = require('express-session');
const path = require('path');

// Initialiser la base de données au démarrage
require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' })); // limite augmentée pour les photos en base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Gestion des sessions avec stockage SQLite
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'budgibook-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    httpOnly: true,
    secure: false // passer à true si HTTPS est activé
  }
}));

// ─── Routes API ─────────────────────────────────────────────────────────────

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/birds',     require('./routes/birds'));
app.use('/api/pairings',  require('./routes/pairings'));
app.use('/api/profile',   require('./routes/profile'));
app.use('/api/public',    require('./routes/public'));
app.use('/api/admin',     require('./routes/admin'));

// ─── Routes HTML ─────────────────────────────────────────────────────────────

// Pages publiques
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/annuaire', (req, res) => res.sendFile(path.join(__dirname, 'public', 'directory.html')));
app.get('/eleveur/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'breeder.html')));

// Pages privées (l'authentification est gérée côté client + API)
app.get('/tableau-de-bord', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/mes-oiseaux',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'birds.html')));
app.get('/accouplements',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'pairings.html')));
app.get('/pedigree',        (req, res) => res.sendFile(path.join(__dirname, 'public', 'pedigree.html')));
app.get('/mon-profil',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));

// Page admin
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ─── Démarrage ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🐦 BudgiBook démarré sur http://localhost:${PORT}`);
  console.log(`   Admin : admin@budgibook.fr / admin123\n`);
});
