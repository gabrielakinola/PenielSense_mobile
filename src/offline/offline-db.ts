import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

const DB_KEY_NAME = 'peniel.offline-db-key';
const DB_NAME = 'peniel-care.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function encryptionKey() {
  const existing = await SecureStore.getItemAsync(DB_KEY_NAME);
  if (existing) return existing;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DB_KEY_NAME, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return value;
}

export async function offlineDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      const key = await encryptionKey();
      // key is generated as lowercase hexadecimal only.
      await db.execAsync(`PRAGMA key = '${key}'; PRAGMA journal_mode = WAL;`);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS offline_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          owner_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS offline_outbox (
          id TEXT PRIMARY KEY NOT NULL,
          owner_id TEXT NOT NULL,
          method TEXT NOT NULL,
          url TEXT NOT NULL,
          payload TEXT,
          created_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS offline_outbox_owner_created
          ON offline_outbox(owner_id, created_at);
      `);
      return db;
    })();
  }
  return databasePromise;
}

export async function writeOfflineCache(ownerId: string, key: string, value: unknown) {
  const db = await offlineDatabase();
  await db.runAsync(
    `INSERT INTO offline_cache(cache_key, owner_id, payload, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET owner_id=excluded.owner_id,
       payload=excluded.payload, updated_at=excluded.updated_at`,
    key, ownerId, JSON.stringify(value), Date.now(),
  );
}

export async function readOfflineCache<T>(ownerId: string, key: string): Promise<T | null> {
  const db = await offlineDatabase();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM offline_cache WHERE cache_key = ? AND owner_id = ?',
    key, ownerId,
  );
  return row ? (JSON.parse(row.payload) as T) : null;
}

export interface OfflineMutation {
  id: string;
  ownerId: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
}

export async function enqueueOfflineMutation(
  id: string,
  ownerId: string,
  method: OfflineMutation['method'],
  url: string,
  payload: unknown,
) {
  const db = await offlineDatabase();
  await db.runAsync(
    'INSERT INTO offline_outbox(id, owner_id, method, url, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, ownerId, method, url, JSON.stringify(payload ?? null), Date.now(),
  );
  return id;
}

export async function pendingOfflineMutations(ownerId: string) {
  const db = await offlineDatabase();
  const rows = await db.getAllAsync<{
    id: string; owner_id: string; method: OfflineMutation['method']; url: string;
    payload: string; created_at: number; attempts: number;
  }>('SELECT * FROM offline_outbox WHERE owner_id = ? ORDER BY created_at ASC', ownerId);
  return rows.map((row) => ({
    id: row.id, ownerId: row.owner_id, method: row.method, url: row.url,
    payload: JSON.parse(row.payload), createdAt: row.created_at, attempts: row.attempts,
  } satisfies OfflineMutation));
}

export async function removeOfflineMutation(id: string) {
  const db = await offlineDatabase();
  await db.runAsync('DELETE FROM offline_outbox WHERE id = ?', id);
}

export async function markOfflineMutationFailed(id: string, message: string) {
  const db = await offlineDatabase();
  await db.runAsync(
    'UPDATE offline_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    message.slice(0, 500), id,
  );
}

export async function clearOfflineData(ownerId: string) {
  const db = await offlineDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM offline_cache WHERE owner_id = ?', ownerId);
    await db.runAsync('DELETE FROM offline_outbox WHERE owner_id = ?', ownerId);
  });
}
