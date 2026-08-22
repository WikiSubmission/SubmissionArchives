export default function PageRuler() {
  const inches = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="w-[816px] h-6 bg-ed-surface/90 border-b border-ed-rule relative select-none shrink-0 shadow-ed-sm rounded-t-sm overflow-hidden font-mono text-[9px] text-ed-fg-faint flex items-center">
      {/* Left 1-inch Margin Shaded Overlay (0 to 96px) */}
      <div className="absolute left-0 top-0 bottom-0 w-[96px] bg-ed-surface-strong/50 border-r border-ed-rule" />

      {/* Right 1-inch Margin Shaded Overlay (720px to 816px) */}
      <div className="absolute right-0 top-0 bottom-0 w-[96px] bg-ed-surface-strong/50 border-l border-ed-rule" />

      {/* Inch Markers & Ticks */}
      <div className="relative w-full h-full">
        {inches.map((inch) => {
          const leftPx = inch * 96
          return (
            <div key={inch} className="absolute top-0 bottom-0 flex flex-col justify-between" style={{ left: `${leftPx}px` }}>
              {/* Major Inch Tick */}
              <div className="w-px h-2.5 bg-ed-rule-strong" />
              {inch < 8 && (
                <span className="translate-x-[2px] leading-none text-ed-fg-faint font-semibold">{inch}</span>
              )}
            </div>
          )
        })}

        {/* Half-inch Ticks */}
        {inches.slice(0, 8).map((inch) => {
          const leftPx = inch * 96 + 48
          return (
            <div key={`half-${inch}`} className="absolute top-0 w-px h-1.5 bg-ed-rule" style={{ left: `${leftPx}px` }} />
          )
        })}
      </div>
    </div>
  )
}
