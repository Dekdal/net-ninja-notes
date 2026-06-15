import { cn } from "@/lib/utils";
import { ZONES, type Zone } from "@/lib/scout/constants";

type Counts = Partial<Record<Zone, number>>;

export function GoalMap({
  selected,
  onSelect,
  heat,
  heatLabel = "arremessos",
  maxValue,
  showCounts = false,
  size = "lg",
}: {
  selected?: Zone | null;
  onSelect?: (z: Zone) => void;
  heat?: Counts;
  heatLabel?: string;
  maxValue?: number;
  showCounts?: boolean;
  size?: "sm" | "lg";
}) {
  const max = maxValue ?? Math.max(1, ...Object.values(heat ?? {}));
  return (
    <div className="w-full">
      <div className={cn(
        "grid grid-cols-3 grid-rows-3 gap-1.5 rounded-xl border-[6px] border-primary bg-gradient-to-br from-primary/5 to-accent/5 p-2 shadow-inner",
        size === "lg" ? "aspect-[4/3]" : "aspect-[4/3] max-w-xs",
      )}>
        {ZONES.map((z) => {
          const v = heat?.[z] ?? 0;
          const intensity = max > 0 ? v / max : 0;
          const isSelected = selected === z;
          return (
            <button
              key={z}
              type="button"
              onClick={() => onSelect?.(z)}
              className={cn(
                "relative flex items-center justify-center rounded-md border border-border bg-card font-display font-bold transition-all",
                onSelect && "hover:scale-[1.03] hover:border-accent active:scale-95 cursor-pointer",
                !onSelect && "cursor-default",
                isSelected && "ring-4 ring-accent",
                size === "lg" ? "text-xl" : "text-sm",
              )}
              style={
                heat
                  ? {
                      backgroundColor: `color-mix(in oklab, var(--color-accent) ${intensity * 70}%, var(--color-card))`,
                      color: intensity > 0.5 ? "white" : undefined,
                    }
                  : undefined
              }
              aria-label={`Zona ${z}${heat ? `, ${v} ${heatLabel}` : ""}`}
            >
              <span className="opacity-70">{z}</span>
              {showCounts && heat && v > 0 ? (
                <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                  {v}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
