import type { JourneyEvent } from "../../types";

export type RangePreset = "all" | "5y" | "2y" | "1y" | "6m" | "3m" | "1m";

interface Props {
  preset: RangePreset;
  onChange: (p: RangePreset) => void;
  totalEvents: number;
  filteredEvents: number;
}

export function DateRangePresets({ preset, onChange, totalEvents, filteredEvents }: Props) {
  const items: { id: RangePreset; label: string }[] = [
    { id: "all", label: "All" },
    { id: "5y", label: "5y" },
    { id: "2y", label: "2y" },
    { id: "1y", label: "1y" },
    { id: "6m", label: "6m" },
    { id: "3m", label: "3m" },
    { id: "1m", label: "1m" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <span style={{ color: "#6b7280", fontSize: 11, marginRight: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
        range
      </span>
      {items.map(({ id, label }) => {
        const active = preset === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              background: active ? "#3730a3" : "transparent",
              color: active ? "white" : "#9ca3af",
              border: "1px solid " + (active ? "#3730a3" : "rgba(255,255,255,0.1)"),
              borderRadius: 6,
              padding: "3px 9px",
              fontSize: 11.5,
              fontWeight: active ? 600 : 400,
            }}
          >
            {label}
          </button>
        );
      })}
      <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 8 }}>
        {filteredEvents.toLocaleString()} / {totalEvents.toLocaleString()} events
      </span>
    </div>
  );
}

export function applyRange(events: JourneyEvent[], preset: RangePreset): JourneyEvent[] {
  if (preset === "all" || events.length === 0) return events;

  // Compute the latest event date and cut from that.
  const latest = events.reduce((max, e) => (e.ts > max ? e.ts : max), events[0].ts);
  const latestMs = Date.parse(latest);
  if (Number.isNaN(latestMs)) return events;

  const days: Record<Exclude<RangePreset, "all">, number> = {
    "5y": 5 * 365,
    "2y": 2 * 365,
    "1y": 365,
    "6m": 183,
    "3m": 92,
    "1m": 31,
  };
  const cutoff = latestMs - days[preset] * 86_400_000;
  return events.filter((e) => Date.parse(e.ts) >= cutoff);
}
