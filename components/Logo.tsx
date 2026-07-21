import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showSlogan?: boolean;
  animate?: boolean;
}

/**
 * High-fidelity, highly polished vector SVG representation of the AgroVision AI Logo
 * based on the user's uploaded logo specification.
 * Fully responsive, crisp, with subtle interactive animations.
 */
export const LogoIcon: React.FC<{ size?: number; animate?: boolean; className?: string }> = ({
  size = 180,
  animate = true,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      {/* Decorative Outer Glow for Premium Polish */}
      <circle cx="100" cy="90" r="82" fill="url(#outerGlow)" opacity="0.15" />

      {/* Main Circular Frame */}
      <circle
        cx="100"
        cy="90"
        r="75"
        stroke="#064e3b"
        strokeWidth="3.5"
        className={animate ? 'animate-[spin_120s_linear_infinite]' : ''}
        strokeDasharray="460 10"
      />

      {/* Wheat / Sorghum / Millet Stem on the Left */}
      <g id="wheat-left" className="transition-all duration-300 hover:scale-105 origin-[45px_100px]">
        {/* Curved stem */}
        <path
          d="M 45,110 Q 51,75 56,48"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Wheat husks climbing up the stem */}
        {/* Left column */}
        <path
          d="M 48,94 C 42,93 40,89 42,85 C 44,85 47,88 48,91 Z"
          fill="#d97706"
        />
        <path
          d="M 49,83 C 43,82 41,78 43,74 C 45,74 48,77 49,80 Z"
          fill="#f59e0b"
        />
        <path
          d="M 51,72 C 45,71 43,67 45,63 C 47,63 50,66 51,69 Z"
          fill="#f59e0b"
        />
        <path
          d="M 52,61 C 46,60 44,56 46,52 C 48,52 51,55 52,58 Z"
          fill="#fbbf24"
        />
        {/* Right column */}
        <path
          d="M 49,90 C 55,89 57,85 55,81 C 53,81 50,84 49,87 Z"
          fill="#d97706"
        />
        <path
          d="M 51,79 C 57,78 59,74 57,70 C 55,70 52,73 51,76 Z"
          fill="#f59e0b"
        />
        <path
          d="M 52,68 C 58,67 60,63 58,59 C 56,59 53,62 52,65 Z"
          fill="#f59e0b"
        />
        <path
          d="M 54,57 C 60,56 62,52 60,48 C 58,48 55,51 54,54 Z"
          fill="#fbbf24"
        />
        {/* Top Husk */}
        <path
          d="M 56,44 Q 57,38 55,34 Q 54,38 56,44"
          fill="#fbbf24"
        />
      </g>

      {/* African Continent Silhouette on the Right */}
      <g
        id="africa-right"
        className="transition-all duration-300 hover:scale-105 origin-[150px_70px]"
      >
        <path
          d="M 143,45 C 148,41 154,39 160,41 C 165,43 169,48 171,52 C 173,55 174,58 173,61 C 172,64 169,67 167,71 C 165,74 163,77 161,81 C 159,84 156,87 154,90 C 152,93 150,96 148,99 C 147,100 146,100 145,98 C 144,96 145,94 144,92 C 143,89 141,87 140,84 C 138,81 135,79 133,76 C 131,73 129,71 128,68 C 128,66 129,64 131,63 C 133,62 135,63 136,61 C 137,59 136,57 137,55 C 138,53 140,53 141,52 C 142,51 141,48 143,45 Z"
          fill="#15803d"
        />
        {/* Madagascar Island */}
        <path
          d="M 164,88 C 165,85 166,85 165,88 C 164,90 163,91 163,89 Z"
          fill="#16a34a"
        />
      </g>

      {/* Central Smartphone with AI and Plant Sprout */}
      <g id="center-smartphone">
        {/* Smartphone Body */}
        <rect
          x="77"
          y="40"
          width="46"
          height="80"
          rx="8"
          fill="#064e3b"
          stroke="#052e16"
          strokeWidth="2.5"
          className="shadow-md"
        />
        {/* Screen */}
        <rect
          x="81"
          y="46"
          width="38"
          height="62"
          rx="4"
          fill="#ffffff"
        />
        {/* Top Speaker Slot */}
        <rect
          x="95"
          y="43"
          width="10"
          height="1.5"
          rx="0.75"
          fill="#15803d"
        />
        {/* Home Bar Indicator */}
        <rect
          x="96"
          y="114"
          width="8"
          height="1.5"
          rx="0.75"
          fill="#15803d"
        />

        {/* AI Chip Traces in upper screen */}
        <g id="ai-traces" className={animate ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}>
          {/* Node 1 */}
          <path
            d="M 90,56 L 95,62 L 95,68"
            stroke="#15803d"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="90" cy="56" r="2" fill="#16a34a" />

          {/* Node 2 */}
          <path
            d="M 100,53 L 100,64"
            stroke="#15803d"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="100" cy="53" r="2" fill="#16a34a" />

          {/* Node 3 */}
          <path
            d="M 110,56 L 105,62 L 105,68"
            stroke="#15803d"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="110" cy="56" r="2" fill="#16a34a" />
        </g>

        {/* Plant Sprout growing in lower screen */}
        <g id="plant-sprout" className={animate ? 'animate-[bounce_4s_ease-in-out_infinite]' : ''}>
          {/* Main Stem */}
          <path
            d="M 100,105 C 100,90 100,80 100,75"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaves */}
          <path
            d="M 100,92 Q 91,92 88,85 Q 94,84 100,92 Z"
            fill="#16a34a"
          />
          <path
            d="M 100,85 Q 109,85 112,78 Q 106,77 100,85 Z"
            fill="#15803d"
          />
          <path
            d="M 100,75 Q 96,67 100,62 Q 104,67 100,75 Z"
            fill="#22c55e"
          />
        </g>
      </g>

      {/* Symmetrical agricultural fields and decorative plant overlay at the bottom */}
      <g id="bottom-agriculture">
        {/* Hill 1 (Left background) */}
        <path
          d="M 30,115 Q 100,95 170,115 Q 100,165 30,115 Z"
          fill="#14532d"
          opacity="0.85"
        />
        {/* Hill 2 (Right foreground) */}
        <path
          d="M 40,122 Q 100,105 160,122 Q 100,165 40,122 Z"
          fill="#15803d"
        />

        {/* Furrow Lines for realistic contour mapping */}
        <path
          d="M 45,128 Q 100,115 155,128"
          stroke="#22c55e"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 58,137 Q 100,126 142,137"
          stroke="#4ade80"
          strokeWidth="1"
          strokeDasharray="3 3"
          fill="none"
          opacity="0.5"
        />

        {/* Right Plant Overlay representing green leaves */}
        <g id="leaf-bundle-right" className="origin-[135px_110px] hover:scale-105 transition-all">
          <path
            d="M 125,110 C 135,92 152,94 162,106 C 148,112 135,113 125,110 Z"
            fill="#16a34a"
          />
          <path
            d="M 132,108 C 145,84 168,85 178,98 C 160,107 145,108 132,108 Z"
            fill="#15803d"
          />
          <path
            d="M 142,110 C 158,80 182,78 191,92 C 173,100 156,104 142,110 Z"
            fill="#22c55e"
          />
        </g>
      </g>

      {/* Circle Top-Left Attached Leaves */}
      <g id="top-left-leaves" className="origin-[35px_30px] hover:scale-110 transition-all duration-300">
        <path
          d="M 38,36 C 26,34 20,20 30,12 C 40,17 40,30 38,36 Z"
          fill="#15803d"
        />
        <path
          d="M 37,48 C 31,46 27,40 31,36 C 35,38 37,44 37,48 Z"
          fill="#16a34a"
        />
      </g>

      {/* Gradients Definitions */}
      <defs>
        <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

