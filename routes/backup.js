const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/backup  — export JSON complet
router.get('/', (req, res) => {
  const data = {
    meta: {
      app:     'BudgiBook Local',
      version: '1.0.0',
      date:    new Date().toISOString()
    },
    elevage:  db.prepare('SELECT * FROM elevage WHERE id=1').get(),
    oiseaux:  db.prepare('SELECT * FROM oiseaux  ORDER BY id').all(),
    nichees:  db.prepare('SELECT * FROM nichees  ORDER BY id').all(),
    poussins: db.prepare('SELECT * FROM poussins ORDER BY id').all()
  };

  const filename = `budgibook_backup_${new Date().toISOString().slice(0,10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(data);
});

// POST /api/backup/restore  — restaurer depuis un JSON
router.post('/restore', express.json({ limit: '10mb' }), (req, res) => {
  const { elevage, oiseaux, nichees, poussins } = req.body;
  if (!oiseaux || !nichees) return res.status(400).json({ error: 'Fichier invalide' });

  const restore = db.transaction(() => {
    // Clear
    db.prepare('DELETE FROM poussins').run();
    db.prepare('DELETE FROM nichees').run();
    db.prepare('DELETE FROM oiseaux').run();

    if (elevage) {
      db.prepare('UPDATE elevage SET nom=?, region=?, description=?, contact=? WHERE id=1')
        .run(elevage.nom||'', elevage.region||'', elevage.description||'', elevage.contact||'');
    }

    // Restore oiseaux (without parent refs first to avoid FK issues)
    for (const o of oiseaux) {
      db.prepare(`
        INSERT INTO oiseaux (id,nom,bague,sexe,date_naissance,mutation,genetique_portee,
          photo,pere_id,mere_id,statut,destinataire,date_transfert,notes_sante,notes,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        o.id, o.nom, o.bague||'', o.sexe||'inconnu', o.date_naissance||null,
        o.mutation||'', o.genetique_portee||'', o.photo||null,
        o.pere_id||null, o.mere_id||null, o.statut||'actif',
        o.destinataire||'', o.date_transfert||null,
        o.notes_sante||'', o.notes||'', o.created_at||new Date().toISOString()
      );
    }

    for (const n of nichees) {
      db.prepare(`
        INSERT INTO nichees (id,male_id,femelle_id,date_mise_en_nid,date_ponte,
          nb_oeufs,nb_eclos,date_envol,statut,notes,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        n.id, n.male_id, n.femelle_id, n.date_mise_en_nid||null, n.date_ponte||null,
        n.nb_oeufs||0, n.nb_eclos||0, n.date_envol||null, n.statut||'en_cours',
        n.notes||'', n.created_at||new Date().toISOString()
      );
    }

    for (const p of (poussins||[])) {
      db.prepare('INSERT OR IGNORE INTO poussins (id,nichee_id,oiseau_id) VALUES (?,?,?)')
        .run(p.id, p.nichee_id, p.oiseau_id);
    }
  });

  try {
    restore();
    res.json({ ok: true, message: 'Données restaurées avec succès' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
