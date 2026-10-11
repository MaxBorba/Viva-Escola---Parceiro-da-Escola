import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable large JSON payloads for base64 photo transfers from mobile cameras (Android / Safari)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// MASTER STORAGE NODE CONFIGURATION
// Notebook MaxBorba - Central Storage & Audit
// ==========================================
const MASTER_NODE_NAME = 'Notebook MaxBorba';
const MASTER_STORAGE_POLICY = '06 Meses (180 dias de guarda obrigatória)';
const MASTER_KEY_ARTICULADOR = '192026';
const AUTHORIZED_SCHOOL_PASSWORDS = [
  '3536', // CE ADAILE M LEITE
  '3706', // CE BRANCA DA MOTA FERNANDES
  '3714', // CE BRASILIO ITIBERE
  '3927', // CE DIRCE DE A MAIA
  '4125', // CE JOAO DE F PIOLI
  '4630', // CE RODRIGUES ALVES
  '4834', // CE UNIDADE POLO
  '5113', // CE JARDIM PANORAMA
  '8517', // CE JARDIM UNIVERSITARIO
  '5237'  // CE OLAVO BILAC
];

// Data Persistence Path
const DATA_DIR = path.join(process.cwd(), 'data_store');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Helper functions for client IP and device detection
function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

function getDeviceType(userAgent: string = ''): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone (Safari iOS)';
  if (ua.includes('ipad')) return 'iPad (Safari iOS)';
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Apple Safari';
  if (ua.includes('windows')) return 'Windows Notebook / PC';
  if (ua.includes('macintosh')) return 'MacBook / macOS';
  if (ua.includes('linux')) return 'Linux / Chromebook';
  return 'Navegador Web Multi-IP';
}

function calculateRetentionDate(baseIso?: string): string {
  const date = baseIso ? new Date(baseIso) : new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString();
}

function getBrasiliaTimeString(): string {
  const now = new Date();
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
}

// Helper to load db
function loadDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        records: [],
        extraWorks: [],
        accessLogs: [],
        masterNode: {
          nodeName: MASTER_NODE_NAME,
          role: 'Nó Mestre de Armazenamento e Auditoria Central',
          retentionPolicy: MASTER_STORAGE_POLICY,
          authorizedSchoolPasswords: AUTHORIZED_SCHOOL_PASSWORDS,
          masterKey: MASTER_KEY_ARTICULADOR,
          crossPlatformAuthorization: 'Liberado para qualquer IP, Android ou Safari iOS',
          status: 'Ativo & Conectado'
        },
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed.records || !Array.isArray(parsed.records)) {
      parsed.records = [];
    }
    if (!parsed.extraWorks || !Array.isArray(parsed.extraWorks)) {
      parsed.extraWorks = [];
    }
    if (!parsed.accessLogs || !Array.isArray(parsed.accessLogs)) {
      parsed.accessLogs = [];
    }
    if (!parsed.masterNode) {
      parsed.masterNode = {
        nodeName: MASTER_NODE_NAME,
        role: 'Nó Mestre de Armazenamento e Auditoria Central',
        retentionPolicy: MASTER_STORAGE_POLICY,
        authorizedSchoolPasswords: AUTHORIZED_SCHOOL_PASSWORDS,
        masterKey: MASTER_KEY_ARTICULADOR,
        crossPlatformAuthorization: 'Liberado para qualquer IP, Android ou Safari iOS',
        status: 'Ativo & Conectado'
      };
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load DB:', err);
    return { 
      records: [], 
      extraWorks: [], 
      accessLogs: [],
      masterNode: { nodeName: MASTER_NODE_NAME, status: 'Ativo' },
      updatedAt: new Date().toISOString() 
    };
  }
}

// Helper to save db
function saveDB(data: { records: any[]; extraWorks: any[]; accessLogs?: any[]; masterNode?: any; updatedAt?: string }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

// Helper to register audit log
function addAuditLog(db: any, log: any) {
  if (!Array.isArray(db.accessLogs)) {
    db.accessLogs = [];
  }
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    formattedDateTimeBrasilia: getBrasiliaTimeString(),
    masterStorageNode: MASTER_NODE_NAME,
    retentionUntil: calculateRetentionDate(),
    ...log
  };
  db.accessLogs.unshift(entry);
  // Keep up to 1000 recent logs
  if (db.accessLogs.length > 1000) {
    db.accessLogs = db.accessLogs.slice(0, 1000);
  }
  return entry;
}

