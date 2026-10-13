import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  School as SchoolIcon, 
  Camera, 
  Upload, 
  Check, 
  ExternalLink, 
  Calendar, 
  CalendarDays,
  Clock, 
  FileDown, 
  Eye, 
  Building2, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Plus,
  Wrench,
  FileCheck
} from 'lucide-react';
import { School, MaintenanceRecord, MaintenanceCategory, UrgencyLevel, ExtraWork } from '../types';
import { getBrasiliaCurrentDateTime, formatDateOnly } from '../utils/brasiliaTime';
import { generateRecordPDF } from '../utils/pdfGenerator';
import { compressImage } from '../utils/imageCompressor';
import CameraCaptureModal from './CameraCaptureModal';
import RecordDetailModal from './RecordDetailModal';
import ExtraWorksSection from './ExtraWorksSection';
import DateRangeExportModal from './DateRangeExportModal';
import { PWAInstallButton } from './PWAInstallButton';

interface DirecaoViewProps {
  school: School;
  records: MaintenanceRecord[];
  extraWorks: ExtraWork[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onAddExtraWork?: (work: ExtraWork) => void;
  onLogout: () => void;
}

export default function DirecaoView({
  school,
  records,
  extraWorks,
  onAddRecord,
  onAddExtraWork,
  onLogout
}: DirecaoViewProps) {
  const [activeTab, setActiveTab] = useState<'solicitacoes' | 'trabalhos_extras'>('solicitacoes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('Estrutural / Alvenaria');
  const [urgency, setUrgency] = useState<UrgencyLevel>('alta');
  const [deadline, setDeadline] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [authorName, setAuthorName] = useState('Direção Escolar');
  
  // Brasília Time Confirmation Option
  const [brasiliaTimeObj, setBrasiliaTimeObj] = useState(() => getBrasiliaCurrentDateTime());
  const [confirmedTimeManually, setConfirmedTimeManually] = useState(true);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDateExportModalOpen, setIsDateExportModalOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<MaintenanceRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Records only for this school (STRICT SCHOOL ISOLATION)
  const schoolRecords = records.filter(r => r.schoolId === school.id);
  const schoolExtraWorks = extraWorks.filter(w => w.schoolId === school.id);

  const handleRefreshTime = () => {
    const fresh = getBrasiliaCurrentDateTime();
    setBrasiliaTimeObj(fresh);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      if (compressed) {
        setPhotoUrl(compressed);
      }
    } catch (err) {
      console.warn('Erro ao processar imagem:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, digite o enunciado da manutenção necessária.');
      return;
    }
    if (!deadline) {
      alert('Por favor, informe a data limite para atendimento.');
      return;
    }

    const currentBrasilia = getBrasiliaCurrentDateTime();
    const newRecord: MaintenanceRecord = {
      id: `dir-${Date.now().toString().slice(-6)}`,
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      createdByRole: 'direcao',
      authorName: authorName.trim() || 'Direção Escolar',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      urgency,
      deadline,
      createdAt: currentBrasilia.iso,
      formattedDateTimeBrasilia: currentBrasilia.displayDate + ' ' + currentBrasilia.displayTime,
      status: 'pendente',
      driveUrl: school.driveUrl
    };

    onAddRecord(newRecord);
    setToastMessage('Solicitação registrada com sucesso! Notificação enviada à coordenação.');
    setTimeout(() => setToastMessage(null), 4000);

    // Reset Form
    setTitle('');
    setDescription('');
    setDeadline('');
    setPhotoUrl('');

    // Open detail modal with instant PDF download
    setSelectedDetailRecord(newRecord);
  };

  return (
    <div id="direcao-view" className="min-h-screen bg-[#F1F5F9] flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Header */}
      <header className="bg-indigo-700 text-white sticky top-0 z-30 shadow-lg border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-xs">
              <SchoolIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                  {school.name}
                </h1>
                <span className="bg-indigo-800 text-indigo-100 text-xs font-bold px-2 py-0.5 rounded border border-indigo-400/30">
                  Painel da Direção
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Código da Unidade: {school.code} &bull; {school.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <PWAInstallButton />

            {/* Botão: Seleção de Datas dos Laudos / Planilha */}
            <button
              id="direcao-date-range-export-btn"
              type="button"
              onClick={() => setIsDateExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ring-1 ring-amber-500/50"
              title="Seleção de datas dos laudos a serem baixados em PDF ou planilha Google"
            >
              <CalendarDays className="w-3.5 h-3.5 text-slate-950" />
              <span>Laudos por Data (PDF / Sheets)</span>
            </button>

            <a
              id="direcao-school-drive-btn"
              href={school.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pasta do Drive desta Escola</span>
            </a>

            <button
              id="direcao-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              Sair
            </button>
          </div>

        </div>

        {/* TABS NAVIGATION BAR FOR DIREÇÃO */}
        <div className="bg-white border-t border-indigo-800/40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1">
            
            <button
              id="direcao-tab-solicitacoes"
              onClick={() => setActiveTab('solicitacoes')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-3.5 border-b-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'solicitacoes'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Solicitações da Escola ({schoolRecords.length})</span>
            </button>

            <button
              id="direcao-tab-trabalhos-extras"
              onClick={() => setActiveTab('trabalhos_extras')}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-3.5 border-b-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'trabalhos_extras'
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
        <div className="bg-teal-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1">
        
        {/* TAB 1: SOLICITAÇÕES DA ESCOLA */}
        {activeTab === 'solicitacoes' && (
          <>
            {/* Banner with Instructions & Objectives */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Registro de Atenção / Manutenção Escolar
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Registrar Ponto que Requer Atenção da Empresa
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                  Tire fotos de problemas estruturais, elétricos, hidráulicos ou de pintura usando a câmera do seu celular ou tablet. Cada registro gera um laudo em PDF e é sincronizado com a equipe técnica.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shrink-0">
                <Building2 className="w-6 h-6 text-teal-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ocorrências desta Escola:</span>
                  <span className="text-base font-bold text-teal-300">{schoolRecords.length} Registradas</span>
                </div>
              </div>
            </div>

        {/* REGISTRATION FORM - Designed exactly with Left Space for Image & Right Space for Description */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" />
              Novo Formulário de Solicitação
            </h3>
            <span className="text-xs text-slate-400">
              {school.name}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* ESPAÇO PARA IMAGEM (LOCALIZADO À ESQUERDA DO APLICATIVO) */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Espaço para Imagem (Câmera / Arquivo): <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold">Android &amp; iOS Safari</span>
                </div>

                {photoUrl ? (
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-teal-500 bg-slate-950 group">
                    <img
                      src={photoUrl}
                      alt="Foto da Manutenção"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <Camera className="w-4 h-4" /> Trocar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <XCircle className="w-4 h-4" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      id="direcao-camera-btn"
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full aspect-4/3 rounded-2xl border-2 border-dashed border-teal-400 bg-teal-50/50 hover:bg-teal-50 text-teal-900 flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7" />
                      </div>
                      <span className="font-bold text-sm">Tirar Foto com a Câmera</span>
                      <span className="text-[11px] text-teal-700 mt-1">
                        Câmera do Celular liberada para Android e Safari
                      </span>
                    </button>

                    <label 
                      id="direcao-upload-file-label"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Selecionar Imagem da Galeria / Arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">Layout do PDF Gerado:</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Imagem à esquerda &bull; Enunciado e prazo à direita &bull; Data de Brasília abaixo
                  </p>
                </div>
              </div>

              {/* LADO DIREITO: ENUNCIADO, DESCRIÇÃO, PRAZO E DATA */}
              <div className="md:col-span-7 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Enunciado / O que deve ser feito: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="direcao-title-input"
                    type="text"
                    required
                    placeholder="Ex: Conserto de lâmpadas do pavilhão 2 e desobstrução de calhas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Descrição Detalhada do Ponto que Requer Atenção:
                  </label>
                  <textarea
                    id="direcao-description-input"
                    rows={3}
                    placeholder="Descreva o problema com clareza para que a equipe de manutenção traga as ferramentas corretas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Prazo Limite Desejado: <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="direcao-deadline-input"
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Categoria:
                    </label>
                    <select
                      id="direcao-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="Estrutural / Alvenaria">Estrutural</option>
                      <option value="Elétrica">Elétrica</option>
                      <option value="Hidráulica">Hidráulica</option>
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
                      Urgência:
                    </label>
                    <select
                      id="direcao-urgency-select"
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
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
                    Nome do Diretor / Registrante:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                {/* DATA E HORA DE BRASÍLIA AUTOMÁTICA COM OPÇÃO DE CONFIRMAÇÃO DOS DADOS */}
                <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-teal-900">
                    <span className="font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-700" />
                      Data e Hora Automática (Horário de Brasília):
                    </span>
                    <button
                      type="button"
                      onClick={handleRefreshTime}
                      className="text-xs text-teal-700 hover:underline font-semibold"
                    >
                      Sincronizar Agora
                    </button>
                  </div>

                  <p className="text-xs font-mono font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-teal-100">
                    {brasiliaTimeObj.formatted}
                  </p>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={confirmedTimeManually}
                      onChange={(e) => setConfirmedTimeManually(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="font-medium">
                      Confirmo a exatidão da data, hora e dos dados desta ocorrência
                    </span>
                  </label>
                </div>

              </div>

            </div>

            {/* Form Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                A foto será sincronizada na pasta oficial do Drive: <strong className="text-slate-700">{school.name}</strong>
              </span>

              <button
                id="submit-direcao-record-btn"
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Registrar Solicitação e Gerar PDF
              </button>
            </div>

          </form>

        </div>

        {/* HISTÓRICO DE OCORRÊNCIAS DESTA UNIDADE ESCOLAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">
              Histórico de Manutenções da sua Escola ({schoolRecords.length})
            </h3>
            <span className="text-xs text-slate-500">
              Acompanhe o status e as devolutivas da empresa parceira
            </span>
          </div>

          {schoolRecords.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-700">Nenhum registro cadastrado para este colégio ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Preencha o formulário acima para abrir sua primeira solicitação.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schoolRecords.map(rec => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:border-teal-500 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-teal-700 uppercase block">
                          Protocolo {rec.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                          {rec.title}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        rec.status === 'realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Left: Image + Right: Info */}
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
                          Categoria: <strong className="text-slate-700">{rec.category}</strong>
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.formattedDateTimeBrasilia}
                        </p>
                      </div>
                    </div>

                    {/* If resolved */}
                    {rec.resolution && (
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Devolutiva da Coordenação: {rec.resolution.status === 'realizado' ? 'Realizado' : 'Não Realizado'}
                        </p>
                        <p className="text-[11px] text-emerald-800 mt-0.5 line-clamp-1">{rec.resolution.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <a
                      href={rec.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Pasta Drive
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedDetailRecord(rec)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver / Baixar PDF
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}

        {/* TAB 2: TRABALHOS EXTRAS CONCRETIZADOS (Requisito 7) */}
        {activeTab === 'trabalhos_extras' && (
          <div id="direcao-trabalhos-extras-content">
            <ExtraWorksSection
              works={extraWorks}
              currentSchool={school}
              userRole="direcao"
              onAddExtraWork={onAddExtraWork || (() => {})}
            />
          </div>
        )}

      </main>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => setPhotoUrl(img)}
        title="Fotografar Ponto de Atenção"
      />

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={selectedDetailRecord}
        onClose={() => setSelectedDetailRecord(null)}
      />

      {/* Date Range Selection & Export Modal */}
      <DateRangeExportModal
        isOpen={isDateExportModalOpen}
        onClose={() => setIsDateExportModalOpen(false)}
        records={records}
        extraWorks={extraWorks}
        currentSchool={school}
        userRole="direcao"
      />

    </div>
  );
}
