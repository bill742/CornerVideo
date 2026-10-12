"use client";

interface TabButtonProps {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}

/** Pill used for the browse tabs and the watchlist filters. */
function TabButton({ active, icon, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

TabButton.displayName = "TabButton";

export { TabButton };
