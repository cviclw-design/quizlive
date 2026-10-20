import React from 'react';

interface IndianRailwaysLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'emblem' | 'crest';
}

export const IndianRailwaysLogo: React.FC<IndianRailwaysLogoProps> = ({
  size = 56,
  className = '',
  showText = false,
  variant = 'crest'
}) => {
  const [useFallbackSvg, setUseFallbackSvg] = React.useState(false);
  const logoUrl = 'https://clw.indianrailways.gov.in/images/18%20star.png';

  if (!useFallbackSvg) {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <img
          src={logoUrl}
          alt="Indian Railways Official 18 Star Logo"
          onError={() => setUseFallbackSvg(true)}
          className="shrink-0 object-contain drop-shadow-xs"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
        {showText && (
          <div className="flex flex-col">
            <span className="font-black text-[#071a3a] text-xs leading-none uppercase tracking-wide">
              भारतीय रेल
            </span>
            <span className="font-bold text-amber-700 text-[10px] leading-tight uppercase tracking-wider">
              Indian Railways
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
        aria-label="Indian Railways Official Emblem"
      >
        <defs>
          <linearGradient id="irGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7d070" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#997018" />
          </linearGradient>
          <linearGradient id="irNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b2447" />
            <stop offset="100%" stopColor="#041226" />
          </linearGradient>
          <linearGradient id="irCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>

        {/* Outer Circular Rim */}
        <circle cx="80" cy="80" r="76" fill="url(#irNavy)" stroke="url(#irGold)" strokeWidth="3.5" />
        <circle cx="80" cy="80" r="71" stroke="#fef08a" strokeWidth="0.75" strokeDasharray="3 3" />

        {/* Outer Ring with Railway Track Ties & Spokes */}
        <circle cx="80" cy="80" r="66" fill="none" stroke="url(#irGold)" strokeWidth="1.5" />

        {/* Circular Inscription Band */}
        <path
          d="M 24 80 A 56 56 0 1 1 136 80 A 56 56 0 1 1 24 80"
          fill="none"
          stroke="#071a3a"
          strokeWidth="15"
        />

        {/* Bilingual Inscription Arc Text Approximation / Star Accents */}
        <circle cx="34" cy="80" r="2.5" fill="url(#irGold)" />
        <circle cx="126" cy="80" r="2.5" fill="url(#irGold)" />

        {/* Inner Railway Wheel (Chakra) with 24 Spokes */}
        <circle cx="80" cy="80" r="48" fill="#ffffff" stroke="url(#irGold)" strokeWidth="2.5" />
        <circle cx="80" cy="80" r="45" fill="#f8fafc" stroke="#071a3a" strokeWidth="1" />

        {/* Radial Spokes of the Railway Chakra */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 80 + Math.cos(rad) * 16;
          const y1 = 80 + Math.sin(rad) * 16;
          const x2 = 80 + Math.cos(rad) * 44;
          const y2 = 80 + Math.sin(rad) * 44;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#071a3a"
              strokeWidth={i % 2 === 0 ? "1.6" : "0.9"}
            />
          );
        })}

        {/* Railway Tracks Crossing Front Wheel */}
        <g stroke="url(#irGold)" strokeWidth="2" strokeLinecap="round">
          {/* Rails */}
          <line x1="62" y1="50" x2="62" y2="110" />
          <line x1="98" y1="50" x2="98" y2="110" />
          {/* Sleepers */}
          <line x1="56" y1="58" x2="104" y2="58" strokeWidth="2.5" stroke="#071a3a" />
          <line x1="56" y1="72" x2="104" y2="72" strokeWidth="2.5" stroke="#071a3a" />
          <line x1="56" y1="88" x2="104" y2="88" strokeWidth="2.5" stroke="#071a3a" />
          <line x1="56" y1="102" x2="104" y2="102" strokeWidth="2.5" stroke="#071a3a" />
        </g>

        {/* Center Hub of the Wheel */}
        <circle cx="80" cy="80" r="14" fill="url(#irCrimson)" stroke="url(#irGold)" strokeWidth="2" />
        <circle cx="80" cy="80" r="5" fill="#fef08a" />

        {/* Top Ashoka Lion Capital (National Emblem Crest at Top) */}
        <g transform="translate(80, 26) scale(0.68)">
          {/* Pedestal with Dharma Chakra */}
          <rect x="-24" y="20" width="48" height="6" rx="2" fill="url(#irGold)" stroke="#071a3a" strokeWidth="1" />
          <circle cx="0" cy="23" r="2.5" fill="#071a3a" />
          
          {/* Central Lion */}
          <path
            d="M -7 4 C -7 -6 0 -12 0 -12 C 0 -12 7 -6 7 4 C 7 12 5 18 0 20 C -5 18 -7 12 -7 4 Z"
            fill="url(#irGold)"
            stroke="#071a3a"
            strokeWidth="1.2"
          />
          {/* Left Lion */}
          <path
            d="M -6 4 C -14 0 -16 -8 -13 -13 C -10 -9 -7 -4 -5 3 Z"
            fill="url(#irGold)"
            stroke="#071a3a"
            strokeWidth="1"
          />
          {/* Right Lion */}
          <path
            d="M 6 4 C 14 0 16 -8 13 -13 C 10 -9 7 -4 5 3 Z"
            fill="url(#irGold)"
            stroke="#071a3a"
            strokeWidth="1"
          />
          {/* Crown Mane details */}
          <circle cx="0" cy="-6" r="1.5" fill="#7f1d1d" />
        </g>

        {/* Banner at Bottom: Satyameva Jayate / Indian Railways */}
        <path
          d="M 38 126 Q 80 140 122 126 L 126 135 Q 80 150 34 135 Z"
          fill="url(#irGold)"
          stroke="#071a3a"
          strokeWidth="1.2"
        />
        <text
          x="80"
          y="134"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#071a3a"
          fontFamily="Outfit, sans-serif"
          letterSpacing="0.8"
        >
          INDIAN RAILWAYS
        </text>
        <text
          x="80"
          y="38"
          textAnchor="middle"
          fontSize="6"
          fontWeight="900"
          fill="#ffffff"
          fontFamily="Outfit, sans-serif"
          letterSpacing="0.6"
        >
          भारतीय रेल
        </text>
      </svg>

      {showText && (
        <div className="leading-tight">
          <div className="text-xs sm:text-sm font-extrabold tracking-wide text-[#071a3a] flex items-center gap-1.5">
            <span>भारतीय रेल</span>
            <span className="text-[#d4af37]">·</span>
            <span>INDIAN RAILWAYS</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-semibold text-[#8a6a12] tracking-wider uppercase">
            Vigilance Directorate · CVC Portal
          </div>
        </div>
      )}
    </div>
  );
};
