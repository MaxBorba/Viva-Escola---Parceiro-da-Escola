import { MaintenanceRecord, ExtraWork, AccessLog, MasterNodeStatus } from '../types';
import { INITIAL_RECORDS, INITIAL_EXTRA_WORKS } from '../data/schools';
import { getSixMonthsRetentionDate } from './brasiliaTime';

export const MASTER_STORAGE_NODE = 'Notebook MaxBorba';
export const OFFICIAL_PHONE_REPOSITORY = '998299505';
export const OFFICIAL_MASTER_IP_ID = '835E8FB-7F16-4C93-B228-3B73FAE5FF24';
export const MASTER_STORAGE_POLICY = 'Ficam registrados até a exclusão ou após 6 meses de salvamento (180 dias de guarda oficial)';
export const FIREBASE_RTDB_URL = 'https://escola-viva-pe-default-rtdb.firebaseio.com';

const STORAGE_KEY = 'parana_maringa_maintenance_records_v3';
const EXTRA_WORKS_STORAGE_KEY = 'parana_maringa_extra_works_v3';
const ACCESS_LOGS_STORAGE_KEY = 'parana_maringa_access_logs_v3';

/**
 * Detects current client device / operating system (Android, Safari iOS, etc.)
 */
export function detectClientDevice(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo Web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone (Safari iOS)';
  if (ua.includes('ipad')) return 'iPad (Safari iOS)';
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Apple Safari';
  if (ua.includes('windows')) return 'Windows Notebook / PC';
  if (ua.includes('macintosh')) return 'MacBook / macOS';
  if (ua.includes('linux')) return 'Linux / Chromebook';
  return 'Navegador Web Multi-IP';
}

// Helper to push updates to backend server asynchronously for Android, Safari, and Desktop cross-device sync
async function syncPushToServer(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', body?: any) {
  try {
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    console.warn(`[Sync Server] Push failed to ${endpoint}:`, err);
  }
}

// Log authentication or critical action to Master Node (Notebook MaxBorba)
export async function logAccessToServer(log: {
  role: 'articulador' | 'direcao' | 'coordenacao';
  schoolCode?: string;
  schoolName?: string;
  authorName?: string;
  enteredPassword?: string;
  action?: string;
}): Promise<void> {
  try {
    await fetch('/api/auth/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
  } catch (err) {
    console.warn('[Audit Log] Falha ao enviar log para o Notebook MaxBorba:', err);
  }
}

// Fetch all records, extra works & access logs from backend server (Notebook MaxBorba)
export async function fetchServerSync(): Promise<{ 
  records: MaintenanceRecord[]; 
  extraWorks: ExtraWork[];
  accessLogs: AccessLog[];
  masterNode?: MasterNodeStatus;
} | null> {
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.records)) {
      saveRecords(data.records);
    }
    if (Array.isArray(data.extraWorks)) {
      saveExtraWorks(data.extraWorks);
    }
    if (Array.isArray(data.accessLogs)) {
      saveAccessLogs(data.accessLogs);
    }
    return {
      records: Array.isArray(data.records) ? data.records : getRecords(),
      extraWorks: Array.isArray(data.extraWorks) ? data.extraWorks : getExtraWorks(),
      accessLogs: Array.isArray(data.accessLogs) ? data.accessLogs : getAccessLogs(),
      masterNode: data.masterNode
    };
  } catch (err) {
    console.warn('[Sync Server] Failed to fetch server sync:', err);
    return null;
  }
}

export function getRecords(): MaintenanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
    return INITIAL_RECORDS;
  } catch (err) {
    console.error('Error loading records from localStorage:', err);
    return INITIAL_RECORDS;
  }
}

export function saveRecords(records: MaintenanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving records to localStorage:', err);
  }
}

