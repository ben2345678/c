/**
 * Routes d'authentification
 * POST /api/auth/register  — inscription
 * POST /api/auth/login     — connexion
 * POST /api/auth/logout    — déconnexion
 * GET  /api/auth/me        — utilisateur courant
 */

const express = require('express');
const bcrypt  = require('bcrypt');
const { getDb } = require('../database');

const router = express.Router();

// ─── Inscription ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, farm_name, region } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password, farm_name, region)
      VALUES (?, ?, ?, ?)
    `).run(email.toLowerCase().trim(), hash, farm_name || null, region || null);

    const user = db.prepare('SELECT id, email, role, farm_name, region FROM users WHERE id = ?').get(result.lastInsertRowid);
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

// ─── Connexion ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Ce compte a été désactivé.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    farm_name: user.farm_name,
    region: user.region,
    profile_photo: user.profile_photo
  };

  res.json({ success: true, user: safeUser });
});

// ─── Déconnexion ─────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ─── Utilisateur courant ──────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non connecté.' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT id, email, role, farm_name, region, description,
           contact_email, contact_phone, contact_social, profile_photo
    FROM users WHERE id = ?
  `).get(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Session invalide.' });
  }

  res.json({ user });
});

module.exports = router;
