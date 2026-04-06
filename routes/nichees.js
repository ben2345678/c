const express = require('express');
const router  = express.Router();
const db      = require('../database');

const SELECT_BASE = `
  SELECT n.*,
    m.nom AS male_nom,    m.bague AS male_bague,    m.mutation AS male_mutation,    m.photo AS male_photo,
    f.nom AS femelle_nom, f.bague AS femelle_bague, f.mutation AS femelle_mutation, f.photo AS femelle_photo,
    (SELECT COUNT(*) FROM poussins p WHERE p.nichee_id = n.id) AS nb_poussins_enregistres
  FROM nichees n
  JOIN oiseaux m ON n.male_id = m.id
  JOIN oiseaux f ON n.femelle_id = f.id
`;

// GET /api/nichees
router.get('/', (req, res) => {
  const { statut } = req.query;
  const where = statut ? ' WHERE n.statut = ?' : '';
  const rows  = db.prepare(SELECT_BASE + where + ' ORDER BY n.created_at DESC').all(...(statut ? [statut] : []));
  res.json(rows);
});

// GET /api/nichees/:id
router.get('/:id', (req, res) => {
  const nichee = db.prepare(SELECT_BASE + ' WHERE n.id = ?').get(req.params.id);
  if (!nichee) return res.status(404).json({ error: 'Nichée non trouvée' });

  nichee.poussins = db.prepare(`
    SELECT o.id, o.nom, o.bague, o.sexe, o.mutation, o.statut, o.photo
    FROM oiseaux o
    JOIN poussins p ON o.id = p.oiseau_id
    WHERE p.nichee_id = ?
    ORDER BY o.nom COLLATE NOCASE
  `).all(req.params.id);

  res.json(nichee);
});

// POST /api/nichees
router.post('/', (req, res) => {
  const { male_id, femelle_id, date_mise_en_nid, date_ponte, nb_oeufs, nb_eclos, date_envol, statut, notes } = req.body;
  if (!male_id || !femelle_id) return res.status(400).json({ error: 'Mâle et femelle requis' });

  const result = db.prepare(`
    INSERT INTO nichees (male_id, femelle_id, date_mise_en_nid, date_ponte, nb_oeufs, nb_eclos, date_envol, statut, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    male_id, femelle_id,
    date_mise_en_nid||null, date_ponte||null,
    nb_oeufs||0, nb_eclos||0,
    date_envol||null, statut||'en_cours', notes||''
  );

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/nichees/:id
router.put('/:id', (req, res) => {
  const { male_id, femelle_id, date_mise_en_nid, date_ponte, nb_oeufs, nb_eclos, date_envol, statut, notes } = req.body;
  if (!male_id || !femelle_id) return res.status(400).json({ error: 'Mâle et femelle requis' });

  const info = db.prepare(`
    UPDATE nichees SET
      male_id=?, femelle_id=?, date_mise_en_nid=?, date_ponte=?,
      nb_oeufs=?, nb_eclos=?, date_envol=?, statut=?, notes=?
    WHERE id=?
  `).run(
    male_id, femelle_id,
    date_mise_en_nid||null, date_ponte||null,
    nb_oeufs||0, nb_eclos||0,
    date_envol||null, statut||'en_cours', notes||'', req.params.id
  );

  if (info.changes === 0) return res.status(404).json({ error: 'Nichée non trouvée' });
  res.json({ ok: true });
});

// DELETE /api/nichees/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM nichees WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Nichée non trouvée' });
  res.json({ ok: true });
});

// POST /api/nichees/:id/poussins — lier un poussin existant
router.post('/:id/poussins', (req, res) => {
  const { oiseau_id } = req.body;
  if (!oiseau_id) return res.status(400).json({ error: 'oiseau_id requis' });

  // Vérifier que l'oiseau existe
  const oiseau = db.prepare('SELECT id, pere_id, mere_id FROM oiseaux WHERE id=?').get(oiseau_id);
  if (!oiseau) return res.status(404).json({ error: 'Oiseau non trouvé' });

  const nichee = db.prepare('SELECT male_id, femelle_id FROM nichees WHERE id=?').get(req.params.id);
  if (!nichee) return res.status(404).json({ error: 'Nichée non trouvée' });

  // Mettre à jour les parents de l'oiseau si pas encore définis
  if (!oiseau.pere_id || !oiseau.mere_id) {
    db.prepare(`
      UPDATE oiseaux
      SET pere_id = COALESCE(pere_id, ?), mere_id = COALESCE(mere_id, ?)
      WHERE id = ?
    `).run(nichee.male_id, nichee.femelle_id, oiseau_id);
  }

  try {
    db.prepare('INSERT INTO poussins (nichee_id, oiseau_id) VALUES (?,?)').run(req.params.id, oiseau_id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Déjà lié à cette nichée' });
  }
});

// DELETE /api/nichees/:id/poussins/:oiseau_id
router.delete('/:id/poussins/:oiseau_id', (req, res) => {
  db.prepare('DELETE FROM poussins WHERE nichee_id=? AND oiseau_id=?').run(req.params.id, req.params.oiseau_id);
  res.json({ ok: true });
});

module.exports = router;
