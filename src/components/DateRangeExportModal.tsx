import { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Building2, 
  Filter, 
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MaintenanceRecord, ExtraWork, School } from '../types';
import { SCHOOLS, GOOGLE_SHEETS_URL } from '../data/schools';
import { formatDateOnly } from '../utils/brasiliaTime';
import { exportRecordsToCSV, formatRecordsForClipboard } from '../utils/storage';
import { generateDateFilteredReportPDF } from '../utils/pdfGenerator';

interface DateRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MaintenanceRecord[];
  extraWorks: ExtraWork[];
  currentSchool?: School; // Fixed if logged as Diretor or Coordenador
  userRole: 'articulador' | 'direcao' | 'coordenacao';
}

export default function DateRangeExportModal({
  isOpen,
  onClose,
  records,
  extraWorks,
  currentSchool,
  userRole
}: DateRangeExportModalProps) {
  // Preset defaults: current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  
  const defaultStart = `${currentYear}-${currentMonth}-01`;
  const defaultEnd = today.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [dateCriterion, setDateCriterion] = useState<'createdAt' | 'deadline' | 'resolutionDate'>('createdAt');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchool ? currentSchool.id : 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [includeExtraWorks, setIncludeExtraWorks] = useState<boolean>(true);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'today' | 'last7' | 'last15' | 'thisMonth' | 'lastMonth' | 'year2026' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'today') {
      const d = now.toISOString().slice(0, 10);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'last7') {
      const prior = new Date();
      prior.setDate(prior.getDate() - 7);
      setStartDate(prior.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'last15') {
      const prior = new Date();
      prior.setDate(prior.getDate() - 15);
      setStartDate(prior.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'thisMonth') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      setStartDate(start);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'lastMonth') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstDayLastMonth.toISOString().slice(0, 10));
      setEndDate(lastDayLastMonth.toISOString().slice(0, 10));
    } else if (preset === 'year2026') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter Records by Date Range, School & Status
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. School filter
      if (selectedSchoolId !== 'all' && r.schoolId !== selectedSchoolId) {
        return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'realizado' && r.status !== 'realizado') return false;
        if (selectedStatus === 'nao_realizado' && r.status !== 'nao_realizado') return false;
        if (selectedStatus === 'pendente' && (r.status === 'realizado' || r.status === 'nao_realizado')) return false;
      }

      // 3. Date Range filter
      let targetDateStr = '';
      if (dateCriterion === 'createdAt') {
        targetDateStr = r.createdAt.substring(0, 10);
      } else if (dateCriterion === 'deadline') {
        targetDateStr = r.deadline;
      } else if (dateCriterion === 'resolutionDate') {
        targetDateStr = r.resolution?.resolvedDate || r.createdAt.substring(0, 10);
      }

      if (startDate && targetDateStr < startDate) return false;
      if (endDate && targetDateStr > endDate) return false;

      return true;
    });
  }, [records, selectedSchoolId, selectedStatus, dateCriterion, startDate, endDate]);

  // Filter Extra Works by Date Range & School
  const filteredExtraWorks = useMemo(() => {
    if (!includeExtraWorks) return [];
    return extraWorks.filter(w => {
      if (selectedSchoolId !== 'all' && w.schoolId !== selectedSchoolId) {
        return false;
      }
      const targetDate = w.completedDate || w.createdAt?.substring(0, 10) || '';
      if (startDate && targetDate < startDate) return false;
      if (endDate && targetDate > endDate) return false;
      return true;
    });
  }, [extraWorks, includeExtraWorks, selectedSchoolId, startDate, endDate]);

  if (!isOpen) return null;

  const getScopeLabel = () => {
    if (selectedSchoolId === 'all') return 'Todas as 10 Unidades Escolares';
    const found = SCHOOLS.find(s => s.id === selectedSchoolId);
    return found ? found.name : 'Unidade Escolar';
  };

  const getDateRangeLabel = () => {
    if (!startDate && !endDate) return 'Todo o Período Histórico';
    if (startDate && !endDate) return `A partir de ${formatDateOnly(startDate)}`;
    if (!startDate && endDate) return `Até ${formatDateOnly(endDate)}`;
    if (startDate === endDate) return `Data: ${formatDateOnly(startDate)}`;
    return `Período: ${formatDateOnly(startDate)} até ${formatDateOnly(endDate)}`;
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateDateFilteredReportPDF(
        getScopeLabel(),
        getDateRangeLabel(),
        filteredRecords,
        filteredExtraWorks
      );
    } catch (e) {
      console.error('Error generating date-filtered PDF:', e);
      alert('Erro ao gerar laudo em PDF. Tente novamente.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadCSV = () => {
    const csv = exportRecordsToCSV(filteredRecords);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanScope = getScopeLabel().replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `LAUDO_PLANILHA_${cleanScope}_${startDate || 'inicio'}_a_${endDate || 'fim'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySheets = () => {
    const tableData = formatRecordsForClipboard(filteredRecords);
    navigator.clipboard.writeText(tableData);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-auto">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner shrink-0">
              <CalendarRange className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Exportador por Período
                </span>
                <span className="text-xs text-indigo-200 font-mono">PDF & Google Sheets</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight">
                Seleção de Datas dos Laudos & Planilhas
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                Filtre ocorrências e laudos por intervalo de datas para download imediato em PDF ou exportação Google Sheets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Period Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Atalhos Rápidos de Período:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSetPreset('thisMonth')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('lastMonth')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Mês Anterior
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('last7')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Últimos 7 Dias
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('last15')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Últimos 15 Dias
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('today')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('year2026')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Ano Letivo 2026
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('all')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Todo o Período
              </button>
            </div>
          </div>

          {/* Date Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Data Inicial:</span>
              </label>
              <input
                id="filter-date-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Data Final:</span>
              </label>
              <input
                id="filter-date-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Critério de Data para o Filtro:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                  dateCriterion === 'createdAt' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="dateCriterion"
                    value="createdAt"
                    checked={dateCriterion === 'createdAt'}
                    onChange={() => setDateCriterion('createdAt')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Data de Registro (Brasília)</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                  dateCriterion === 'deadline' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="dateCriterion"
                    value="deadline"
                    checked={dateCriterion === 'deadline'}
                    onChange={() => setDateCriterion('deadline')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Prazo Limite</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                  dateCriterion === 'resolutionDate' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-400' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="radio"
                    name="dateCriterion"
                    value="resolutionDate"
                    checked={dateCriterion === 'resolutionDate'}
                    onChange={() => setDateCriterion('resolutionDate')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Data de Devolutiva / Conclusão</span>
                </label>
              </div>
            </div>
          </div>

          {/* School & Status Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* School selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Unidade Escolar:</span>
              </label>
              {currentSchool ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>{currentSchool.name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">(Cód: {currentSchool.code})</span>
                </div>
              ) : (
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">Todas as 10 Escolas do NRE Maringá</option>
                  {SCHOOLS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Cód: {s.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Status selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Status de Atendimento:</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">Todos os Status (Realizados, Não Realizados e Pendentes)</option>
                <option value="realizado">Somente Realizados [ X ]</option>
                <option value="nao_realizado">Somente Não Realizados [ X ]</option>
                <option value="pendente">Somente Pendentes / Em Andamento</option>
              </select>
            </div>

          </div>

          {/* Extra Works Toggle */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Incluir Trabalhos Extras e Manutenções do Plano Concretizados
                </p>
                <p className="text-[11px] text-emerald-700">
                  Adiciona laudos fotográficos com antes e depois das manutenções extras concluídas no período.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeExtraWorks}
                onChange={(e) => setIncludeExtraWorks(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Live Period Results Summary Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                Resumo dos Dados Filtrados:
              </span>
              <h4 className="text-sm font-extrabold text-white mt-0.5">
                {getScopeLabel()} &bull; {getDateRangeLabel()}
              </h4>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                <span>Solicitações: <strong>{filteredRecords.length}</strong></span>
                {includeExtraWorks && <span>Obras Extras: <strong>{filteredExtraWorks.length}</strong></span>}
                <span>Total: <strong>{filteredRecords.length + filteredExtraWorks.length} itens</strong></span>
              </p>
            </div>

            {filteredRecords.length === 0 && filteredExtraWorks.length === 0 ? (
              <span className="text-xs text-amber-400 font-bold bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                Nenhum dado no período
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Exportação
              </span>
            )}
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <a
            href={GOOGLE_SHEETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1.5 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Planilha Oficial Google</span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Copy for Google Sheets */}
            <button
              type="button"
              onClick={handleCopySheets}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Copiar dados formatados para colar no Google Sheets"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar p/ Google Sheets</span>
                </>
              )}
            </button>

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Baixar planilha CSV com as ocorrências do período"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Baixar CSV</span>
            </button>

            {/* Download PDF Report */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF || (filteredRecords.length === 0 && filteredExtraWorks.length === 0)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Gerar e baixar Laudo Oficial em PDF com fotos e devolutivas do período"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span>{isExportingPDF ? 'Gerando PDF...' : 'Baixar Laudo em PDF'}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
