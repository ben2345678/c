/**
 * Routes de gestion des oiseaux (espace privé éleveur)
 * GET    /api/birds           — liste des oiseaux de l'éleveur
 * POST   /api/birds           — ajouter un oiseau
 * GET    /api/birds/:id       — détail d'un oiseau
 * PUT    /api/birds/:id       — modifier un oiseau
 * DELETE /api/birds/:id       — supprimer un oiseau
 */

const express = require('express');
const { getDb } = require('../database');
const { requireAuth } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// ─── Liste des oiseaux ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { sex, status, mutation, species } = req.query;
  const db = getDb();

  let query = `
    SELECT b.*,
      f.name AS father_name, f.mutation AS father_mutation,
      m.name AS mother_name, m.mutation AS mother_mutation
    FROM birds b
    LEFT JOIN birds f ON b.father_id = f.id
    LEFT JOIN birds m ON b.mother_id = m.id
    WHERE b.user_id = ?
  `;
  const params = [req.session.userId];

  if (sex)      { query += ' AND b.sex = ?';                    params.push(sex); }
  if (status)   { query += ' AND b.status = ?';                 params.push(status); }
  if (mutation) { query += ' AND b.mutation LIKE ?';            params.push(`%${mutation}%`); }
  if (species)  { query += ' AND b.species = ?';                params.push(species); }

  query += ' ORDER BY b.created_at DESC';

  const birds = db.prepare(query).all(...params);
  res.json({ birds });
});

// ─── Ajouter un oiseau ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const {
    name, ring_number, sex, birth_date, mutation, genetics,
    photo, father_id, mother_id, status, transfer_to, transfer_date,
    transfer_notes, is_public, notes, species
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Le nom est requis.' });

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO birds (
      user_id, species, name, ring_number, sex, birth_date, mutation, genetics,
      photo, father_id, mother_id, status, transfer_to, transfer_date,
      transfer_notes, is_public, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session.userId,
    species || 'budgerigar',
    name,
    ring_number || null,
    sex || 'unknown',
    birth_date || null,
    mutation || null,
    genetics || null,
    photo || null,
    father_id || null,
    mother_id || null,
    status || 'active',
    transfer_to || null,
    transfer_date || null,
    transfer_notes || null,
    is_public ? 1 : 0,
    notes || null
  );

  const bird = db.prepare('SELECT * FROM birds WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ bird });
});

// ─── Détail d'un oiseau ──────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const db = getDb();
  const bird = db.prepare(`
    SELECT b.*,
      f.name AS father_name, f.mutation AS father_mutation, f.sex AS father_sex,
      m.name AS mother_name, m.mutation AS mother_mutation, m.sex AS mother_sex
    FROM birds b
    LEFT JOIN birds f ON b.father_id = f.id
    LEFT JOIN birds m ON b.mother_id = m.id
    WHERE b.id = ? AND b.user_id = ?
  `).get(req.params.id, req.session.userId);

  if (!bird) return res.status(404).json({ error: 'Oiseau introuvable.' });

  // Récupérer les enfants
  const children = db.prepare(`
    SELECT id, name, sex, mutation, birth_date, status
    FROM birds
    WHERE (father_id = ? OR mother_id = ?) AND user_id = ?
  `).all(bird.id, bird.id, req.session.userId);

  res.json({ bird, children });
});

// ─── Modifier un oiseau ──────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM birds WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Oiseau introuvable.' });

  const {
    name, ring_number, sex, birth_date, mutation, genetics,
    photo, father_id, mother_id, status, transfer_to, transfer_date,
    transfer_notes, is_public, notes, species
  } = req.body;

  db.prepare(`
    UPDATE birds SET
      species = ?, name = ?, ring_number = ?, sex = ?, birth_date = ?,
      mutation = ?, genetics = ?, photo = ?, father_id = ?, mother_id = ?,
      status = ?, transfer_to = ?, transfer_date = ?, transfer_notes = ?,
      is_public = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    species || 'budgerigar',
    name,
    ring_number || null,
    sex || 'unknown',
    birth_date || null,
    mutation || null,
    genetics || null,
    photo || null,
    father_id || null,
    mother_id || null,
    status || 'active',
    transfer_to || null,
    transfer_date || null,
    transfer_notes || null,
    is_public ? 1 : 0,
    notes || null,
    req.params.id,
    req.session.userId
  );

  const bird = db.prepare('SELECT * FROM birds WHERE id = ?').get(req.params.id);
  res.json({ bird });
});

// ─── Supprimer un oiseau ─────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM birds WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Oiseau introuvable.' });

  db.prepare('DELETE FROM birds WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  res.json({ success: true });
});

// ─── Pedigree d'un oiseau (3 générations) ────────────────────────────────────
router.get('/:id/pedigree', (req, res) => {
  const db = getDb();

  function getBird(id, userId) {
    if (!id) return null;
    return db.prepare(`
      SELECT id, name, sex, mutation, birth_date, ring_number
      FROM birds WHERE id = ? AND user_id = ?
    `).get(id, userId);
  }

  function buildPedigree(id, depth, userId) {
    if (!id || depth === 0) return null;
    const bird = getBird(id, userId);
    if (!bird) return null;

    // Récupérer les identifiants des parents
    const full = db.prepare('SELECT father_id, mother_id FROM birds WHERE id = ?').get(id);
    return {
      ...bird,
      father: buildPedigree(full?.father_id, depth - 1, userId),
      mother: buildPedigree(full?.mother_id, depth - 1, userId)
    };
  }

  const pedigree = buildPedigree(req.params.id, 3, req.session.userId);
  if (!pedigree) return res.status(404).json({ error: 'Oiseau introuvable.' });

  res.json({ pedigree });
});

// ─── Export des données personnelles en JSON ──────────────────────────────────
router.get('/export/json', (req, res) => {
  const db = getDb();
  const birds = db.prepare('SELECT * FROM birds WHERE user_id = ?').all(req.session.userId);
  const pairings = db.prepare('SELECT * FROM pairings WHERE user_id = ?').all(req.session.userId);
  const clutches = db.prepare('SELECT * FROM clutches WHERE user_id = ?').all(req.session.userId);
  const user = db.prepare('SELECT id, email, farm_name, region, description, contact_email, contact_phone, contact_social, created_at FROM users WHERE id = ?').get(req.session.userId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="budgibook-export.json"');
  res.json({ user, birds, pairings, clutches, exported_at: new Date().toISOString() });
});

module.exports = router;
