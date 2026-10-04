import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { 
  StudentProfile, 
  ParentAccount, 
  WalletTransaction, 
  TermPaymentRecord,
  CurriculumRecord,
  AdminUser,
  UserSession,
  AuditLogEntry
} from './types';
import { ServerCurriculumRecord } from './db';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE_PATH = path.resolve(DATA_DIR, 'brightly_db.json');
const DB_BACKUP_PATH = path.resolve(DATA_DIR, 'brightly_db.bak.json');

export interface PersistentSchema {
  version: number;
  lastUpdated: string;
  admins: AdminUser[];
  parents: ParentAccount[];
  students: StudentProfile[];
  sessions: UserSession[];
  payments: TermPaymentRecord[];
  transactions: WalletTransaction[];
  curriculum: ServerCurriculumRecord[];
  auditLogs: AuditLogEntry[];
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export class PersistenceManager {
  private static isWriting = false;
  private static pendingData: PersistentSchema | null = null;

  public static ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public static isValidSchema(data: any): data is PersistentSchema {
    return Boolean(
      data &&
      typeof data === 'object' &&
      Array.isArray(data.students) &&
      Array.isArray(data.parents) &&
      Array.isArray(data.admins) &&
      Array.isArray(data.payments)
    );
  }

  public static load(): PersistentSchema | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(DB_FILE_PATH)) {
        return null;
      }
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (this.isValidSchema(data)) {
        return data;
      }
      console.warn('[Persistence] Primary DB file failed schema integrity check. Attempting backup restore...');
      return this.restoreFromBackup();
    } catch (err) {
      console.error('[Persistence] Error reading database file, trying backup:', err);
      return this.restoreFromBackup();
    }
  }

  public static restoreFromBackup(): PersistentSchema | null {
    try {
      if (fs.existsSync(DB_BACKUP_PATH)) {
        const raw = fs.readFileSync(DB_BACKUP_PATH, 'utf-8');
        const backupData = JSON.parse(raw);
        if (this.isValidSchema(backupData)) {
          console.log('[Persistence] Successfully restored valid database state from backup file.');
          // Resync primary file
          fs.writeFileSync(DB_FILE_PATH, raw, 'utf-8');
          return backupData;
        }
      }
    } catch (backupErr) {
      console.error('[Persistence] Error reading backup file:', backupErr);
    }
    return null;
  }

  /**
   * Thread-safe / asynchronous serialization queue to prevent corrupted writes under concurrent operations
   */
  public static save(data: PersistentSchema): void {
    this.pendingData = data;
    if (this.isWriting) {
      return;
    }

    this.isWriting = true;
    try {
      while (this.pendingData) {
        const currentData = this.pendingData;
        this.pendingData = null;

        this.ensureDataDir();
        currentData.lastUpdated = new Date().toISOString();
        const serialized = JSON.stringify(currentData, null, 2);
        const tempPath = `${DB_FILE_PATH}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;

        // 1. Write to temporary file
        fs.writeFileSync(tempPath, serialized, 'utf-8');

        // 2. Backup existing valid database file before replacement
        if (fs.existsSync(DB_FILE_PATH)) {
          try {
            fs.copyFileSync(DB_FILE_PATH, DB_BACKUP_PATH);
          } catch {
            // Ignore non-fatal backup copy warning
          }
        }

        // 3. Atomic rename guarantees POSIX atomicity
        fs.renameSync(tempPath, DB_FILE_PATH);
      }
    } catch (err) {
      console.error('[Persistence] Failed to persist database state:', err);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Manual backup export for disaster recovery procedures
   */
  public static createManualBackup(label = 'manual'): string | null {
    try {
      this.ensureDataDir();
      if (fs.existsSync(DB_FILE_PATH)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.resolve(DATA_DIR, `brightly_db.${label}.${timestamp}.bak.json`);
        fs.copyFileSync(DB_FILE_PATH, backupPath);
        return backupPath;
      }
    } catch (err) {
      console.error('[Persistence] Manual backup failed:', err);
    }
    return null;
  }
}
