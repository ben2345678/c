/**
 * Routes des accouplements et nichées
 * GET    /api/pairings                  — liste des accouplements
 * POST   /api/pairings                  — créer un accouplement
 * PUT    /api/pairings/:id              — modifier un accouplement
 * DELETE /api/pairings/:id              — supprimer un accouplement
 * GET    /api/pairings/:id/clutches     — nichées d'un accouplement
 * POST   /api/pairings/:id/clutches     — ajouter une nichée
 * PUT    /api/pairings/clutches/:cid    — modifier une nichée
 * DELETE /api/pairings/clutches/:cid    — supprimer une nichée
 */

const express = require('express');
const { getDb } = require('../database');
const { requireAuth } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// ─── Liste des accouplements ─────────────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDb();
  const pairings = db.prepare(`
    SELECT p.*,
      m.name AS male_name, m.mutation AS male_mutation, m.ring_number AS male_ring,
      f.name AS female_name, f.mutation AS female_mutation, f.ring_number AS female_ring,
      COUNT(c.id) AS clutch_count
    FROM pairings p
    JOIN birds m ON p.male_id = m.id
    JOIN birds f ON p.female_id = f.id
    LEFT JOIN clutches c ON c.pairing_id = p.id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(req.session.userId);

  res.json({ pairings });
});

// ─── Créer un accouplement ───────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { male_id, female_id, notes } = req.body;
  if (!male_id || !female_id) {
    return res.status(400).json({ error: 'Mâle et femelle requis.' });
  }

  const db = getDb();

  // Vérifier que les oiseaux appartiennent bien à l'éleveur
  const male   = db.prepare('SELECT id, sex FROM birds WHERE id = ? AND user_id = ?').get(male_id, req.session.userId);
  const female = db.prepare('SELECT id, sex FROM birds WHERE id = ? AND user_id = ?').get(female_id, req.session.userId);
  if (!male || !female) return res.status(400).json({ error: 'Oiseaux invalides.' });

  const result = db.prepare(`
    INSERT INTO pairings (user_id, male_id, female_id, notes)
    VALUES (?, ?, ?, ?)
  `).run(req.session.userId, male_id, female_id, notes || null);

  const pairing = db.prepare('SELECT * FROM pairings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ pairing });
});

// ─── Modifier un accouplement ────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM pairings WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Accouplement introuvable.' });

  const { notes, is_active } = req.body;
  db.prepare('UPDATE pairings SET notes = ?, is_active = ? WHERE id = ?').run(
    notes || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id
  );

  res.json({ success: true });
});

// ─── Supprimer un accouplement ───────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM pairings WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Accouplement introuvable.' });

  db.prepare('DELETE FROM pairings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Nichées d'un accouplement ───────────────────────────────────────────────
router.get('/:id/clutches', (req, res) => {
  const db = getDb();
  const pairing = db.prepare('SELECT id FROM pairings WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!pairing) return res.status(404).json({ error: 'Accouplement introuvable.' });

  const clutches = db.prepare('SELECT * FROM clutches WHERE pairing_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ clutches });
});

// ─── Ajouter une nichée ──────────────────────────────────────────────────────
router.post('/:id/clutches', (req, res) => {
  const db = getDb();
  const pairing = db.prepare('SELECT id FROM pairings WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!pairing) return res.status(404).json({ error: 'Accouplement introuvable.' });

  const { nest_date, laying_date, eggs_count, hatched_count, fledge_date, status, notes } = req.body;

  const result = db.prepare(`
    INSERT INTO clutches (pairing_id, user_id, nest_date, laying_date, eggs_count, hatched_count, fledge_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id, req.session.userId,
    nest_date || null, laying_date || null,
    eggs_count || 0, hatched_count || 0,
    fledge_date || null, status || 'ongoing',
    notes || null
  );

  const clutch = db.prepare('SELECT * FROM clutches WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ clutch });
});

// ─── Modifier une nichée ─────────────────────────────────────────────────────
router.put('/clutches/:cid', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM clutches WHERE id = ? AND user_id = ?').get(req.params.cid, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Nichée introuvable.' });

  const { nest_date, laying_date, eggs_count, hatched_count, fledge_date, status, notes } = req.body;

  db.prepare(`
    UPDATE clutches SET
      nest_date = ?, laying_date = ?, eggs_count = ?, hatched_count = ?,
      fledge_date = ?, status = ?, notes = ?
    WHERE id = ?
  `).run(
    nest_date || null, laying_date || null,
    eggs_count || 0, hatched_count || 0,
    fledge_date || null, status || 'ongoing',
    notes || null, req.params.cid
  );

  res.json({ success: true });
});

// ─── Supprimer une nichée ────────────────────────────────────────────────────
router.delete('/clutches/:cid', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM clutches WHERE id = ? AND user_id = ?').get(req.params.cid, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Nichée introuvable.' });

  db.prepare('DELETE FROM clutches WHERE id = ?').run(req.params.cid);
  res.json({ success: true });
});

// ─── Toutes les nichées de l'éleveur ─────────────────────────────────────────
router.get('/all-clutches', (req, res) => {
  const db = getDb();
  const clutches = db.prepare(`
    SELECT c.*,
      m.name AS male_name, f.name AS female_name
    FROM clutches c
    JOIN pairings p ON c.pairing_id = p.id
    JOIN birds m ON p.male_id = m.id
    JOIN birds f ON p.female_id = f.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.session.userId);

  res.json({ clutches });
});

module.exports = router;
