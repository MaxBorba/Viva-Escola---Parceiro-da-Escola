import { useState, useMemo, useEffect } from 'react';
import { 
  HardDrive, 
  ShieldCheck, 
  KeyRound, 
  Laptop, 
  Smartphone, 
  Activity, 
  Calendar, 
  Clock, 
  Building2, 
  Search, 
  FileDown, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  RefreshCw,
  Copy,
  Check,
  Globe,
  Radio,
  Key,
  Save,
  Download,
  Sparkles,
  Database,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { MaintenanceRecord, ExtraWork, AccessLog, MasterNodeStatus } from '../types';
import { SCHOOLS, MASTER_KEY_ARTICULADOR } from '../data/schools';
import { 
  MASTER_STORAGE_NODE, 
  OFFICIAL_PHONE_REPOSITORY, 
  OFFICIAL_MASTER_IP_ID, 
  MASTER_STORAGE_POLICY,
  FIREBASE_RTDB_URL,
  saveAllDataToServer,
  getApiKeyFromServer,
  rotateApiKeyOnServer,
  downloadFullBackupJSON,
  syncDirectToFirebaseRTDB
} from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface MasterStorageAuditSectionProps {
  records: MaintenanceRecord[];
  extraWorks: ExtraWork[];
  accessLogs: AccessLog[];
  masterNodeInfo?: MasterNodeStatus | null;
  onOpenRecordDetail?: (record: MaintenanceRecord) => void;
}

export default function MasterStorageAuditSection({
  records,
  extraWorks,
  accessLogs,
  masterNodeInfo,
  onOpenRecordDetail
}: MasterStorageAuditSectionProps) {
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState<'all' | 'articulador' | 'direcao' | 'coordenacao'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'retention_records' | 'authorized_nodes' | 'api_key_sync'>('audit_logs');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // API Key & Save states
  const [apiKey, setApiKey] = useState('EV-PR-MARINGA-MAXBORBA-998299505-KEY2026');
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Firebase RTDB Sync states
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseFeedback, setFirebaseFeedback] = useState<string | null>(null);

  useEffect(() => {
    getApiKeyFromServer().then(data => {
      if (data?.apiKey) {
        setApiKey(data.apiKey);
      }
    });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await saveAllDataToServer();
      setSaveFeedback(res.message);
    } catch {
      setSaveFeedback('Dados salvos no aplicativo localmente.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  const handleRotateKey = async () => {
    if (!window.confirm('Deseja realmente gerar uma nova Chave de API? A chave anterior será substituída no Notebook MaxBorba.')) {
      return;
    }
    setIsRotatingKey(true);
    try {
      const res = await rotateApiKeyOnServer();
      if (res?.apiKey) {
        setApiKey(res.apiKey);
        setSaveFeedback('Nova Chave de API gerada com sucesso!');
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleSyncFirebase = async () => {
    setIsSyncingFirebase(true);
    setFirebaseFeedback(null);
    try {
      const res = await syncDirectToFirebaseRTDB();
      setFirebaseFeedback(res.message);
    } catch (err: any) {
      setFirebaseFeedback(`Erro ao salvar no Firebase: ${err?.message || 'Falha de conexão'}`);
    } finally {
      setIsSyncingFirebase(false);
      setTimeout(() => setFirebaseFeedback(null), 6000);
    }
  };


  // Filter logs
  const filteredLogs = useMemo(() => {
    return accessLogs.filter(log => {
      if (logRoleFilter !== 'all' && log.role !== logRoleFilter) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchesAuthor = (log.authorName || '').toLowerCase().includes(q);
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesIp = (log.ip || '').toLowerCase().includes(q);
        const matchesDevice = (log.device || '').toLowerCase().includes(q);
        const matchesSchool = (log.schoolName || '').toLowerCase().includes(q);
        const matchesCode = (log.schoolCode || '').toLowerCase().includes(q);
        if (!matchesAuthor && !matchesAction && !matchesIp && !matchesDevice && !matchesSchool && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [accessLogs, logRoleFilter, logSearchQuery]);

  // Download audit logs as CSV
  const handleExportLogsCSV = () => {
    const headers = [
      'ID Log',
      'Data/Hora Brasília',
      'Perfil',
      'Escola',
      'Código Unidade',
      'IP de Origem',
      'Dispositivo / Sistema',
      'Senha Mestre Utilizada',
      'Ação Registrada',
      'Nó Mestre de Armazenamento',
      'Celular Repositório Oficial',
      'IP / ID Mestre Oficial',
      'Regra de Guarda'
    ];

    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.formattedDateTimeBrasilia || l.timestamp}"`,
      `"${l.role.toUpperCase()}"`,
      `"${(l.schoolName || 'Regional Maringá').replace(/"/g, '""')}"`,
      `"${l.schoolCode || '-'}"`,
      `"${l.ip || '127.0.0.1'}"`,
      `"${(l.device || 'Navegador Web').replace(/"/g, '""')}"`,
      `"${l.isMasterKey ? 'SIM (192026)' : 'NÃO'}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${l.masterStorageNode || MASTER_STORAGE_NODE}"`,
      `"${l.officialPhoneRepository || OFFICIAL_PHONE_REPOSITORY}"`,
      `"${l.officialMasterIpId || OFFICIAL_MASTER_IP_ID}"`,
      `"Até exclusão voluntária ou após 6 meses de salvamento"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_IP_Mestre_${OFFICIAL_PHONE_REPOSITORY}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="master-storage-audit-section" className="space-y-6">
      
      {/* Top Banner: Repositórios Oficiais (Notebook MaxBorba | Celular 998299505 | IP 835E8FB-7F16-4C93-B228-3B73FAE5FF24) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>REPOSITÓRIOS OFICIAIS ATIVOS &bull; NOTEBOOK MAXBORBA &bull; CELULAR {OFFICIAL_PHONE_REPOSITORY}</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Repositores Oficiais de Todos os Registros
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
                O celular <strong className="text-emerald-300 font-mono font-bold">{OFFICIAL_PHONE_REPOSITORY}</strong>, o 
                IP <strong className="text-emerald-300 font-mono font-bold">{OFFICIAL_MASTER_IP_ID}</strong> e o 
                <strong className="text-white"> Notebook MaxBorba</strong> são os 
                <strong> repositores oficiais</strong> de todos os registros oficiais enviados por qualquer celular 
                <strong className="text-white"> Android</strong> ou <strong className="text-white">Safari (iOS/macOS)</strong>, 
                <strong> ficando registrados até a exclusão ou após 6 meses de salvamento</strong>.
              </p>
            </div>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-slate-200 inline-flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Celular Repositório: <strong className="font-mono text-emerald-300">{OFFICIAL_PHONE_REPOSITORY}</strong></span>
              </span>

              <span className="bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-slate-200 inline-flex items-center gap-1.5 font-mono">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>IP / ID: <strong className="text-blue-300">{OFFICIAL_MASTER_IP_ID}</strong></span>
              </span>

              <span className="bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/40 inline-flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guarda: Até Exclusão ou 6 Meses (180 dias)</span>
              </span>

              <span className="bg-indigo-950/90 text-indigo-200 px-3 py-1 rounded-xl border border-indigo-500/40 inline-flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Android &bull; Safari iOS &bull; Desktop (Multi-IP Liberado)</span>
              </span>
            </div>
          </div>

          {/* Master Identifiers Card */}
          <div className="bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shrink-0 flex flex-col justify-between shadow-lg max-w-sm space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Repositório Celular Oficial
              </span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-emerald-400 tracking-wider">
                  {OFFICIAL_PHONE_REPOSITORY}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(OFFICIAL_PHONE_REPOSITORY)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                  title="Copiar Celular Oficial"
                >
                  {copiedText === OFFICIAL_PHONE_REPOSITORY ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                IP Mestre do Repositório
              </span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-blue-300 break-all">
                  {OFFICIAL_MASTER_IP_ID}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(OFFICIAL_MASTER_IP_ID)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer shrink-0"
                  title="Copiar IP Mestre"
                >
                  {copiedText === OFFICIAL_MASTER_IP_ID ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Chave Mestra Articulador:</span>
                <span className="text-base font-mono font-bold text-amber-400">{MASTER_KEY_ARTICULADOR}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(MASTER_KEY_ARTICULADOR)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                title="Copiar Chave Mestra"
              >
                {copiedText === MASTER_KEY_ARTICULADOR ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 block font-medium">Chave de API Oficial (API Key):</span>
                <span className="text-xs font-mono font-bold text-emerald-300 truncate block max-w-[200px]" title={apiKey}>
                  {apiKey}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(apiKey)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer shrink-0"
                title="Copiar Chave de API"
              >
                {copiedText === apiKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Persistent Quick Action Toolbar for Data Persistence & PWA */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Sincronização &amp; Salvamento Central no Notebook MaxBorba</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Registros salvos até a exclusão ou por 06 meses no nó oficial ({records.length} manutenções ativas)
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Botão de Salvamento no Firebase RTDB Solicitado pelo Usuário */}
          <button
            type="button"
            onClick={handleSyncFirebase}
            disabled={isSyncingFirebase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-md transition cursor-pointer ring-1 ring-amber-400/50"
            title="Salvar todos os registros no link oficial do Google Firebase: https://escola-viva-pe-default-rtdb.firebaseio.com/"
          >
            {isSyncingFirebase ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>{isSyncingFirebase ? 'Salvando no Firebase...' : 'Salvar no Google Firebase RTDB'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Salvando...' : 'Salvar no Nó MaxBorba'}</span>
          </button>

          <button
            type="button"
            onClick={downloadFullBackupJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Baixar arquivo JSON com todos os dados salvos"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Backup JSON</span>
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Firebase Feedback Banner */}
      {firebaseFeedback && (
        <div className="bg-amber-500 text-slate-950 border border-amber-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-slate-950 shrink-0" />
            <span>{firebaseFeedback}</span>
          </div>
          <button onClick={() => setFirebaseFeedback(null)} className="text-slate-800 hover:text-black text-xs font-black cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Save feedback banner */}
      {saveFeedback && (
        <div className="bg-emerald-900/90 border border-emerald-500/50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{saveFeedback}</span>
          </div>
          <button onClick={() => setSaveFeedback(null)} className="text-slate-300 hover:text-white text-xs">
            &times;
          </button>
        </div>
      )}


      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Pedidos no MaxBorba */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Registros no MaxBorba
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
              {records.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Pedidos com fotos guardados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Trabalhos Extras */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Trabalhos Extras
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
              {extraWorks.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Serviços concretizados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Auditoria de IPs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Acessos Auditados no IP
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
              {accessLogs.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Sessões &amp; Ações no nó mestre
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Retenção 06 Meses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Política de Retenção
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
              06 Meses
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold">
              180 dias de guarda ativa
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Sub Tabs Selector */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('audit_logs')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'audit_logs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Auditoria de IPs e Acessos ({filteredLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('authorized_nodes')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'authorized_nodes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Senhas Autorizadas dos Diretores e Coordenadores (10 Escolas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('retention_records')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'retention_records'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Controle de Retenção de 06 Meses dos Dados ({records.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('api_key_sync')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'api_key_sync'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Chave de API (API Key) &amp; Salvamento do App</span>
        </button>
      </div>

      {/* SUB-TAB 1: AUDIT LOGS TABLE */}
      {activeSubTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Registros de Acessos Auditados no IP do Notebook MaxBorba</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Todos os articuladores que acessam com a senha mestre e todos os acessos de diretores e coordenadores ficam gravados no IP deste computador.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportLogsCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Exportar Auditoria (CSV)</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Buscar por IP, escola, dispositivo, perfil ou ação..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={logRoleFilter}
                onChange={(e) => setLogRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="all">Todos os Perfis</option>
                <option value="articulador">Articulador (Senha Mestre)</option>
                <option value="direcao">Direção Escolar</option>
                <option value="coordenacao">Coordenação Técnica</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Data / Hora Brasília</th>
                  <th className="px-4 py-3">Perfil &amp; Solicitante</th>
                  <th className="px-4 py-3">Escola / Senha</th>
                  <th className="px-4 py-3">IP de Origem</th>
                  <th className="px-4 py-3">Dispositivo / Sistema</th>
                  <th className="px-4 py-3">Ação Registrada</th>
                  <th className="px-4 py-3 text-right">Retenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Nenhum registro de auditoria encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isArt = log.role === 'articulador';
                    const isDir = log.role === 'direcao';
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {log.formattedDateTimeBrasilia || new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isArt 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : isDir
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {log.role}
                            </span>
                            <span className="font-semibold text-slate-800">{log.authorName}</span>
                          </div>
                          {log.isMasterKey && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Autenticado com Senha Mestre
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {log.schoolName || 'Acesso Geral Maringá'}
                          </div>
                          {log.schoolCode && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold text-slate-700">
                              Senha: {log.schoolCode}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {log.ip || '127.0.0.1'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-1.5">
                            {log.device?.toLowerCase().includes('android') ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : log.device?.toLowerCase().includes('safari') ? (
                              <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className="font-medium">{log.device || 'Navegador Web Multi-IP'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            06 Meses
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: AUTHORIZED SCHOOL PASSWORDS (10 ESCOLAS + ARTICULADOR) */}
      {activeSubTab === 'authorized_nodes' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Senhas dos Diretores e Coordenadores com Armazenamento no Notebook MaxBorba</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Todos os dados inseridos por esses 10 acessos são automaticamente salvos no IP mestre do Notebook MaxBorba por 06 meses.
              </p>
            </div>

            <span className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200">
              10 Senhas Oficiais Cadastradas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCHOOLS.map((school, index) => {
              const schoolRecords = records.filter(r => r.schoolId === school.id);
              return (
                <div 
                  key={school.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-4 hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      0{index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {school.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">{school.gre} &bull; {school.city}</span>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                        <span>{schoolRecords.length} registros guardados</span>
                        <span>&bull;</span>
                        <span className="text-emerald-700 font-semibold">MaxBorba Ativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Senha</span>
                    <div className="inline-flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-3 py-1 rounded-xl font-mono font-bold text-sm shadow-xs">
                      <span>{school.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(school.code)}
                        className="text-slate-400 hover:text-white"
                        title="Copiar Senha"
                      >
                        {copiedText === school.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cross Platform Authorization Banner */}
          <div className="bg-emerald-950/90 text-white rounded-2xl p-5 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-200">
                  Autorização Multi-IP &amp; Multi-Dispositivo para Articuladores
                </h4>
                <p className="text-xs text-slate-300">
                  Os articuladores que utilizarem a senha mestre <strong>{MASTER_KEY_ARTICULADOR}</strong> estão plenamente autorizados a utilizar qualquer IP, Android ou Safari iOS para registrar novos pedidos ou excluir ações.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-emerald-500/30">
                192026 Mestre
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: RETENTION 06 MONTHS TRACKER */}
      {activeSubTab === 'retention_records' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Controle de Guarda Obrigatória de 06 Meses</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ao ser registrado qualquer dado feito por articulador, direção ou coordenação, o aplicativo mantém o registro salvo por 06 meses (180 dias) com armazenamento mestre no Notebook MaxBorba.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Protocolo</th>
                  <th className="px-4 py-3">Escola</th>
                  <th className="px-4 py-3">Título / Objeto</th>
                  <th className="px-4 py-3">Cadastrado Por</th>
                  <th className="px-4 py-3">Repositores Oficiais</th>
                  <th className="px-4 py-3">Data de Registro</th>
                  <th className="px-4 py-3 text-right">Permanência Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Nenhum registro armazenado até o momento.
                    </td>
                  </tr>
                ) : (
                  records.map(rec => {
                    const retDate = rec.retentionUntil 
                      ? new Date(rec.retentionUntil).toLocaleDateString('pt-BR')
                      : '180 dias';
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          #{rec.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {rec.schoolName}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate">
                          {rec.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {rec.authorName} ({rec.createdByRole})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold block">
                              Cel: {rec.officialPhoneRepository || OFFICIAL_PHONE_REPOSITORY}
                            </span>
                            <span className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-mono block">
                              IP: {(rec.officialMasterIpId || OFFICIAL_MASTER_IP_ID).slice(0, 15)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {rec.formattedDateTimeBrasilia}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-700" />
                            <span>Até exclusão ou {retDate} (6 meses)</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: CHAVE DE API (API KEY) & SALVAMENTO CENTRAL */}
      {activeSubTab === 'api_key_sync' && (
        <div className="space-y-6">
          
          {/* Card 1: Chave de API Oficial */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Chave de API Oficial (API Key)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Autenticação oficial para sincronização direta, scripts de auditoria e integração segura
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateKey}
                  disabled={isRotatingKey}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? 'animate-spin' : ''}`} />
                  <span>{isRotatingKey ? 'Gerando...' : 'Gerar Nova Chave'}</span>
                </button>
              </div>
            </div>

            {/* API Key Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">Chave Ativa</span>
                <span className="font-mono text-[11px]">Nó: {MASTER_STORAGE_NODE}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <code className="text-sm sm:text-base font-mono font-bold text-emerald-400 break-all select-all">
                  {apiKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(apiKey)}
                  className="shrink-0 p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition cursor-pointer"
                  title="Copiar API Key"
                >
                  {copiedText === apiKey ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Esta chave autoriza chamadas autenticadas na API REST do servidor. Pode ser enviada no cabeçalho HTTP <code className="text-amber-300 font-mono">x-api-key: {apiKey.slice(0, 16)}...</code> para leitura e gravação centralizada de registros.
              </p>
            </div>

            {/* Quick Curl / Fetch Example */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block">Exemplo de Uso via API REST:</span>
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
{`curl -X GET https://.../api/sync \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>

          {/* Card: Google Firebase Realtime Database (Solicitado pelo Usuário) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-7 border-2 border-amber-500/50 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shrink-0">
                  <Cloud className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Google Firebase Realtime Database (Nuvem Oficial)
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Ativo &amp; Conectado
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Repositório em nuvem de todos os registros, chamados e auditorias da rede estadual
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncFirebase}
                disabled={isSyncingFirebase}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer shrink-0"
              >
                {isSyncingFirebase ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Cloud className="w-4 h-4 text-slate-950" />
                )}
                <span>{isSyncingFirebase ? 'Salvando na Nuvem...' : 'Salvar Todos os Registros no Firebase'}</span>
              </button>
            </div>

            {/* Link Box */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">
                  Link Oficial do Firebase Realtime Database
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Google Cloud Firebase</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <code className="text-xs sm:text-sm font-mono font-bold text-amber-300 break-all select-all">
                  {FIREBASE_RTDB_URL}
                </code>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(FIREBASE_RTDB_URL)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition cursor-pointer"
                    title="Copiar Link do Firebase"
                  >
                    {copiedText === FIREBASE_RTDB_URL ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`${FIREBASE_RTDB_URL}/.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                    title="Abrir JSON no navegador"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <a
                  href={`${FIREBASE_RTDB_URL}/records.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
                >
                  <span className="font-mono text-[11px]">/records.json ({records.length})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>

                <a
                  href={`${FIREBASE_RTDB_URL}/extraWorks.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
                >
                  <span className="font-mono text-[11px]">/extraWorks.json ({extraWorks.length})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>

                <a
                  href={`${FIREBASE_RTDB_URL}/escola_viva_data.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900/80 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300 hover:text-white transition"
                >
                  <span className="font-mono text-[11px]">/escola_viva_data.json (Dump)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Todos os registros e acessos realizados por <strong>Articulador</strong>, <strong>Direção</strong> e <strong>Coordenação</strong> através de qualquer dispositivo (celular Android, iPhone Safari ou Notebook) são automaticamente salvos e espelhados neste banco do Firebase, garantindo persistência em nuvem independente do LocalStorage do navegador.
            </p>
          </div>

          {/* Card 2: Salvamento e Persistência do Aplicativo */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Salvamento Central dos Dados no Aplicativo
                </h3>
                <p className="text-xs text-slate-500">
                  Garantia de que os registros não ficam apenas no LocalStorage temporário
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sincronização Automática Contínua</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Qualquer novo pedido de manutenção, trabalho extra, alteração de status ou log de login inserido por Articuladores, Direção ou Coordenação é sincronizado com o banco central (<code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-300">data_store/db.json</code>) e protegido por 06 meses.
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Garantia de Redundância e Backup</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Mesmo em caso de limpeza de cache de celular, os dados permanecem seguros no repositório oficial (<strong className="text-blue-950">Notebook MaxBorba</strong>, Celular <strong className="font-mono">{OFFICIAL_PHONE_REPOSITORY}</strong>).
                </p>
              </div>
            </div>

            {/* Actions for Saving & Backup */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Gravando no Nó Mestre...' : 'Forçar Salvamento Integral Agora'}</span>
              </button>

              <button
                type="button"
                onClick={downloadFullBackupJSON}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exportar Arquivo de Backup Completo (.JSON)</span>
              </button>
            </div>
          </div>

          {/* Card 3: PWA - Aplicativo Instalável */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Aplicativo PWA (Progressive Web App)
                </h3>
                <p className="text-xs text-slate-500">
                  Instale diretamente no seu celular Android, iPhone (Safari) ou computador sem precisar de loja
                </p>
              </div>
            </div>

            <PWAInstallButton variant="banner" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Android (Google Chrome)</span>
                <p className="text-slate-600">Toque no botão "Instalar PWA" ou no menu ⋮ &gt; "Instalar aplicativo" na tela inicial.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">iPhone / iPad (Safari)</span>
                <p className="text-slate-600">Toque no ícone Compartilhar (quadrado com seta) e selecione "Adicionar à Tela de Início".</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Notebook / Computador</span>
                <p className="text-slate-600">Clique no ícone de instalação na barra de endereço do navegador para abrir como app nativo.</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

