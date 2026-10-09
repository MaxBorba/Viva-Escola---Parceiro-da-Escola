import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable large JSON payloads for base64 photo transfers from mobile cameras (Android / Safari)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data Persistence Path
const DATA_DIR = path.join(process.cwd(), 'data_store');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed data (empty for official production use)
const INITIAL_RECORDS: any[] = [];
const INITIAL_EXTRA_WORKS: any[] = [];

// Helper to load db
function loadDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const isTest = (rec: any) => {
      const q = 'teste';
      const title = (rec?.title || '').toLowerCase();
      const desc = (rec?.description || '').toLowerCase();
      const author = (rec?.authorName || '').toLowerCase();
      const notes = (rec?.resolution?.notes || '').toLowerCase();
      const category = (rec?.category || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || author.includes(q) || notes.includes(q) || category.includes(q) || title.includes('test');
    };

    const isSampleExtra = (w: any) => {
      if (w.id === 'extra-001' || w.id === 'extra-002') return true;
      const title = (w?.title || '').toLowerCase();
      const desc = (w?.description || '').toLowerCase();
      return title.includes('teste') || desc.includes('teste') || title.includes('exemplo') || desc.includes('exemplo');
    };

    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        records: INITIAL_RECORDS,
        extraWorks: [],
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.records || !Array.isArray(parsed.records)) {
      parsed.records = INITIAL_RECORDS;
    }
    if (!parsed.extraWorks || !Array.isArray(parsed.extraWorks)) {
      parsed.extraWorks = [];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load DB:', err);
    return { records: INITIAL_RECORDS, extraWorks: [], updatedAt: new Date().toISOString() };
  }
}

// Helper to save db
function saveDB(data: { records: any[]; extraWorks: any[]; updatedAt?: string }) {
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

// ==========================================
// REST API ENDPOINTS FOR MULTI-DEVICE SYNC
// (Android, iOS Safari, Mac, PC, Chromebook)
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), region: 'PR - NRE Maringá' });
});

// Full Sync (GET)
app.get('/api/sync', (req, res) => {
  const db = loadDB();
  res.json({
    records: db.records,
    extraWorks: db.extraWorks,
    updatedAt: db.updatedAt
  });
});

// Full Sync (POST) - merge/replace
app.post('/api/sync', (req, res) => {
  const { records, extraWorks } = req.body;
  const db = loadDB();
  if (Array.isArray(records)) {
    db.records = records;
  }
  if (Array.isArray(extraWorks)) {
    db.extraWorks = extraWorks;
  }
  saveDB(db);
  res.json({ success: true, records: db.records, extraWorks: db.extraWorks });
});

// GET Records
app.get('/api/records', (req, res) => {
  const db = loadDB();
  res.json(db.records);
});

// POST new record
app.post('/api/records', (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.id) {
    return res.status(400).json({ error: 'Registro inválido' });
  }
  const db = loadDB();
  // prepend or update if already exists
  const existingIdx = db.records.findIndex((r: any) => r.id === newRecord.id);
  if (existingIdx >= 0) {
    db.records[existingIdx] = { ...db.records[existingIdx], ...newRecord };
  } else {
    db.records.unshift(newRecord);
  }
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
    db.records[idx] = { ...db.records[idx], ...updates };
    saveDB(db);
    return res.json(db.records);
  }
  res.status(404).json({ error: 'Registro não encontrado' });
});

// DELETE single record
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.records = db.records.filter((r: any) => r.id !== id);
  saveDB(db);
  res.json(db.records);
});

// DELETE records by school
app.delete('/api/records/school/:schoolId', (req, res) => {
  const { schoolId } = req.params;
  const db = loadDB();
  const initialLen = db.records.length;
  db.records = db.records.filter((r: any) => r.schoolId !== schoolId);
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
  saveDB(db);
  res.json({ records: db.records, deletedCount: initialLen - db.records.length });
});

// GET Extra Works
app.get('/api/extra-works', (req, res) => {
  const db = loadDB();
  res.json(db.extraWorks);
});

// POST Extra Work
app.post('/api/extra-works', (req, res) => {
  const newWork = req.body;
  if (!newWork || !newWork.id) {
    return res.status(400).json({ error: 'Trabalho extra inválido' });
  }
  const db = loadDB();
  const existingIdx = db.extraWorks.findIndex((w: any) => w.id === newWork.id);
  if (existingIdx >= 0) {
    db.extraWorks[existingIdx] = { ...db.extraWorks[existingIdx], ...newWork };
  } else {
    db.extraWorks.unshift(newWork);
  }
  saveDB(db);
  res.status(201).json(db.extraWorks);
});

// DELETE Extra Work
app.delete('/api/extra-works/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.extraWorks = db.extraWorks.filter((w: any) => w.id !== id);
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
    console.log(`[ESCOLA VIVA PARCEIRO DA ESCOLA] Servidor rodando em http://0.0.0.0:${PORT} com sincronização multi-dispositivos ativa.`);
  });
}

startServer();
