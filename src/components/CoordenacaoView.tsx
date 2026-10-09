import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CalendarDays,
  Camera, 
  ExternalLink, 
  Eye, 
  LogOut, 
  Building2,
  Filter,
  Check,
  PlusCircle,
  Sparkles,
  FileCheck,
  Smartphone,
  Tablet,
  Laptop,
  Bell,
  User
} from 'lucide-react';
import { School, MaintenanceRecord, ResolutionData, ExtraWork } from '../types';
import { formatDateOnly } from '../utils/brasiliaTime';
import { playNotificationChime, requestBrowserNotificationPermission, showBrowserNotification } from '../utils/notificationSound';
import ResolutionModal from './ResolutionModal';
import RecordDetailModal from './RecordDetailModal';
import ExtraWorksSection from './ExtraWorksSection';
import ExtraWorkFormModal from './ExtraWorkFormModal';
import DateRangeExportModal from './DateRangeExportModal';
import CoordenacaoNotificationsModal from './CoordenacaoNotificationsModal';

interface CoordenacaoViewProps {
  school: School;
  records: MaintenanceRecord[];
  extraWorks: ExtraWork[];
  onUpdateResolution: (recordId: string, resolution: ResolutionData) => void;
  onAddExtraWork: (work: ExtraWork) => void;
  onLogout: () => void;
}

