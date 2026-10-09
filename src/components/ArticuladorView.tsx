import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Table, 
  Filter, 
  FileDown, 
  ExternalLink, 
  Copy, 
  Check, 
  Camera, 
  Upload, 
  Calendar, 
  CalendarDays,
  CalendarRange,
  Clock, 
  Building2, 
  Search, 
  LogOut, 
  AlertTriangle,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Trash2,
  Trash
} from 'lucide-react';
import { SCHOOLS, GOOGLE_SHEETS_URL, MASTER_KEY_ARTICULADOR } from '../data/schools';
import { MaintenanceRecord, School, MaintenanceCategory, UrgencyLevel, ExtraWork } from '../types';
import { getBrasiliaCurrentDateTime, formatDateOnly } from '../utils/brasiliaTime';
import { exportRecordsToCSV, formatRecordsForClipboard, isTestRecord } from '../utils/storage';
import { generateRecordPDF, generateSchoolReportPDF } from '../utils/pdfGenerator';
import { compressImage } from '../utils/imageCompressor';
import CameraCaptureModal from './CameraCaptureModal';
import RecordDetailModal from './RecordDetailModal';
import CleanTestModal from './CleanTestModal';
import SchoolCleanModal from './SchoolCleanModal';
import ExtraWorksSection from './ExtraWorksSection';
import ExtraWorkFormModal from './ExtraWorkFormModal';
import DateRangeExportModal from './DateRangeExportModal';
import MasterPasswordConfirmModal from './MasterPasswordConfirmModal';

interface ArticuladorViewProps {
  records: MaintenanceRecord[];
  extraWorks: ExtraWork[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onClearTestRecords?: () => { updated: MaintenanceRecord[]; deletedCount: number; deletedIds: string[] };
  onDeleteRecordsBySchool?: (schoolId: string) => void;
  onClearTestRecordsBySchool?: (schoolId: string) => void;
  onAddExtraWork: (work: ExtraWork) => void;
  onDeleteExtraWork?: (id: string) => void;
  onLogout: () => void;
}

export default function ArticuladorView({
  records,
  extraWorks,
  onAddRecord,
  onDeleteRecord,
  onClearTestRecords,
  onDeleteRecordsBySchool,
  onClearTestRecordsBySchool,
  onAddExtraWork,
  onDeleteExtraWork,
  onLogout
}: ArticuladorViewProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);
  const [isCleanModalOpen, setIsCleanModalOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [schoolToClean, setSchoolToClean] = useState<School | null>(null);
  const [showExtraWorkModal, setShowExtraWorkModal] = useState<boolean>(false);
  const [isDateExportModalOpen, setIsDateExportModalOpen] = useState<boolean>(false);

  // New Record Form State (Aba 2)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(SCHOOLS[0].id);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<MaintenanceCategory>('Elétrica');
  const [formUrgency, setFormUrgency] = useState<UrgencyLevel>('media');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPhoto, setFormPhoto] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState('Articulador Regional PE');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters State (Aba 6)
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all');
  const [filterMonthYear, setFilterMonthYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected school for Tab 5 (Spreadsheet Export)
  const [exportSchoolId, setExportSchoolId] = useState<string>('all');
  const [copiedSpreadsheetData, setCopiedSpreadsheetData] = useState(false);

  // Selected school for Aba 4 (Devolutivas da Coordenação)
  const [coordenacaoSchoolFilter, setCoordenacaoSchoolFilter] = useState<string>('all');
  const [coordenacaoTypeFilter, setCoordenacaoTypeFilter] = useState<'all' | 'direcao' | 'pendentes' | 'concluidos'>('all');

  // Selected school object for Aba 2
  const currentFormSchool = SCHOOLS.find(s => s.id === selectedSchoolId) || SCHOOLS[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateRecord = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Por favor, informe o enunciado/ponto de atenção.');
      return;
    }
    if (!formDeadline) {
      alert('Por favor, defina o prazo limite para a manutenção.');
      return;
    }

    const brasiliaTime = getBrasiliaCurrentDateTime();
    const newRecord: MaintenanceRecord = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: currentFormSchool.id,
      schoolName: currentFormSchool.name,
      schoolCode: currentFormSchool.code,
      createdByRole: 'articulador',
      authorName: formAuthor.trim() || 'Articulador Regional',
      photoUrl: formPhoto || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      urgency: formUrgency,
      deadline: formDeadline,
      createdAt: brasiliaTime.iso,
      formattedDateTimeBrasilia: brasiliaTime.displayDate + ' ' + brasiliaTime.displayTime,
      status: 'pendente',
      driveUrl: currentFormSchool.driveUrl
    };

    onAddRecord(newRecord);
    setSuccessToast(`Pedido cadastrado com sucesso com foto! Notificação enviada à Coordenação Técnica de ${currentFormSchool.name}.`);
    setTimeout(() => setSuccessToast(null), 5000);