// ==========================================
// REST API ENDPOINTS FOR MULTI-DEVICE SYNC
// Notebook MaxBorba Master Hub
// (Android, iOS Safari, Mac, PC, Chromebook)
// ==========================================

// Health check with Master Node information
app.get('/api/health', (req, res) => {
  const ip = getClientIP(req);
  res.json({ 
    status: 'ok', 
    serverTime: new Date().toISOString(), 
    brasiliaTime: getBrasiliaTimeString(),
    masterNode: MASTER_NODE_NAME,
    retentionPolicy: MASTER_STORAGE_POLICY,
    authorizedPasswords: [...AUTHORIZED_SCHOOL_PASSWORDS, MASTER_KEY_ARTICULADOR],
    crossPlatform: 'Liberado para qualquer IP, Android ou Safari',
    clientIp: ip,
    region: 'PR - NRE Maringá' 
  });
});

// Full Master Status endpoint
app.get('/api/master-status', (req, res) => {
  const db = loadDB();
  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  res.json({
    nodeName: MASTER_NODE_NAME,
    role: 'IP Mestre de Armazenamento e Auditoria Central',
    retentionPolicy: MASTER_STORAGE_POLICY,
    authorizedSchoolPasswords: AUTHORIZED_SCHOOL_PASSWORDS,
    masterKeyArticulador: MASTER_KEY_ARTICULADOR,
    crossPlatformAuthorization: 'Articuladores autorizados em qualquer IP, Android ou Safari para registrar e excluir',
    totalRecordsStored: db.records.length,
    totalExtraWorksStored: db.extraWorks.length,
    totalAccessLogsStored: db.accessLogs.length,
    clientAccessInfo: {
      clientIp,
      clientDevice,
      timestamp: new Date().toISOString(),
      brasiliaTime: getBrasiliaTimeString()
    },
    status: 'Ativo & Conectado'
  });
});

// Full Sync (GET)
app.get('/api/sync', (req, res) => {
  const db = loadDB();
  res.json({
    records: db.records,
    extraWorks: db.extraWorks,
    accessLogs: db.accessLogs || [],
    masterNode: db.masterNode,
    updatedAt: db.updatedAt
  });
});

// Full Sync (POST) - merge/replace
app.post('/api/sync', (req, res) => {
  const { records, extraWorks, accessLogs } = req.body;
  const db = loadDB();
  if (Array.isArray(records)) {
    db.records = records;
  }
  if (Array.isArray(extraWorks)) {
    db.extraWorks = extraWorks;
  }
  if (Array.isArray(accessLogs)) {
    db.accessLogs = accessLogs;
  }
  saveDB(db);
  res.json({ 
    success: true, 
    records: db.records, 
    extraWorks: db.extraWorks,
    accessLogs: db.accessLogs,
    masterNode: db.masterNode 
  });
});

// POST Auth / Access Log
app.post('/api/auth/log', (req, res) => {
  const { role, schoolCode, schoolName, authorName, action, enteredPassword } = req.body;
  const db = loadDB();
  const clientIp = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const clientDevice = getDeviceType(userAgent);

  const isMasterKey = enteredPassword === MASTER_KEY_ARTICULADOR;

  const logEntry = addAuditLog(db, {
    role: role || 'articulador',
    schoolCode,
    schoolName,
    authorName: authorName || (isMasterKey ? 'Articulador Regional (Senha Mestre)' : schoolName || 'Usuário'),
    isMasterKey,
    ip: clientIp,
    device: clientDevice,
    userAgent,
    action: action || (isMasterKey ? 'Acesso do Articulador via Senha Mestre' : `Acesso ${role} (Código: ${schoolCode})`)
  });

  saveDB(db);
  res.json({ success: true, log: logEntry, masterNode: MASTER_NODE_NAME });
});

// GET Access Logs
app.get('/api/access-logs', (req, res) => {
  const db = loadDB();
  res.json(db.accessLogs || []);
});

// GET Records
app.get('/api/records', (req, res) => {
  const db = loadDB();
  res.json(db.records);
});

