/**
 * Brightly Home Lesson — Repository Factory and Runtime Provider Selector
 * 
 * Manages explicit environment-based repository instantiation.
 * Enforces single source of truth rules:
 * - NO split-brain persistence.
 * - NO silent fallback from failed PostgreSQL to JSON.
 * - Clear identification of development-only JSON persistence vs durable PostgreSQL.
 */

import {
  type IRepositoryContainer,
  type IParentRepository,
  type IPupilRepository,
  type ICompletedLessonRepository,
  type CompletedLessonRecord,
  type IPaymentRepository,
  type IWalletRepository,
  type ICreditLedgerRepository,
  type IReferralRepository,
  type ICurriculumRepository,
  type IAuditLogRepository,
  type ISessionRepository,
  type IPasswordResetOtpRepository,
  type IAdminRepository,
  type IPilotRepository
} from './types';
import {
  JsonParentRepository,
  JsonPupilRepository,
  JsonCompletedLessonRepository,
  JsonPaymentRepository,
  JsonWalletRepository,
  JsonCreditLedgerRepository,
  JsonReferralRepository,
  JsonCurriculumRepository,
  JsonAuditLogRepository,
  JsonSessionRepository,
  JsonPasswordResetOtpRepository,
  JsonAdminRepository,
  JsonPilotRepository
} from './json/jsonRepositories';
import {
  PostgresParentRepository,
  PostgresPupilRepository,
  PostgresCompletedLessonRepository,
  PostgresPaymentRepository,
  PostgresWalletRepository,
  PostgresCreditLedgerRepository,
  PostgresReferralRepository,
  PostgresCurriculumRepository,
  PostgresAuditLogRepository,
  PostgresSessionRepository,
  PostgresPasswordResetOtpRepository,
  PostgresAdminRepository,
  PostgresPilotRepository
} from './postgres/postgresRepositories';
import { PostgresDatabaseAdapter, postgresAdapter } from '../db/postgresAdapter';

export type DatabaseProviderType = 'postgres' | 'json';

export interface RepositoryInitializationOptions {
  provider?: DatabaseProviderType;
  allowJsonInProduction?: boolean;
}

class RepositoryContainer implements IRepositoryContainer {
  constructor(
    public readonly providerName: 'postgres' | 'json',
    public readonly isDurable: boolean,
    public readonly parents: IParentRepository,
    public readonly pupils: IPupilRepository,
    public readonly completedLessons: ICompletedLessonRepository,
    public readonly payments: IPaymentRepository,
    public readonly wallet: IWalletRepository,
    public readonly creditLedger: ICreditLedgerRepository,
    public readonly referrals: IReferralRepository,
    public readonly curriculum: ICurriculumRepository,
    public readonly auditLogs: IAuditLogRepository,
    public readonly sessions: ISessionRepository,
    public readonly otps: IPasswordResetOtpRepository,
    public readonly admins: IAdminRepository,
    public readonly pilot: IPilotRepository
  ) {}
}

let activeContainer: IRepositoryContainer | null = null;
let activeProvider: DatabaseProviderType = 'json';

/**
 * Determines the authoritative database provider based on environment variables.
 * Explicit precedence:
 * 1. DATABASE_PROVIDER ('postgres' | 'json')
 * 2. Presence of DATABASE_URL -> 'postgres'
 * 3. Default to 'json' (strictly marked as development-only)
 */
export function resolveDatabaseProvider(): DatabaseProviderType {
  const envProvider = process.env.DATABASE_PROVIDER?.toLowerCase().trim();
  if (envProvider === 'postgres' || envProvider === 'postgresql') {
    return 'postgres';
  }
  if (envProvider === 'json') {
    return 'json';
  }
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return 'postgres';
  }
  return 'json';
}

/**
 * Creates and initializes the active repository container.
 * Injects memory accessors and persistence callbacks for the JSON provider.
 */
