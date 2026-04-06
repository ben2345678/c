const express = require('express');
const router  = express.Router();
const db      = require('../database');

function fetchOiseau(id) {
  if (!id) return null;
  return db.prepare(
    'SELECT id, nom, bague, sexe, mutation, photo, pere_id, mere_id FROM oiseaux WHERE id=?'
  ).get(id) || null;
}

function buildTree(id, depth) {
  const o = fetchOiseau(id);
  if (!o) return null;

  const node = { id: o.id, nom: o.nom, bague: o.bague, sexe: o.sexe, mutation: o.mutation, photo: o.photo };

  if (depth > 0) {
    node.pere = buildTree(o.pere_id, depth - 1);
    node.mere = buildTree(o.mere_id, depth - 1);
  }
  return node;
}

// GET /api/pedigree/:id?gen=3
router.get('/:id', (req, res) => {
  const gen = Math.min(parseInt(req.query.gen) || 3, 4);
  const tree = buildTree(parseInt(req.params.id), gen - 1);
  if (!tree) return res.status(404).json({ error: 'Oiseau non trouvé' });
  res.json(tree);
});

module.exports = router;