/**
 * Beautiful Aperture SVG icon specifically sized to fit inside text
 */
export const ApertureIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 22,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle ${className}`}
    >
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none" />
      {/* 6 beautiful blade polygons forming camera lens aperture */}
      <path d="M 50,6 L 88,28 L 59,45 Z" fill="currentColor" />
      <path d="M 94,50 L 72,88 L 55,59 Z" fill="currentColor" />
      <path d="M 50,94 L 12,72 L 41,55 Z" fill="currentColor" />
      <path d="M 6,50 L 28,12 L 45,41 Z" fill="currentColor" />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showSlogan = true,
  animate = true,
  className = '',
}) => {
  const isLg = size === 'lg' || size === 'xl';
  const isSm = size === 'sm';

  const iconSizes = {
    sm: 52,
    md: 100,
    lg: 180,
    xl: 230,
  };

  const selectedIconSize = iconSizes[size];

  return (
    <div className={`flex flex-col items-center text-center justify-center ${className}`}>
      {/* Crisp SVG Emblem */}
      <LogoIcon size={selectedIconSize} animate={animate} className="mb-4" />

      {/* Title block with stylized camera aperture */}
      <div className="flex flex-col items-center">
        <h2
          className={`font-black tracking-tight leading-none text-slate-900 flex items-center justify-center gap-1.5 ${
            size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : size === 'lg' ? 'text-4.5xl' : 'text-5xl'
          }`}
        >
          <span className="text-emerald-950 font-black">Agro</span>
          <span className="text-emerald-700 font-extrabold flex items-center">
            Visi
            <ApertureIcon
              size={size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 34 : 38}
              className="text-emerald-600 mx-[1px] animate-[spin_10s_linear_infinite]"
            />
            n
          </span>
          <span className="inline-block bg-emerald-900 text-white font-extrabold px-1.5 py-0.5 rounded-lg text-[45%] ml-1 self-center tracking-normal uppercase">
            AI
          </span>
        </h2>

        {/* Subtitle description */}
        {showSubtitle && !isSm && (
          <p
            className={`text-slate-600 font-extrabold uppercase tracking-widest max-w-[340px] leading-tight mt-2.5 ${
              size === 'md' ? 'text-[7.5px]' : 'text-[8.5px]'
            }`}
          >
            L'intelligence artificielle au service de la souveraineté alimentaire
          </p>
        )}

        {/* Separator Line with Leaf Centerpiece */}
        {showSlogan && !isSm && (
          <div className="flex items-center justify-center gap-2.5 w-full max-w-[200px] my-3">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <div className="text-emerald-600 flex gap-0.5">
              <i className="fa-solid fa-leaf text-[9px] rotate-45"></i>
              <i className="fa-solid fa-leaf text-[9px] -rotate-45"></i>
            </div>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>
        )}

        {/* Elegant script-style Slogan */}
        {showSlogan && !isSm && (
          <p className="text-emerald-700 font-bold text-xs italic tracking-wide">
            « Cultiver l'Excellence, Nourrir l'Afrique »
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;