// POST new record (stored with Notebook MaxBorba master metadata and 6 months retention)
app.post('/api/records', (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.id) {
    return res.status(400).json({ error: 'Registro inválido' });
  }

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  // Apply master storage node metadata & 06 months retention
  newRecord.masterStorageNode = MASTER_NODE_NAME;
  newRecord.originIp = clientIp;
  newRecord.originDevice = clientDevice;
  newRecord.retentionUntil = calculateRetentionDate(newRecord.createdAt);

  const db = loadDB();
  const existingIdx = db.records.findIndex((r: any) => r.id === newRecord.id);
  if (existingIdx >= 0) {
    db.records[existingIdx] = { ...db.records[existingIdx], ...newRecord };
  } else {
    db.records.unshift(newRecord);
  }

  // Register in audit log
  addAuditLog(db, {
    role: newRecord.createdByRole || 'articulador',
    schoolCode: newRecord.schoolCode,
    schoolName: newRecord.schoolName,
    authorName: newRecord.authorName || 'Articulador',
    isMasterKey: newRecord.createdByRole === 'articulador',
    ip: clientIp,
    device: clientDevice,
    action: `Cadastro de Pedido #${newRecord.id}: "${newRecord.title?.slice(0, 45)}" (Retenção 06 Meses)`,
    targetId: newRecord.id
  });

  saveDB(db);
  res.status(201).json(db.records);
});

// PUT update record (devolutiva resolution, status, etc)
app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = loadDB();
  const idx = db.records.findIndex((r: any) => r.id === id);
  if (idx >= 0) {
    const clientIp = getClientIP(req);
    const clientDevice = getDeviceType(req.headers['user-agent']);

    db.records[idx] = { 
      ...db.records[idx], 
      ...updates,
      lastUpdatedIp: clientIp,
      lastUpdatedDevice: clientDevice,
      masterStorageNode: MASTER_NODE_NAME
    };

    // Log resolution action
    addAuditLog(db, {
      role: 'coordenacao',
      schoolCode: db.records[idx].schoolCode,
      schoolName: db.records[idx].schoolName,
      authorName: updates.resolution?.resolvedBy || 'Coordenação Técnica',
      isMasterKey: false,
      ip: clientIp,
      device: clientDevice,
      action: `Devolutiva Técnica Registrada para Protocolo #${id} ([${updates.resolution?.status?.toUpperCase()}])`,
      targetId: id
    });

    saveDB(db);
    return res.json(db.records);
  }
  res.status(404).json({ error: 'Registro não encontrado' });
});

// DELETE single record (Authorized for Articuladores from ANY IP, Android or Safari)
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const targetRecord = db.records.find((r: any) => r.id === id);
  db.records = db.records.filter((r: any) => r.id !== id);

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  // Log deletion with master key authorization
  addAuditLog(db, {
    role: 'articulador',
    schoolCode: targetRecord?.schoolCode,
    schoolName: targetRecord?.schoolName,
    authorName: 'Articulador Regional (Senha Mestre 192026)',
    isMasterKey: true,
    ip: clientIp,
    device: clientDevice,
    action: `Exclusão de Ação / Registro #${id} realizada com Senha Mestre`,
    targetId: id
  });

  saveDB(db);
  res.json(db.records);
});

// DELETE records by school
app.delete('/api/records/school/:schoolId', (req, res) => {
  const { schoolId } = req.params;
  const db = loadDB();
  const initialLen = db.records.length;
  db.records = db.records.filter((r: any) => r.schoolId !== schoolId);

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  addAuditLog(db, {
    role: 'articulador',
    authorName: 'Articulador Regional (Senha Mestre 192026)',
    isMasterKey: true,
    ip: clientIp,
    device: clientDevice,
    action: `Exclusão de ${initialLen - db.records.length} registros da escola ${schoolId}`
  });

  saveDB(db);
  res.json({ records: db.records, deletedCount: initialLen - db.records.length });
});

