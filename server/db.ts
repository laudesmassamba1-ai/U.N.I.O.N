import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'union.sqlite');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir) && DB_PATH !== ':memory:') {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  
  // Enable WAL mode and foreign keys
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize all 11 required tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      standfirst TEXT,
      body TEXT NOT NULL,
      lead_image TEXT,
      category TEXT NOT NULL,
      department TEXT,
      nature TEXT NOT NULL,
      status TEXT NOT NULL,
      featured INTEGER DEFAULT 0,
      week_number INTEGER,
      week_start TEXT,
      week_end TEXT,
      sources TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      archived_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS article_revisions (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      revision_number INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      summary TEXT,
      author TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      size INTEGER,
      alt_text TEXT NOT NULL,
      credit TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      flagged INTEGER DEFAULT 0,
      flag_reason TEXT,
      votes_useful INTEGER DEFAULT 0,
      votes_not_useful INTEGER DEFAULT 0,
      report_count INTEGER DEFAULT 0,
      duplicate_of TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS suggestion_votes (
      id TEXT PRIMARY KEY,
      suggestion_id TEXT NOT NULL,
      voter_hash TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(suggestion_id, voter_hash),
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suggestion_responses (
      id TEXT PRIMARY KEY,
      suggestion_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      responder_role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      suggestion_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap (
      id TEXT PRIMARY KEY,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS studio_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passhash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      details TEXT,
      user_role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      member_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT,
      status TEXT NOT NULL DEFAULT 'dossier_recu',
      created_at TEXT NOT NULL,
      card_sent_at TEXT
    );

    -- Journal des sauvegardes : alimenté par le workflow, lu par la sonde de santé.
    CREATE TABLE IF NOT EXISTS backup_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      row_counts TEXT NOT NULL,
      destination TEXT
    );
  `);

  // Initialize default settings if not present
  const existingSettings = db.prepare('SELECT value FROM settings WHERE key = ?').get('suggestions');
  if (!existingSettings) {
    const defaultSettings = JSON.stringify({
      retainedVotes: 25,
      retainedShare: 65,
      archivedVotes: 25,
      archivedShare: 70,
      expiryDays: 60,
      retentionDays: 90,
      editionName: 'Édition de lancement',
    });
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('suggestions', defaultSettings);
  }

  // Initialize default roadmap if not present
  const roadmapCount = db.prepare('SELECT COUNT(*) as count FROM roadmap').get() as { count: number };
  if (roadmapCount.count === 0) {
    const initialSteps = [
      { id: 'step-1', order: 1, title: 'Charte : projet en relecture', status: 'en_cours', desc: 'Soumis à la validation des fondateurs.' },
      { id: 'step-2', order: 2, title: 'Bureau : en constitution', status: 'en_cours', desc: 'Désignation des cinq postes au fur et à mesure.' },
      { id: 'step-3', order: 3, title: 'Dossier légal : à venir', status: 'a_venir', desc: 'Dépôt des statuts dès stabilisation du bureau.' },
    ];
    const insertStep = db.prepare('INSERT INTO roadmap (id, step_order, title, status, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const step of initialSteps) {
      insertStep.run(step.id, step.order, step.title, step.status, step.desc, new Date().toISOString());
    }
  }

  dbInstance = db;
  return db;
}
