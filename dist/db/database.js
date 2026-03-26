"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
let dbInstance = null;
function initDb() {
    if (dbInstance)
        return dbInstance;
    // Use a synchronous connection with better-sqlite3
    dbInstance = new better_sqlite3_1.default(path_1.default.join(__dirname, '../../database.sqlite'));
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
      out_port INTEGER NOT NULL,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id) ON DELETE CASCADE
    );
  `);
    console.log('📦 Database initialized with better-sqlite3 (Multitenant Schema)');
    return dbInstance;
}
function getDb() {
    if (!dbInstance) {
        return initDb();
    }
    return dbInstance;
}
