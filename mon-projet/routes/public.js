/**
 * Routes publiques (accès sans authentification)
 * GET /api/public/breeders          — annuaire des éleveurs
 * GET /api/public/breeders/:id      — vitrine d'un éleveur
 */

const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

// ─── Annuaire des éleveurs ───────────────────────────────────────────────────
router.get('/breeders', (req, res) => {
  const { region } = req.query;
  const db = getDb();

  let query = `
    SELECT u.id, u.farm_name, u.region, u.description, u.profile_photo,
           COUNT(b.id) AS bird_count
    FROM users u
    LEFT JOIN birds b ON b.user_id = u.id AND b.is_public = 1
    WHERE u.role = 'breeder' AND u.is_active = 1
  `;
  const params = [];

  if (region) {
    query += ' AND u.region = ?';
    params.push(region);
  }

  query += ' GROUP BY u.id ORDER BY u.farm_name ASC';

  const breeders = db.prepare(query).all(...params);
  res.json({ breeders });
});

// ─── Liste des régions disponibles ───────────────────────────────────────────
router.get('/regions', (req, res) => {
  const db = getDb();
  const regions = db.prepare(`
    SELECT DISTINCT region FROM users
    WHERE role = 'breeder' AND is_active = 1 AND region IS NOT NULL
    ORDER BY region ASC
  `).all();

  res.json({ regions: regions.map(r => r.region) });
});

// ─── Vitrine d'un éleveur ─────────────────────────────────────────────────────
router.get('/breeders/:id', (req, res) => {
  const db = getDb();

  const breeder = db.prepare(`
    SELECT id, farm_name, region, description,
           contact_email, contact_phone, contact_social, profile_photo
    FROM users
    WHERE id = ? AND role = 'breeder' AND is_active = 1
  `).get(req.params.id);

  if (!breeder) return res.status(404).json({ error: 'Éleveur introuvable.' });

  // Oiseaux reproducteurs publics
  const birds = db.prepare(`
    SELECT id, name, sex, mutation, birth_date, photo, ring_number
    FROM birds
    WHERE user_id = ? AND is_public = 1 AND status = 'active'
    ORDER BY name ASC
  `).all(req.params.id);

  res.json({ breeder, birds });
});

module.exports = router;
