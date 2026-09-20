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
import type { JourneyEvent } from "../../types";
import { KIND_ORDER, KIND_STYLE, PANEL_BG, PANEL_BORDER, PANEL_SHADOW } from "./style";

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
      <ChartCard title="Cumulative Claim Exposure">
        <ExposureChart events={events} />
      </ChartCard>
      <ChartCard title="Monthly Activity">
        <ActivityChart events={events} />
      </ChartCard>
      <ChartCard title="Claim Payouts by Status">
        <ClaimStatusChart events={events} />
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
        boxShadow: PANEL_SHADOW,
      }}
    >
      <div
        style={{
          color: "#6b7280",
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

// ── Exposure chart ───────────────────────────────────────────────────────────
// Cumulative claimed amount (net of payments) over time — a running
// "outstanding exposure" line for the policy.
function ExposureChart({ events }: Props) {
  const data = useMemo(() => {
    let bal = 0;
    const out: { ts: string; exposure: number }[] = [];
    const sorted = [...events].sort((a, b) => (a.ts < b.ts ? -1 : 1));
    for (const e of sorted) {
      if (e.kind === "claim" && typeof e.amount === "number") {
        bal += e.amount;
      } else if (e.kind === "payment" && typeof e.amount === "number") {
        bal -= e.amount;
      } else {
        continue;
      }
      out.push({ ts: e.ts.slice(0, 10), exposure: Math.round(bal * 100) / 100 });
    }
    if (out.length > 120) {
      const step = Math.ceil(out.length / 120);
      return out.filter((_, i) => i % step === 0).concat(out[out.length - 1]);
    }
    return out;
  }, [events]);

  if (data.length === 0) {
    return <EmptyChartMsg label="No claims or payments in range" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b45309" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#b45309" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="ts"
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          minTickGap={20}
          stroke="#e5e7eb"
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          stroke="#e5e7eb"
          tickFormatter={(v) => fmtMoneyShort(v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#6b7280", fontSize: 11 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "exposure"]}
        />
        <Area
          type="monotone"
          dataKey="exposure"
          stroke="#b45309"
          strokeWidth={2}
          fill="url(#expGrad)"
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
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          minTickGap={20}
          stroke="#e5e7eb"
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          stroke="#e5e7eb"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#6b7280", fontSize: 11 }}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "#6b7280" }}
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

// ── Claim status donut ───────────────────────────────────────────────────────
// Sum of claim amounts grouped by claim status (label field on claim events).
const STATUS_PALETTE = [
  "#4338ca", "#b45309", "#047857", "#7c3aed",
  "#0369a1", "#b91c1c", "#525252", "#9333ea",
];

function ClaimStatusChart({ events }: Props) {
  const data = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const e of events) {
      if (e.kind !== "claim") continue;
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
    return <EmptyChartMsg label="No claims in range" />;
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
              <Cell key={i} fill={STATUS_PALETTE[i % STATUS_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, n: string) => [`$${v.toLocaleString()}`, n]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: "#6b7280" }}
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
        <div style={{ color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
          total
        </div>
        <div style={{ color: "#b45309", fontSize: 13, fontWeight: 700 }}>
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
        color: "#9ca3af",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 12,
  color: "#111827",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
};

function fmtMoneyShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return Math.round(n).toString();
}
