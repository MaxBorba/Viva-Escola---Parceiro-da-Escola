import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Check, 
  Sparkles, 
  Building2,
  Calendar,
  Eye,
  AlertCircle,
  ShieldAlert,
  Lock,
  EyeOff
} from 'lucide-react';
import { School, MaintenanceRecord } from '../types';
import { isTestRecord } from '../utils/storage';
import { formatDateOnly } from '../utils/brasiliaTime';
import { MASTER_KEY_ARTICULADOR } from '../data/schools';
import MasterPasswordConfirmModal from './MasterPasswordConfirmModal';

interface SchoolCleanModalProps {
  school: School;
  records: MaintenanceRecord[];
  onClose: () => void;
  onDeleteSingleRecord: (id: string) => void;
  onClearTestRecordsForSchool: (schoolId: string) => void;
  onDeleteAllRecordsForSchool: (schoolId: string) => void;
}

export default function SchoolCleanModal({
  school,
  records,
  onClose,
  onDeleteSingleRecord,
  onClearTestRecordsForSchool,
  onDeleteAllRecordsForSchool
}: SchoolCleanModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'selective' | 'clear_tests' | 'delete_all'>('selective');
  const [singleRecordToDelete, setSingleRecordToDelete] = useState<MaintenanceRecord | null>(null);
  
  // Tab 2 Master Password
  const [clearTestsPassword, setClearTestsPassword] = useState('');
  const [clearTestsPasswordError, setClearTestsPasswordError] = useState<string | null>(null);
  const [showClearTestsPassword, setShowClearTestsPassword] = useState(false);

  // Tab 3 Master Password
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [deleteAllPasswordError, setDeleteAllPasswordError] = useState<string | null>(null);
  const [showDeleteAllPassword, setShowDeleteAllPassword] = useState(false);

  const schoolRecords = records.filter(r => r.schoolId === school.id);
  const testRecords = schoolRecords.filter(isTestRecord);

  const handleClearTests = (e: FormEvent) => {
    e.preventDefault();
    if (clearTestsPassword.trim() !== MASTER_KEY_ARTICULADOR) {
      setClearTestsPasswordError(`Senha incorreta! Digite a senha mestre (${MASTER_KEY_ARTICULADOR}) do Articulador.`);
      return;
    }
    onClearTestRecordsForSchool(school.id);
    onClose();
  };

  const handleDeleteAll = (e: FormEvent) => {
    e.preventDefault();
    if (deleteAllPassword.trim() !== MASTER_KEY_ARTICULADOR) {
      setDeleteAllPasswordError(`Senha incorreta! Digite a senha mestre (${MASTER_KEY_ARTICULADOR}) do Articulador.`);
      return;
    }
    onDeleteAllRecordsForSchool(school.id);
    onClose();
  };

  return (
    <div id="school-clean-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Limpeza e Exclusão de Registros &bull; {school.name}
              </h3>
              <p className="text-xs text-rose-100">
                Código: {school.code} | Total de Ocorrências nesta Escola: {schoolRecords.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('selective')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
              activeSubTab === 'selective'
                ? 'bg-white text-slate-900 border-t-2 border-x border-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Excluir Registro Específico ({schoolRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab('clear_tests')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'clear_tests'
                ? 'bg-white text-slate-900 border-t-2 border-x border-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Limpar Apenas Testes ({testRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab('delete_all')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
              activeSubTab === 'delete_all'
                ? 'bg-white text-rose-700 border-t-2 border-x border-rose-600 shadow-xs'
                : 'text-rose-600 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            Zerar Todos desta Escola
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Subtab 1: Selective deletion of individual records */}
          {activeSubTab === 'selective' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Selecione abaixo os registros inseridos por engano ou para teste para remover definitivamente da base de dados desta escola:
              </p>

              {schoolRecords.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Nenhum registro encontrado nesta escola</p>
                  <p className="text-xs text-slate-500 mt-1">A base desta unidade está limpa.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {schoolRecords.map((rec) => {
                    const isTest = isTestRecord(rec);
                    return (
                      <div
                        key={rec.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isTest 
                            ? 'bg-amber-50/60 border-amber-300' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={rec.photoUrl}
                            alt={rec.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                #{rec.id}
                              </span>
                              {isTest && (
                                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Detectado como Teste
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {rec.formattedDateTimeBrasilia}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                              {rec.title}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Autor: {rec.authorName} ({rec.createdByRole}) &bull; Status: {rec.status}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSingleRecordToDelete(rec)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                          title="Excluir este registro (Requer Senha Mestre)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Clear tests */}
          {activeSubTab === 'clear_tests' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Varredura de Registros de Teste</p>
                  <p>
                    O sistema identificou <strong>{testRecords.length}</strong> registro(s) contendo palavras-chave de teste vinculados à <strong>{school.name}</strong>.
                    Para autorizar a remoção, é obrigatória a inserção da Senha Mestre ({MASTER_KEY_ARTICULADOR}).
                  </p>
                </div>
              </div>

              {testRecords.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {testRecords.map(r => (
                    <div key={r.id} className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">#{r.id} - {r.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Criado em: {r.formattedDateTimeBrasilia}</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Será Excluído
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nenhum registro com marcação de teste foi detectado nesta escola.
                </p>
              )}

              {testRecords.length > 0 && (
                <form onSubmit={handleClearTests} className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-2.5">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Digite a Senha Mestre do Articulador ({MASTER_KEY_ARTICULADOR}):
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showClearTestsPassword ? 'text' : 'password'}
                      value={clearTestsPassword}
                      onChange={(e) => {
                        setClearTestsPassword(e.target.value);
                        if (clearTestsPasswordError) setClearTestsPasswordError(null);
                      }}
                      placeholder={`Digite ${MASTER_KEY_ARTICULADOR}`}
                      className="w-full pl-9 pr-10 py-2 border border-amber-300 bg-white rounded-lg text-xs font-mono tracking-widest text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClearTestsPassword(!showClearTestsPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      {showClearTestsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {clearTestsPasswordError && (
                    <p className="text-xs font-bold text-rose-600">
                      {clearTestsPasswordError}
                    </p>
                  )}

                  <div className="pt-1 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!clearTestsPassword.trim()}
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Limpar {testRecords.length} Registros de Teste</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Subtab 3: Delete all */}
          {activeSubTab === 'delete_all' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold text-sm">Atenção: Ação Irreversível!</p>
                  <p>
                    Esta operação excluirá <strong>TODOS os {schoolRecords.length} registros e ocorrências</strong> da escola <strong>{school.name}</strong>.
                    Esta exclusão requer expressamente a <strong>Senha Mestre ({MASTER_KEY_ARTICULADOR})</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleDeleteAll} className="space-y-3 bg-rose-50/60 p-4 rounded-xl border border-rose-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                    Digite a Senha Mestre do Articulador ({MASTER_KEY_ARTICULADOR}) para Autorizar:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showDeleteAllPassword ? 'text' : 'password'}
                      placeholder={`Digite ${MASTER_KEY_ARTICULADOR}`}
                      value={deleteAllPassword}
                      onChange={(e) => {
                        setDeleteAllPassword(e.target.value);
                        if (deleteAllPasswordError) setDeleteAllPasswordError(null);
                      }}
                      className="w-full pl-9 pr-10 py-2.5 border border-rose-300 bg-white rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeleteAllPassword(!showDeleteAllPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showDeleteAllPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {deleteAllPasswordError && (
                  <p className="text-xs font-bold text-rose-600">
                    {deleteAllPasswordError}
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!deleteAllPassword.trim() || schoolRecords.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Todos os Dados com Senha Mestre</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </motion.div>

      {/* Single Record Delete Modal with Master Password */}
      {singleRecordToDelete && (
        <MasterPasswordConfirmModal
          isOpen={!!singleRecordToDelete}
          onClose={() => setSingleRecordToDelete(null)}
          onConfirm={() => {
            onDeleteSingleRecord(singleRecordToDelete.id);
            setSingleRecordToDelete(null);
          }}
          title="Excluir Registro da Escola"
          description={`Para confirmar a exclusão definitiva do registro de ${school.name}, digite a senha mestre do Articulador (${MASTER_KEY_ARTICULADOR}):`}
          itemDetails={[
            { label: 'Protocolo', value: `#${singleRecordToDelete.id}` },
            { label: 'Título', value: singleRecordToDelete.title },
            { label: 'Escola', value: school.name },
            { label: 'Autor', value: singleRecordToDelete.authorName }
          ]}
          confirmButtonText="Confirmar Exclusão com Senha Mestre"
        />
      )}
    </div>
  );
}
