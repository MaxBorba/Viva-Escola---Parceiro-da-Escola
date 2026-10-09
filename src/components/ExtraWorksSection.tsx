import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  PlusCircle, 
  FileDown, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Layers, 
  Eye, 
  Trash2,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { School, ExtraWork, ExtraWorkType } from '../types';
import { MASTER_KEY_ARTICULADOR } from '../data/schools';
import { formatDateOnly } from '../utils/brasiliaTime';
import { generateExtraWorkSinglePDF, generateExtraWorksReportPDF } from '../utils/pdfGenerator';
import ExtraWorkDetailModal from './ExtraWorkDetailModal';
import ExtraWorkFormModal from './ExtraWorkFormModal';
import MasterPasswordConfirmModal from './MasterPasswordConfirmModal';

interface ExtraWorksSectionProps {
  works: ExtraWork[];
  currentSchool?: School; // If logged as Diretor or Coordenador
  userRole: 'articulador' | 'direcao' | 'coordenacao';
  onAddExtraWork: (work: ExtraWork) => void;
  onDeleteExtraWork?: (id: string) => void;
}

export default function ExtraWorksSection({
  works,
  currentSchool,
  userRole,
  onAddExtraWork,
  onDeleteExtraWork
}: ExtraWorksSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<ExtraWork | null>(null);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<ExtraWork | null>(null);

  // If in school context (Diretor or Coordenador), restrict to current school
  const scopedWorks = currentSchool 
    ? works.filter(w => w.schoolId === currentSchool.id)
    : works;

  const filteredWorks = scopedWorks.filter(w => {
    const matchesSearch = 
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.schoolCode.includes(searchTerm) ||
      w.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      filterType === 'todos' ? true : w.workType === filterType;

    return matchesSearch && matchesType;
  });

  const handleExportConsolidatedPDF = async () => {
    setIsExportingAll(true);
    try {
      const scopeTitle = currentSchool ? currentSchool.name : 'Todas as Escolas - NRE Maringá';
      await generateExtraWorksReportPDF(scopeTitle, filteredWorks);
    } catch (e) {
      console.error('Error generating consolidated extra works PDF:', e);
      alert('Erro ao gerar relatório consolidado em PDF.');
    } finally {
      setIsExportingAll(false);
    }
  };

  const isAsgCount = scopedWorks.filter(w => w.workType === 'plano_asg').length;
  const isPlanoCount = scopedWorks.filter(w => w.workType === 'conforme_plano').length;
  const isExtraCount = scopedWorks.filter(w => w.workType === 'manutencao_extra').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Obras & Manutenções
              </span>
              {currentSchool && (
                <span className="text-xs text-slate-300 font-semibold">
                  {currentSchool.name} (Cód: {currentSchool.code})
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
              Trabalhos Extras Concretizados
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Visualização e exportação técnica de manutenções realizadas conforme plano e intervenções extras.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportConsolidatedPDF}
            disabled={isExportingAll || filteredWorks.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Exportar todos os registros filtrados em PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-300" />
            <span>{isExportingAll ? 'Gerando...' : 'Exportar Relatório em PDF'}</span>
          </button>

          {/* Insert new work (Articulador or Coordenador) */}
          {(userRole === 'articulador' || userRole === 'coordenacao') && (
            <button
              type="button"
              onClick={() => setShowInsertModal(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inserir Trabalho / Manutenção Extra</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Geral</span>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{scopedWorks.length}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase">Plano ASG</span>
            <h4 className="text-2xl font-black text-indigo-900 mt-0.5">{isAsgCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase">Conforme Plano</span>
            <h4 className="text-2xl font-black text-emerald-900 mt-0.5">{isPlanoCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-teal-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase">Manutenção Extra</span>
            <h4 className="text-2xl font-black text-teal-900 mt-0.5">{isExtraCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por escola, título, serviço ou técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Filtrar:</span>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({scopedWorks.length})
            </button>
            <button
              onClick={() => setFilterType('plano_asg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'plano_asg' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ASG ({isAsgCount})
            </button>
            <button
              onClick={() => setFilterType('conforme_plano')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'conforme_plano' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plano ({isPlanoCount})
            </button>
            <button
              onClick={() => setFilterType('manutencao_extra')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'manutencao_extra' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extras ({isExtraCount})
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      {filteredWorks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Nenhum trabalho registrado nesta categoria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Utilize o botão acima para cadastrar manutenções executadas conforme plano ou serviços extras concretizados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorks.map((work) => {
            const isAsg = work.workType === 'plano_asg';
            const isPlano = work.workType === 'conforme_plano';
            return (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  
                  {/* Card Header & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                        isAsg
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : isPlano 
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                          : 'bg-teal-100 text-teal-900 border border-teal-200'
                      }`}>
                        {isAsg ? 'Plano ASG' : isPlano ? 'Conforme Plano' : 'Manutenção Extra'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">#{work.id}</span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {work.category}
                    </span>
                  </div>

                  {/* School & Title */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug">
                      {work.title}
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{work.schoolName}</span>
                      <span className="font-mono text-slate-500 font-normal">(Cód: {work.schoolCode})</span>
                    </p>
                  </div>

                  {/* Photos preview */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {work.photoBeforeUrl && (
                      <div className="relative rounded-xl overflow-hidden aspect-16/10 bg-slate-100 border border-slate-200">
                        <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Antes
                        </span>
                        <img src={work.photoBeforeUrl} alt="Antes" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={`relative rounded-xl overflow-hidden aspect-16/10 bg-slate-100 border-2 border-emerald-400 ${!work.photoBeforeUrl ? 'col-span-2 aspect-16/9' : ''}`}>
                      <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Concluído
                      </span>
                      <img src={work.photoAfterUrl} alt="Depois" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {work.description}
                  </p>

                  {/* Meta footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateOnly(work.completedDate)} ({work.completedTimeBrasilia})
                    </span>
                    <span>
                      Empresa: <strong>{work.contractorName}</strong>
                    </span>
                  </div>

                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWorkForDetail(work)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ver Detalhes & Fotos</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateExtraWorkSinglePDF(work)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Baixar Laudo Técnico em PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Laudo PDF</span>
                    </button>

                    {userRole === 'articulador' && onDeleteExtraWork && (
                      <button
                        type="button"
                        onClick={() => setWorkToDelete(work)}
                        className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir trabalho concretizado (Requer Senha Mestre)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedWorkForDetail && (
        <ExtraWorkDetailModal
          work={selectedWorkForDetail}
          onClose={() => setSelectedWorkForDetail(null)}
        />
      )}

      {/* Insert Modal */}
      {showInsertModal && (
        <ExtraWorkFormModal
          initialSchool={currentSchool}
          registeredByRole={userRole === 'articulador' ? 'articulador' : 'coordenacao'}
          onClose={() => setShowInsertModal(false)}
          onSaveExtraWork={onAddExtraWork}
        />
      )}

      {/* Exclusão Protegida por Senha Mestre do Articulador */}
      {workToDelete && onDeleteExtraWork && (
        <MasterPasswordConfirmModal
          isOpen={!!workToDelete}
          onClose={() => setWorkToDelete(null)}
          onConfirm={() => {
            onDeleteExtraWork(workToDelete.id);
            setWorkToDelete(null);
          }}
          title="Excluir Registro de Trabalho Concretizado"
          description={`Atenção Articulador: toda informação permanece salva indeterminadamente no sistema. Para autorizar a exclusão deste trabalho via lixeira, digite a senha mestre (${MASTER_KEY_ARTICULADOR}):`}
          itemDetails={[
            { label: 'Identificador', value: `#${workToDelete.id}` },
            { label: 'Título', value: workToDelete.title },
            { label: 'Escola', value: `${workToDelete.schoolName} (${workToDelete.schoolCode})` },
            { label: 'Tipo', value: workToDelete.workType === 'plano_asg' ? 'Plano de Trabalho ASG' : workToDelete.workType === 'conforme_plano' ? 'Conforme Plano' : 'Manutenção Extra' },
            { label: 'Data Conclusão', value: `${formatDateOnly(workToDelete.completedDate)} às ${workToDelete.completedTimeBrasilia}` }
          ]}
          confirmButtonText="Confirmar Exclusão com Senha Mestre"
          warningText="Esta ação apagará definitivamente este trabalho concretizado do banco de dados."
        />
      )}

    </div>
  );
}
