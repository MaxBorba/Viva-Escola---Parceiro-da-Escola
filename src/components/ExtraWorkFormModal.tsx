import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Wrench, 
  X, 
  Camera, 
  Upload, 
  Check, 
  Calendar, 
  Clock, 
  Building2, 
  DollarSign, 
  Sparkles,
  FileCheck,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Tablet,
  Laptop,
  RefreshCw
} from 'lucide-react';
import { School, ExtraWork, ExtraWorkType, MaintenanceCategory } from '../types';
import { SCHOOLS } from '../data/schools';
import { getBrasiliaCurrentDateTime } from '../utils/brasiliaTime';
import CameraCaptureModal from './CameraCaptureModal';
import { compressImage } from '../utils/imageCompressor';

interface ExtraWorkFormModalProps {
  initialSchool?: School;
  registeredByRole: 'coordenacao' | 'articulador';
  onClose: () => void;
  onSaveExtraWork: (work: ExtraWork) => void;
}

const CATEGORIES: MaintenanceCategory[] = [
  'Serviços Gerais / Limpeza (ASG)',
  'Elétrica',
  'Hidráulica',
  'Estrutural / Alvenaria',
  'Pintura',
  'Telhado / Infiltração',
  'Mobiliário / Equipamento',
  'Sanitários',
  'Acessibilidade',
  'Outro'
];

