import { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Camera, 
  Eye, 
  Wrench, 
  User, 
  Building2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { MaintenanceRecord, School } from '../types';
import { formatDateOnly } from '../utils/brasiliaTime';

interface CoordenacaoNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  records: MaintenanceRecord[];
  unreadIds: string[];
  onMarkAllAsRead: () => void;
  onSelectRecordForResolution: (record: MaintenanceRecord) => void;
  onSelectRecordForDetail: (record: MaintenanceRecord) => void;
}

export default function CoordenacaoNotificationsModal({
  isOpen,
  onClose,
  school,
  records,
  unreadIds,
  onMarkAllAsRead,
  onSelectRecordForResolution,
  onSelectRecordForDetail
}: CoordenacaoNotificationsModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'articulador' | 'direcao' | 'pendentes'>('all');

  if (!isOpen) return null;

  // Filter school records
  const incomingRecords = records
    .filter(r => r.schoolId === school.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = incomingRecords.filter(r => {
    if (filterType === 'articulador') return r.createdByRole === 'articulador';
    if (filterType === 'direcao') return r.createdByRole === 'direcao';
    if (filterType === 'pendentes') return r.status === 'pendente' || r.status === 'em_andamento';
    return true;
  });

  return (
    <div 
      id="coordenacao-notifications-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-700 text-white px-5 py-4 flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white relative shadow-inner">
              <Bell className="w-5 h-5" />
              {unreadIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadIds.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Central de Notificações da Coordenação
              </h3>
              <p className="text-xs text-indigo-100">
                {school.name} &bull; Pedidos recebidos do Articulador e da Direção
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Filters */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({incomingRecords.length})
            </button>
            <button
              onClick={() => setFilterType('articulador')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'articulador'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Do Articulador ({incomingRecords.filter(r => r.createdByRole === 'articulador').length})
            </button>
            <button
              onClick={() => setFilterType('direcao')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'direcao'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Da Direção ({incomingRecords.filter(r => r.createdByRole === 'direcao').length})
            </button>
            <button
              onClick={() => setFilterType('pendentes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'pendentes'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pendentes ({incomingRecords.filter(r => r.status === 'pendente' || r.status === 'em_andamento').length})
            </button>
          </div>

          {unreadIds.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Nenhuma notificação encontrada neste filtro.</p>
              <p className="text-xs text-slate-400 mt-1">
                Todas as solicitações registradas pelo Articulador ou pela Direção aparecem aqui.
              </p>
            </div>
          ) : (
            filtered.map(rec => {
              const isUnread = unreadIds.includes(rec.id);
              const isArticulador = rec.createdByRole === 'articulador';
              const isResolved = !!rec.resolution;

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isUnread
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                      <img
                        src={rec.photoUrl}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {rec.photoUrl && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.2 font-bold flex items-center justify-center gap-0.5">
                          <Camera className="w-2.5 h-2.5" /> Foto
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isArticulador ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <User className="w-3 h-3 text-emerald-700" /> Articulador Regional
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                            <Building2 className="w-3 h-3 text-teal-700" /> Direção Escolar
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-400">
                          #{rec.id}
                        </span>

                        {isUnread && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 shadow-xs">
                            NOVA
                          </span>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isResolved 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isResolved ? 'Devolutiva Enviada' : 'Aguardando Devolutiva'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {rec.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-rose-700">
                          <Calendar className="w-3 h-3" /> Prazo: {formatDateOnly(rec.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.formattedDateTimeBrasilia}
                        </span>
                        <span className="text-slate-600 font-semibold">
                          Categoria: {rec.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecordForDetail(rec);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Visualizar laudo completo e PDF"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecordForResolution(rec);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      title="Dar devolutiva com foto do conserto"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Editar Devolutiva' : 'Dar Devolutiva'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Total de <strong>{filtered.length}</strong> notificações sincronizadas em tempo real.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
