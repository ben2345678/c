/**
 * Middlewares d'authentification et d'autorisation
 */

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
