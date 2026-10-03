/** Emblème de Nova Terra : une planète et son anneau. Décoratif, le nom est toujours affiché à côté. */
export function NovaTerraEmblem({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nt-planet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="#0b1324" />
      <circle cx="20" cy="20" r="9" fill="url(#nt-planet)" />
      <path d="M8 24c3 2.5 21 -3.5 24 -9" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="31" cy="9" r="1.4" fill="#fde68a" />
    </svg>
  )
}

export function NovaTerraWordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <NovaTerraEmblem />
      <span className="flex flex-col leading-tight">
        <strong className={`text-lg font-semibold tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>Nova Terra</strong>
        <span className={`text-xs ${inverted ? "text-slate-300" : "text-slate-600"}`}>Ville de Nova Terra</span>
      </span>
    </span>
  )
}
