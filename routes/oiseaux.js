const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../database');

// ── Multer setup ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/oiseaux'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `oiseau_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté'));
  }
});

// ── Queries ─────────────────────────────────────────────────
const SELECT_BASE = `
  SELECT o.*,
    p.nom   AS pere_nom,   p.bague AS pere_bague,
    m.nom   AS mere_nom,   m.bague AS mere_bague
  FROM oiseaux o
  LEFT JOIN oiseaux p ON o.pere_id = p.id
  LEFT JOIN oiseaux m ON o.mere_id = m.id
`;

// GET /api/oiseaux
router.get('/', (req, res) => {
  const { statut, sexe } = req.query;
  const conditions = [];
  const params = [];

  if (statut) { conditions.push('o.statut = ?'); params.push(statut); }
  if (sexe)   { conditions.push('o.sexe = ?');   params.push(sexe); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(SELECT_BASE + where + ' ORDER BY o.nom COLLATE NOCASE').all(...params);
  res.json(rows);
});

// GET /api/oiseaux/:id
router.get('/:id', (req, res) => {
  const oiseau = db.prepare(SELECT_BASE + ' WHERE o.id = ?').get(req.params.id);
  if (!oiseau) return res.status(404).json({ error: 'Oiseau non trouvé' });

  // Descendance connue
  oiseau.descendance = db.prepare(`
    SELECT o.id, o.nom, o.bague, o.sexe, o.mutation, o.statut, o.photo
    FROM oiseaux o
    JOIN poussins pu ON o.id = pu.oiseau_id
    JOIN nichees  n  ON pu.nichee_id = n.id
    WHERE n.male_id = ? OR n.femelle_id = ?
    ORDER BY o.nom COLLATE NOCASE
  `).all(req.params.id, req.params.id);

  res.json(oiseau);
});

// POST /api/oiseaux
router.post('/', (req, res) => {
  const {
    nom, bague, sexe, date_naissance, mutation, genetique_portee,
    pere_id, mere_id, statut, destinataire, date_transfert, notes_sante, notes
  } = req.body;

  if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est requis' });

  const result = db.prepare(`
    INSERT INTO oiseaux
      (nom, bague, sexe, date_naissance, mutation, genetique_portee,
       pere_id, mere_id, statut, destinataire, date_transfert, notes_sante, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    nom.trim(), bague||'', sexe||'inconnu', date_naissance||null,
    mutation||'', genetique_portee||'',
    pere_id||null, mere_id||null,
    statut||'actif', destinataire||'', date_transfert||null,
    notes_sante||'', notes||''
  );

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/oiseaux/:id
router.put('/:id', (req, res) => {
  const {
    nom, bague, sexe, date_naissance, mutation, genetique_portee,
    pere_id, mere_id, statut, destinataire, date_transfert, notes_sante, notes
  } = req.body;

  if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est requis' });

  const info = db.prepare(`
    UPDATE oiseaux SET
      nom=?, bague=?, sexe=?, date_naissance=?, mutation=?, genetique_portee=?,
      pere_id=?, mere_id=?, statut=?, destinataire=?, date_transfert=?,
      notes_sante=?, notes=?
    WHERE id=?
  `).run(
    nom.trim(), bague||'', sexe||'inconnu', date_naissance||null,
    mutation||'', genetique_portee||'',
    pere_id||null, mere_id||null,
    statut||'actif', destinataire||'', date_transfert||null,
    notes_sante||'', notes||'', req.params.id
  );

  if (info.changes === 0) return res.status(404).json({ error: 'Oiseau non trouvé' });
  res.json({ ok: true });
});

// DELETE /api/oiseaux/:id
router.delete('/:id', (req, res) => {
  const oiseau = db.prepare('SELECT photo FROM oiseaux WHERE id=?').get(req.params.id);
  if (!oiseau) return res.status(404).json({ error: 'Oiseau non trouvé' });

  if (oiseau.photo) {
    const p = path.join(__dirname, '../uploads', oiseau.photo);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  db.prepare('DELETE FROM oiseaux WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/oiseaux/:id/photo
router.post('/:id/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune photo fournie' });

  const filename = `oiseaux/${req.file.filename}`;

  // Delete old photo
  const old = db.prepare('SELECT photo FROM oiseaux WHERE id=?').get(req.params.id);
  if (old?.photo) {
    const p = path.join(__dirname, '../uploads', old.photo);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  db.prepare('UPDATE oiseaux SET photo=? WHERE id=?').run(filename, req.params.id);
  res.json({ photo: filename });
});

module.exports = router;