export function getAccessLogs(): AccessLog[] {
  try {
    const raw = localStorage.getItem(ACCESS_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading access logs from localStorage:', err);
    return [];
  }
}

export function saveAccessLogs(logs: AccessLog[]): void {
  try {
    localStorage.setItem(ACCESS_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving access logs to localStorage:', err);
  }
}

export function addRecord(record: MaintenanceRecord): MaintenanceRecord[] {
  // Ensure master storage node metadata, device and 06 months retention
  if (!record.masterStorageNode) {
    record.masterStorageNode = MASTER_STORAGE_NODE;
  }
  if (!record.officialPhoneRepository) {
    record.officialPhoneRepository = OFFICIAL_PHONE_REPOSITORY;
  }
  if (!record.officialMasterIpId) {
    record.officialMasterIpId = OFFICIAL_MASTER_IP_ID;
  }
  if (!record.originDevice) {
    record.originDevice = detectClientDevice();
  }
  if (!record.retentionUntil) {
    record.retentionUntil = getSixMonthsRetentionDate(record.createdAt).iso;
  }

  const current = getRecords();
  const exists = current.some(r => r.id === record.id);
  const updated = exists 
    ? current.map(r => r.id === record.id ? record : r)
    : [record, ...current];
  saveRecords(updated);
  // Multi-device server sync
  syncPushToServer('/api/records', 'POST', record);
  return updated;
}

export function updateRecord(id: string, updates: Partial<MaintenanceRecord>): MaintenanceRecord[] {
  const current = getRecords();
  const updated = current.map(rec => rec.id === id ? { ...rec, ...updates } : rec);
  saveRecords(updated);
  // Multi-device server sync
  syncPushToServer(`/api/records/${id}`, 'PUT', updates);
  return updated;
}

export function isTestRecord(record: MaintenanceRecord): boolean {
  const query = 'teste';
  const title = (record.title || '').toLowerCase();
  const desc = (record.description || '').toLowerCase();
  const author = (record.authorName || '').toLowerCase();
  const notes = (record.resolution?.notes || '').toLowerCase();
  const category = (record.category || '').toLowerCase();

  return title.includes(query) ||
    desc.includes(query) ||
    author.includes(query) ||
    notes.includes(query) ||
    category.includes(query) ||
    title.includes('test ') ||
    title.startsWith('test') ||
    title.endsWith('test');
}

export function deleteRecord(id: string): MaintenanceRecord[] {
  const current = getRecords();
  const updated = current.filter(rec => rec.id !== id);
  saveRecords(updated);
  // Multi-device server sync
  syncPushToServer(`/api/records/${id}`, 'DELETE');
  return updated;
}

export function deleteMultipleRecords(ids: string[]): MaintenanceRecord[] {
  const current = getRecords();
  const idSet = new Set(ids);
  const updated = current.filter(rec => !idSet.has(rec.id));
  saveRecords(updated);
  ids.forEach(id => syncPushToServer(`/api/records/${id}`, 'DELETE'));
  return updated;
}

export function deleteRecordsBySchoolId(schoolId: string): { updated: MaintenanceRecord[]; deletedCount: number } {
  const current = getRecords();
  const toDelete = current.filter(r => r.schoolId === schoolId);
  const updated = current.filter(r => r.schoolId !== schoolId);
  saveRecords(updated);
  syncPushToServer(`/api/records/school/${schoolId}`, 'DELETE');
  return { updated, deletedCount: toDelete.length };
}

export function clearTestRecordsBySchoolId(schoolId: string): { updated: MaintenanceRecord[]; deletedCount: number; deletedIds: string[] } {
  const current = getRecords();
  const testRecordsForSchool = current.filter(r => r.schoolId === schoolId && isTestRecord(r));
  const testIds = testRecordsForSchool.map(r => r.id);
  const updated = current.filter(r => !testIds.includes(r.id));
  saveRecords(updated);
  syncPushToServer('/api/records/clear-tests', 'POST', { schoolId });
  return { updated, deletedCount: testIds.length, deletedIds: testIds };
}

export function clearTestRecords(): { updated: MaintenanceRecord[]; deletedCount: number; deletedIds: string[] } {
  const current = getRecords();
  const testIds = current.filter(isTestRecord).map(r => r.id);
  const updated = current.filter(r => !testIds.includes(r.id));
  saveRecords(updated);
  syncPushToServer('/api/records/clear-tests', 'POST', {});
  return { updated, deletedCount: testIds.length, deletedIds: testIds };
}

export function resetToSeedData(): MaintenanceRecord[] {
  saveRecords(INITIAL_RECORDS);
  syncPushToServer('/api/sync', 'POST', { records: INITIAL_RECORDS, extraWorks: INITIAL_EXTRA_WORKS });
  return INITIAL_RECORDS;
}

// -------------------------------------------------------------
// EXTRA WORKS STORAGE (Conforme Plano e Manutenção Extra)
// -------------------------------------------------------------

export function isSampleExtraWork(work: ExtraWork): boolean {
  if (work.id === 'extra-001' || work.id === 'extra-002') return true;
  const title = (work.title || '').toLowerCase();
  const desc = (work.description || '').toLowerCase();
  return title.includes('teste') || desc.includes('teste') || title.includes('exemplo') || desc.includes('exemplo');
}

export function getExtraWorks(): ExtraWork[] {
  try {
    const raw = localStorage.getItem(EXTRA_WORKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXTRA_WORKS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleanWorks = parsed.filter(w => !isSampleExtraWork(w));
      if (cleanWorks.length !== parsed.length) {
        localStorage.setItem(EXTRA_WORKS_STORAGE_KEY, JSON.stringify(cleanWorks));
      }
      return cleanWorks;
    }
    localStorage.setItem(EXTRA_WORKS_STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    console.error('Error loading extra works from localStorage:', err);
    return [];
  }
}

export function saveExtraWorks(works: ExtraWork[]): void {
  try {
    localStorage.setItem(EXTRA_WORKS_STORAGE_KEY, JSON.stringify(works));
  } catch (err) {
    console.error('Error saving extra works to localStorage:', err);
  }
}

export function addExtraWork(work: ExtraWork): ExtraWork[] {
  if (!work.masterStorageNode) {
    work.masterStorageNode = MASTER_STORAGE_NODE;
  }
  if (!work.officialPhoneRepository) {
    work.officialPhoneRepository = OFFICIAL_PHONE_REPOSITORY;
  }
  if (!work.officialMasterIpId) {
    work.officialMasterIpId = OFFICIAL_MASTER_IP_ID;
  }
  if (!work.originDevice) {
    work.originDevice = detectClientDevice();
  }
  if (!work.retentionUntil) {
    work.retentionUntil = getSixMonthsRetentionDate(work.createdAt).iso;
  }

  const current = getExtraWorks();
  const updated = [work, ...current];
  saveExtraWorks(updated);
  syncPushToServer('/api/extra-works', 'POST', work);
  return updated;
}

export function deleteExtraWork(id: string): ExtraWork[] {
  const current = getExtraWorks();
  const updated = current.filter(w => w.id !== id);
  saveExtraWorks(updated);
  syncPushToServer(`/api/extra-works/${id}`, 'DELETE');
  return updated;
}

export function deleteExtraWorksBySchoolId(schoolId: string): { updated: ExtraWork[]; deletedCount: number } {
  const current = getExtraWorks();
  const toDelete = current.filter(w => w.schoolId === schoolId);
  const updated = current.filter(w => w.schoolId !== schoolId);
  saveExtraWorks(updated);
  syncPushToServer(`/api/extra-works/school/${schoolId}`, 'DELETE');
  return { updated, deletedCount: toDelete.length };
}

/**
 * Generate CSV string formatted for Excel and Google Sheets
 */
export function exportRecordsToCSV(records: MaintenanceRecord[]): string {
  const headers = [
    'ID',
    'Escola',
    'Código Escola',
    'Enunciado / Ponto de Atenção',
    'Descrição Detalhada',
    'Categoria',
    'Urgência',
    'Prazo Limite',
    'Data de Registro (Brasília)',
    'Registrado Por (Perfil)',
    'Autor',
    'Status Atual',
    'Devolutiva Coordenação',
    'Data Conclusão / Resolução',
    'Responsável Devolutiva',
    'Novo Prazo (se não realizado)',
    'Link Google Drive'
  ];

  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.schoolName.replace(/"/g, '""')}"`,
    `"${r.schoolCode}"`,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${(r.description || '').replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.urgency.toUpperCase()}"`,
    `"${r.deadline}"`,
    `"${r.formattedDateTimeBrasilia}"`,
    `"${r.createdByRole.toUpperCase()}"`,
    `"${r.authorName}"`,
    `"${r.status.toUpperCase().replace('_', ' ')}"`,
    `"${(r.resolution?.notes || '').replace(/"/g, '""')}"`,
    `"${r.resolution?.resolvedTimeBrasilia || r.resolution?.resolvedDate || '-'}"`,
    `"${(r.resolution?.resolvedBy || '-').replace(/"/g, '""')}"`,
    `"${r.resolution?.newDeadlineIfUnresolved || '-'}"`,
    `"${r.driveUrl}"`
  ]);

  return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
}

/**
 * Copy formatted Tab-separated table to clipboard (perfect for pasting into Google Sheets)
 */
export function formatRecordsForClipboard(records: MaintenanceRecord[]): string {
  const headers = [
    'ID',
    'Escola',
    'Código',
    'Enunciado / Ponto de Atenção',
    'Categoria',
    'Urgência',
    'Prazo',
    'Data/Hora Brasília',
    'Autor',
    'Status',
    'Devolutiva',
    'Google Drive'
  ];

  const rows = records.map(r => [
    r.id,
    r.schoolName,
    r.schoolCode,
    r.title,
    r.category,
    r.urgency,
    r.deadline,
    r.formattedDateTimeBrasilia,
    r.authorName,
    r.status === 'realizado' ? 'REALIZADO' : r.status === 'nao_realizado' ? 'NÃO REALIZADO' : r.status,
    r.resolution?.notes || '-',
    r.driveUrl
  ]);

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

/**
 * Trigger full save and commit to server (Notebook MaxBorba)
 */
export async function saveAllDataToServer(): Promise<{ success: boolean; message: string }> {
  try {
    const records = getRecords();
    const extraWorks = getExtraWorks();
    const accessLogs = getAccessLogs();

    const res = await fetch('/api/sync/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, extraWorks, accessLogs })
    });

    if (!res.ok) throw new Error('Falha na resposta do servidor');
    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Dados salvos com sucesso no Notebook MaxBorba!'
    };
  } catch (err) {
    console.warn('[Save All] Falha ao sincronizar com servidor, dados mantidos localmente:', err);
    return {
      success: true,
      message: 'Dados salvos localmente no dispositivo (offline)'
    };
  }
}

/**
 * Fetch active API Key from Notebook MaxBorba server
 */
export async function getApiKeyFromServer(): Promise<{ apiKey: string; createdAt?: string } | null> {
  try {
    const res = await fetch('/api/auth/api-key');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[API Key] Erro ao buscar chave da API:', err);
    return { apiKey: 'EV-PR-MARINGA-MAXBORBA-998299505-KEY2026' };
  }
}

/**
 * Rotate API Key on server
 */
export async function rotateApiKeyOnServer(): Promise<{ apiKey: string; message: string } | null> {
  try {
    const res = await fetch('/api/auth/api-key/rotate', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[API Key] Erro ao renovar chave da API:', err);
    return null;
  }
}

/**
 * Download full JSON backup of all stored records and access logs
 */
export function downloadFullBackupJSON(): void {
  try {
    const backupData = {
      exportedAt: new Date().toISOString(),
      masterStorageNode: MASTER_STORAGE_NODE,
      officialPhoneRepository: OFFICIAL_PHONE_REPOSITORY,
      officialMasterIpId: OFFICIAL_MASTER_IP_ID,
      retentionPolicy: MASTER_STORAGE_POLICY,
      records: getRecords(),
      extraWorks: getExtraWorks(),
      accessLogs: getAccessLogs()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_escola_viva_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao gerar download do backup:', err);
  }
}

/**
 * Direct sync to Google Firebase Realtime Database
 * URL: https://escola-viva-pe-default-rtdb.firebaseio.com/
 */
export async function syncDirectToFirebaseRTDB(): Promise<{ success: boolean; message: string; url: string }> {
  try {
    const records = getRecords();
    const extraWorks = getExtraWorks();
    const accessLogs = getAccessLogs();

    const payload = {
      records,
      extraWorks,
      accessLogs,
      masterNode: {
        nodeName: MASTER_STORAGE_NODE,
        officialPhone: OFFICIAL_PHONE_REPOSITORY,
        officialMasterIpId: OFFICIAL_MASTER_IP_ID,
        retentionPolicy: MASTER_STORAGE_POLICY,
        status: 'Ativo & Conectado'
      },
      syncedAt: new Date().toISOString(),
      firebaseDatabaseUrl: FIREBASE_RTDB_URL
    };

    // 1. Salva snapshot geral em /escola_viva_data.json
    await fetch(`${FIREBASE_RTDB_URL}/escola_viva_data.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 2. Salva lista de registros diretamente em /records.json
    await fetch(`${FIREBASE_RTDB_URL}/records.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });

    // 3. Salva trabalhos extras em /extraWorks.json
    await fetch(`${FIREBASE_RTDB_URL}/extraWorks.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extraWorks)
    });

    // 4. Salva logs de auditoria em /accessLogs.json
    await fetch(`${FIREBASE_RTDB_URL}/accessLogs.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accessLogs)
    });

    // Também aciona o servidor backend para consistência
    fetch('/api/firebase/sync', { method: 'POST' }).catch(() => {});

    return {
      success: true,
      message: `Todos os registros (${records.length} pedidos, ${extraWorks.length} extras, ${accessLogs.length} logs) foram salvos com sucesso no Google Firebase RTDB!`,
      url: FIREBASE_RTDB_URL
    };
  } catch (err: any) {
    console.error('[Firebase RTDB Sync Error]:', err);
    return {
      success: false,
      message: `Erro ao salvar no Firebase: ${err?.message || 'Falha de conexão'}`,
      url: FIREBASE_RTDB_URL
    };
  }
}


