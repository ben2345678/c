/**
 * Routes d'administration
 * GET    /api/admin/stats             — statistiques globales
 * GET    /api/admin/users             — liste des éleveurs
 * PUT    /api/admin/users/:id/toggle  — activer/désactiver un compte
 * DELETE /api/admin/users/:id         — supprimer un compte
 */

const express = require('express');
const { getDb } = require('../database');
const { requireAdmin } = require('./middleware');

const router = express.Router();
router.use(requireAdmin);

// ─── Statistiques globales ───────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const db = getDb();

  const totalUsers  = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'breeder'").get().n;
  const activeUsers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'breeder' AND is_active = 1").get().n;
  const totalBirds  = db.prepare('SELECT COUNT(*) AS n FROM birds').get().n;
  const totalPairs  = db.prepare('SELECT COUNT(*) AS n FROM pairings').get().n;
  const totalClutches = db.prepare('SELECT COUNT(*) AS n FROM clutches').get().n;

  res.json({ stats: { totalUsers, activeUsers, totalBirds, totalPairs, totalClutches } });
});

// ─── Liste des éleveurs ──────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.farm_name, u.region, u.is_active, u.created_at,
           COUNT(b.id) AS bird_count
    FROM users u
    LEFT JOIN birds b ON b.user_id = u.id
    WHERE u.role = 'breeder'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  res.json({ users });
});

// ─── Activer / Désactiver un compte ─────────────────────────────────────────
router.put('/users/:id/toggle', (req, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id, is_active FROM users WHERE id = ? AND role = 'breeder'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  const newStatus = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

  res.json({ success: true, is_active: newStatus });
});

// ─── Supprimer un compte ─────────────────────────────────────────────────────
router.delete('/users/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'breeder'").get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  // La suppression en cascade est gérée par SQLite (ON DELETE CASCADE)
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
