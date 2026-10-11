import { useState } from 'react';
import { MaintenanceRecord } from '../types';
import { generateRecordPDF } from '../utils/pdfGenerator';
import { formatDateOnly } from '../utils/brasiliaTime';
import { 
  X, 
  FileDown, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  Tag,
  Share2,
  Loader2
} from 'lucide-react';

interface RecordDetailModalProps {
  record: MaintenanceRecord | null;
  onClose: () => void;
  onOpenResolution?: (record: MaintenanceRecord) => void;
  canResolve?: boolean;
}

export default function RecordDetailModal({
  record,
  onClose,
  onOpenResolution,
  canResolve = false
}: RecordDetailModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!record) return null;

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateRecordPDF(record);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'realizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Realizado com Sucesso
          </span>
        );
      case 'nao_realizado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Não Realizado (Requer Reprogramação)
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <AlertCircle className="w-3.5 h-3.5" /> Em Andamento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Pendente de Atendimento
          </span>
        );
    }
  };

  return (
    <div id="record-detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div id="record-detail-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">{record.schoolName}</h3>
                <span className="text-xs bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded font-mono border border-indigo-400/30">
                  Cód: {record.schoolCode}
                </span>
              </div>
              <p className="text-xs text-indigo-200">Protocolo: {record.id}</p>
            </div>
          </div>
          <button
            id="close-record-detail-btn"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Status & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>{getStatusBadge(record.status)}</div>
            
            <div className="flex flex-wrap items-center gap-2">
              <a
                id="record-drive-link-btn"
                href={record.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Pasta do Drive
              </a>

              <button
                id="download-record-pdf-btn"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Baixar PDF Formatado
              </button>
            </div>
          </div>

          {/* Main Card: Image on Left + Enunciado & Prazo on Right (Exact layout described by user) */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Solicitação / Ponto de Atenção Registrado
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Image */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner relative group">
                  <img
                    src={record.photoUrl}
                    alt={record.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded backdrop-blur-xs">
                    Foto do Problema
                  </div>
                </div>
              </div>

              {/* Right Column: Enunciado & Prazo */}
              <div className="md:col-span-7 space-y-3.5">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Enunciado da Necessidade:
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-0.5">
                    {record.title}
                  </h3>
                </div>

                {record.description && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {record.description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Prazo Limite:</span>
                    <span className="font-bold text-rose-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateOnly(record.deadline)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Categoria:</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {record.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cadastrado por: <strong className="text-slate-700">{record.authorName}</strong> ({record.createdByRole})</span>
                </div>
              </div>
            </div>

            {/* Date below image and statement */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 -mx-4 -mb-4 p-3 rounded-b-2xl">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Data e Hora Oficial: <strong className="text-slate-800">{record.formattedDateTimeBrasilia}</strong>
              </span>
              <span className="text-[11px] text-slate-400">Horário de Brasília</span>
            </div>
          </div>

          {/* Master Storage Node (Notebook MaxBorba) & 06 Meses Retention Badge */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-700 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-slate-300">Nó Mestre de Armazenamento: <strong className="text-white font-bold">{record.masterStorageNode || 'Notebook MaxBorba'}</strong></span>
                {record.originDevice && (
                  <span className="text-[11px] text-slate-400 block">Dispositivo de Origem: {record.originDevice}</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Guarda Obrigatória: 06 Meses Ativa</span>
              </span>
            </div>
          </div>

          {/* Resolution / Devolutiva Section */}
          {record.resolution ? (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 sm:p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Devolutiva da Coordenação / Empresa Parceira
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {record.resolution.resolvedPhotoUrl && (
                  <div className="md:col-span-5">
                    <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-white border border-emerald-200 shadow-sm relative">
                      <img
                        src={record.resolution.resolvedPhotoUrl}
                        alt="Foto do Reparo Realizado"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 left-2 bg-emerald-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded">
                        Foto da Conclusão
                      </div>
                    </div>
                  </div>
                )}

                <div className={record.resolution.resolvedPhotoUrl ? "md:col-span-7 space-y-3" : "md:col-span-12 space-y-3"}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Status Reportado:</span>
                    {record.resolution.status === 'realizado' ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        [ X ] Realizado
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                        [ X ] Não Realizado
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-sm text-slate-700">
                    <p className="font-medium text-xs text-slate-500 mb-1">Notas do Serviço Técnico:</p>
                    {record.resolution.notes || 'Sem observações adicionais.'}
                  </div>

                  {record.resolution.newDeadlineIfUnresolved && (
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-xs">
                      <span className="text-rose-600 font-semibold block">Novo Prazo Reprogramado:</span>
                      <span className="font-bold text-rose-900 text-sm">
                        {formatDateOnly(record.resolution.newDeadlineIfUnresolved)}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <p>Concluído/Reportado em: <strong>{record.resolution.resolvedTimeBrasilia || record.resolution.resolvedDate}</strong></p>
                    <p>Responsável Técnico: <strong>{record.resolution.resolvedBy}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          ) : canResolve ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-amber-900 text-sm">Aguardando Devolutiva da Coordenação</h5>
                <p className="text-xs text-amber-700">Esta solicitação está aberta para registro do conserto executado ou justificativa.</p>
              </div>
              <button
                id="open-resolution-btn"
                onClick={() => {
                  onClose();
                  onOpenResolution?.(record);
                }}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                Registrar Devolutiva Agora
              </button>
            </div>
          ) : null}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            ESCOLA VIVA PARCEIRO DA ESCOLA &copy; Parceria Escola x Empresa Privada
          </span>
          <button
            id="close-detail-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