export default function ExtraWorkFormModal({
  initialSchool,
  registeredByRole,
  onClose,
  onSaveExtraWork
}: ExtraWorkFormModalProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(initialSchool?.id || SCHOOLS[0].id);
  const [workType, setWorkType] = useState<ExtraWorkType>('conforme_plano');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('Estrutural / Alvenaria');
  const [contractorName, setContractorName] = useState('Empresa Técnica Parceira SEED/PR');
  const [responsibleTechnician, setResponsibleTechnician] = useState('Eng. Responsável');
  const [completedDate, setCompletedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [costEstimate, setCostEstimate] = useState('');
  const [observations, setObservations] = useState('');
  
  // Photos
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [activeCameraTarget, setActiveCameraTarget] = useState<'before' | 'after' | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const nativeCameraBeforeRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraAfterRef = useRef<HTMLInputElement | null>(null);
  const fileBeforeRef = useRef<HTMLInputElement | null>(null);
  const fileAfterRef = useRef<HTMLInputElement | null>(null);

  const selectedSchool = SCHOOLS.find(s => s.id === selectedSchoolId) || SCHOOLS[0];

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file);
      if (target === 'before') {
        setPhotoBeforeUrl(compressed);
      } else {
        setPhotoAfterUrl(compressed);
      }
    } catch (err) {
      console.warn('Erro ao processar imagem:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleCameraCapture = (dataUrl: string) => {
    if (activeCameraTarget === 'before') {
      setPhotoBeforeUrl(dataUrl);
    } else if (activeCameraTarget === 'after') {
      setPhotoAfterUrl(dataUrl);
    }
    setActiveCameraTarget(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, digite o título/objeto do trabalho realizado.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, informe a descrição detalhada dos serviços executados.');
      return;
    }
    if (!photoAfterUrl) {
      alert('Por favor, anexe a foto de comprovação da execução/conclusão do serviço.');
      return;
    }

    const brasiliaTime = getBrasiliaCurrentDateTime();
    const newWork: ExtraWork = {
      id: `extra-${Date.now().toString().slice(-6)}`,
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      schoolCode: selectedSchool.code,
      workType,
      title: title.trim(),
      description: description.trim(),
      category,
      completedDate,
      completedTimeBrasilia: brasiliaTime.displayDate + ' ' + brasiliaTime.displayTime,
      registeredByRole,
      registeredByName: registeredByRole === 'articulador' ? 'Articulador Regional' : 'Coordenação / Empresa Técnica',
      contractorName: contractorName.trim() || 'Empresa Parceira',
      responsibleTechnician: responsibleTechnician.trim() || 'Equipe Técnica Responsável',
      photoBeforeUrl: photoBeforeUrl || undefined,
      photoAfterUrl,
      costEstimate: costEstimate.trim() || undefined,
      observations: observations.trim() || undefined,
      driveUrl: selectedSchool.driveUrl,
      createdAt: brasiliaTime.iso
    };

    onSaveExtraWork(newWork);
    onClose();
  };

  return (
    <>
      <div id="extra-work-form-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shadow-xs">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                    Registro Oficial
                  </span>
                  <span className="text-xs text-slate-300">SEED / NRE Maringá</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                  Inserir Trabalhos: Plano ASG, Conforme Plano e/ou Manutenção Extra
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* 1. Escolha do Tipo de Trabalho */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Tipo de Execução: <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                  workType === 'plano_asg'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}>
                  <input
                    type="radio"
                    name="workType"
                    value="plano_asg"
                    checked={workType === 'plano_asg'}
                    onChange={() => {
                      setWorkType('plano_asg');
                      setCategory('Serviços Gerais / Limpeza (ASG)');
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Plano de Trabalho ASG</span>
                    <span className="text-[11px] text-slate-500">Serviços gerais, limpeza, conservação e rotinas ASG</span>
                  </div>
                </label>

                <label className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                  workType === 'conforme_plano'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}>
                  <input
                    type="radio"
                    name="workType"
                    value="conforme_plano"
                    checked={workType === 'conforme_plano'}
                    onChange={() => setWorkType('conforme_plano')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Conforme Plano de Trabalho</span>
                    <span className="text-[11px] text-slate-500">Obras preventivas e programadas no cronograma</span>
                  </div>
                </label>

                <label className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                  workType === 'manutencao_extra'
                    ? 'border-teal-600 bg-teal-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}>
                  <input
                    type="radio"
                    name="workType"
                    value="manutencao_extra"
                    checked={workType === 'manutencao_extra'}
                    onChange={() => setWorkType('manutencao_extra')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Manutenção Extra / Não Programada</span>
                    <span className="text-[11px] text-slate-500">Demandas pontuais, reparos extras ou emergenciais</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. Seleção de Escola */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Unidade Escolar Atendida: <span className="text-rose-600">*</span>
              </label>
              {initialSchool ? (
                <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <div>
                      <span className="font-bold text-sm text-slate-900">{selectedSchool.name}</span>
                      <span className="text-xs text-slate-500 block">{selectedSchool.gre} &bull; {selectedSchool.city}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg">
                    Cód: {selectedSchool.code}
                  </span>
                </div>
              ) : (
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Cód: {s.code}) - {s.city}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Título / Objeto da Manutenção & Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Título / Objeto do Trabalho Realizado: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={workType === 'plano_asg' ? "Ex: Limpeza e higienização dos reservatórios / pátio conforme plano ASG" : "Ex: Reforma da Cobertura e Troca de Calhas do Bloco B"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Categoria: <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Descrição detalhada dos serviços */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Descrição Detalhada dos Serviços Executados: <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva minuciosamente os reparos executados, materiais empregados, instalações e liberações técnicas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* 5. Dados da Empresa e Responsável Técnico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Empresa Executora / Equipe Técnica: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome da Construtora / Empresa Parceira"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Responsável Técnico / Encarregado: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Eng. Roberto Santos (CREA 1234-PR)"
                  value={responsibleTechnician}
                  onChange={(e) => setResponsibleTechnician(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 6. Data de Conclusão & Custo Estimado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Data de Conclusão / Execução: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Custo / Investimento Estimado (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: R$ 4.500,00"
                  value={costEstimate}
                  onChange={(e) => setCostEstimate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 7. Fotos de Comprovação (Antes e Depois) */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Comprovação Fotográfica dos Serviços:
                </label>
                <span className="text-xs text-slate-500">Câmera e upload suportados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foto Antes (Opcional) */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">1. Foto Antes / Situação Inicial (Opcional)</span>
                    {photoBeforeUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoBeforeUrl('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {photoBeforeUrl ? (
                    <img
                      src={photoBeforeUrl}
                      alt="Foto Antes"
                      className="w-full h-36 object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl bg-white text-slate-400">
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-xs">Nenhuma foto anexada</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveCameraTarget('before')}
                      className="py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      title="Abrir Webcam / Câmera ao vivo (Notebook, Tablet e Celular)"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Webcam / Câmera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => nativeCameraBeforeRef.current?.click()}
                      className="py-2 px-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      title="Câmera nativa do smartphone ou tablet"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Câmera Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileBeforeRef.current?.click()}
                      className="py-2 px-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      title="Carregar foto salva ou arquivo do computador"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Galeria / PC</span>
                    </button>

                    <input
                      ref={nativeCameraBeforeRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e, 'before')}
                      className="hidden"
                    />

                    <input
                      ref={fileBeforeRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'before')}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Foto Depois / Conclusão (Obrigatória) */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      2. Foto Depois / Concluído <span className="text-rose-600">*</span>
                    </span>
                    {photoAfterUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoAfterUrl('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {photoAfterUrl ? (
                    <img
                      src={photoAfterUrl}
                      alt="Foto Concluído"
                      className="w-full h-36 object-cover rounded-xl border border-emerald-300 shadow-xs"
                    />
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center gap-2 border border-dashed border-emerald-300 rounded-xl bg-white text-emerald-600/60">
                      <FileCheck className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-800">Foto obrigatória de conclusão</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveCameraTarget('after')}
                      className="py-2 px-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer shadow-xs text-center"
                      title="Abrir Webcam / Câmera ao vivo (Notebook, Tablet e Celular)"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Webcam / Câmera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => nativeCameraAfterRef.current?.click()}
                      className="py-2 px-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      title="Câmera nativa do smartphone ou tablet"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Câmera Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileAfterRef.current?.click()}
                      className="py-2 px-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                      title="Carregar foto salva ou arquivo do computador"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Galeria / PC</span>
                    </button>

                    <input
                      ref={nativeCameraAfterRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e, 'after')}
                      className="hidden"
                    />

                    <input
                      ref={fileAfterRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'after')}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Observações Gerais */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Observações Técnicas / Garantia / Informações Adicionais:
              </label>
              <input
                type="text"
                placeholder="Ex: Garantia de 12 meses. Materiais com certificação ABNT."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar e Concretizar Trabalho</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>

      {/* Camera Capture Modal */}
      {activeCameraTarget && (
        <CameraCaptureModal
          isOpen={!!activeCameraTarget}
          onCapture={handleCameraCapture}
          onClose={() => setActiveCameraTarget(null)}
          title={`Fotografar - ${activeCameraTarget === 'before' ? 'Foto Antes' : 'Foto Depois'}`}
        />
      )}
    </>
  );
}
