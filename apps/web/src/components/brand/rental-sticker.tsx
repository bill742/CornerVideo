import { cn } from "@/lib/utils";

interface RentalStickerProps extends React.ComponentProps<"span"> {
  /** "new-release" swaps the red for the Coming Soon teal. */
  tone?: "new-release" | "primary";
}

/**
 * The round price sticker from the front of a rental tape. Carries short
 * dates and states only ("Fri", "New", "S2") — anything longer won't fit the
 * circle at small sizes.
 */
function RentalSticker({
  children,
  className,
  tone = "primary",
  ...props
}: RentalStickerProps) {
  return (
    <span
      {...props}
      className={cn(
        "font-display inline-flex aspect-square items-center justify-center rounded-full text-center leading-none font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.35)] ring-2 ring-white/70 ring-inset",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-new-release text-background",
        className
      )}
    >
      {children}
    </span>
  );
}

RentalSticker.displayName = "RentalSticker";

export { RentalSticker };
