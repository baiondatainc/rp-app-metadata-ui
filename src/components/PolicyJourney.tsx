import { useEffect, useMemo, useState } from "react";
import { fetchPolicyJourney, fetchPolicySample } from "../api";
import type {
  JourneyKind,
  PolicyJourneyPayload,
  PolicySample,
} from "../types";
import { KIND_ORDER, KIND_STYLE, PANEL_BG, PANEL_BORDER, PANEL_SHADOW } from "./journey/style";
import { JourneyCharts } from "./journey/Charts";
import { DateRangePresets, applyRange, type RangePreset } from "./journey/DateRange";
import { Timeline } from "./journey/Timeline";

export function PolicyJourney() {
  const [samples, setSamples] = useState<PolicySample[] | null>(null);
  const [sampleErr, setSampleErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journey, setJourney] = useState<PolicyJourneyPayload | null>(null);
  const [journeyErr, setJourneyErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [inputId, setInputId] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<JourneyKind>>(new Set(KIND_ORDER));
  const [range, setRange] = useState<RangePreset>("all");

  useEffect(() => {
    fetchPolicySample(50)
      .then((rows) => {
        setSamples(rows);
        if (rows.length > 0) setSelectedId(rows[0].id);
      })
      .catch((e) => setSampleErr(String(e)));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setJourneyErr(null);
    fetchPolicyJourney(selectedId)
      .then(setJourney)
      .catch((e) => setJourneyErr(String(e)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const kindFiltered = useMemo(
    () => (journey?.events ?? []).filter((e) => activeKinds.has(e.kind)),
    [journey, activeKinds],
  );
  const dateFiltered = useMemo(
    () => applyRange(kindFiltered, range),
    [kindFiltered, range],
  );

  const toggleKind = (k: JourneyKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      if (next.size === 0) next.add(k);
      return next;
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: pickerOpen ? "320px 1fr" : "0 1fr",
        height: "100%",
        transition: "grid-template-columns 0.18s ease",
        background: "#ffffff",
      }}
    >
      <PolicyPicker
        samples={samples}
        sampleErr={sampleErr}
        selectedId={selectedId}
        inputId={inputId}
        onInputChange={setInputId}
        onSubmitInput={() => inputId.trim() && setSelectedId(inputId.trim())}
        onSelect={setSelectedId}
      />

      <section style={{ position: "relative", overflow: "auto", background: "#ffffff" }}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          title={pickerOpen ? "Hide picker" : "Show picker"}
          style={{
            position: "sticky",
            top: 16,
            left: 12,
            zIndex: 4,
            background: "#ffffff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            margin: 12,
            boxShadow: PANEL_SHADOW,
          }}
        >
          {pickerOpen ? "‹ collapse" : "› policies"}
        </button>

        <div style={{ padding: "0 28px 28px" }}>
          {journeyErr && <div style={{ color: "#b91c1c", padding: 18 }}>{journeyErr}</div>}
          {loading && (
            <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}>
              <div className="pulse" style={{ display: "inline-block" }}>
                Loading journey…
              </div>
            </div>
          )}
          {!loading && journey && (
            <>
              <PolicyHeaderCard payload={journey} />
              <JourneyCharts events={dateFiltered} />
              <FilterBar
                journey={journey}
                activeKinds={activeKinds}
                onToggle={toggleKind}
                range={range}
                onRangeChange={setRange}
                totalEvents={kindFiltered.length}
                filteredEvents={dateFiltered.length}
              />
              <Timeline events={dateFiltered} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Policy picker ───────────────────────────────────────────────────────────

function PolicyPicker({
  samples,
  sampleErr,
  selectedId,
  inputId,
  onInputChange,
  onSubmitInput,
  onSelect,
}: {
  samples: PolicySample[] | null;
  sampleErr: string | null;
  selectedId: string | null;
  inputId: string;
  onInputChange: (v: string) => void;
  onSubmitInput: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside
      style={{
        borderRight: "1px solid #e5e7eb",
        background: "#f9fafb",
        overflow: "auto",
      }}
    >
      <div style={{ padding: 14 }}>
        <input
          value={inputId}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmitInput()}
          placeholder="Enter policy ID"
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <div style={{ marginTop: 12, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
          or pick from top policies by premium
        </div>
      </div>
      {sampleErr && <div style={{ padding: 14, color: "#b91c1c", fontSize: 13 }}>{sampleErr}</div>}
      {samples && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {samples.map((s) => {
            const active = s.id === selectedId;
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    width: "100%",
                    padding: "10px 14px",
                    background: active ? "#eef2ff" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid #4338ca" : "3px solid transparent",
                    color: active ? "#4338ca" : "#374151",
                    textAlign: "left",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "#b45309" }}>
                    {s.policy_number || s.id}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: 11.5 }}>
                    {(s.line_of_business || "—")} · {(s.policy_status || "—")} · GWP ${fmtMoneyShort(s.gwp)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

// ── Policy header card ──────────────────────────────────────────────────────

function PolicyHeaderCard({ payload }: { payload: PolicyJourneyPayload }) {
  const p = payload.policy;
  const statusColor = p.is_cancelled ? "#b91c1c" : p.is_active ? "#047857" : "#525252";
  return (
    <div
      style={{
        background: PANEL_BG,
        border: PANEL_BORDER,
        borderRadius: 12,
        padding: "18px 22px",
        marginTop: 16,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 14 }}>
        <h2 style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 20, color: "#b45309" }}>
          {p.policy_number || p.policy_id}
        </h2>
        <span
          style={{
            color: statusColor,
            background: p.is_cancelled ? "#fee2e2" : p.is_active ? "#d1fae5" : "#f5f5f5",
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {p.policy_status || (p.is_cancelled ? "cancelled" : p.is_active ? "active" : "inactive")}
        </span>
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {[p.line_of_business, p.policy_type].filter(Boolean).join(" · ") || "—"}
        </span>
        {p.insurer.length > 0 && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            · insurer: {p.insurer.join(", ")}
          </span>
        )}
        {p.channels.length > 0 && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            · via: {p.channels.join(", ")}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 14 }}>
        <Stat label="issue" value={fmtDate(p.issue_date)} />
        <Stat label="expiry" value={fmtDate(p.expiry_date)} />
        <Stat label="renewals" value={String(p.renewal_count)} />
        <Stat label="events" value={String(p.event_count)} />
        <Stat label="claims" value={`${p.claim_count} (${p.open_claim_count} open)`} />
        <Stat label="GWP" value={`$${fmtMoney(p.gross_written_premium)}`} />
        <Stat label="commission" value={`$${fmtMoney(p.commission)}`} />
        <Stat label="total claimed" value={`$${fmtMoney(p.total_claimed)}`} accent="#b45309" />
        <Stat label="total paid" value={`$${fmtMoney(p.total_paid)}`} accent="#047857" />
        <Stat label="outstanding" value={`$${fmtMoney(p.total_outstanding)}`} accent={p.total_outstanding > 0 ? "#b45309" : undefined} />
        <Stat label="loss ratio" value={`${p.loss_ratio_pct.toFixed(1)}%`} accent={p.loss_ratio_pct > 100 ? "#b91c1c" : p.loss_ratio_pct > 70 ? "#b45309" : "#047857"} />
        {p.is_reinsured && p.reinsurers.length > 0 && (
          <Stat label="reinsured by" value={p.reinsurers.join(", ")} />
        )}
      </div>
      {p.is_cancelled && p.cancellation_reason && (
        <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 12 }}>
          Cancelled {fmtDate(p.cancellation_date)} · {p.cancellation_reason}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ color: "#9ca3af", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: accent ?? "#111827", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── Filter bar (kind chips + date range) ────────────────────────────────────

function FilterBar({
  journey,
  activeKinds,
  onToggle,
  range,
  onRangeChange,
  totalEvents,
  filteredEvents,
}: {
  journey: PolicyJourneyPayload;
  activeKinds: Set<JourneyKind>;
  onToggle: (k: JourneyKind) => void;
  range: RangePreset;
  onRangeChange: (p: RangePreset) => void;
  totalEvents: number;
  filteredEvents: number;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        marginTop: 22,
        padding: "14px 16px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderRadius: 10,
        border: PANEL_BORDER,
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        zIndex: 3,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {KIND_ORDER.map((k) => {
          const meta = KIND_STYLE[k];
          const n = journey.counts[k] ?? 0;
          const on = activeKinds.has(k);
          return (
            <button
              key={k}
              onClick={() => onToggle(k)}
              style={{
                background: on ? meta.bg : "#ffffff",
                color: on ? meta.color : "#9ca3af",
                border: "1px solid " + (on ? meta.color : "#e5e7eb"),
                borderRadius: 8,
                padding: "5px 11px",
                fontSize: 12,
                fontWeight: 500,
                transition: "all 0.12s ease",
              }}
            >
              {meta.icon} {meta.label} · {n}
            </button>
          );
        })}
      </div>
      <div style={{ marginLeft: "auto" }}>
        <DateRangePresets
          preset={range}
          onChange={onRangeChange}
          totalEvents={totalEvents}
          filteredEvents={filteredEvents}
        />
      </div>
    </div>
  );
}

function fmtMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMoneyShort(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return Math.round(v).toString();
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return s.slice(0, 10);
}
