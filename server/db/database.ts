import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function initDb(): Database.Database {
  if (dbInstance) return dbInstance;

  // Use a synchronous connection with better-sqlite3
  dbInstance = new Database(path.join(__dirname, '../../database.sqlite'));

  // Enable WAL mode for better concurrent performance
  dbInstance.pragma('journal_mode = WAL');
  // Enforce foreign keys
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      streamid TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      delay_seconds INTEGER NOT NULL,
      out_port INTEGER NOT NULL UNIQUE,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS remi (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      out_port INTEGER NOT NULL UNIQUE,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS simulcasts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      destination_name TEXT NOT NULL,
      rtmp_url TEXT NOT NULL,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compliance (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      output_path TEXT NOT NULL,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
    );
  `);

  console.log('📦 Database initialized with better-sqlite3 (Multitenant Schema)');
  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}
