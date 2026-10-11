import { useState, useMemo } from 'react';
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
  Radio
} from 'lucide-react';
import { MaintenanceRecord, ExtraWork, AccessLog, MasterNodeStatus } from '../types';
import { SCHOOLS, MASTER_KEY_ARTICULADOR } from '../data/schools';
import { MASTER_STORAGE_NODE } from '../utils/storage';

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
  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'retention_records' | 'authorized_nodes'>('audit_logs');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
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
      'Prazo de Retenção (06 Meses)'
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
      `"${l.retentionUntil || '180 dias'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_IP_Mestre_Notebook_MaxBorba_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="master-storage-audit-section" className="space-y-6">
      
      {/* Top Banner: Master Node Notebook MaxBorba */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>IP MESTRE ATIVO &bull; NOTEBOOK MAXBORBA</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hub Central de Armazenamento e Auditoria
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
                Este computador (<strong className="text-emerald-300">Notebook MaxBorba</strong>) opera como o 
                <strong> IP Mestre oficial</strong> de armazenamento de todos os dados inseridos por todos os acessos dos 
                diretores e coordenadores com as senhas cadastradas, com retenção obrigatória de <strong>06 meses</strong>.
              </p>
            </div>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700 text-slate-200 inline-flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nó Mestre: <strong>Notebook MaxBorba</strong></span>
              </span>

              <span className="bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/40 inline-flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guarda Garantida: 06 Meses (180 dias)</span>
              </span>

              <span className="bg-indigo-950/90 text-indigo-200 px-3 py-1 rounded-xl border border-indigo-500/40 inline-flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Acesso Multi-IP Liberado (Android &bull; Safari iOS &bull; Desktop)</span>
              </span>
            </div>
          </div>

          {/* Master Key Card */}
          <div className="bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shrink-0 flex flex-col justify-between shadow-lg max-w-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Credencial Mestra de Articulação
            </span>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div>
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 tracking-wider">
                  {MASTER_KEY_ARTICULADOR}
                </span>
                <span className="text-[10px] text-slate-400 block">Chave Mestra do Articulador</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(MASTER_KEY_ARTICULADOR)}
                className="p-2 rounded-xl bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                title="Copiar Chave Mestra"
              >
                {copiedText === MASTER_KEY_ARTICULADOR ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-700/80 text-[11px] text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Autorizado para registrar e excluir em qualquer dispositivo</span>
            </div>
          </div>

        </div>

      </div>

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
                  <th className="px-4 py-3">Data de Registro</th>
                  <th className="px-4 py-3">Nó de Armazenamento</th>
                  <th className="px-4 py-3 text-right">Guarda Obrigatória</th>
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
                      : '06 Meses Ativo';
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
                        <td className="px-4 py-3 text-slate-600">
                          {rec.authorName} ({rec.createdByRole})
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {rec.formattedDateTimeBrasilia}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-800 border border-slate-200">
                            {rec.masterStorageNode || MASTER_STORAGE_NODE}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
                            Até {retDate} (06 Meses)
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

    </div>
  );
}
