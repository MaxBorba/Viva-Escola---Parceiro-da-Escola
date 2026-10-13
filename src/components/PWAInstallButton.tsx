import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-500/40 rounded-xl p-3 text-white flex items-center justify-between gap-3 shadow-lg ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/80 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Instalar Aplicativo Escola Viva</p>
              <p className="text-[11px] text-blue-200">Acesse direto da tela inicial do seu Android ou computador</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar PWA</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        title="Instalar Aplicativo Escola Viva na Tela de Início"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Instalar Aplicativo no iPhone / iPad"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span>Instalar no Safari</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-100">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <Share2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>1. No Safari, toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</span>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>2. Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>3. Toque em <strong>"Adicionar"</strong> no canto superior direito para concluir.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that support install prompt via browser menu or desktop
  return (
    <button
      onClick={() => {
        alert('Para instalar o aplicativo Escola Viva, use o menu do navegador (três pontinhos ou ícone de instalação na barra de endereços) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
      }}
      title="Instalar como Aplicativo PWA"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-blue-400" />
      <span>Instalar App</span>
    </button>
  );
};