export function initializeRepositoryContainer(
  jsonAccessors: {
    getParents: () => Map<string, any>;
    getStudents: () => Map<string, any>;
    getCurriculum: () => Map<string, any>;
    getPayments: () => Map<string, any>;
    getWalletTx: () => any[];
    getCreditLedger: () => any[];
    getReferrals: () => Map<string, any>;
    getAuditLogs: () => any[];
    getSessions: () => Map<string, any>;
    getAdmins: () => Map<string, any>;
    getPilotFeedbacks: () => Map<string, any>;
    getPilotIncidents: () => Map<string, any>;
    persist: () => void;
  },
  options: RepositoryInitializationOptions = {}
): IRepositoryContainer {
  const provider = options.provider || resolveDatabaseProvider();
  activeProvider = provider;

  const isProduction = process.env.NODE_ENV === 'production';

  // Security gate: JSON persistence must NEVER be permitted as authoritative production storage
  if (isProduction && provider === 'json' && !options.allowJsonInProduction) {
    console.error('[DATABASE ARCHITECTURE CRITICAL DEFECT] JSON persistence is strictly forbidden in production.');
    throw new Error('DURABILITY_FATAL_ERROR: Production environment requires a managed PostgreSQL / Cloud SQL database. Set DATABASE_URL.');
  }

  if (provider === 'postgres') {
    const adapter = PostgresDatabaseAdapter.getInstance();
    if (!adapter.isConfigured()) {
      // FAIL SAFELY: No silent fallback! Report blocked/error state explicitly.
      console.error('[DATABASE CONFIGURATION ERROR] DATABASE_PROVIDER=postgres requested, but DATABASE_URL is not configured.');
      throw new Error('POSTGRES_CONFIGURATION_ERROR: DATABASE_URL is missing. Silent fallback to JSON is strictly prohibited.');
    }

    console.log('[DATABASE PROVIDER] Initializing authoritative POSTGRESQL repository layer.');

    activeContainer = new RepositoryContainer(
      'postgres',
      true,
      new PostgresParentRepository(adapter),
      new PostgresPupilRepository(adapter),
      new PostgresCompletedLessonRepository(adapter),
      new PostgresPaymentRepository(adapter),
      new PostgresWalletRepository(adapter),
      new PostgresCreditLedgerRepository(adapter),
      new PostgresReferralRepository(adapter),
      new PostgresCurriculumRepository(adapter),
      new PostgresAuditLogRepository(adapter),
      new PostgresSessionRepository(adapter),
      new PostgresPasswordResetOtpRepository(adapter),
      new PostgresAdminRepository(adapter),
      new PostgresPilotRepository(adapter)
    );
  } else {
    console.log('[DATABASE PROVIDER] Running in DEVELOPMENT_ONLY_JSON_STORAGE mode. Ephemeral / synthetic fixtures only.');

    activeContainer = new RepositoryContainer(
      'json',
      false,
      new JsonParentRepository(jsonAccessors.getParents, jsonAccessors.persist),
      new JsonPupilRepository(jsonAccessors.getStudents, jsonAccessors.persist),
      new JsonCompletedLessonRepository(jsonAccessors.getStudents, jsonAccessors.persist),
      new JsonPaymentRepository(jsonAccessors.getPayments, jsonAccessors.persist),
      new JsonWalletRepository(jsonAccessors.getWalletTx, jsonAccessors.getParents, jsonAccessors.persist),
      new JsonCreditLedgerRepository(jsonAccessors.getCreditLedger, jsonAccessors.persist),
      new JsonReferralRepository(jsonAccessors.getReferrals, jsonAccessors.persist),
      new JsonCurriculumRepository(jsonAccessors.getCurriculum, jsonAccessors.persist),
      new JsonAuditLogRepository(jsonAccessors.getAuditLogs, jsonAccessors.persist),
      new JsonSessionRepository(jsonAccessors.getSessions, jsonAccessors.persist),
      new JsonPasswordResetOtpRepository(),
      new JsonAdminRepository(jsonAccessors.getAdmins, jsonAccessors.persist),
      new JsonPilotRepository(jsonAccessors.getPilotFeedbacks, jsonAccessors.getPilotIncidents, jsonAccessors.persist)
    );
  }

  return activeContainer;
}

export function getRepositoryContainer(): IRepositoryContainer {
  if (!activeContainer) {
    throw new Error('REPOSITORY_CONTAINER_UNINITIALIZED: initializeRepositoryContainer() must be called at system bootstrap.');
  }
  return activeContainer;
}

export function getActiveDatabaseProvider(): DatabaseProviderType {
  return activeProvider;
}

export type {
  IRepositoryContainer,
  IParentRepository,
  IPupilRepository,
  ICompletedLessonRepository,
  CompletedLessonRecord,
  IPaymentRepository,
  IWalletRepository,
  ICreditLedgerRepository,
  IReferralRepository,
  ICurriculumRepository,
  IAuditLogRepository,
  ISessionRepository,
  IPasswordResetOtpRepository,
  IAdminRepository,
  IPilotRepository
};
