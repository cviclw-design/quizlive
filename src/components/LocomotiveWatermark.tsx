import React from 'react';

interface LocomotiveWatermarkProps {
  className?: string;
  variant?: 'both' | 'vande_bharat' | 'wap7';
}

export const LocomotiveWatermark: React.FC<LocomotiveWatermarkProps> = ({
  className = '',
  variant = 'both'
}) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center opacity-[0.04] transition-opacity duration-500 ${className}`}
    >
      <svg
        className="w-[120vw] max-w-[1500px] h-auto text-[#071a3a]"
        viewBox="0 0 1600 600"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Overhead Catenary & High-Voltage Traction Wire */}
        <line x1="0" y1="90" x2="1600" y2="90" stroke="currentColor" strokeWidth="2" strokeDasharray="16 8" />
        <line x1="0" y1="130" x2="1600" y2="130" stroke="currentColor" strokeWidth="3" />
        {/* Catenary Support Droppers */}
        {Array.from({ length: 16 }).map((_, i) => (
          <line
            key={i}
            x1={100 * i + 50}
            y1="90"
            x2={100 * i + 50}
            y2="130"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* ========================================================
            LEFT SIDE: WAP-7 / WAG-9 ELECTRIC LOCOMOTIVE (CLW CLASSIC)
            ======================================================== */}
        <g id="wap7-loco" transform="translate(60, 110)">
          {/* Pantograph reaching to catenary */}
          <path
            d="M 280 20 L 320 -80 L 370 -80 L 410 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line x1="310" y1="-80" x2="380" y2="-80" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <line x1="345" y1="-80" x2="345" y2="-10" stroke="currentColor" strokeWidth="3" />

          {/* Roof Line & Air Conditioners / Resistors */}
          <rect x="120" y="20" width="460" height="24" rx="6" />
          <rect x="220" y="8" width="90" height="14" rx="3" />
          <rect x="420" y="8" width="90" height="14" rx="3" />

          {/* Locomotive Body Silhouette */}
          <path
            d="M 100 44 L 560 44 L 560 260 L 70 260 L 70 120 L 100 44 Z"
          />

          {/* Cab Windshield & Windows */}
          <path
            d="M 105 58 L 150 58 L 140 115 L 85 115 Z"
            fill="white"
            fillOpacity="0.8"
          />
          <rect x="165" y="62" width="55" height="48" rx="4" fill="white" fillOpacity="0.8" />
          <rect x="240" y="70" width="35" height="35" rx="3" fill="white" fillOpacity="0.7" />
          <rect x="300" y="70" width="35" height="35" rx="3" fill="white" fillOpacity="0.7" />
          <rect x="360" y="70" width="35" height="35" rx="3" fill="white" fillOpacity="0.7" />
          <rect x="420" y="70" width="35" height="35" rx="3" fill="white" fillOpacity="0.7" />
          <rect x="485" y="62" width="55" height="48" rx="4" fill="white" fillOpacity="0.8" />

          {/* CLW Aerodynamic Front Hood & Twin High-Beam Headlights */}
          <circle cx="82" cy="155" r="9" fill="white" />
          <circle cx="82" cy="180" r="9" fill="white" />
          {/* Central Ashoka Crest Plate on Locomotive Nose */}
          <rect x="68" y="195" width="28" height="24" rx="4" fill="white" fillOpacity="0.6" />

          {/* Heavy Buffers & Cowcatcher / Cattle Guard */}
          <rect x="40" y="240" width="32" height="14" rx="3" />
          <polygon points="40,270 70,240 70,270" />
          <polygon points="560,240 590,240 590,254 560,254" />

          {/* Co-Co Bogies & Heavy Steel Wheels */}
          <rect x="90" y="260" width="180" height="18" rx="4" />
          <circle cx="120" cy="285" r="24" />
          <circle cx="180" cy="285" r="24" />
          <circle cx="240" cy="285" r="24" />
          
          <rect x="370" y="260" width="180" height="18" rx="4" />
          <circle cx="400" cy="285" r="24" />
          <circle cx="460" cy="285" r="24" />
          <circle cx="520" cy="285" r="24" />
          
          {/* Wheel Hubs */}
          <circle cx="120" cy="285" r="9" fill="white" />
          <circle cx="180" cy="285" r="9" fill="white" />
          <circle cx="240" cy="285" r="9" fill="white" />
          <circle cx="400" cy="285" r="9" fill="white" />
          <circle cx="460" cy="285" r="9" fill="white" />
          <circle cx="520" cy="285" r="9" fill="white" />
        </g>

        {/* ========================================================
            RIGHT SIDE: VANDE BHARAT EXPRESS / AMRIT BHARAT BULLET NOSE
            ======================================================== */}
        <g id="vande-bharat-train" transform="translate(850, 100)">
          {/* Aerodynamic High-Speed Bullet Nose */}
          <path
            d="M 50 270 
               L 540 270 
               C 590 270 630 250 660 210 
               C 690 170 710 130 715 100 
               C 700 70 660 40 590 35 
               L 50 35 
               Z"
          />

          {/* Raked Panoramic Pilot Cockpit Windshield */}
          <path
            d="M 660 115 
               C 645 80 610 60 560 55 
               L 500 55 
               L 515 130 
               L 620 130 
               Z"
            fill="white"
            fillOpacity="0.85"
          />

          {/* Vande Bharat Dynamic Tri-color Racing Livery Stripes */}
          <path
            d="M 680 160 C 650 170 600 175 520 175 L 50 175 L 50 195 L 540 195 C 620 195 660 185 680 160 Z"
            fill="white"
            fillOpacity="0.4"
          />
          <path
            d="M 665 198 C 630 205 580 208 520 208 L 50 208 L 50 220 L 530 220 C 590 220 640 215 665 198 Z"
            fill="white"
            fillOpacity="0.25"
          />

          {/* Vande Bharat Sharp LED Headlight Clusters */}
          <polygon points="650,185 685,170 670,195 640,195" fill="white" />
          <circle cx="660" cy="180" r="6" fill="white" />

          {/* Passenger Saloon Windows (Flush Panoramic Glass) */}
          <rect x="70" y="80" width="75" height="42" rx="6" fill="white" fillOpacity="0.75" />
          <rect x="165" y="80" width="75" height="42" rx="6" fill="white" fillOpacity="0.75" />
          <rect x="260" y="80" width="75" height="42" rx="6" fill="white" fillOpacity="0.75" />
          <rect x="355" y="80" width="75" height="42" rx="6" fill="white" fillOpacity="0.75" />
          <rect x="450" y="80" width="40" height="42" rx="6" fill="white" fillOpacity="0.75" />

          {/* Underfloor Aerodynamic Shroud / Skirts */}
          <rect x="50" y="265" width="560" height="15" rx="4" />

          {/* High-Speed Bogies */}
          <circle cx="140" cy="295" r="22" />
          <circle cx="210" cy="295" r="22" />
          <circle cx="430" cy="295" r="22" />
          <circle cx="500" cy="295" r="22" />
          {/* Wheel Hubs */}
          <circle cx="140" cy="295" r="8" fill="white" />
          <circle cx="210" cy="295" r="8" fill="white" />
          <circle cx="430" cy="295" r="8" fill="white" />
          <circle cx="500" cy="295" r="8" fill="white" />

          {/* Roof-mounted aerodynamic shroud */}
          <path d="M 120 35 L 260 20 L 400 35 Z" fill="currentColor" />
        </g>

        {/* ========================================================
            TRACK BED: RAILS & SLEEPERS EXTENDING HORIZONTALLY
            ======================================================== */}
        <g id="rail-tracks" transform="translate(0, 420)">
          {/* Ballast Stone Base */}
          <rect x="0" y="0" width="1600" height="8" fill="currentColor" fillOpacity="0.4" />
          {/* Sleepers (Concrete Ties) */}
          {Array.from({ length: 64 }).map((_, i) => (
            <rect
              key={i}
              x={25 * i}
              y="8"
              width="14"
              height="28"
              rx="2"
              fill="currentColor"
              fillOpacity="0.8"
            />
          ))}
          {/* Running Rails */}
          <rect x="0" y="14" width="1600" height="5" fill="currentColor" />
          <rect x="0" y="28" width="1600" height="5" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
};
