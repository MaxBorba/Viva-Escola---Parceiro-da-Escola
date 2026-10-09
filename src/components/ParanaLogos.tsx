import React from 'react';

/**
 * Official vector emblem for the State of Paraná (Governo do Estado do Paraná)
 */
export function ParanaFlagOrShield({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Brasão e Bandeira do Estado do Paraná"
    >
      {/* Outer rounded shield / badge */}
      <rect width="100" height="100" rx="20" fill="#00873E" />
      
      {/* Diagonal white band (inspired by Paraná state flag) */}
      <path 
        d="M-10 85 L85 -10 L110 15 L15 110 Z" 
        fill="#FFFFFF" 
      />
      
      {/* Central Blue Disc (representing the Southern Sky / Paraná Sphere) */}
      <circle cx="50" cy="50" r="22" fill="#003399" stroke="#FFFFFF" strokeWidth="2.5" />
      
      {/* Southern Cross stars (Cruzeiro do Sul) */}
      <circle cx="50" cy="38" r="2" fill="#FFFFFF" />
      <circle cx="50" cy="62" r="2" fill="#FFFFFF" />
      <circle cx="41" cy="50" r="2" fill="#FFFFFF" />
      <circle cx="59" cy="48" r="2" fill="#FFFFFF" />
      <circle cx="54" cy="55" r="1.3" fill="#FFFFFF" />

      {/* Stylized Araucaria / Laurel Branch accent in gold */}
      <path 
        d="M20 78 C25 65, 35 60, 42 60" 
        stroke="#FCD34D" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M80 22 C75 35, 65 40, 58 40" 
        stroke="#FCD34D" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

/**
 * Official styled logo lockup for Paraná - Governo do Estado
 */
export function ParanaStateLogo({ 
  variant = 'dark',
  size = 'normal'
}: { 
  variant?: 'light' | 'dark' | 'header';
  size?: 'small' | 'normal' | 'large';
}) {
  const isLight = variant === 'light';
  const isHeader = variant === 'header';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div className="relative shrink-0 shadow-sm rounded-xl overflow-hidden">
        <ParanaFlagOrShield className={size === 'small' ? "w-8 h-8" : size === 'large' ? "w-12 h-12" : "w-10 h-10"} />
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className={`font-black tracking-tight ${
          size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'
        } ${isHeader || isLight ? 'text-white' : 'text-slate-900'}`}>
          PARANÁ
        </span>
        <span className={`font-semibold tracking-wider uppercase ${
          size === 'small' ? 'text-[9px]' : size === 'large' ? 'text-xs' : 'text-[10px]'
        } ${isHeader ? 'text-emerald-200' : isLight ? 'text-emerald-300' : 'text-emerald-700'}`}>
          GOVERNO DO ESTADO
        </span>
        <span className={`font-medium ${
          size === 'small' ? 'text-[8px]' : 'text-[9px]'
        } ${isHeader ? 'text-indigo-200' : isLight ? 'text-slate-300' : 'text-slate-500'}`}>
          SEED &bull; Secretaria da Educação
        </span>
      </div>
    </div>
  );
}

/**
 * Official vector emblem for NRE MARINGÁ (Núcleo Regional de Educação de Maringá)
 */
export function NreMaringaLogo({ 
  variant = 'badge',
  size = 'normal'
}: { 
  variant?: 'badge' | 'full' | 'header';
  size?: 'small' | 'normal' | 'large';
}) {
  const isHeader = variant === 'header';

  return (
    <div className="inline-flex items-center gap-2 select-none">
      {/* NRE Emblem Badge */}
      <div className="relative flex items-center justify-center rounded-xl bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/40 p-1.5 shadow-md shadow-indigo-950/40 shrink-0">
        <div className="flex flex-col items-center justify-center px-1.5 py-0.5">
          <div className="flex items-center gap-0.5">
            <span className="font-black text-xs sm:text-sm tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-sky-200 to-white">
              NRE
            </span>
          </div>
          <span className="text-[7px] font-black tracking-widest text-indigo-300 uppercase -mt-0.5">
            MGF
          </span>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight ${
            size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
          } ${isHeader ? 'text-white' : 'text-indigo-200'}`}>
            NRE MARINGÁ
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
            REGIONAL
          </span>
        </div>
        <span className={`font-medium ${
          size === 'small' ? 'text-[8px]' : 'text-[10px]'
        } ${isHeader ? 'text-indigo-200/80' : 'text-slate-300'}`}>
          Núcleo Regional de Educação
        </span>
      </div>
    </div>
  );
}

/**
 * Unified Header Brand combining Estado do Paraná + NRE Maringá
 */
export function ParanaNreHeaderBrand() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
      {/* Paraná State Brand */}
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 drop-shadow-xs">
          <ParanaFlagOrShield className="w-9 h-9" />
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
            PARANÁ
            <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-400/30">
              PR
            </span>
          </span>
          <span className="text-[10px] font-bold text-emerald-200 tracking-wider uppercase">
            Governo do Estado
          </span>
        </div>
      </div>

      {/* Vertical subtle divider */}
      <div className="hidden sm:block h-7 w-px bg-white/20"></div>

      {/* NRE Maringá Brand */}
      <div className="flex items-center gap-2">
        <div className="bg-indigo-950/80 border border-indigo-400/40 rounded-lg px-2 py-1 flex items-center justify-center shadow-xs">
          <span className="font-black text-xs text-amber-300 tracking-tight">NRE</span>
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-bold text-xs sm:text-sm text-white tracking-tight">
            MARINGÁ
          </span>
          <span className="text-[9px] text-indigo-200 font-medium">
            Núcleo Regional de Educação
          </span>
        </div>
      </div>
    </div>
  );
}
