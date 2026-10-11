import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  FileDown, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Building2, 
  Wrench, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  UserCheck,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';
import { ExtraWork } from '../types';
import { formatDateOnly } from '../utils/brasiliaTime';
import { generateExtraWorkSinglePDF } from '../utils/pdfGenerator';

interface ExtraWorkDetailModalProps {
  work: ExtraWork;
  onClose: () => void;
}

export default function ExtraWorkDetailModal({
  work,
  onClose
}: ExtraWorkDetailModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateExtraWorkSinglePDF(work);
    } catch (e) {
      console.error('Error generating extra work PDF:', e);
      alert('Erro ao gerar laudo PDF do trabalho executado.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isAsg = work.workType === 'plano_asg';
  const isPlano = work.workType === 'conforme_plano';

  return (
    <div id="extra-work-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
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
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isAsg
                    ? 'bg-indigo-400/20 text-indigo-200 border-indigo-400/30'
                    : isPlano
                    ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-teal-400/20 text-teal-200 border-teal-400/30'
                }`}>
                  {isAsg ? 'Plano de Trabalho ASG' : isPlano ? 'Conforme Plano de Trabalho' : 'Manutenção Extra Concretizada'}
                </span>
                <span className="text-xs text-slate-300">ID: #{work.id}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                {work.title}
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* School Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{work.schoolName}</h4>
                <p className="text-xs text-slate-500">
                  Código da Unidade: <strong className="text-slate-800 font-mono">{work.schoolCode}</strong> &bull; Maringá / PR
                </p>
              </div>
            </div>

            <a
              href={work.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pasta Google Drive</span>
            </a>
          </div>

          {/* Technical Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Empresa Executora:</span>
              <span className="font-bold text-slate-800 text-xs">{work.contractorName}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Responsável Técnico:</span>
              <span className="font-bold text-slate-800 text-xs">{work.responsibleTechnician}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Data de Conclusão:</span>
              <span className="font-bold text-emerald-700 text-xs">
                {formatDateOnly(work.completedDate)} ({work.completedTimeBrasilia})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Categoria do Serviço:</span>
              <span className="font-bold text-slate-800 text-xs">{work.category}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrado por:</span>
              <span className="font-bold text-slate-800 text-xs">{work.registeredByName} ({work.registeredByRole})</span>
            </div>

            {work.costEstimate && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Custo Estimado:</span>
                <span className="font-bold text-emerald-800 text-xs">{work.costEstimate}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Descrição Detalhada dos Serviços Executados:
            </h5>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {work.description}
            </p>
          </div>

          {work.observations && (
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block">Observações Técnicas / Garantia:</span>
              <p className="mt-0.5">{work.observations}</p>
            </div>
          )}

          {/* Photos Side-by-side or Single */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Comprovação Fotográfica da Obra / Serviço:
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {work.photoBeforeUrl && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 block">Foto Antes / Situação Inicial:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs aspect-4/3 bg-slate-900">
                    <img
                      src={work.photoBeforeUrl}
                      alt="Situação Inicial"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className={`space-y-1.5 ${!work.photoBeforeUrl ? 'sm:col-span-2' : ''}`}>
                <span className="text-xs font-bold text-emerald-800 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Foto Depois / Trabalho Concluído:
                </span>
                <div className={`rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md ${
                  !work.photoBeforeUrl ? 'aspect-16/9 max-h-80' : 'aspect-4/3'
                } bg-slate-900`}>
                  <img
                    src={work.photoAfterUrl}
                    alt="Trabalho Concluído"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Master Storage Node (Notebook MaxBorba) & 06 Meses Retention */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-slate-300">Nó Mestre de Armazenamento: <strong className="text-white font-bold">{work.masterStorageNode || 'Notebook MaxBorba'}</strong></span>
                {work.originDevice && (
                  <span className="text-[11px] text-slate-400 block">Dispositivo de Origem: {work.originDevice}</span>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guarda Obrigatória: 06 Meses Ativa</span>
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Gerando Laudo PDF...' : 'Baixar Laudo Técnico em PDF'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
