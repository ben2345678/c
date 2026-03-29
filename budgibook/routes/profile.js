/**
 * Routes du profil éleveur
 * GET  /api/profile      — récupérer le profil
 * PUT  /api/profile      — mettre à jour le profil
 * PUT  /api/profile/password — changer le mot de passe
 */

const express = require('express');
const bcrypt  = require('bcrypt');
const { getDb } = require('../database');
const { requireAuth } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// ─── Récupérer le profil ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, email, farm_name, region, description,
           contact_email, contact_phone, contact_social,
           profile_photo, created_at
    FROM users WHERE id = ?
  `).get(req.session.userId);

  if (!user) return res.status(404).json({ error: 'Profil introuvable.' });
  res.json({ user });
});

// ─── Mettre à jour le profil ─────────────────────────────────────────────────
router.put('/', (req, res) => {
  const { farm_name, region, description, contact_email, contact_phone, contact_social, profile_photo } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE users SET
      farm_name = ?, region = ?, description = ?,
      contact_email = ?, contact_phone = ?, contact_social = ?,
      profile_photo = ?
    WHERE id = ?
  `).run(
    farm_name || null, region || null, description || null,
    contact_email || null, contact_phone || null, contact_social || null,
    profile_photo || null,
    req.session.userId
  );

  res.json({ success: true });
});

// ─── Changer le mot de passe ─────────────────────────────────────────────────
router.put('/password', async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
  }

  const db = getDb();
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.session.userId);

  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
  }

  const hash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.session.userId);

  res.json({ success: true });
});

module.exports = router;
