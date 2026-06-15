import { useEffect, useMemo, useState } from "react";
import { fetchPatientJourney, fetchPatientSample } from "../api";
import type {
  JourneyEvent,
  JourneyKind,
  PatientJourneyPayload,
  PatientSample,
} from "../types";
import { KIND_ORDER, KIND_STYLE, PANEL_BG, PANEL_BORDER } from "./journey/style";
import { JourneyCharts } from "./journey/Charts";
import { DateRangePresets, applyRange, type RangePreset } from "./journey/DateRange";
import { Timeline } from "./journey/Timeline";

export function PatientJourney() {
  const [samples, setSamples] = useState<PatientSample[] | null>(null);
  const [sampleErr, setSampleErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journey, setJourney] = useState<PatientJourneyPayload | null>(null);
  const [journeyErr, setJourneyErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [inputId, setInputId] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<JourneyKind>>(new Set(KIND_ORDER));
  const [range, setRange] = useState<RangePreset>("all");

  useEffect(() => {
    fetchPatientSample(50)
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
    fetchPatientJourney(selectedId)
      .then(setJourney)
      .catch((e) => setJourneyErr(String(e)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // ── derived data ──────────────────────────────────────────────────────────
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
      if (next.size === 0) next.add(k); // never empty
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
      }}
    >
      <PatientPicker
        samples={samples}
        sampleErr={sampleErr}
        selectedId={selectedId}
        inputId={inputId}
        onInputChange={setInputId}
        onSubmitInput={() => inputId.trim() && setSelectedId(inputId.trim())}
        onSelect={setSelectedId}
      />

      <section style={{ position: "relative", overflow: "auto" }}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          title={pickerOpen ? "Hide picker" : "Show picker"}
          style={{
            position: "sticky",
            top: 16,
            left: 12,
            zIndex: 4,
            background: "#1f2540",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            margin: 12,
          }}
        >
          {pickerOpen ? "‹ collapse" : "› patients"}
        </button>

        <div style={{ padding: "0 28px 28px" }}>
          {journeyErr && <div style={{ color: "#fca5a5", padding: 18 }}>{journeyErr}</div>}
          {loading && (
            <div style={{ color: "#9ca3af", padding: 40, textAlign: "center" }}>
              <div className="pulse" style={{ display: "inline-block" }}>
                Loading journey…
              </div>
            </div>
          )}
          {!loading && journey && (
            <>
              <PatientHeaderCard payload={journey} />
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

// ── Patient picker ──────────────────────────────────────────────────────────

function PatientPicker({
  samples,
  sampleErr,
  selectedId,
  inputId,
  onInputChange,
  onSubmitInput,
  onSelect,
}: {
  samples: PatientSample[] | null;
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
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "#11162a",
        overflow: "auto",
      }}
    >
      <div style={{ padding: 14 }}>
        <input
          value={inputId}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmitInput()}
          placeholder='Enter patient ID (e.g. "SAPA:1000102")'
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "#0b1023",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <div style={{ marginTop: 12, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
          or pick from highest-balance patients
        </div>
      </div>
      {sampleErr && <div style={{ padding: 14, color: "#fca5a5", fontSize: 13 }}>{sampleErr}</div>}
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
                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
                    color: active ? "#c7d2fe" : "#d1d5db",
                    textAlign: "left",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "#fde68a" }}>{s.id}</span>
                  <span style={{ color: "#9ca3af", fontSize: 11.5 }}>
                    {(s.state || "—")} · {(s.payor_cohort || "—")} · ${fmtMoney(s.balance)}
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

// ── Patient header card ─────────────────────────────────────────────────────

function PatientHeaderCard({ payload }: { payload: PatientJourneyPayload }) {
  const p = payload.patient;
  return (
    <div
      style={{
        background: PANEL_BG,
        border: PANEL_BORDER,
        borderRadius: 12,
        padding: "18px 22px",
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 14 }}>
        <h2 style={{ margin: 0, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 20, color: "#fde68a" }}>
          {p.patient_id}
        </h2>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>
          {[p.city, p.state].filter(Boolean).join(", ") || "—"}
        </span>
        {p.practices.length > 0 && (
          <span style={{ color: "#9ca3af", fontSize: 13 }}>
            · practice: {p.practices.join(", ")}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 14 }}>
        <Stat label="payor cohort" value={p.payor_cohort || "—"} />
        <Stat label="call tier" value={p.call_tier || "—"} />
        <Stat label="carrier" value={p.carrier_name || "—"} />
        <Stat label="visits" value={String(p.visit_count)} />
        <Stat label="charges" value={String(p.charge_count)} />
        <Stat label="statements" value={String(p.statement_count)} />
        <Stat label="total charged" value={`$${fmtMoney(p.total_charged)}`} />
        <Stat label="total paid" value={`$${fmtMoney(p.total_paid)}`} accent="#34d399" />
        <Stat label="outstanding balance" value={`$${fmtMoney(p.outstanding_balance)}`} accent="#fbbf24" />
        <Stat label="bad debt" value={`$${fmtMoney(p.adj_bad_debt)}`} accent={p.adj_bad_debt > 0 ? "#fca5a5" : undefined} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: accent ?? "#e5e7eb", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
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
  journey: PatientJourneyPayload;
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
        background: "rgba(15,19,32,0.85)",
        backdropFilter: "blur(8px)",
        borderRadius: 10,
        border: PANEL_BORDER,
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        zIndex: 3,
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
                background: on ? meta.bg : "transparent",
                color: on ? meta.color : "#6b7280",
                border: "1px solid " + (on ? meta.color : "rgba(255,255,255,0.1)"),
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