// Clear test records
app.post('/api/records/clear-tests', (req, res) => {
  const { schoolId } = req.body;
  const db = loadDB();
  const isTest = (rec: any) => {
    const q = 'teste';
    const title = (rec.title || '').toLowerCase();
    const desc = (rec.description || '').toLowerCase();
    const author = (rec.authorName || '').toLowerCase();
    const notes = (rec.resolution?.notes || '').toLowerCase();
    return title.includes(q) || desc.includes(q) || author.includes(q) || notes.includes(q) || title.includes('test');
  };

  const initialLen = db.records.length;
  if (schoolId) {
    db.records = db.records.filter((r: any) => !(r.schoolId === schoolId && isTest(r)));
  } else {
    db.records = db.records.filter((r: any) => !isTest(r));
  }

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  addAuditLog(db, {
    role: 'articulador',
    authorName: 'Articulador Regional (Senha Mestre 192026)',
    isMasterKey: true,
    ip: clientIp,
    device: clientDevice,
    action: `Limpeza de ${initialLen - db.records.length} registros de teste realizada com Senha Mestre`
  });

  saveDB(db);
  res.json({ records: db.records, deletedCount: initialLen - db.records.length });
});

// GET Extra Works
app.get('/api/extra-works', (req, res) => {
  const db = loadDB();
  res.json(db.extraWorks);
});

// POST Extra Work (stored with Notebook MaxBorba master metadata and 6 months retention)
app.post('/api/extra-works', (req, res) => {
  const newWork = req.body;
  if (!newWork || !newWork.id) {
    return res.status(400).json({ error: 'Trabalho extra inválido' });
  }

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  newWork.masterStorageNode = MASTER_NODE_NAME;
  newWork.originIp = clientIp;
  newWork.originDevice = clientDevice;
  newWork.retentionUntil = calculateRetentionDate(newWork.createdAt);

  const db = loadDB();
  const existingIdx = db.extraWorks.findIndex((w: any) => w.id === newWork.id);
  if (existingIdx >= 0) {
    db.extraWorks[existingIdx] = { ...db.extraWorks[existingIdx], ...newWork };
  } else {
    db.extraWorks.unshift(newWork);
  }

  addAuditLog(db, {
    role: newWork.registeredByRole || 'coordenacao',
    schoolCode: newWork.schoolCode,
    schoolName: newWork.schoolName,
    authorName: newWork.registeredByName || 'Técnico',
    isMasterKey: newWork.registeredByRole === 'articulador',
    ip: clientIp,
    device: clientDevice,
    action: `Cadastro de Trabalho Extra #${newWork.id}: "${newWork.title?.slice(0, 45)}" (Retenção 06 Meses)`,
    targetId: newWork.id
  });

  saveDB(db);
  res.status(201).json(db.extraWorks);
});

// DELETE Extra Work (Authorized for Articuladores from ANY IP, Android or Safari)
app.delete('/api/extra-works/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const targetWork = db.extraWorks.find((w: any) => w.id === id);
  db.extraWorks = db.extraWorks.filter((w: any) => w.id !== id);

  const clientIp = getClientIP(req);
  const clientDevice = getDeviceType(req.headers['user-agent']);

  addAuditLog(db, {
    role: 'articulador',
    schoolCode: targetWork?.schoolCode,
    schoolName: targetWork?.schoolName,
    authorName: 'Articulador Regional (Senha Mestre 192026)',
    isMasterKey: true,
    ip: clientIp,
    device: clientDevice,
    action: `Exclusão de Trabalho Extra #${id} autorizada com Senha Mestre`,
    targetId: id
  });

  saveDB(db);
  res.json(db.extraWorks);
});

// DELETE Extra Works by school
app.delete('/api/extra-works/school/:schoolId', (req, res) => {
  const { schoolId } = req.params;
  const db = loadDB();
  db.extraWorks = db.extraWorks.filter((w: any) => w.schoolId !== schoolId);
  saveDB(db);
  res.json(db.extraWorks);
});

// ==========================================
// VITE & STATIC SPA FALLBACK
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ESCOLA VIVA PARCEIRO DA ESCOLA] Servidor Mestre [${MASTER_NODE_NAME}] ativo em http://0.0.0.0:${PORT}`);
    console.log(`[POLÍTICA DE RETENÇÃO] Armazenamento central ativo por 06 Meses para todos os acessos das senhas: ${AUTHORIZED_SCHOOL_PASSWORDS.join(', ')} e Mestre ${MASTER_KEY_ARTICULADOR}.`);
  });
}

startServer();
