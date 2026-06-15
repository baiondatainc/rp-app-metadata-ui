import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JourneyEvent, JourneyKind } from "../../types";
import { KIND_ORDER, KIND_STYLE, PANEL_BG, PANEL_BORDER } from "./style";

interface Props {
  events: JourneyEvent[];
}

export function JourneyCharts({ events }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 16,
        marginTop: 18,
      }}
    >
      <ChartCard title="Cumulative Balance">
        <BalanceChart events={events} />
      </ChartCard>
      <ChartCard title="Monthly Activity">
        <ActivityChart events={events} />
      </ChartCard>
      <ChartCard title="Charges by Modality">
        <ModalityChart events={events} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: PANEL_BG,
        border: PANEL_BORDER,
        borderRadius: 12,
        padding: "14px 16px 6px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#9ca3af",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ width: "100%", height: 180 }}>{children}</div>
    </div>
  );
}

// ── Balance chart ────────────────────────────────────────────────────────────
function BalanceChart({ events }: Props) {
  const data = useMemo(() => {
    let bal = 0;
    const out: { ts: string; balance: number }[] = [];
    // Charges add to balance; payments/transactions subtract.
    // We rebuild a running balance over the events as a *qualitative* view.
    const sorted = [...events].sort((a, b) => (a.ts < b.ts ? -1 : 1));
    for (const e of sorted) {
      if (e.kind === "charge" && typeof e.amount === "number") {
        bal += e.amount;
      } else if (e.kind === "transaction" && typeof e.amount === "number") {
        bal -= e.amount;
      } else {
        continue;
      }
      out.push({ ts: e.ts.slice(0, 10), balance: Math.round(bal * 100) / 100 });
    }
    // Sub-sample if huge — keep ~120 points for smooth area
    if (out.length > 120) {
      const step = Math.ceil(out.length / 120);
      return out.filter((_, i) => i % step === 0).concat(out[out.length - 1]);
    }
    return out;
  }, [events]);

  if (data.length === 0) {
    return <EmptyChartMsg label="No financial events in range" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.55} />
            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="ts"
          tick={{ fill: "#6b7280", fontSize: 10 }}
          minTickGap={20}
          stroke="rgba(255,255,255,0.08)"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 10 }}
          stroke="rgba(255,255,255,0.08)"
          tickFormatter={(v) => fmtMoneyShort(v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#9ca3af", fontSize: 11 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "balance"]}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#fbbf24"
          strokeWidth={2}
          fill="url(#balGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Activity chart ───────────────────────────────────────────────────────────
function ActivityChart({ events }: Props) {
  const data = useMemo(() => {
    const buckets = new Map<string, Record<string, number | string>>();
    for (const e of events) {
      const month = e.ts.slice(0, 7);
      const row = buckets.get(month) || ({ month } as Record<string, number | string>);
      row[e.kind] = ((row[e.kind] as number) || 0) + 1;
      buckets.set(month, row);
    }
    const arr = [...buckets.values()].sort((a: any, b: any) =>
      a.month < b.month ? -1 : 1,
    );
    return arr.map((row) => {
      const filled: Record<string, number | string> = { month: row.month };
      for (const k of KIND_ORDER) filled[k] = (row[k] as number) || 0;
      return filled;
    });
  }, [events]);

  if (data.length === 0) {
    return <EmptyChartMsg label="No events in range" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fill: "#6b7280", fontSize: 10 }}
          minTickGap={20}
          stroke="rgba(255,255,255,0.08)"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 10 }}
          stroke="rgba(255,255,255,0.08)"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#9ca3af", fontSize: 11 }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "#9ca3af" }}
          iconType="circle"
          iconSize={8}
        />
        {KIND_ORDER.map((k) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="all"
            fill={KIND_STYLE[k].color}
            name={KIND_STYLE[k].label}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Modality donut ───────────────────────────────────────────────────────────
const MODALITY_PALETTE = [
  "#fbbf24", "#60a5fa", "#34d399", "#a78bfa",
  "#22d3ee", "#f472b6", "#fb923c", "#94a3b8",
];

function ModalityChart({ events }: Props) {
  const data = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const e of events) {
      if (e.kind !== "charge") continue;
      const k = e.label || "(unknown)";
      buckets.set(k, (buckets.get(k) || 0) + (e.amount || 0));
    }
    const arr = [...buckets.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    if (arr.length <= 6) return arr;
    const top = arr.slice(0, 5);
    const other = arr.slice(5).reduce((acc, r) => acc + r.value, 0);
    return [...top, { name: "Other", value: Math.round(other * 100) / 100 }];
  }, [events]);

  const total = data.reduce((s, r) => s + r.value, 0);

  if (data.length === 0) {
    return <EmptyChartMsg label="No charges in range" />;
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={MODALITY_PALETTE[i % MODALITY_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, n: string) => [`$${v.toLocaleString()}`, n]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: "#9ca3af" }}
            iconType="circle"
            iconSize={8}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          left: "29%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
          total
        </div>
        <div style={{ color: "#fde68a", fontSize: 13, fontWeight: 700 }}>
          ${fmtMoneyShort(total)}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function EmptyChartMsg({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#6b7280",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "#11162a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
  color: "#e5e7eb",
};

function fmtMoneyShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return Math.round(n).toString();
}
