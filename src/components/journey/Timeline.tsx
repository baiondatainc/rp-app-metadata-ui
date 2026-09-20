import { useMemo, useState } from "react";
import type { JourneyEvent } from "../../types";
import { KIND_STYLE } from "./style";

interface Props {
  events: JourneyEvent[];
}

export function Timeline({ events }: Props) {
  const [pinned, setPinned] = useState<string | null>(null);
  const grouped = useMemo(() => groupByMonth(events), [events]);
  const maxAmount = useMemo(
    () => events.reduce((m, e) => Math.max(m, Math.abs(e.amount || 0)), 0),
    [events],
  );

  if (grouped.length === 0) {
    return (
      <div style={{ color: "#6b7280", padding: "32px 12px" }}>
        No events to show. Try a wider date range or different event types.
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {grouped.map(({ key, items }) => (
        <div key={key} style={{ marginBottom: 22 }}>
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "#ffffff",
              padding: "8px 4px",
              color: "#6b7280",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              zIndex: 1,
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <span>{key}</span>
            <span style={{ color: "#9ca3af", fontSize: 11 }}>
              {items.length} event{items.length === 1 ? "" : "s"}
            </span>
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, borderLeft: "1px solid #e5e7eb" }}>
            {items.map((e) => (
              <EventRow
                key={`${e.kind}:${e.id}:${e.ts}`}
                ev={e}
                maxAmount={maxAmount}
                pinned={pinned === eventKey(e)}
                onClick={() => setPinned((p) => (p === eventKey(e) ? null : eventKey(e)))}
              />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function eventKey(e: JourneyEvent): string {
  return `${e.kind}:${e.id}:${e.ts}`;
}

function EventRow({
  ev,
  maxAmount,
  pinned,
  onClick,
}: {
  ev: JourneyEvent;
  maxAmount: number;
  pinned: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const meta = KIND_STYLE[ev.kind];
  const date = ev.ts ? ev.ts.slice(0, 10) : "—";
  const time = ev.ts && ev.ts.length >= 16 ? ev.ts.slice(11, 16) : "";
  const hasAmount = typeof ev.amount === "number" && ev.amount !== 0;
  const barWidth = hasAmount && maxAmount > 0 ? (Math.abs(ev.amount!) / maxAmount) * 100 : 0;

  return (
    <li
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        padding: "10px 16px 10px 22px",
        display: "grid",
        gridTemplateColumns: "118px 38px 1fr 150px",
        gap: 12,
        alignItems: "center",
        fontSize: 13,
        background: pinned
          ? "#eef2ff"
          : hover
            ? "#f9fafb"
            : "transparent",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.12s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: -6,
          top: 17,
          width: 11,
          height: 11,
          borderRadius: 11,
          background: meta.color,
          border: "2px solid #ffffff",
          boxShadow: pinned ? `0 0 0 4px ${meta.bg}` : "none",
          transition: "box-shadow 0.15s ease",
        }}
      />
      <span style={{ color: "#6b7280", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
        {date}
        {time && <span style={{ color: "#9ca3af", marginLeft: 4 }}>{time}</span>}
      </span>
      <span
        title={meta.label}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          background: meta.bg,
          color: meta.color,
          fontSize: 14,
        }}
      >
        {meta.icon}
      </span>
      <span style={{ color: "#111827", minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{ev.label}</span>
        {ev.detail && (
          <span
            style={{
              color: "#6b7280",
              marginLeft: 8,
              display: "inline-block",
              maxWidth: 360,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
            }}
          >
            · {ev.detail}
          </span>
        )}
        {pinned && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 12,
              color: "#374151",
              fontFamily: "ui-monospace, Menlo, monospace",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: 12,
              rowGap: 3,
            }}
          >
            <span style={{ color: "#9ca3af" }}>kind</span><span>{ev.kind}</span>
            <span style={{ color: "#9ca3af" }}>timestamp</span><span>{ev.ts}</span>
            <span style={{ color: "#9ca3af" }}>id</span><span>{ev.id}</span>
            {ev.detail && (<><span style={{ color: "#9ca3af" }}>detail</span><span style={{ whiteSpace: "normal" }}>{ev.detail}</span></>)}
            {hasAmount && (<><span style={{ color: "#9ca3af" }}>amount</span><span>${fmtMoney(ev.amount!)}</span></>)}
          </div>
        )}
      </span>
      <span style={{ textAlign: "right", position: "relative" }}>
        <span
          style={{
            color: meta.color,
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 13,
            fontWeight: hasAmount ? 600 : 400,
          }}
        >
          {hasAmount ? `$${fmtMoney(ev.amount!)}` : ""}
        </span>
        {hasAmount && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: 0,
              bottom: -6,
              height: 3,
              width: `${barWidth}%`,
              background: meta.color,
              opacity: 0.35,
              borderRadius: 2,
            }}
          />
        )}
      </span>
    </li>
  );
}

function groupByMonth(events: JourneyEvent[]): { key: string; items: JourneyEvent[] }[] {
  const buckets = new Map<string, JourneyEvent[]>();
  for (const e of events) {
    const key = e.ts ? e.ts.slice(0, 7) : "unknown";
    const arr = buckets.get(key);
    if (arr) arr.push(e);
    else buckets.set(key, [e]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, items]) => ({ key: formatMonth(key), items }));
}

function formatMonth(yyyymm: string): string {
  if (yyyymm === "unknown") return "Unknown date";
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const name = new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long" });
  return `${name} ${y}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
