import React, { useState } from 'react';
import { 
  Trash2, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  ShieldAlert,
  Sparkles,
  Plus,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { MaintenanceRecord } from '../types';
import { MASTER_KEY_ARTICULADOR } from '../data/schools';
import MasterPasswordConfirmModal from './MasterPasswordConfirmModal';

interface CleanTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testRecords: MaintenanceRecord[];
  onConfirmClearAll: () => void;
  onDeleteSingle?: (recordId: string) => void;
  onCreateSampleTest?: () => void;
}

export default function CleanTestModal({
  isOpen,
  onClose,
  testRecords,
  onConfirmClearAll,
  onDeleteSingle,
  onCreateSampleTest
}: CleanTestModalProps) {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [singleRecordToDelete, setSingleRecordToDelete] = useState<MaintenanceRecord | null>(null);

  if (!isOpen) return null;

  const handleClearAllWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword.trim() !== MASTER_KEY_ARTICULADOR) {
      setPasswordError(`Senha mestre incorreta! Digite a senha (${MASTER_KEY_ARTICULADOR}) do Articulador para confirmar a limpeza.`);
      return;
    }
    setPasswordError(null);
    setMasterPassword('');
    onConfirmClearAll();
  };

  return (
    <div 
      id="clean-test-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        id="clean-test-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between border-b border-rose-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Limpeza de Registros de Teste</h3>
                <span className="text-xs bg-rose-900/80 text-rose-100 px-2 py-0.5 rounded-full font-bold border border-rose-400/30">
                  {testRecords.length} identificado(s)
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Apenas o Articulador via Senha Mestre ({MASTER_KEY_ARTICULADOR}) pode autorizar a exclusão
              </p>
            </div>
          </div>
          <button
            id="close-clean-test-modal-btn"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
          
          {testRecords.length > 0 ? (
            <div className="space-y-4">
              
              {/* Alert Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-bold text-sm">Política de Retenção e Segurança:</p>
                  <p>
                    Toda informação cadastrada permanece salva indefinidamente no sistema. A exclusão de registros identificados com 
                    <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold mx-1">teste</span> 
                    exige expressamente a inserção da <strong>Senha Mestre do Articulador ({MASTER_KEY_ARTICULADOR})</strong>.
                  </p>
                </div>
              </div>

              {/* List of Detected Test Records */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Registros Identificados ({testRecords.length}):
                </label>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {testRecords.map(rec => (
                    <div 
                      key={rec.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-rose-300 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-900 truncate">
                            {rec.schoolName}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            #{rec.id}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            TESTE
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {rec.title}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span>Autor: {rec.authorName}</span>
                          <span>&bull;</span>
                          <span>Data: {rec.formattedDateTimeBrasilia}</span>
                        </div>
                      </div>

                      {onDeleteSingle && (
                        <button
                          type="button"
                          onClick={() => setSingleRecordToDelete(rec)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Excluir este registro (Requer senha mestre)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Password Input for Bulk Deletion */}
              <form onSubmit={handleClearAllWithPassword} className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Autorização Obrigatória por Senha Mestre ({MASTER_KEY_ARTICULADOR}):</span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={masterPassword}
                    onChange={(e) => {
                      setMasterPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={`Digite a senha mestre ${MASTER_KEY_ARTICULADOR} para limpar`}
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-rose-300 bg-white text-slate-900 text-xs font-mono tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs font-bold text-rose-700">
                    {passwordError}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    id="confirm-delete-all-tests-btn"
                    type="submit"
                    disabled={!masterPassword.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Todos os {testRecords.length} Registros com Senha Mestre</span>
                  </button>
                </div>
              </form>

            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Nenhum dado de teste encontrado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não há nenhum registro com o termo "teste" cadastrado no momento. Todos os dados atuais pertencem às ocorrências operacionais oficiais.
                </p>
              </div>

              {onCreateSampleTest && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onCreateSampleTest}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar um registro de teste para validação
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Single Test Item Deletion Modal */}
      {singleRecordToDelete && onDeleteSingle && (
        <MasterPasswordConfirmModal
          isOpen={!!singleRecordToDelete}
          onClose={() => setSingleRecordToDelete(null)}
          onConfirm={() => {
            onDeleteSingle(singleRecordToDelete.id);
            setSingleRecordToDelete(null);
          }}
          title="Excluir Registro de Teste"
          description={`Para apagar permanentemente este registro de teste da base de dados, digite a senha mestre do Articulador (${MASTER_KEY_ARTICULADOR}):`}
          itemDetails={[
            { label: 'Protocolo', value: `#${singleRecordToDelete.id}` },
            { label: 'Título', value: singleRecordToDelete.title },
            { label: 'Escola', value: singleRecordToDelete.schoolName },
            { label: 'Autor', value: singleRecordToDelete.authorName }
          ]}
          confirmButtonText="Confirmar Exclusão com Senha Mestre"
        />
      )}
    </div>
  );
}
