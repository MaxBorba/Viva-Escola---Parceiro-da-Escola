import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Wrench, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  ArrowRight, 
  School as SchoolIcon, 
  X, 
  AlertCircle,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { SCHOOLS, MASTER_KEY_ARTICULADOR } from '../data/schools';
import { School, UserSession } from '../types';
import { ParanaNreHeaderBrand, ParanaFlagOrShield } from './ParanaLogos';

interface RoleSelectorProps {
  onSelectSession: (session: UserSession) => void;
  onBackToLanding: () => void;
}

export default function RoleSelector({
  onSelectSession,
  onBackToLanding
}: RoleSelectorProps) {
  const [activeModal, setActiveModal] = useState<'articulador' | 'direcao' | 'coordenacao' | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openAuth = (role: 'articulador' | 'direcao' | 'coordenacao') => {
    setActiveModal(role);
    setEnteredCode('');
    setSelectedSchoolId('');
    setErrorMessage(null);
  };

  const handleArticuladorAuth = (e: FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() === MASTER_KEY_ARTICULADOR) {
      onSelectSession({
        role: 'articulador',
        authenticatedAt: new Date().toISOString()
      });
    } else {
      setErrorMessage(`Chave Mestra incorreta. A Chave Mestra do Articulador é ${MASTER_KEY_ARTICULADOR}.`);
    }
  };

  const handleSchoolAuth = (role: 'direcao' | 'coordenacao') => (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = enteredCode.trim();

    // Check if code matches any school or master key
    const matchedSchool = SCHOOLS.find(s => s.code === cleanCode);

    if (matchedSchool) {
      onSelectSession({
        role,
        school: matchedSchool,
        authenticatedAt: new Date().toISOString()
      });
    } else if (cleanCode === MASTER_KEY_ARTICULADOR) {
      // Allow master key for supervisors/coordinators as well
      const fallbackSchool = selectedSchoolId 
        ? SCHOOLS.find(s => s.id === selectedSchoolId) || SCHOOLS[0]
        : SCHOOLS[0];

      onSelectSession({
        role,
        school: fallbackSchool,
        authenticatedAt: new Date().toISOString()
      });
    } else {
      setErrorMessage(`Código de 4 dígitos não reconhecido para ${role === 'direcao' ? 'a Direção' : 'a Coordenação'}. Verifique o código com o Articulador.`);
    }
  };

  return (
    <div id="role-selector-page" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800 pb-4">
        <button
          id="back-to-landing-btn"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-3">
          <ParanaNreHeaderBrand />
        </div>
      </header>

      {/* Center 3 Role Icons Cards */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8">
        
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selecione seu Perfil de Acesso &bull; NRE Maringá</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Como você deseja acessar hoje?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Acesso segmentado e seguro para articulação estadual, direção escolar e coordenação técnica de manutenção.
          </p>
        </div>

        {/* The 3 Core Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          
          {/* 1º ÍCONE - ARTICULADOR */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            id="role-card-articulador"
            onClick={() => openAuth('articulador')}
            className="group relative bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-emerald-500 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl cursor-pointer transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    1º ÍCONE
                  </span>
                  <span className="text-xs text-slate-400">Chave Mestra</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                  ARTICULADOR
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Acesso global a todas as unidades escolares do NRE Maringá, visualização dos códigos das diretorias, registros de pontos, filtro por datas, laudos em PDF e exportação para a Planilha Google.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-700/60 mt-6 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Acesso Restrito
              </span>
              <span className="p-2 rounded-lg bg-slate-700 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

          {/* 2º ÍCONE - DIREÇÃO */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            id="role-card-direcao"
            onClick={() => openAuth('direcao')}
            className="group relative bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-emerald-400 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl cursor-pointer transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-slate-700 group-hover:bg-emerald-600 flex items-center justify-center text-white shadow-md transition-all group-hover:scale-105">
                <SchoolIcon className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                    2º ÍCONE
                  </span>
                  <span className="text-xs text-slate-400">Código Secreto</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                  DIREÇÃO
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Acesso exclusivo para os diretores registrarem fotos com a câmera do celular/Safari, descrição das manutenções, data/hora de Brasília e laudos em PDF da sua unidade.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-700/60 mt-6 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Código da Unidade
              </span>
              <span className="p-2 rounded-lg bg-slate-700 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

          {/* 3º ÍCONE - COORDENAÇÃO */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            id="role-card-coordenacao"
            onClick={() => openAuth('coordenacao')}
            className="group relative bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-emerald-400 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xl cursor-pointer transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-slate-700 group-hover:bg-emerald-600 flex items-center justify-center text-white shadow-md transition-all group-hover:scale-105">
                <Wrench className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                    3º ÍCONE
                  </span>
                  <span className="text-xs text-slate-400">Código Secreto</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                  COORDENAÇÃO
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Acesso para a empresa e equipe técnica reportarem as devolutivas dos consertos: ( ) Realizado ou ( ) Não Realizado com justificativa e novo prazo de entrega.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-700/60 mt-6 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Empresa Parceira
              </span>
              <span className="p-2 rounded-lg bg-slate-700 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

        </div>

      </main>

      {/* Footer Info */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400 py-3 border-t border-slate-800">
        Os códigos individuais das unidades permanecem confidenciais e protegidos para cada escola do NRE Maringá.
      </footer>

      {/* AUTH MODAL FOR ARTICULADOR */}
      <AnimatePresence>
        {activeModal === 'articulador' && (
          <div id="articulador-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-white relative"
            >
              <button
                id="close-articulador-modal"
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center mb-4 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-white">Acesso do Articulador</h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Digite a Chave Mestra para liberar a gestão de todas as escolas e quadro geral de códigos do NRE Maringá.
              </p>

              <form onSubmit={handleArticuladorAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Chave Mestra do Articulador:
                  </label>
                  <div className="relative">
                    <input
                      id="articulador-master-key-input"
                      type="password"
                      autoFocus
                      required
                      placeholder="••••••"
                      value={enteredCode}
                      onChange={(e) => {
                        setEnteredCode(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono tracking-widest text-center text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <KeyRound className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Chave confidencial e exclusiva do Articulador Estadual credenciado.</span>
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="submit-articulador-auth-btn"
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entrar como Articulador</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL FOR DIREÇÃO & COORDENAÇÃO */}
      <AnimatePresence>
        {(activeModal === 'direcao' || activeModal === 'coordenacao') && (
          <div id="school-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-white relative"
            >
              <button
                id="close-school-modal"
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center mb-4 border border-emerald-500/30">
                {activeModal === 'direcao' ? <SchoolIcon className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
              </div>

              <h3 className="text-xl font-bold text-white">
                {activeModal === 'direcao' ? 'Acesso da Direção Escolar' : 'Acesso da Coordenação / Empresa'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Digite a senha de 4 dígitos da sua unidade escolar cadastrada (ex: 3536, 3714, 4125, etc.) para acessar a página correspondente.
              </p>

              <form onSubmit={handleSchoolAuth(activeModal)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Senha / Código de Acesso da Unidade:
                  </label>
                  <div className="relative">
                    <input
                      id="school-code-input"
                      type="password"
                      autoFocus
                      required
                      placeholder="Senha de 4 dígitos"
                      value={enteredCode}
                      onChange={(e) => {
                        setEnteredCode(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 font-mono tracking-widest text-center text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Acesso individual e confidencial vinculado entre Android, Safari e Web.</span>
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="submit-school-auth-btn"
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
