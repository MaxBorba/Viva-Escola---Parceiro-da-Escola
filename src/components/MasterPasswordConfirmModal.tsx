import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, 
  X, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle 
} from 'lucide-react';
import { MASTER_KEY_ARTICULADOR } from '../data/schools';

interface MasterPasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
  confirmButtonText?: string;
  warningText?: string;
}

export default function MasterPasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemDetails,
  confirmButtonText = 'Excluir Definitivamente',
  warningText = 'Esta ação é irreversível e removerá os dados do banco permanente.'
}: MasterPasswordConfirmModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.trim() !== MASTER_KEY_ARTICULADOR) {
      setError(`Senha mestre incorreta! Digite a senha mestre (${MASTER_KEY_ARTICULADOR}) do Articulador para autorizar a exclusão.`);
      return;
    }

    onConfirm();
    onClose();
  };

  return (
    <div 
      id="master-password-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-rose-100">
                Exclusão protegida por Senha Mestre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Details list */}
          {itemDetails && itemDetails.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              {itemDetails.map((detail, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-500 shrink-0">{detail.label}:</span>
                  <span className="text-slate-900 font-medium text-right break-all">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{warningText}</p>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Digite a Senha Mestre do Articulador: <span className="text-rose-600 font-mono font-bold">({MASTER_KEY_ARTICULADOR})</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="master-password-confirm-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`Digite ${MASTER_KEY_ARTICULADOR}`}
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border bg-white text-slate-900 text-sm font-mono tracking-widest focus:ring-2 focus:outline-hidden transition-all ${
                  error 
                    ? 'border-rose-400 focus:ring-rose-500' 
                    : 'border-slate-300 focus:ring-rose-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="confirm-master-password-delete-btn"
              type="submit"
              disabled={!password.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmButtonText}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