export default function CoordenacaoView({
  school,
  records,
  extraWorks,
  onUpdateResolution,
  onAddExtraWork,
  onLogout
}: CoordenacaoViewProps) {
  const [activeMainTab, setActiveMainTab] = useState<'devolutivas' | 'trabalhos_extras'>('devolutivas');
  const [showExtraWorkModal, setShowExtraWorkModal] = useState<boolean>(false);
  const [isDateExportModalOpen, setIsDateExportModalOpen] = useState<boolean>(false);
  const [selectedRecordForResolution, setSelectedRecordForResolution] = useState<MaintenanceRecord | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendentes' | 'concluidos'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [newRecordAlertToast, setNewRecordAlertToast] = useState<MaintenanceRecord | null>(null);

  // Tracking seen records for this school in localStorage
  const SEEN_STORAGE_KEY = `coordenacao_seen_ids_${school.id}`;
  const [seenRecordIds, setSeenRecordIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Filter records for this school (STRICT ISOLATION)
  const schoolRecords = records.filter(r => r.schoolId === school.id);
  const schoolExtraWorks = extraWorks.filter(w => w.schoolId === school.id);

  // Unread records = school records created by Articulador or Direção that haven't been opened yet
  const unreadRecordIds = schoolRecords
    .filter(r => (r.createdByRole === 'articulador' || r.createdByRole === 'direcao') && !seenRecordIds.includes(r.id))
    .map(r => r.id);

  // Initial sound permission & track incoming records
  const prevRecordCountRef = useRef<number>(schoolRecords.length);
  const isFirstRenderRef = useRef<boolean>(true);

  useEffect(() => {
    // Request notification permission quietly
    requestBrowserNotificationPermission().catch(() => {});
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevRecordCountRef.current = schoolRecords.length;
      return;
    }

    // Check if new records arrived for this school
    if (schoolRecords.length > prevRecordCountRef.current) {
      // Find the newest record
      const sorted = [...schoolRecords].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const newest = sorted[0];

      if (newest && (newest.createdByRole === 'articulador' || newest.createdByRole === 'direcao')) {
        // Play notification chime
        playNotificationChime();

        // Show alert toast
        setNewRecordAlertToast(newest);

        // Show browser OS notification if enabled
        const requesterLabel = newest.createdByRole === 'articulador' ? 'Articulador Regional' : 'Direção Escolar';
        showBrowserNotification(`Novo Pedido de Manutenção (${school.name})`, {
          body: `${requesterLabel} solicitou: ${newest.title} (Prazo: ${formatDateOnly(newest.deadline)})`
        });
      }
    }
    prevRecordCountRef.current = schoolRecords.length;
  }, [schoolRecords.length, school.name]);

  const markAllAsRead = () => {
    const allIds = schoolRecords.map(r => r.id);
    setSeenRecordIds(allIds);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.warn('Falha ao salvar seenIds:', e);
    }
  };

  const markRecordAsRead = (id: string) => {
    if (!seenRecordIds.includes(id)) {
      const updated = [...seenRecordIds, id];
      setSeenRecordIds(updated);
      try {
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Falha ao salvar seenIds:', e);
      }
    }
  };

  const pendingRecords = schoolRecords.filter(r => r.status === 'pendente' || r.status === 'em_andamento');
  const resolvedRecords = schoolRecords.filter(r => r.status === 'realizado' || r.status === 'nao_realizado');

  const displayedRecords = statusFilter === 'pendentes'
    ? pendingRecords
    : statusFilter === 'concluidos'
    ? resolvedRecords
    : schoolRecords;

  const handleSaveResolution = (recordId: string, resolution: ResolutionData) => {
    onUpdateResolution(recordId, resolution);
    markRecordAsRead(recordId);
    setToastMessage(`Devolutiva registrada com sucesso para o protocolo #${recordId}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div id="coordenacao-view" className="min-h-screen bg-[#F1F5F9] flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Header */}
      <header className="bg-indigo-700 text-white sticky top-0 z-30 shadow-lg border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-xs">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                  {school.name}
                </h1>
                <span className="bg-indigo-800 text-indigo-100 text-xs font-bold px-2 py-0.5 rounded border border-indigo-400/30">
                  Painel da Coordenação / Empresa
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Atendimento Técnico &bull; Código da Unidade: {school.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Botão de Notificações Recebidas */}
            <button
              id="coordenacao-notifications-btn"
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer relative ${
                unreadRecordIds.length > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/30'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="Notificações de novos chamados e solicitações da escola"
            >
              <Bell className={`w-4 h-4 ${unreadRecordIds.length > 0 ? 'animate-bounce text-slate-950' : 'text-amber-300'}`} />
              <span>Notificações</span>
              {unreadRecordIds.length > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  {unreadRecordIds.length}
                </span>
              )}
            </button>

            {/* Botão: Seleção de Datas dos Laudos / Planilha */}
            <button
              id="coordenacao-date-range-export-btn"
              type="button"
              onClick={() => setIsDateExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ring-1 ring-amber-500/50"
              title="Seleção de datas dos laudos a serem baixados em PDF ou planilha Google"
            >
              <CalendarDays className="w-4 h-4 text-slate-950" />
              <span>Laudos por Data (PDF / Sheets)</span>
            </button>

            {/* Botão de Destaque Solicitado pelo Usuário */}
            <button
              id="coordenacao-insert-extra-work-btn"
              type="button"
              onClick={() => setShowExtraWorkModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Inserir trabalhos realizados conforme plano e/ou manutenção extra"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Inserir Trabalhos Realizados Conforme Plano e/ou Manutenção Extra</span>
            </button>

            <a
              id="coordenacao-school-drive-btn"
              href={school.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Drive da Escola</span>
            </a>

            <button
              id="coordenacao-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              Sair
            </button>
          </div>

        </div>

        {/* TABS NAVIGATION BAR FOR COORDENADOR */}
        <div className="bg-white border-t border-indigo-800/40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1">
            
            <button
              id="coordenacao-tab-devolutivas"
              onClick={() => setActiveMainTab('devolutivas')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-3.5 border-b-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === 'devolutivas'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Solicitações & Devolutivas ({schoolRecords.length})</span>
            </button>

            <button
              id="coordenacao-tab-trabalhos-extras"
              onClick={() => setActiveMainTab('trabalhos_extras')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-3.5 border-b-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === 'trabalhos_extras'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70'
                  : 'border-transparent text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Trabalhos Extras Concretizados ({schoolExtraWorks.length})</span>
            </button>

          </div>
        </div>
      </header>

      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Real-time Notification Alert Banner */}
      {newRecordAlertToast && (
        <div className="bg-amber-400 border-b-2 border-amber-600 text-slate-950 px-4 py-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-950 text-amber-400 rounded-lg shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-extrabold leading-snug">
                🔔 Nova Solicitação Recebida do {newRecordAlertToast.createdByRole === 'articulador' ? 'Articulador Regional' : 'Direção'}:
                {' '}<span className="underline decoration-slate-950 font-black">{newRecordAlertToast.title}</span>
              </p>
              <p className="text-[11px] text-slate-800">
                Prazo Limite: <strong>{formatDateOnly(newRecordAlertToast.deadline)}</strong> &bull; Protocolo #{newRecordAlertToast.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                setSelectedRecordForResolution(newRecordAlertToast);
                markRecordAsRead(newRecordAlertToast.id);
                setNewRecordAlertToast(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-amber-300 hover:text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Atender / Responder Agora
            </button>
            <button
              onClick={() => setNewRecordAlertToast(null)}
              className="p-1 text-slate-800 hover:text-slate-950 rounded-md hover:bg-amber-300/60 cursor-pointer"
              title="Fechar alerta"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 flex-1">
        
        {activeMainTab === 'devolutivas' && (
          <>
            {/* Multi-Device Photo Banner for Coordenador */}
            <div className="bg-linear-to-r from-indigo-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Camera className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Registro de Fotos Habilitado para Qualquer Aparelho
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Ao responder devolutivas ou registrar manutenções, você pode fotografar diretamente do seu <strong>celular</strong> (câmera frontal ou traseira), <strong>tablet</strong> ou <strong>notebook</strong> (webcam ou foto salva). As fotos são otimizadas automaticamente para emissão dos laudos em PDF.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-emerald-300 font-semibold shadow-inner">
                  <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Celular</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Tablet className="w-3.5 h-3.5 text-sky-400" /> Tablet</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Laptop className="w-3.5 h-3.5 text-indigo-300" /> Notebook</span>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                  <Wrench className="w-3.5 h-3.5" /> Devolutivas &bull; Parceria Escola x Empresa
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Devolutivas de Manutenção e Consertos
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Registre a conclusão dos serviços com foto do reparo e a opção <strong>( ) Realizado</strong> ou <strong>( ) Não Realizado</strong> com prazo e justificativa técnica.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowExtraWorkModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Inserir Trabalho / Manutenção Extra</span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                    <span className="text-xl font-black text-amber-900 block">{pendingRecords.length}</span>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">Pendentes</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                    <span className="text-xl font-black text-emerald-900 block">{resolvedRecords.length}</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Devolutivas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todas as Ocorrências ({schoolRecords.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pendentes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pendentes'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Aguardando Devolutiva ({pendingRecords.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('concluidos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'concluidos'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Devolutivas Enviadas ({resolvedRecords.length})
              </button>
            </div>

            {/* List of Records */}
            {displayedRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
                <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                <p className="font-bold text-slate-800 text-base">Nenhum item nesta categoria para {school.name}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedRecords.map(rec => {
                  const isResolved = !!rec.resolution;

                  return (
                    <div
                      key={rec.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                        isResolved ? 'border-slate-200' : 'border-amber-300 ring-2 ring-amber-500/10'
                      }`}
                    >
                      <div className="space-y-3">
                        
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {rec.createdByRole === 'articulador' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <User className="w-3 h-3 text-emerald-700" /> Solicitado pelo Articulador
                                </span>
                              ) : rec.createdByRole === 'direcao' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300">
                                  <Building2 className="w-3 h-3 text-teal-700" /> Solicitado pela Direção
                                </span>
                              ) : null}

                              {!seenRecordIds.includes(rec.id) && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 shadow-xs">
                                  NOVO
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">
                              Protocolo {rec.id} &bull; {rec.schoolCode}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                              {rec.title}
                            </h4>
                          </div>

                          {isResolved ? (
                            rec.resolution?.status === 'realizado' ? (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                                [ X ] Realizado
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                                [ X ] Não Realizado
                              </span>
                            )
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full shrink-0">
                              Pendente
                            </span>
                          )}
                        </div>

                        {/* Image & Description */}
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
                              <Calendar className="w-3.5 h-3.5" /> Prazo Original: {formatDateOnly(rec.deadline)}
                            </p>
                            <p className="text-slate-500">
                              Solicitante: <strong className="text-slate-700">{rec.authorName}</strong> ({rec.createdByRole})
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Data/Hora: {rec.formattedDateTimeBrasilia}
                            </p>
                          </div>
                        </div>

                        {/* Devolutiva Info if exists */}
                        {rec.resolution && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <p className="text-slate-800 font-medium">
                              <strong>Devolutiva:</strong> {rec.resolution.notes}
                            </p>
                            {rec.resolution.newDeadlineIfUnresolved && (
                              <p className="text-rose-700 font-bold">
                                Novo Prazo Reprogramado: {formatDateOnly(rec.resolution.newDeadlineIfUnresolved)}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400">
                              Registrado por {rec.resolution.resolvedBy} em {rec.resolution.resolvedTimeBrasilia}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <a
                          href={rec.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Pasta do Drive
                        </a>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForDetail(rec)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Visualizar / PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRecordForResolution(rec)}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{isResolved ? 'Editar Devolutiva' : 'Dar Devolutiva'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: TRABALHOS EXTRAS CONCRETIZADOS */}
        {activeMainTab === 'trabalhos_extras' && (
          <div id="coordenacao-trabalhos-extras-content">
            <ExtraWorksSection
              works={extraWorks}
              currentSchool={school}
              userRole="coordenacao"
              onAddExtraWork={onAddExtraWork}
              onDeleteExtraWork={undefined}
            />
          </div>
        )}

      </main>

      {/* Date Range Selection & Export Modal */}
      <DateRangeExportModal
        isOpen={isDateExportModalOpen}
        onClose={() => setIsDateExportModalOpen(false)}
        records={records}
        extraWorks={extraWorks}
        currentSchool={school}
        userRole="coordenacao"
      />

      {/* Modal: Inserir trabalhos realizados conforme plano e/ou manutenção extra */}
      {showExtraWorkModal && (
        <ExtraWorkFormModal
          initialSchool={school}
          registeredByRole="coordenacao"
          onClose={() => setShowExtraWorkModal(false)}
          onSaveExtraWork={(newWork) => {
            onAddExtraWork(newWork);
            setToastMessage(`Trabalho realizado "${newWork.title}" registrado com sucesso!`);
            setTimeout(() => setToastMessage(null), 4000);
            setActiveMainTab('trabalhos_extras');
          }}
        />
      )}

      {/* Resolution Modal */}
      <ResolutionModal
        record={selectedRecordForResolution}
        isOpen={!!selectedRecordForResolution}
        onClose={() => setSelectedRecordForResolution(null)}
        onSave={handleSaveResolution}
      />

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
        canResolve={true}
        onOpenResolution={(rec) => setSelectedRecordForResolution(rec)}
      />

      {/* Notifications Modal */}
      <CoordenacaoNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        school={school}
        records={records}
        unreadIds={unreadRecordIds}
        onMarkAllAsRead={markAllAsRead}
        onSelectRecordForResolution={(rec) => {
          setSelectedRecordForResolution(rec);
          markRecordAsRead(rec.id);
        }}
        onSelectRecordForDetail={(rec) => {
          setSelectedRecordForDetail(rec);
          markRecordAsRead(rec.id);
        }}
      />

    </div>
  );
}

