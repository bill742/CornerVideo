import { cn } from "@/lib/utils";

interface VhsLoaderProps {
  className?: string;
  /** Read to screen readers; the caption on screen is decorative. */
  label?: string;
}

/**
 * The house loading state: a rental tape winding behind its window.
 *
 * It fades in after a short delay (see `.vhs-loader` in globals.css), so a
 * load that finishes quickly shows nothing at all rather than flashing a
 * placeholder. Pages keep their own headings and only swap the content area
 * for this, so nothing above it moves when the content arrives.
 */
function VhsLoader({ className, label = "Loading" }: VhsLoaderProps) {
  return (
    <div
      className={cn(
        "vhs-loader flex min-h-[50vh] flex-col items-center justify-center gap-4",
        className
      )}
      role="status"
    >
      <svg
        aria-hidden
        className="w-56 drop-shadow-md"
        viewBox="0 0 200 116"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shell */}
        <rect
          className="fill-[#1C1A17] stroke-[var(--color-border)]"
          height="112"
          rx="7"
          strokeWidth="2"
          width="196"
          x="2"
          y="2"
        />
        {/* Spine label, the store's own sticker on the tape */}
        <rect fill="#F6EFE0" height="26" rx="2" width="164" x="18" y="10" />
        <rect className="fill-primary" height="6" width="164" x="18" y="10" />
        <text
          className="font-display"
          fill="#1C1A17"
          fontSize="11"
          fontWeight="600"
          letterSpacing="1.5"
          textAnchor="middle"
          x="100"
          y="31"
        >
          CORNER VIDEO
        </text>

        {/* Window onto the reels */}
        <rect fill="#0C0B09" height="50" rx="6" width="136" x="32" y="48" />

        {/* Tape packs: one empties as the other fills */}
        <circle
          className="vhs-pack vhs-pack-left"
          cx="70"
          cy="73"
          fill="#3B2C1E"
          r="20"
        />
        <circle
          className="vhs-pack vhs-pack-right"
          cx="130"
          cy="73"
          fill="#3B2C1E"
          r="20"
        />
        {/* Tape running across the bottom of the window */}
        <path d="M52 96 L148 96" stroke="#3B2C1E" strokeWidth="2" />

        {/* Hubs, spinning */}
        {[70, 130].map((cx) => (
          <g className="vhs-hub" key={cx}>
            <circle cx={cx} cy="73" fill="#F6EFE0" r="8" />
            {[0, 120, 240].map((angle) => (
              <rect
                fill="#0C0B09"
                height="5"
                key={angle}
                transform={`rotate(${angle} ${cx} 73)`}
                width="2.5"
                x={cx - 1.25}
                y="65"
              />
            ))}
            <circle cx={cx} cy="73" fill="#0C0B09" r="2.5" />
          </g>
        ))}
      </svg>
      <p
        aria-hidden
        className="text-muted-foreground font-display tracking-wide"
      >
        Rewinding…
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

VhsLoader.displayName = "VhsLoader";

export { VhsLoader };
