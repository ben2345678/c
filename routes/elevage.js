const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/elevage')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/elevage
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM elevage WHERE id=1').get());
});

// PUT /api/elevage
router.put('/', (req, res) => {
  const { nom, region, description, contact } = req.body;
  db.prepare('UPDATE elevage SET nom=?, region=?, description=?, contact=? WHERE id=1')
    .run(nom||'Mon Élevage', region||'', description||'', contact||'');
  res.json({ ok: true });
});

// POST /api/elevage/logo
router.post('/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

  const filename = `elevage/${req.file.filename}`;
  const old = db.prepare('SELECT logo FROM elevage WHERE id=1').get();
  if (old?.logo) {
    const p = path.join(__dirname, '../uploads', old.logo);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.prepare('UPDATE elevage SET logo=? WHERE id=1').run(filename);
  res.json({ logo: filename });
});

module.exports = router;
