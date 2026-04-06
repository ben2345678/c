const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'budgibook.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS elevage (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    nom         TEXT    NOT NULL DEFAULT 'Mon Élevage',
    region      TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    contact     TEXT    NOT NULL DEFAULT '',
    logo        TEXT    DEFAULT NULL
  );

  INSERT OR IGNORE INTO elevage (id, nom) VALUES (1, 'Mon Élevage');

  CREATE TABLE IF NOT EXISTS oiseaux (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nom              TEXT    NOT NULL,
    bague            TEXT    NOT NULL DEFAULT '',
    sexe             TEXT    NOT NULL DEFAULT 'inconnu'
                               CHECK (sexe IN ('male','femelle','inconnu')),
    date_naissance   TEXT    DEFAULT NULL,
    mutation         TEXT    NOT NULL DEFAULT '',
    genetique_portee TEXT    NOT NULL DEFAULT '',
    photo            TEXT    DEFAULT NULL,
    pere_id          INTEGER DEFAULT NULL REFERENCES oiseaux(id) ON DELETE SET NULL,
    mere_id          INTEGER DEFAULT NULL REFERENCES oiseaux(id) ON DELETE SET NULL,
    statut           TEXT    NOT NULL DEFAULT 'actif'
                               CHECK (statut IN ('actif','vendu','donne','decede')),
    destinataire     TEXT    NOT NULL DEFAULT '',
    date_transfert   TEXT    DEFAULT NULL,
    notes_sante      TEXT    NOT NULL DEFAULT '',
    notes            TEXT    NOT NULL DEFAULT '',
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nichees (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    male_id          INTEGER NOT NULL REFERENCES oiseaux(id) ON DELETE CASCADE,
    femelle_id       INTEGER NOT NULL REFERENCES oiseaux(id) ON DELETE CASCADE,
    date_mise_en_nid TEXT    DEFAULT NULL,
    date_ponte       TEXT    DEFAULT NULL,
    nb_oeufs         INTEGER NOT NULL DEFAULT 0,
    nb_eclos         INTEGER NOT NULL DEFAULT 0,
    date_envol       TEXT    DEFAULT NULL,
    statut           TEXT    NOT NULL DEFAULT 'en_cours'
                               CHECK (statut IN ('en_cours','terminee','abandonnee')),
    notes            TEXT    NOT NULL DEFAULT '',
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS poussins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nichee_id  INTEGER NOT NULL REFERENCES nichees(id) ON DELETE CASCADE,
    oiseau_id  INTEGER NOT NULL REFERENCES oiseaux(id) ON DELETE CASCADE,
    UNIQUE (nichee_id, oiseau_id)
  );
`);

module.exports = db;
