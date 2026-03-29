/**
 * BudgiBook - Module de base de données
 * Utilise better-sqlite3 pour des opérations synchrones simples.
 * La structure est conçue pour supporter facilement d'autres espèces d'oiseaux
 * via le champ `species` dans la table `birds`.
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'budgibook.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    -- =============================================
    -- TABLE : users (éleveurs et administrateurs)
    -- =============================================
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'breeder', -- 'breeder' | 'admin'
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      -- Informations de la vitrine publique
      farm_name   TEXT,
      region      TEXT,
      description TEXT,
      -- Coordonnées de contact (affichées sur la vitrine si renseignées)
      contact_email    TEXT,
      contact_phone    TEXT,
      contact_social   TEXT,
      -- Photo de profil (base64)
      profile_photo TEXT
    );

    -- =============================================
    -- TABLE : birds (oiseaux)
    -- Conçue pour supporter d'autres espèces via le champ species
    -- =============================================
    CREATE TABLE IF NOT EXISTS birds (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      species       TEXT    NOT NULL DEFAULT 'budgerigar', -- extensible : 'lovebird', 'cockatiel', etc.
      name          TEXT    NOT NULL,
      ring_number   TEXT,   -- numéro de bague (optionnel)
      sex           TEXT    NOT NULL DEFAULT 'unknown', -- 'male' | 'female' | 'unknown'
      birth_date    TEXT,
      mutation      TEXT,   -- mutation / couleur (texte libre)
      genetics      TEXT,   -- mutations portées non visibles (texte libre)
      photo         TEXT,   -- image encodée en base64
      father_id     INTEGER REFERENCES birds(id) ON DELETE SET NULL,
      mother_id     INTEGER REFERENCES birds(id) ON DELETE SET NULL,
      status        TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'sold' | 'given' | 'deceased'
      -- Informations de cession (si vendu ou donné)
      transfer_to   TEXT,   -- nom acheteur / destinataire
      transfer_date TEXT,
      transfer_notes TEXT,
      -- Visibilité sur la vitrine publique
      is_public     INTEGER NOT NULL DEFAULT 0,
      notes         TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- =============================================
    -- TABLE : pairings (accouplements)
    -- =============================================
    CREATE TABLE IF NOT EXISTS pairings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      male_id     INTEGER NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
      female_id   INTEGER NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
      notes       TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- =============================================
    -- TABLE : clutches (nichées)
    -- =============================================
    CREATE TABLE IF NOT EXISTS clutches (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      pairing_id    INTEGER NOT NULL REFERENCES pairings(id) ON DELETE CASCADE,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nest_date     TEXT,   -- date de mise en nid
      laying_date   TEXT,   -- date de ponte
      eggs_count    INTEGER DEFAULT 0,
      hatched_count INTEGER DEFAULT 0,
      fledge_date   TEXT,   -- date d'envol
      status        TEXT    NOT NULL DEFAULT 'ongoing', -- 'ongoing' | 'finished' | 'abandoned'
      notes         TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Index pour accélérer les recherches courantes
    CREATE INDEX IF NOT EXISTS idx_birds_user    ON birds(user_id);
    CREATE INDEX IF NOT EXISTS idx_birds_status  ON birds(status);
    CREATE INDEX IF NOT EXISTS idx_birds_sex     ON birds(sex);
    CREATE INDEX IF NOT EXISTS idx_pairings_user ON pairings(user_id);
    CREATE INDEX IF NOT EXISTS idx_clutches_user ON clutches(user_id);
  `);

  // Créer le compte administrateur par défaut si absent
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (email, password, role, farm_name)
      VALUES ('admin@budgibook.fr', ?, 'admin', 'Administration BudgiBook')
    `).run(hash);
    console.log('[DB] Compte admin créé : admin@budgibook.fr / admin123');
  }
}

module.exports = { getDb };
