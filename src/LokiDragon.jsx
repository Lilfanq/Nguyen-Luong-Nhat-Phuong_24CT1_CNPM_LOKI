export default function LokiDragon({ idPrefix }) {
  const flameId = `${idPrefix}-flame`
  const hornId = `${idPrefix}-horn`
  const headId = `${idPrefix}-head`
  const glowId = `${idPrefix}-glow`

  return <svg className="dragon-mascot-art" viewBox="0 0 200 164" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={headId} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#262634" />
        <stop offset="0.55" stopColor="#0d0d15" />
        <stop offset="1" stopColor="#030307" />
      </linearGradient>
      <linearGradient id={hornId} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#07070c" />
        <stop offset="0.7" stopColor="#1b1b27" />
        <stop offset="1" stopColor="#4a4a5e" />
      </linearGradient>
      <linearGradient id={flameId} x1="1" y1="0.5" x2="0" y2="0.5">
        <stop offset="0" stopColor="#f1ffff" />
        <stop offset="0.35" stopColor="#6fe3ff" />
        <stop offset="1" stopColor="#1f6bff" stopOpacity="0.85" />
      </linearGradient>
      <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.6" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <g className="dragon-float">
      <path d="M120 70c30-10 60 8 66 44 4 22-6 40-28 46l-40 3z" fill="#07070c" stroke="#262634" strokeWidth="2" />
      <path d="M138 70c-2-26 12-46 40-58-8 18-6 32 2 52z" fill={`url(#${hornId})`} stroke="#3b3b4d" strokeWidth="2" strokeLinejoin="round" />

      <path d="M16 106C12 78 34 58 70 52c38-6 76 6 90 36 10 24-4 54-40 60l-68-1c-30-3-44-18-36-41z" fill={`url(#${headId})`} stroke="#3b3b4d" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M82 64C70 34 92 6 152-12c-20 24-20 52-10 80z" fill={`url(#${hornId})`} stroke="#5a5a70" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M89 44c14-5 30-4 44 2m-45 10c15-5 32-4 48 2" fill="none" stroke="#f0f0f6" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 36c10-12 26-22 44-30" fill="none" stroke="#6a6a82" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M42 80c14-14 38-18 62-10m-52 24c10-6 22-8 34-7m24-8c14-3 28-1 40 7" fill="none" stroke="#3b3b4d" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="33" cy="98" rx="5.5" ry="3.6" fill="#303040" transform="rotate(-18 33 98)" />
      <ellipse cx="50" cy="92" rx="5" ry="3.3" fill="#303040" transform="rotate(-18 50 92)" />

      <g className="dragon-mouth-closed">
        <path d="M17 112c36 20 82 28 140 8" fill="none" stroke="#4a4a5e" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M30 118 33 128 39 120M54 127l3 10 6-9M80 132l3 10 6-9" fill="#f5f5fa" />
      </g>

      <g className="dragon-mouth-open">
        <path d="M17 108c34 8 84 4 140-12 4 32-18 54-54 56-44 2-80-14-86-44z" fill="#74102f" stroke="#2c0816" strokeWidth="2" />
        <path d="M38 130c30-12 70-6 94 10-34 14-74 10-94-10z" fill="#ff7ea7" stroke="#d94b78" strokeWidth="1.5" />
        <path d="M18 109 27 126 34 113 43 129 51 115 61 130 69 116 80 129 89 116 101 128 111 114 123 124 133 110 147 116 157 97z" fill="#fff" stroke="#d6d6e2" strokeWidth="1" strokeLinejoin="round" />
        <path d="M44 146 51 133 58 147 67 134 77 150 89 136 101 151 113 138 124 150 132 143z" fill="#fff" stroke="#d6d6e2" strokeWidth="1" strokeLinejoin="round" />
      </g>

      <g className="dragon-eyes-closed" fill="none" strokeLinecap="round">
        <path d="M58 78q17 9 35-2" stroke="#6fb5df" strokeWidth="3.6" />
        <path d="M113 76q12 7 27-2" stroke="#6fb5df" strokeWidth="3" />
      </g>

      <g className="dragon-eyes-awake" filter={`url(#${glowId})`}>
        <path d="M56 79q18-17 42-7-18 21-42 7z" fill="#e4fdff" stroke="#74e3ff" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="78" cy="76" rx="2.6" ry="7" fill="#08233c" />
        <path d="M111 77q13-12 30-4-13 16-30 4z" fill="#e4fdff" stroke="#74e3ff" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="126" cy="75" rx="2.1" ry="5" fill="#08233c" />
      </g>

      <g className="dragon-flames" filter={`url(#${glowId})`}>
        <path className="dragon-flame dragon-flame-main" d="M62 76C44 64 36 46 8 34c14 18 6 28 20 40-18-2-28 6-46 10 30 8 56 4 80-4z" fill={`url(#${flameId})`} />
        <path className="dragon-flame dragon-flame-low" d="M64 83C42 84 26 98 2 100c22 8 44 2 66-8z" fill={`url(#${flameId})`} opacity="0.85" />
        <path className="dragon-flame dragon-flame-back" d="M124 72c10-20 22-26 36-44-2 20 6 30 18 42-14-4-34 0-54 8z" fill={`url(#${flameId})`} />
      </g>
    </g>
  </svg>
}
