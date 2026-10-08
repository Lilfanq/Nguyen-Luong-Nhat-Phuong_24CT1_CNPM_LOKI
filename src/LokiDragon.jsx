export default function LokiDragon({ idPrefix }) {
  const headId = `${idPrefix}-head`
  const hornId = `${idPrefix}-horn`
  const outerId = `${idPrefix}-fire-outer`
  const midId = `${idPrefix}-fire-mid`
  const glowId = `${idPrefix}-glow`

  return <svg className="dragon-mascot-art" viewBox="0 -16 200 186" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={headId} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#2a2a3a" />
        <stop offset="0.5" stopColor="#0e0e17" />
        <stop offset="1" stopColor="#020206" />
      </linearGradient>
      <linearGradient id={hornId} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#050509" />
        <stop offset="0.7" stopColor="#1c1c29" />
        <stop offset="1" stopColor="#575770" />
      </linearGradient>
      <linearGradient id={outerId} x1="1" y1="0.5" x2="0" y2="0.5">
        <stop offset="0" stopColor="#3f8cff" />
        <stop offset="1" stopColor="#1229c9" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id={midId} x1="1" y1="0.5" x2="0" y2="0.5">
        <stop offset="0" stopColor="#c9fbff" />
        <stop offset="1" stopColor="#38c8ff" stopOpacity="0.8" />
      </linearGradient>
      <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <g className="dragon-float">
      <path d="M120 74 176 70 196 108 188 150 150 164 112 160z" fill="#06060a" stroke="#262634" strokeWidth="2" strokeLinejoin="miter" />
      <path d="M150 72C148 48 168 30 198 26c-12 18-12 34-10 54z" fill={`url(#${hornId})`} stroke="#4a4a60" strokeWidth="2" strokeLinejoin="miter" />

      <path d="M10 96 22 70 50 54 58 40 66 56 84 48 92 34 100 52 122 46 132 62 158 68 176 94 172 126 150 148 112 154 60 152 30 140 12 120z" fill={`url(#${headId})`} stroke="#4a4a60" strokeWidth="2.4" strokeLinejoin="miter" />
      <path d="M98 54C88 30 104 2 164-14c-18 24-18 54-12 80l-28-4z" fill={`url(#${hornId})`} stroke="#6a6a84" strokeWidth="2.4" strokeLinejoin="miter" />
      <path d="M99 46 134 37M101 57 137 48" fill="none" stroke="#e4e4ee" strokeWidth="5.5" strokeLinecap="butt" />
      <path d="M108 30C120 14 138-2 158-10" fill="none" stroke="#7a7a94" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38 82 66 64 104 68 130 78M112 92 138 86 156 102M72 102 86 94 94 106" fill="none" stroke="#50506a" strokeWidth="2.6" strokeLinejoin="miter" />
      <ellipse cx="30" cy="100" rx="6.5" ry="4" fill="#2a2a38" transform="rotate(-20 30 100)" />
      <ellipse cx="49" cy="93" rx="6" ry="3.6" fill="#2a2a38" transform="rotate(-20 49 93)" />

      <g className="dragon-mouth-closed">
        <path d="M12 118 40 132 84 144 130 142 172 124" fill="none" stroke="#5a5a74" strokeWidth="3.2" strokeLinejoin="miter" />
        <path d="M32 128 38 140 44 131M64 138 70 150 76 140M98 144 104 156 110 144" fill="#f4f4fa" />
      </g>

      <g className="dragon-mouth-open">
        <path d="M12 114 18 136 48 156 96 166 142 160 172 132 174 96z" fill="#06060a" stroke="#4a4a60" strokeWidth="2.2" strokeLinejoin="miter" />
        <path d="M18 112 66 108 112 104 168 98 164 128 138 152 96 158 52 150 24 132z" fill="#6c0e2c" />
        <path d="M46 146C70 124 112 126 142 148 114 164 72 162 46 146z" fill="#ff86ad" stroke="#d2456f" strokeWidth="1.6" />
        <path d="M64 142C86 134 108 136 124 146" fill="none" stroke="#ffc1d4" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 110 24 130 32 111 42 134 52 111 64 137 76 110 90 137 102 108 118 133 130 106 148 126 158 102 170 96z" fill="#fff" stroke="#cfcfdc" strokeWidth="1" strokeLinejoin="miter" />
        <path d="M30 140 40 124 48 146 60 128 70 152 84 132 96 156 110 136 122 156 136 140 144 152z" fill="#fff" stroke="#cfcfdc" strokeWidth="1" strokeLinejoin="miter" />
      </g>

      <g className="dragon-eyes-closed" fill="none" strokeLinejoin="miter" strokeLinecap="round">
        <path d="M58 78 82 88 102 74" stroke="#4d9fd6" strokeWidth="3.8" />
        <path d="M114 78 130 86 146 74" stroke="#4d9fd6" strokeWidth="3.2" />
      </g>

      <g className="dragon-flames" filter={`url(#${glowId})`}>
        <g className="dragon-flame dragon-flame-outer">
          <path d="M104 78 88 62 80 66 66 46 62 60 48 44 48 58 32 48 38 64 18 58 28 72 6 70 24 82 8 94 34 90 22 104 48 98 44 110 66 98 82 100 100 88z" fill={`url(#${outerId})`} />
        </g>
        <g className="dragon-flame dragon-flame-mid">
          <path d="M102 78 90 68 82 70 72 56 68 66 56 56 58 68 44 62 52 74 34 76 50 82 38 94 58 90 56 100 74 90 90 90 100 84z" fill={`url(#${midId})`} />
        </g>
        <g className="dragon-flame dragon-flame-core">
          <path d="M100 78 86 68 76 74 62 68 70 79 58 86 74 86 86 90z" fill="#f6ffff" />
        </g>

        <g className="dragon-flame dragon-flame-up-outer">
          <path d="M122 78 116 62 110 54 120 54 112 38 126 46 128 28 136 44 148 34 146 52 162 50 154 62 172 66 152 72 156 82 140 82z" fill={`url(#${outerId})`} />
        </g>
        <g className="dragon-flame dragon-flame-up-mid">
          <path d="M126 78 120 66 118 56 126 58 124 46 134 54 140 42 142 56 152 54 148 66 160 70 144 74 142 82z" fill={`url(#${midId})`} />
        </g>
        <g className="dragon-flame dragon-flame-up-core">
          <path d="M124 78 130 66 138 70 144 74 138 84z" fill="#f6ffff" />
        </g>

        <path className="dragon-ember dragon-ember-one" d="M20 38 24 44 18 46z" fill="#9fe9ff" />
        <path className="dragon-ember dragon-ember-two" d="M44 24 48 30 42 32z" fill="#e8ffff" />
        <path className="dragon-ember dragon-ember-three" d="M156 20 160 26 154 28z" fill="#7bc8ff" />
      </g>
    </g>
  </svg>
}