    // Reset Form
    setFormTitle('');
    setFormDescription('');
    setFormDeadline('');
    setFormPhoto('');

    // Open detail modal with option to download PDF immediately
    setSelectedRecordForDetail(newRecord);
  };

  // Filtered list of Direção records (Aba 3)
  const direcaoRecords = useMemo(() => {
    return records.filter(r => r.createdByRole === 'direcao');
  }, [records]);

  // Filtered list of Coordenação records (Aba 4)
  const coordenacaoRecords = useMemo(() => {
    return records;
  }, [records]);

  // Displayed Coordenação records with school and type filter (allows viewing Direção records in Aba 4)
  const displayedCoordenacaoRecords = useMemo(() => {
    return records.filter(r => {
      if (coordenacaoSchoolFilter !== 'all' && r.schoolId !== coordenacaoSchoolFilter) return false;
      if (coordenacaoTypeFilter === 'direcao') return r.createdByRole === 'direcao';
      if (coordenacaoTypeFilter === 'pendentes') return !r.resolution;
      if (coordenacaoTypeFilter === 'concluidos') return !!r.resolution;
      return true;
    });
  }, [records, coordenacaoSchoolFilter, coordenacaoTypeFilter]);

  // Filtered list for Aba 6 (Filter by school, month, status, search)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Filter by school
      if (filterSchoolId !== 'all' && r.schoolId !== filterSchoolId) return false;
      
      // Filter by status
      if (filterStatus !== 'all') {
        if (filterStatus === 'realizado' && r.status !== 'realizado') return false;
        if (filterStatus === 'nao_realizado' && r.status !== 'nao_realizado') return false;
        if (filterStatus === 'pendente' && (r.status === 'realizado' || r.status === 'nao_realizado')) return false;
      }

      // Filter by Month/Year (YYYY-MM from createdAt or deadline)
      if (filterMonthYear !== 'all') {
        const recordDate = r.createdAt.substring(0, 7); // e.g. 2026-08
        if (recordDate !== filterMonthYear) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesSchool = r.schoolName.toLowerCase().includes(query);
        const matchesDesc = (r.description || '').toLowerCase().includes(query);
        const matchesAuthor = r.authorName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSchool && !matchesDesc && !matchesAuthor) return false;
      }

      return true;
    });
  }, [records, filterSchoolId, filterStatus, filterMonthYear, searchQuery]);

  // Export records for Aba 5
  const exportRecords = useMemo(() => {
    if (exportSchoolId === 'all') return records;
    return records.filter(r => r.schoolId === exportSchoolId);
  }, [records, exportSchoolId]);

  const handleDownloadCSV = () => {
    const csvContent = exportRecordsToCSV(exportRecords);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ESCOLA_VIVA_PARCEIRO_DA_ESCOLA_Manutencoes_${exportSchoolId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyForSheets = () => {
    const tableData = formatRecordsForClipboard(exportRecords);
    navigator.clipboard.writeText(tableData);
    setCopiedSpreadsheetData(true);
    setTimeout(() => setCopiedSpreadsheetData(false), 3000);
  };

  // Filtered list of test records (containing "teste")
  const testRecords = useMemo(() => {
    return records.filter(isTestRecord);
  }, [records]);

  const handleConfirmClearTests = () => {
    if (onClearTestRecords) {
      const result = onClearTestRecords();
      setIsCleanModalOpen(false);
      setSuccessToast(`${result.deletedCount} registro(s) de teste excluído(s) com sucesso!`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleConfirmSingleDelete = () => {
    if (recordToDelete && onDeleteRecord) {
      onDeleteRecord(recordToDelete.id);
      setSuccessToast(`Registro #${recordToDelete.id} excluído com sucesso!`);
      setRecordToDelete(null);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleCreateSampleTestRecord = () => {
    const brasiliaTime = getBrasiliaCurrentDateTime();
    const sample: MaintenanceRecord = {
      id: `art-teste-${Date.now().toString().slice(-4)}`,
      schoolId: SCHOOLS[0].id,
      schoolName: SCHOOLS[0].name,
      schoolCode: SCHOOLS[0].code,
      createdByRole: 'articulador',
      authorName: 'Articulador (Teste)',
      photoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      title: 'Teste de Manutenção do Sistema - Lâmpada do Corredor',
      description: 'Registro gerado exclusivamente para teste do sistema e validação da rotina de limpeza.',
      category: 'Elétrica',
      urgency: 'baixa',
      deadline: '2026-08-30',
      createdAt: brasiliaTime.iso,
      formattedDateTimeBrasilia: brasiliaTime.displayDate + ' ' + brasiliaTime.displayTime,
      status: 'pendente',
      driveUrl: SCHOOLS[0].driveUrl
    };
    onAddRecord(sample);
    setSuccessToast('Registro de teste criado para validação da lixeira!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleExportConsolidatedPDF = () => {
    const schoolName = exportSchoolId === 'all' 
      ? 'Todas as Unidades Escolares' 
      : SCHOOLS.find(s => s.id === exportSchoolId)?.name || 'Escola';
    generateSchoolReportPDF(schoolName, exportRecords);
  };

  return (
    <div id="articulador-view" className="min-h-screen bg-[#F1F5F9] flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Top Header */}
      <header className="bg-indigo-700 text-white sticky top-0 z-30 shadow-lg border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-xs">
              EV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl text-white tracking-tight">
                  ESCOLA VIVA PARCEIRO DA ESCOLA
                </h1>
                <span className="bg-indigo-800 text-indigo-100 text-xs font-bold px-2 py-0.5 rounded border border-indigo-400/30">
                  Painel do Articulador
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Sessão Master Autenticada &bull; Gestão Estratégica das 10 Escolas Estaduais
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Botão: Seleção de Datas dos Laudos a serem baixados em PDF ou Planilha Google */}
            <button
              id="header-date-range-export-btn"
              type="button"
              onClick={() => setIsDateExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer ring-1 ring-amber-500/50"
              title="Seleção de datas dos laudos a serem baixados em PDF ou planilha Google"
            >
              <CalendarDays className="w-4 h-4 text-slate-950" />
              <span>Laudos por Data (PDF / Sheets)</span>
            </button>

            {/* Botão: Novo Pedido com Foto */}
            <button
              id="header-new-request-photo-btn"
              type="button"
              onClick={() => setActiveTab(2)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ring-1 ring-amber-500/50"
              title="Registrar novo pedido com foto e notificar a coordenação"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Novo Pedido com Foto</span>
            </button>

            {/* Botão: Inserir trabalhos realizados conforme plano e/ou manutenção extra */}
            <button
              id="header-insert-extra-work-btn"
              type="button"
              onClick={() => setShowExtraWorkModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Inserir trabalhos realizados conforme plano e/ou manutenção extra"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Inserir Trabalho / Manutenção Extra</span>
            </button>

            {/* Trash Icon Button to Clean Test Data */}
            <button
              id="header-clean-tests-btn"
              type="button"
              onClick={() => setIsCleanModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                testRecords.length > 0
                  ? 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 border-rose-400/50 shadow-xs ring-1 ring-rose-400/30 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
              title="Limpar registros com a denominação 'teste'"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              <span>Limpar Testes</span>
              {testRecords.length > 0 && (
                <span className="bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full text-[10px] ml-0.5">
                  {testRecords.length}
                </span>
              )}
            </button>

            <div className="bg-indigo-800 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-indigo-400/30 text-indigo-100 hidden md:flex">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Rede Conectada
            </div>

            <a
              id="header-official-sheet-link"
              href={GOOGLE_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planilha Oficial</span> Google
            </a>

            <button
              id="articulador-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              Sair
            </button>
          </div>

        </div>

        {/* 7 TABS NAVIGATION BAR (Sleek Underline Pattern) */}
        <div className="bg-white border-t border-indigo-800/40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-0">
            
            {/* 1ª aba – Códigos das escolas */}
            <button
              id="tab-btn-1-codigos"
              onClick={() => setActiveTab(1)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 1
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>1ª Aba &bull; Códigos das Escolas</span>
            </button>

            {/* 2ª aba – Registros por parte do articulador */}
            <button
              id="tab-btn-2-registros-articulador"
              onClick={() => setActiveTab(2)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 2
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>2ª Aba &bull; Novo Registro (Articulador)</span>
            </button>

            {/* 3ª aba - Registros de diretor */}
            <button
              id="tab-btn-3-registros-diretor"
              onClick={() => setActiveTab(3)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 3
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>3ª Aba &bull; Registros de Direção ({direcaoRecords.length})</span>
            </button>

            {/* 4ª aba - Registro de coordenação */}
            <button
              id="tab-btn-4-registros-coordenacao"
              onClick={() => setActiveTab(4)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 4
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>4ª Aba &bull; Devolutivas Coordenação ({coordenacaoRecords.length})</span>
            </button>

            {/* 5ª aba – Exportação de dados para planilha */}
            <button
              id="tab-btn-5-exportacao-planilha"
              onClick={() => setActiveTab(5)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 5
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>5ª Aba &bull; Exportação para Planilha</span>
            </button>

            {/* 6ª aba – Filtrar os dados por escola e por data */}
            <button
              id="tab-btn-6-filtros-dados"
              onClick={() => setActiveTab(6)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 6
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>6ª Aba &bull; Filtrar por Escola / Data</span>
            </button>

            {/* 7ª aba - Trabalhos extras concretizados */}
            <button
              id="tab-btn-7-trabalhos-extras"
              onClick={() => setActiveTab(7)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 border-b-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 7
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70'
                  : 'border-transparent text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>7ª Aba &bull; Trabalhos Extras Concretizados ({extraWorks.length})</span>
            </button>

          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold shadow-md animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* MAIN BODY AREA */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* ========================================================================= */}
        {/* 1ª ABA – CÓDIGOS DAS ESCOLAS (Quadro Geral) */}
        {/* ========================================================================= */}
        {activeTab === 1 && (
          <div id="tab-1-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <KeyRound className="w-3.5 h-3.5" /> Quadro Geral de Códigos
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Códigos de Diretores e Coordenadores
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Estes códigos são exclusivos do articulador. Cada diretor e coordenador utiliza apenas o código de 4 dígitos referente à sua própria escola.
                </p>
              </div>

              <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shrink-0 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Credencial de Articulação:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-400 tracking-wider">CHAVE MESTRA PROTEGIDA</span>
                </div>
              </div>
            </div>

            {/* School Code Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {SCHOOLS.map((school, index) => {
                const schoolRecords = records.filter(r => r.schoolId === school.id);
                const pendingCount = schoolRecords.filter(r => r.status === 'pendente' || r.status === 'em_andamento').length;
                const doneCount = schoolRecords.filter(r => r.status === 'realizado').length;

                return (
                  <div 
                    key={school.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          0{index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">
                            {school.name}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">{school.gre} &bull; {school.city}</span>
                        </div>
                      </div>

                      {/* Code Badge */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Código</span>
                        <div className="inline-flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-3 py-1 rounded-xl font-mono font-bold text-sm shadow-xs">
                          <span>{school.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(school.code)}
                            title="Copiar código"
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedCode === school.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                          {pendingCount} Pendentes
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                          {doneCount} Realizados
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Botão de Excluir / Limpar Dados da Escola (Requisito 5) */}
                        <button
                          type="button"
                          onClick={() => setSchoolToClean(school)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold hover:shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Excluir registros ou limpar dados de teste desta escola"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Excluir / Limpar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSchoolId(school.id);
                            setActiveTab(2);
                          }}
                          className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Criar</span>
                        </button>

                        <a
                          href={school.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Drive</span>
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2ª ABA – REGISTROS POR PARTE DO ARTICULADOR (No Devido Ícone do Colégio) */}
        {/* ========================================================================= */}
        {activeTab === 2 && (
          <div id="tab-2-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <PlusCircle className="w-3.5 h-3.5" /> Registro Oficial do Articulador
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Novo Registro de Ponto de Manutenção
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Selecione o colégio estadual, registre a imagem com prazo e enunciado e gere o laudo em PDF para envio à empresa parceira.
              </p>
            </div>

            {/* School Quick Switcher Selector (10 Colégios) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Selecione o Colégio para o Registro: <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {SCHOOLS.map(s => {
                  const isSelected = s.id === selectedSchoolId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSchoolId(s.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="text-[11px] leading-tight line-clamp-2">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">Cód: {s.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected School Banner + Drive Link */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white">{currentFormSchool.name}</h3>
                  <p className="text-xs text-slate-300">Código Oficial: {currentFormSchool.code}</p>
                </div>
              </div>

              <a
                href={currentFormSchool.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Pasta no Google Drive Desta Escola
              </a>
            </div>

            {/* Main Form: Left (Image) + Right (Enunciado + Prazo + Submit) */}
            <form onSubmit={handleCreateRecord} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Image Capture / Upload (Android & Safari Compatible) */}
                <div className="md:col-span-5 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Foto da Ocorrência (Câmera / Arquivo):
                  </label>

                  {formPhoto ? (
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950 group">
                      <img
                        src={formPhoto}
                        alt="Foto da Manutenção"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCameraModalOpen(true)}
                          className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-md"
                        >
                          <Camera className="w-4 h-4" /> Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormPhoto('')}
                          className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow-md"
                        >
                          <XCircle className="w-4 h-4" /> Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <button
                        id="articulador-open-camera-btn"
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="w-full aspect-4/3 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900 flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-sm">Abrir Câmera do Celular / PC</span>
                        <span className="text-[11px] text-emerald-700 mt-1">Compatível com Android e Safari iOS</span>
                      </button>

                      {/* Fallback direct file input */}
                      <label 
                        id="articulador-file-upload-label"
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Carregar da Galeria / Arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                if (compressed) setFormPhoto(compressed);
                              } catch (err) {
                                console.warn('Erro ao processar imagem:', err);
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) setFormPhoto(ev.target.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    O PDF será gerado com esta imagem posicionada à esquerda e o enunciado à direita com a data abaixo.
                  </p>
                </div>

                {/* Right Column: Enunciado, Prazo, Categoria, Descrição */}
                <div className="md:col-span-7 space-y-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Enunciado / Ponto que Requer Atenção: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="articulador-title-input"
                      type="text"
                      required
                      placeholder="Ex: Reparo no telhado do bloco pedagógico e revisão do quadro de força"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Descrição Detalhada do Problema:
                    </label>
                    <textarea
                      id="articulador-description-input"
                      rows={3}
                      placeholder="Especifique local exato, gravidade, salas afetadas ou necessidades de peças..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Prazo Limite: <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="articulador-deadline-input"
                        type="date"
                        required
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Categoria:
                      </label>
                      <select
                        id="articulador-category-select"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as MaintenanceCategory)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="Elétrica">Elétrica</option>
                        <option value="Hidráulica">Hidráulica</option>
                        <option value="Estrutural / Alvenaria">Estrutural</option>
                        <option value="Pintura">Pintura</option>
                        <option value="Telhado / Infiltração">Telhado</option>
                        <option value="Mobiliário / Equipamento">Mobiliário</option>
                        <option value="Sanitários">Sanitários</option>
                        <option value="Acessibilidade">Acessibilidade</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Nível de Urgência:
                      </label>
                      <select
                        id="articulador-urgency-select"
                        value={formUrgency}
                        onChange={(e) => setFormUrgency(e.target.value as UrgencyLevel)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">URGENTE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Nome do Articulador Responsável:
                    </label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                </div>

              </div>

              {/* Automatic Brasília Time & Submit Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 sm:p-6 rounded-b-2xl">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data/Hora Automática de Brasília incluída na confirmação.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    id="save-articulador-record-btn"
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Registro e Gerar Laudo
                  </button>
                </div>
              </div>

            </form>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 3ª ABA – REGISTROS DE DIRETOR */}
        {/* ========================================================================= */}
        {activeTab === 3 && (
          <div id="tab-3-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
                  <Building2 className="w-3.5 h-3.5" /> 3ª Aba &bull; Gestão das Solicitações
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Todas as Solicitações Feitas pela Direção Escolar
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  O articulador consegue abrir todas as solicitações com imagens, datas de Brasília, enunciados e prazos.
                </p>
              </div>

              <span className="bg-slate-900 text-emerald-400 font-bold px-3.5 py-1.5 rounded-xl text-xs">
                {direcaoRecords.length} Registros de Diretor
              </span>
            </div>

            {direcaoRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-700">Nenhuma solicitação da direção registrada ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {direcaoRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      
                      {/* Top Header of card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-teal-700 uppercase block">
                              {rec.schoolName}
                            </span>
                            {isTestRecord(rec) && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                                Teste
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-base leading-snug mt-0.5 line-clamp-2">
                            {rec.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          rec.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Photo Thumbnail + Enunciado & Prazo Layout */}
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={rec.photoUrl}
                            alt={rec.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="col-span-8 text-xs text-slate-600 space-y-1">
                          <p className="font-semibold text-rose-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Prazo: {formatDateOnly(rec.deadline)}
                          </p>
                          <p className="text-slate-500">
                            Autor: <strong className="text-slate-700">{rec.authorName}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rec.formattedDateTimeBrasilia}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <a
                        href={rec.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Pasta Drive
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalhes / PDF
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 4ª ABA – REGISTRO DE COORDENAÇÃO (Devolutivas: Realizado / Não Realizado) */}
        {/* ========================================================================= */}
        {activeTab === 4 && (
          <div id="tab-4-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4ª Aba &bull; Devolutivas da Empresa Parceira
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Acompanhamento de Devolutivas da Coordenação
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Todas as respostas da coordenação permanecem salvas no aplicativo para conferência. Apenas o Articulador possui permissão para apagar registros via senha mestre ({MASTER_KEY_ARTICULADOR}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-xl text-xs">
                  {records.filter(r => r.resolution?.status === 'realizado').length} Realizados
                </span>
                <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-xl text-xs">
                  {records.filter(r => r.resolution?.status === 'nao_realizado').length} Não Realizados
                </span>
              </div>
            </div>

            {/* School Filter Bar for Aba 4 */}
            <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-700">Filtrar por Escola:</span>
                <select
                  id="coordenacao-school-filter-select"
                  value={coordenacaoSchoolFilter}
                  onChange={(e) => setCoordenacaoSchoolFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="all">Todas as 10 Escolas ({records.length} chamados)</option>
                  {SCHOOLS.map(s => {
                    const count = records.filter(r => r.schoolId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sub-tab filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCoordenacaoTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    coordenacaoTypeFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({records.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCoordenacaoTypeFilter('direcao')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    coordenacaoTypeFilter === 'direcao'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ver pedidos feitos pela direção da escola encaminhados à coordenação"
                >
                  Pedidos da Direção ({records.filter(r => r.createdByRole === 'direcao').length})
                </button>

                <button
                  type="button"
                  onClick={() => setCoordenacaoTypeFilter('pendentes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    coordenacaoTypeFilter === 'pendentes'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aguardando Resposta ({records.filter(r => !r.resolution).length})
                </button>

                <button
                  type="button"
                  onClick={() => setCoordenacaoTypeFilter('concluidos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    coordenacaoTypeFilter === 'concluidos'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Laudos Concluídos ({records.filter(r => !!r.resolution).length})
                </button>
              </div>

              <span className="text-xs font-medium text-slate-500">
                Mostrando <strong>{displayedCoordenacaoRecords.length}</strong> de <strong>{records.length}</strong> demandas
              </span>
            </div>

            {displayedCoordenacaoRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-800 text-base">Nenhuma demanda encontrada com o filtro selecionado.</p>
                <p className="text-xs text-slate-500 mt-1">Todas as demandas de manutenção registradas pela Direção e pelo Articulador são mantidas permanentemente aqui para auditoria e conferência.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedCoordenacaoRecords.map(rec => (
                <div 
                  key={rec.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-emerald-500 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{rec.schoolName}</span>
                        {rec.createdByRole === 'direcao' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                            Pedido da Direção
                          </span>
                        )}
                        {rec.createdByRole === 'articulador' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Pedido do Articulador
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{rec.title}</h3>
                    </div>

                    {rec.resolution ? (
                      rec.resolution?.status === 'realizado' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> [ X ] Realizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-4 h-4 text-rose-600" /> [ X ] Não Realizado
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-4 h-4 text-amber-700" /> Aguardando Resposta da Coordenação
                      </span>
                    )}
                  </div>

                  {rec.resolution ? (
                    /* Before / After Photos comparison */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">1. Foto do Problema (Original):</span>
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={rec.photoUrl} alt="Problema" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">2. Foto da Devolutiva / Conserto:</span>
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          {rec.resolution?.resolvedPhotoUrl ? (
                            <img src={rec.resolution.resolvedPhotoUrl} alt="Conserto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xs text-slate-400">Sem foto de conserto anexada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="sm:col-span-4 aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={rec.photoUrl} alt="Problema" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="sm:col-span-8 text-xs text-slate-600 space-y-1.5">
                        <p className="font-semibold text-rose-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Prazo Solicitado: {formatDateOnly(rec.deadline)}
                        </p>
                        <p className="text-slate-600">
                          Solicitante: <strong className="text-slate-800">{rec.authorName}</strong> ({rec.createdByRole === 'direcao' ? 'Direção Escolar' : 'Articulador Regional'})
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Data/Hora do Registro: {rec.formattedDateTimeBrasilia}
                        </p>
                        {rec.description && (
                          <p className="text-slate-700 text-xs mt-1 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                            {rec.description}
                          </p>
                        )}
                        <p className="text-amber-800 font-semibold text-[11px] pt-1">
                          ⚡ Demanda encaminhada à empresa parceira. Aguardando execução do serviço e devolutiva com foto.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes & Deadlines */}
                  {rec.resolution && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <p className="text-slate-800 font-medium">
                        <strong>Observações do Serviço Técnico:</strong> {rec.resolution?.notes}
                      </p>
                      
                      {rec.resolution?.newDeadlineIfUnresolved && (
                        <p className="text-rose-700 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                          Novo Prazo Reprogramado: {formatDateOnly(rec.resolution.newDeadlineIfUnresolved)}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-slate-500 text-[11px] pt-1">
                        <span>Responsável Técnico: <strong>{rec.resolution?.resolvedBy}</strong></span>
                        <span>Data/Hora da Devolutiva: <strong>{rec.resolution?.resolvedTimeBrasilia}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <a
                      href={rec.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Pasta do Drive
                    </a>

                    <button
                      type="button"
                      onClick={() => setRecordToDelete(rec)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRecordForDetail(rec)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                      Baixar PDF com Devolutiva
                    </button>
                  </div>

                </div>
              ))}
            </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 5ª ABA – EXPORTAÇÃO DE DADOS PARA PLANILHA GOOGLE */}
        {/* ========================================================================= */}
        {activeTab === 5 && (
          <div id="tab-5-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Table className="w-3.5 h-3.5" /> 5ª Aba &bull; Integração com Planilha Oficial
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Exportação de Registros para o Google Sheets
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Selecione o colégio e sincronize ou copie os dados formatados diretamente na Planilha Oficial da Parceria Escola x Privada.
              </p>
            </div>

            {/* Official Google Spreadsheet Callout Banner */}
            <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Planilha Oficial do Projeto (Google Sheets):
                </span>
                <p className="font-mono text-xs text-slate-300 break-all">
                  {GOOGLE_SHEETS_URL}
                </p>
              </div>

              <a
                id="open-spreadsheet-direct-btn"
                href={GOOGLE_SHEETS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Planilha no Google Sheets
              </a>
            </div>

            {/* Select School to Export */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Filtrar Colégio para Exportação:
                  </label>
                  <select
                    id="export-school-select"
                    value={exportSchoolId}
                    onChange={(e) => setExportSchoolId(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden min-w-[280px]"
                  >
                    <option value="all">Todas as 10 Escolas Integradas ({records.length} itens)</option>
                    {SCHOOLS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Cód: {s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="tab5-date-range-export-btn"
                    type="button"
                    onClick={() => setIsDateExportModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ring-1 ring-amber-500/50"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-950" />
                    <span>Filtrar Laudos por Período de Datas</span>
                  </button>

                  <button
                    id="copy-for-sheets-btn"
                    type="button"
                    onClick={handleCopyForSheets}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {copiedSpreadsheetData ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-400" />
                        <span>Copiar Tabela para Colar no Sheets</span>
                      </>
                    )}
                  </button>

                  <button
                    id="download-csv-btn"
                    type="button"
                    onClick={handleDownloadCSV}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Baixar Arquivo CSV</span>
                  </button>

                  <button
                    id="download-report-pdf-btn"
                    type="button"
                    onClick={handleExportConsolidatedPDF}
                    className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Baixar Relatório em PDF</span>
                  </button>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-mono">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Escola</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Enunciado</th>
                      <th className="p-3">Prazo</th>
                      <th className="p-3">Data/Hora (Brasília)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Devolutiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {exportRecords.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-3 font-mono text-slate-500">{r.id}</td>
                        <td className="p-3 font-bold text-slate-900">{r.schoolName}</td>
                        <td className="p-3 font-mono">{r.schoolCode}</td>
                        <td className="p-3 max-w-xs truncate">{r.title}</td>
                        <td className="p-3 text-rose-700 font-bold">{formatDateOnly(r.deadline)}</td>
                        <td className="p-3 text-slate-500">{r.formattedDateTimeBrasilia}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate">
                          {r.resolution?.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 6ª ABA – FILTRAR OS DADOS POR ESCOLA E POR DATA (MÊS) */}
        {/* ========================================================================= */}
        {activeTab === 6 && (
          <div id="tab-6-content" className="space-y-6">
            
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <Filter className="w-3.5 h-3.5" /> 6ª Aba &bull; Painel de Filtros Avançados
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Filtrar Ocorrências por Escola e por Data (Mês/Ano)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Refine as ocorrências por unidade escolar, mês de registro, status de atendimento ou busque por termos específicos.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botão: Seleção de Datas dos Laudos a serem baixados em PDF ou Planilha */}
                <button
                  id="tab6-date-range-export-btn"
                  type="button"
                  onClick={() => setIsDateExportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer ring-1 ring-amber-500/50"
                >
                  <CalendarDays className="w-4 h-4 text-slate-950" />
                  <span>Baixar Laudos / Planilha por Período</span>
                </button>

                {/* Quick Clean Tests Button with Trash Icon in Tab 6 */}
                <button
                  id="tab6-clean-tests-btn"
                  type="button"
                  onClick={() => setIsCleanModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                    testRecords.length > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-rose-300" />
                  <span>Limpar Dados de Teste {testRecords.length > 0 ? `(${testRecords.length})` : ''}</span>
                </button>
              </div>
            </div>

            {/* Test Data Cleanup Banner if test records exist */}
            {testRecords.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-700 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-950 text-sm">
                      {testRecords.length} Registro(s) com denominação "Teste" Detectado(s)
                    </h4>
                    <p className="text-xs text-rose-800">
                      Você pode limpar e remover todas essas ocorrências de teste em um único clique para manter a base oficial organizada.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCleanModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Abrir Lixeira de Testes</span>
                </button>
              </div>
            )}

            {/* Filter Controls Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. Filter by School */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Filtrar por Escola:
                  </label>
                  <select
                    id="filter-school-select"
                    value={filterSchoolId}
                    onChange={(e) => setFilterSchoolId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">Todas as Escolas</option>
                    {SCHOOLS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter by Month/Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Filtrar por Mês (Data):
                  </label>
                  <select
                    id="filter-month-select"
                    value={filterMonthYear}
                    onChange={(e) => setFilterMonthYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">Todos os Meses</option>
                    <option value="2026-08">Agosto / 2026</option>
                    <option value="2026-07">Julho / 2026</option>
                    <option value="2026-06">Junho / 2026</option>
                    <option value="2026-05">Maio / 2026</option>
                  </select>
                </div>

                {/* 3. Filter by Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Filtrar por Status:
                  </label>
                  <select
                    id="filter-status-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pendente">Pendente / Em Andamento</option>
                    <option value="realizado">Realizado</option>
                    <option value="nao_realizado">Não Realizado</option>
                  </select>
                </div>

                {/* 4. Search by Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Busca por Palavra-Chave:
                  </label>
                  <div className="relative">
                    <input
                      id="search-query-input"
                      type="text"
                      placeholder="Ex: lâmpada, telhado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

              </div>

              {/* Reset Filters button */}
              {(filterSchoolId !== 'all' || filterMonthYear !== 'all' || filterStatus !== 'all' || searchQuery) && (
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500 font-medium">
                    Mostrando <strong>{filteredRecords.length}</strong> de {records.length} ocorrências
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSchoolId('all');
                      setFilterMonthYear('all');
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Limpar Filtros
                  </button>
                </div>
              )}

            </div>

            {/* Filtered Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map(rec => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          Cód: {rec.schoolCode}
                        </span>
                        {isTestRecord(rec) && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                            Teste
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {rec.title}
                    </h4>

                    <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={rec.photoUrl} alt={rec.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p className="font-medium text-slate-800">{rec.schoolName}</p>
                      <p className="text-rose-700 font-semibold">Prazo: {formatDateOnly(rec.deadline)}</p>
                      <p className="text-[11px] text-slate-400">{rec.formattedDateTimeBrasilia}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={rec.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Drive
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(rec)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir este registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRecordForDetail(rec)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Detalhes / PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 7ª ABA – TRABALHOS EXTRAS CONCRETIZADOS (Visualização e Exportação PDF) */}
        {/* ========================================================================= */}
        {activeTab === 7 && (
          <div id="tab-7-content">
            <ExtraWorksSection
              works={extraWorks}
              userRole="articulador"
              onAddExtraWork={onAddExtraWork}
              onDeleteExtraWork={onDeleteExtraWork}
            />
          </div>
        )}

      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(img) => setFormPhoto(img)}
        title="Fotografar Ponto de Atenção"
      />

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
      />

      {/* Clean Test Data Modal (Lixeira de Testes Geral) */}
      <CleanTestModal
        isOpen={isCleanModalOpen}
        onClose={() => setIsCleanModalOpen(false)}
        testRecords={testRecords}
        onConfirmClearAll={handleConfirmClearTests}
        onDeleteSingle={(id) => {
          if (onDeleteRecord) {
            onDeleteRecord(id);
            setSuccessToast(`Registro de teste #${id} removido!`);
            setTimeout(() => setSuccessToast(null), 3000);
          }
        }}
        onCreateSampleTest={handleCreateSampleTestRecord}
      />

      {/* Per-School Clean Modal (1ª Aba - Limpar/Excluir dados da Escola) */}
      {schoolToClean && (
        <SchoolCleanModal
          school={schoolToClean}
          records={records}
          onClose={() => setSchoolToClean(null)}
          onDeleteSingleRecord={(id) => {
            if (onDeleteRecord) {
              onDeleteRecord(id);
              setSuccessToast(`Registro #${id} excluído com sucesso!`);
              setTimeout(() => setSuccessToast(null), 3500);
            }
          }}
          onClearTestRecordsForSchool={(schoolId) => {
            if (onClearTestRecordsBySchool) {
              onClearTestRecordsBySchool(schoolId);
              setSuccessToast(`Registros de teste da unidade foram limpos!`);
              setTimeout(() => setSuccessToast(null), 3500);
            }
          }}
          onDeleteAllRecordsForSchool={(schoolId) => {
            if (onDeleteRecordsBySchool) {
              onDeleteRecordsBySchool(schoolId);
              setSuccessToast(`Todos os registros da escola foram excluídos com sucesso!`);
              setTimeout(() => setSuccessToast(null), 3500);
            }
          }}
        />
      )}

      {/* Modal: Seleção de Datas dos Laudos e Planilhas */}
      <DateRangeExportModal
        isOpen={isDateExportModalOpen}
        onClose={() => setIsDateExportModalOpen(false)}
        records={records}
        extraWorks={extraWorks}
        userRole="articulador"
      />

      {/* Modal: Inserir trabalhos realizados conforme plano e/ou manutenção extra */}
      {showExtraWorkModal && (
        <ExtraWorkFormModal
          registeredByRole="articulador"
          onClose={() => setShowExtraWorkModal(false)}
          onSaveExtraWork={(newWork) => {
            onAddExtraWork(newWork);
            setSuccessToast(`Trabalho realizado "${newWork.title}" concretizado e registrado com sucesso!`);
            setTimeout(() => setSuccessToast(null), 4000);
            setActiveTab(7); // Switch to Tab 7 to see the new work
          }}
        />
      )}

      {/* Single Record Delete Confirmation Modal com Senha Mestre */}
      {recordToDelete && (
        <MasterPasswordConfirmModal
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={handleConfirmSingleDelete}
          title="Excluir Ocorrência via Lixeira"
          description={`Atenção Articulador: toda informação cadastrada permanece salva indefinidamente. Para confirmar a exclusão deste registro via lixeira, digite a senha mestre (${MASTER_KEY_ARTICULADOR}):`}
          itemDetails={[
            { label: 'Protocolo', value: `#${recordToDelete.id}` },
            { label: 'Título', value: recordToDelete.title },
            { label: 'Escola', value: recordToDelete.schoolName },
            { label: 'Autor', value: `${recordToDelete.authorName} (${recordToDelete.createdByRole})` },
            { label: 'Data', value: recordToDelete.formattedDateTimeBrasilia }
          ]}
          confirmButtonText="Confirmar Exclusão com Senha Mestre"
          warningText="Esta ação apagará permanentemente esta ocorrência da base de dados e do histórico."
        />
      )}

    </div>
  );
}
