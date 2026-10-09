import { useState, useEffect, FormEvent, useRef } from 'react';
import { MaintenanceRecord, ResolutionData } from '../types';
import { getBrasiliaCurrentDateTime } from '../utils/brasiliaTime';
import CameraCaptureModal from './CameraCaptureModal';
import { compressImage } from '../utils/imageCompressor';
import { 
  X, 
  Camera, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Upload,
  Calendar,
  Image as ImageIcon,
  Smartphone,
  Tablet,
  Laptop,
  RefreshCw
} from 'lucide-react';

interface ResolutionModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordId: string, resolution: ResolutionData) => void;
}

export default function ResolutionModal({
  record,
  isOpen,
  onClose,
  onSave
}: ResolutionModalProps) {
  const [statusChoice, setStatusChoice] = useState<'realizado' | 'nao_realizado'>('realizado');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [technicianName, setTechnicianName] = useState('Engenharia / Equipe Técnica');
  const [notes, setNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [confirmedTime, setConfirmedTime] = useState(() => getBrasiliaCurrentDateTime());
  const [validationError, setValidationError] = useState<string | null>(null);

  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file);
      setPhotoUrl(compressed);
    } catch (err) {
      console.warn('Erro ao processar foto:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  useEffect(() => {
    if (record) {
      setValidationError(null);
      if (record.resolution) {
        setStatusChoice(record.resolution.status === 'nao_realizado' ? 'nao_realizado' : 'realizado');
        setPhotoUrl(record.resolution.resolvedPhotoUrl || '');
        setTechnicianName(record.resolution.resolvedBy || 'Engenharia / Equipe Técnica');
        setNotes(record.resolution.notes || '');
        setNewDeadline(record.resolution.newDeadlineIfUnresolved || '');
      } else {
        setStatusChoice('realizado');
        setPhotoUrl('');
        setTechnicianName('Engenharia / Equipe Técnica');
        setNotes('');
        setNewDeadline('');
      }
      setConfirmedTime(getBrasiliaCurrentDateTime());
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (statusChoice === 'nao_realizado' && !newDeadline) {
      setValidationError('Por favor, informe a nova data de previsão/prazo de entrega reprogramado para o conserto.');
      return;
    }

    const currentBrasilia = getBrasiliaCurrentDateTime();

    const resolution: ResolutionData = {
      status: statusChoice,
      resolvedPhotoUrl: photoUrl || undefined,
      resolvedDate: currentBrasilia.dateStr,
      resolvedTimeBrasilia: currentBrasilia.displayDate + ' ' + currentBrasilia.displayTime,
      resolvedBy: technicianName.trim() || 'Coordenação Técnica',
      notes: notes.trim() || (statusChoice === 'realizado' ? 'Serviço executado e vistoriado.' : 'Necessidade de prazo adicional para execução.'),
      newDeadlineIfUnresolved: statusChoice === 'nao_realizado' ? newDeadline : undefined
    };

    onSave(record.id, resolution);
    onClose();
  };

  return (
    <>
      <div id="resolution-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <div id="resolution-modal" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
          
          {/* Header */}
          <div className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">Registro de Devolutiva do Conserto</h3>
                <p className="text-xs text-indigo-200">{record.schoolName} - Protocolo {record.id}</p>
              </div>
            </div>
            <button
              id="close-resolution-btn"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            
            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Permanent Storage Notice for Conference */}
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Registro Permanente para Conferência:</strong>
                Esta devolutiva ficará gravada no aplicativo para consulta e auditoria permanente da Direção Escolar e do Articulador Regional.
              </div>
            </div>

            {/* Solicitation Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Solicitação Original:
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{record.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Prazo Original: <strong className="text-rose-700">{record.deadline}</strong></span>
                <span>&bull;</span>
                <a 
                  href={record.driveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> Pasta do Drive
                </a>
              </div>
            </div>

            {/* Status Choice (Realizado vs Não Realizado) */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Definição do Atendimento: <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="status-realizado-option"
                  type="button"
                  onClick={() => {
                    setStatusChoice('realizado');
                    setValidationError(null);
                  }}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                    statusChoice === 'realizado'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${statusChoice === 'realizado' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  ( X ) Realizado
                </button>

                <button
                  id="status-nao-realizado-option"
                  type="button"
                  onClick={() => {
                    setStatusChoice('nao_realizado');
                    setValidationError(null);
                  }}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                    statusChoice === 'nao_realizado'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${statusChoice === 'nao_realizado' ? 'text-rose-600' : 'text-slate-400'}`} />
                  ( X ) Não Realizado
                </button>
              </div>
            </div>

            {/* If Non-Realized: Requirement for new deadline */}
            {statusChoice === 'nao_realizado' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Apresentar Novo Prazo para Entrega: <span className="text-rose-600">*</span>
                </div>
                <p className="text-xs text-rose-700">
                  Conforme exigência do protocolo, informe a nova data de conclusão para ciência do articulador e direção.
                </p>
                <div className="relative mt-1">
                  <input
                    id="new-deadline-input"
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => {
                      setNewDeadline(e.target.value);
                      if (e.target.value) setValidationError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Photo Capture for Realized work */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="block text-sm font-bold text-slate-800">
                  Foto do Conserto / Vistoria:
                </label>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Celular</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Tablet className="w-3 h-3" /> Tablet</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Laptop className="w-3 h-3" /> Notebook</span>
                </div>
              </div>
              
              {photoUrl ? (
                <div className="relative aspect-16/9 max-h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Foto do reparo"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> Foto anexada com sucesso
                  </div>
                </div>
              ) : isProcessingPhoto ? (
                <div className="p-8 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 text-emerald-800">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold">Processando e otimizando foto para o laudo...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Opção 1: Câmera ao Vivo / Webcam (Notebook, Tablet, Celular) */}
                  <button
                    id="open-camera-resolution-btn"
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="p-3.5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs text-center"
                  >
                    <Camera className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold leading-tight">Câmera ao Vivo / Webcam</span>
                    <span className="text-[10px] text-emerald-700">Notebook, Tablet e Celular</span>
                  </button>

                  {/* Opção 2: Câmera Nativa do Celular/Tablet */}
                  <button
                    id="open-native-mobile-camera-btn"
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="p-3.5 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs text-center"
                  >
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold leading-tight">Câmera Celular / Tablet</span>
                    <span className="text-[10px] text-indigo-700">App de Câmera do Aparelho</span>
                  </button>

                  {/* Opção 3: Galeria / Arquivos do Computador */}
                  <button
                    id="open-file-upload-resolution-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs text-center"
                  >
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-xs font-bold leading-tight">Galeria / Arquivo do PC</span>
                    <span className="text-[10px] text-slate-500">JPG, PNG, Fotos Salvas</span>
                  </button>

                  {/* Input Câmera Nativa Celular/Tablet */}
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessFile(file);
                    }}
                  />

                  {/* Input Arquivo / Galeria */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessFile(file);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Observations / Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Descrição do Trabalho Realizado ou Justificativa:
              </label>
              <textarea
                id="resolution-notes-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhe o que foi consertado, materiais aplicados ou motivo do adiamento..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Technician Name */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Responsável Técnico / Coordenação:
              </label>
              <input
                id="resolution-tech-name"
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Automatic Brasília Timestamp with user confirmation */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-emerald-600" />
                Data/Hora de Brasília Automática: <strong>{confirmedTime.formatted}</strong>
              </span>
              <button
                type="button"
                onClick={() => setConfirmedTime(getBrasiliaCurrentDateTime())}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                Atualizar Horário
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                id="cancel-resolution-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                id="submit-resolution-btn"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Devolutiva
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => setPhotoUrl(img)}
        title="Fotografar Reparo Realizado"
      />
    </>
  );
}
