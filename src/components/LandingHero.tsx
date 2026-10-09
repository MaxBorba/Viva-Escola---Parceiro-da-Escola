import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Camera, 
  FileText, 
  CheckCircle,
  Sparkles,
  School as SchoolIcon,
  Wrench,
  Lock,
  Layers
} from 'lucide-react';
import { SCHOOLS } from '../data/schools';
import { ParanaNreHeaderBrand, ParanaFlagOrShield } from './ParanaLogos';

interface LandingHeroProps {
  onStart: () => void;
  totalRecordsCount: number;
  resolvedCount: number;
}

export default function LandingHero({
  onStart,
  totalRecordsCount,
  resolvedCount
}: LandingHeroProps) {
  return (
    <div id="landing-hero-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Official Paraná State + NRE Maringá Branding */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ParanaNreHeaderBrand />
          </div>

          {/* Quick Action / Access System */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs items-center gap-2 text-emerald-200 hidden md:flex">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>Rede Estadual Conectada &bull; NRE Maringá</span>
            </div>
            <button
              id="header-start-btn"
              onClick={onStart}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/60 active:scale-95 cursor-pointer"
            >
              <span>Acessar Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Text & Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Paraná & NRE Maringá Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estado do Paraná &bull; NRE Maringá</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                ESCOLA VIVA &bull; PARCEIRO DA ESCOLA
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Transformando a infraestrutura das escolas com{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-300 via-teal-200 to-sky-300">
                agilidade e cooperação.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Plataforma oficial do <strong>NRE Maringá</strong> e <strong>Governo do Estado do Paraná</strong> para diretores, articuladores e a equipe técnica da empresa registrarem ocorrências de infraestrutura com fotos em tempo real, prazos, laudos técnicos em PDF e integração digital.
            </p>

            {/* Feature highlights badge row */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
                <Camera className="w-5 h-5 text-emerald-400 mb-1.5" />
                <h4 className="font-bold text-xs text-white">Fotos com Câmera</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Android, Safari iOS e PC</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
                <FileText className="w-5 h-5 text-sky-400 mb-1.5" />
                <h4 className="font-bold text-xs text-white">Laudo em PDF</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Foto à esq. + Enunciado</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5 text-teal-400 mb-1.5" />
                <h4 className="font-bold text-xs text-white">Devolutivas</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Realizado / Não Realizado</p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                id="main-start-btn"
                onClick={onStart}
                className="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-xl shadow-lg shadow-emerald-950/60 hover:shadow-emerald-600/30 transition-all transform active:scale-95 cursor-pointer"
              >
                <span>INICIAR APLICATIVO</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-xs text-slate-400 flex items-center gap-2 justify-center sm:justify-start">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Acesso protegido por Código Escolar &amp; Chave Mestra</span>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Institutional Panel with Profiles & Metrics (No static image) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-800/60 p-5 sm:p-7 space-y-6">
              
              {/* Institutional Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div className="flex items-center gap-3">
                  <ParanaFlagOrShield className="w-10 h-10 shadow-xs" />
                  <div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                      ESCOLA VIVA PARCEIRO DA ESCOLA
                    </h3>
                    <p className="text-xs text-emerald-400 font-semibold">
                      Governo do Estado do Paraná &bull; NRE Maringá
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Oficial
                </span>
              </div>

              {/* Profiles overview cards */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Canais de Acesso no Sistema:</span>
                </div>

                <div 
                  onClick={onStart}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        1º Painel do Articulador
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Visão regional, códigos das unidades, laudos em PDF e planilhas
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                </div>

                <div 
                  onClick={onStart}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <SchoolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        2º Painel da Direção Escolar
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Abertura de chamados com fotos da câmera e acompanhamento
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                </div>

                <div 
                  onClick={onStart}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                        3º Coordenação &amp; Empresa Técnica
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Registro de prazos, agendamentos e devolutivas com fotos pós-obra
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0" />
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black text-emerald-400">{SCHOOLS.length}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Unidades Escolares</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black text-teal-300">{totalRecordsCount}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Ocorrências Totais</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="block text-xl sm:text-2xl font-black text-amber-400">{resolvedCount}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Consertos Feitos</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ParanaFlagOrShield className="w-4 h-4" />
            <span>Governo do Estado do Paraná &bull; NRE MARINGÁ &bull; ESCOLA VIVA PARCEIRO DA ESCOLA</span>
          </div>
          <span className="text-slate-400">SEED - Secretaria de Estado da Educação &amp; Empresas Parceiras</span>
        </div>
      </footer>

    </div>
  );
}

