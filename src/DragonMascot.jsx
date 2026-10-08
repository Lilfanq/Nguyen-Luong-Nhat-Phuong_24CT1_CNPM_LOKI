export default function DragonMascot({ idPrefix }) {
  const scaleId = `${idPrefix}-dragon-scale`
  const muzzleId = `${idPrefix}-dragon-muzzle`
  const eyeGlowId = `${idPrefix}-dragon-eye-glow`
  const filterId = `${idPrefix}-dragon-glow`

  return <svg className="dragon-mascot-art" viewBox="0 0 180 150" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={scaleId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a4ff89" />
        <stop offset="0.46" stopColor="#42c96b" />
        <stop offset="1" stopColor="#12634f" />
      </linearGradient>
      <linearGradient id={muzzleId} x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#dcffb7" />
        <stop offset="1" stopColor="#68cb83" />
      </linearGradient>
      <radialGradient id={eyeGlowId}>
        <stop offset="0" stopColor="#eaff8a" />
        <stop offset="1" stopColor="#6cff8d" />
      </radialGradient>
      <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <g className="dragon-float">
      <path className="dragon-neck" fill={`url(#${scaleId})`} d="M48 102c-23 5-30 20-27 31 3 10 16 13 30 5 8-5 13-13 16-22" />
      <path className="dragon-tail" fill="none" d="M42 126c12 13 31 13 42 1 7-8 4-18-4-21-7-3-14 2-14 8 0 5 4 8 9 7" />
      <path className="dragon-horn" d="M61 49c-14-6-23-18-22-34 12 7 23 7 32 1 2 13 0 23-5 33z" />
      <path className="dragon-horn" d="M116 45c10-10 13-23 8-37-8 10-18 14-30 12 4 12 11 20 22 25z" />
      <path className="dragon-ear" d="M49 62 22 48c6 20 15 31 30 33m80-20 28-16c-5 19-15 30-30 33" />
      <path className="dragon-head" fill={`url(#${scaleId})`} d="M44 75c-1-29 19-49 49-51 29-2 49 18 47 47l-3 22c-2 21-20 38-45 40l-22 1c-20 0-34-13-33-31z" />
      <path className="dragon-cheek-fin" d="M49 91 27 100l25 7m81-18 22 10-23 7" />
      <path className="dragon-muzzle" fill={`url(#${muzzleId})`} d="M56 83c11-10 28-13 45-8l20 7c14 5 19 15 12 24-8 12-28 17-49 14l-23-3c-20-3-24-21-5-34z" />
      <path className="dragon-nose" d="M119 91c4-4 10-4 14-1m-29-4c4-4 9-4 13-1" />
      <g className="dragon-eyes-closed">
        <path d="M60 70c8-8 17-8 25-1m20-2c8-7 17-6 24 2" />
        <path className="dragon-lashes" d="m61 68-5-5m10 3-2-7m68 11 5-5m-10 3 2-7" />
      </g>
      <g className="dragon-eyes-awake" filter={`url(#${filterId})`}>
        <path className="dragon-eye-shape" d="M60 68c7-9 17-10 26-2-5 12-16 14-26 2zm45-1c8-8 18-7 25 2-8 10-19 10-25-2z" />
        <ellipse cx="73" cy="68" rx="3.2" ry="5.4" fill={`url(#${eyeGlowId})`} />
        <ellipse cx="116" cy="68" rx="3.2" ry="5.4" fill={`url(#${eyeGlowId})`} />
      </g>
      <path className="dragon-mouth" d="M78 107c11 5 23 5 33 0m-19 5 4 5 4-5" />
      <path className="dragon-whisker" d="M59 103c-13 1-22 6-30 15m83-8c13 1 21 6 28 14" />
      <path className="dragon-scale-mark" d="m76 43 5-5 5 5m15-2 5-5 5 5" />
      <path className="dragon-breath" d="M126 102c13-2 19 0 25 5-8 0-12 3-16 7 10-1 17 2 22 7" />
    </g>
  </svg>
}