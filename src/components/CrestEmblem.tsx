import React from 'react';

interface CrestEmblemProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export const CrestEmblem: React.FC<CrestEmblemProps> = ({
  className = '',
  size = 64,
  monochrome = false
}) => {
  const goldColor = monochrome ? '#334155' : '#D97706';
  const navyColor = monochrome ? '#0F172A' : '#1E3A8A';
  const accentColor = monochrome ? '#475569' : '#B45309';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Vigilance Awareness Week Emblem"
    >
      {/* Outer Decorative Circle with Ring */}
      <circle cx="50" cy="50" r="46" stroke={goldColor} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="42" stroke={navyColor} strokeWidth="1" strokeDasharray="2 2" />

      {/* Laurel Wreath / Leaves */}
      <path
        d="M 22 64 C 18 52 20 38 28 26 C 26 34 26 44 32 52"
        stroke={goldColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 78 64 C 82 52 80 38 72 26 C 74 34 74 44 68 52"
        stroke={goldColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Central Pillar of Justice / Balance */}
      <path
        d="M 48 30 L 52 30 L 52 68 L 48 68 Z"
        fill={navyColor}
      />
      {/* Pillar Base & Pedestal */}
      <path
        d="M 40 68 L 60 68 L 63 74 L 37 74 Z"
        fill={goldColor}
      />
      <rect x="35" y="74" width="30" height="3" fill={navyColor} rx="1" />

      {/* Beam of Scales */}
      <path
        d="M 30 36 L 50 34 L 70 36"
        stroke={goldColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Left Scale Pan */}
      <line x1="32" y1="36" x2="27" y2="47" stroke={accentColor} strokeWidth="1.2" />
      <line x1="32" y1="36" x2="37" y2="47" stroke={accentColor} strokeWidth="1.2" />
      <path
        d="M 24 47 C 28 53 36 53 40 47 Z"
        fill={goldColor}
        stroke={navyColor}
        strokeWidth="1"
      />

      {/* Right Scale Pan */}
      <line x1="68" y1="36" x2="63" y2="47" stroke={accentColor} strokeWidth="1.2" />
      <line x1="68" y1="36" x2="73" y2="47" stroke={accentColor} strokeWidth="1.2" />
      <path
        d="M 60 47 C 64 53 72 53 76 47 Z"
        fill={goldColor}
        stroke={navyColor}
        strokeWidth="1"
      />

      {/* Ashoka Wheel / Sun Wheel at Pinnacle */}
      <circle cx="50" cy="24" r="6" stroke={navyColor} strokeWidth="1.5" fill="white" />
      <circle cx="50" cy="24" r="1.5" fill={goldColor} />
      {/* Radial Spokes */}
      <line x1="50" y1="18" x2="50" y2="30" stroke={navyColor} strokeWidth="0.8" />
      <line x1="44" y1="24" x2="56" y2="24" stroke={navyColor} strokeWidth="0.8" />
      <line x1="46" y1="20" x2="54" y2="28" stroke={navyColor} strokeWidth="0.8" />
      <line x1="46" y1="28" x2="54" y2="20" stroke={navyColor} strokeWidth="0.8" />

      {/* Bottom Ribbon / Banner */}
      <path
        d="M 20 84 Q 50 80 80 84 L 84 89 Q 50 85 16 89 Z"
        fill={navyColor}
      />
      <circle cx="50" cy="85.5" r="1.5" fill={goldColor} />
    </svg>
  );
};

export const SealStamp: React.FC<{ certificateId: string; date: string }> = ({
  certificateId,
  date
}) => {
  return (
    <div className="relative inline-flex flex-col items-center justify-center p-3 rounded-full border-2 border-amber-800/60 bg-amber-50/50 w-28 h-28 text-center select-none shadow-sm">
      <div className="absolute inset-1 rounded-full border border-dashed border-amber-800/40 pointer-events-none" />
      <span className="text-[8px] font-bold tracking-widest text-amber-900 uppercase">
        VAW 2026
      </span>
      <span className="text-[7px] font-semibold text-amber-800 tracking-wider">
        VERIFIED INTEGRITY
      </span>
      <div className="w-8 h-px bg-amber-800/40 my-0.5" />
      <span className="font-mono text-[7px] text-amber-950 font-bold">
        {certificateId.slice(0, 10)}
      </span>
      <span className="text-[6px] text-amber-800 mt-0.5">
        {date}
      </span>
    </div>
  );
};
