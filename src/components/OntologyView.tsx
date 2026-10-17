import { useEffect, useMemo, useState } from "react";
import { fetchOntology } from "../api";
import type {
  OntologyClass,
  OntologyDataProperty,
  OntologyPayload,
  OntologyRelationship,
} from "../types";

type Mode = "classes" | "relationships" | "properties";

export function OntologyView() {
  const [data, setData] = useState<OntologyPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("classes");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchOntology()
      .then((p) => {
        setData(p);
        setSelected(p.classes[0]?.name ?? null);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const items: { key: string; label: string; sub?: string }[] = useMemo(() => {
    if (!data) return [];
    if (mode === "classes") {
      return data.classes.map((c) => ({
        key: c.name,
        label: c.label || c.name,
        sub: `${c.properties.length} props · ${c.outgoing.length + c.incoming.length} rels`,
      }));
    }
    if (mode === "relationships") {
      return data.relationships.map((r) => ({
        key: r.type,
        label: r.label || r.type,
        sub: `${r.from.join(", ") || "?"} → ${r.to.join(", ") || "?"}`,
      }));
    }
    return data.properties.map((p) => ({
      key: p.name,
      label: p.label || p.name,
      sub: p.domains.join(", "),
    }));
  }, [data, mode]);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const q = filter.toLowerCase();
    return items.filter(
      (it) =>
        it.key.toLowerCase().includes(q) ||
        it.label.toLowerCase().includes(q) ||
        (it.sub ?? "").toLowerCase().includes(q),
    );
  }, [items, filter]);

  if (err) {
    return (
      <div style={{ padding: 24, color: "#111827" }}>
        <h2>Failed to load ontology</h2>
        <pre style={{ color: "#b91c1c" }}>{err}</pre>
        <p style={{ color: "#374151", lineHeight: 1.55 }}>
          Ensure the ontology has been imported into Neo4j via n10s:
        </p>
        <pre style={preBlock}>
          CALL n10s.graphconfig.init({"{"}handleVocabUris: "IGNORE"{"}"});
          {"\n"}CALL n10s.onto.import.fetch(
          {"\n"}  "file:///ontology/ia_ontology.ttl", "Turtle"
          {"\n"});
        </pre>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 24, color: "#6b7280" }}>Loading ontology…</div>;
  }

  const selectedKey = selected ?? filtered[0]?.key ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <OntologyHeader
        meta={data.meta}
        totals={data.totals}
        mode={mode}
        onMode={(m) => {
          setMode(m);
          const first =
            m === "classes"
              ? data.classes[0]?.name
              : m === "relationships"
              ? data.relationships[0]?.type
              : data.properties[0]?.name;
          setSelected(first ?? null);
          setFilter("");
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          flex: 1,
          minHeight: 0,
          background: "#ffffff",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid #e5e7eb",
            overflowY: "auto",
            background: "#f9fafb",
          }}
        >
          <div style={{ padding: "12px 14px" }}>
            <input
              placeholder={`Filter ${mode}…`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filtered.map((it) => {
              const active = it.key === selectedKey;
              return (
                <li key={it.key}>
                  <button
                    onClick={() => setSelected(it.key)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "9px 14px",
                      background: active ? "#eef2ff" : "transparent",
                      border: "none",
                      color: active ? "#4338ca" : "#374151",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      textAlign: "left",
                      borderLeft: active
                        ? "3px solid #4338ca"
                        : "3px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div>{it.label}</div>
                    {it.sub && (
                      <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                        {it.sub}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>
                No matches.
              </li>
            )}
          </ul>
        </aside>
        <section
          style={{
            overflowY: "auto",
            padding: "24px 28px",
            color: "#111827",
          }}
        >
          {mode === "classes" && renderClassDetail(data, selectedKey)}
          {mode === "relationships" &&
            renderRelationshipDetail(data, selectedKey)}
          {mode === "properties" && renderPropertyDetail(data, selectedKey)}
        </section>
      </div>
    </div>
  );
}

function OntologyHeader({
  meta,
  totals,
  mode,
  onMode,
}: {
  meta: OntologyPayload["meta"];
  totals: OntologyPayload["totals"];
  mode: Mode;
  onMode: (m: Mode) => void;
}) {
  return (
    <div
      style={{
        padding: "14px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          {meta.label || "IA Ontology (n10s)"}
        </div>
        {meta.uri && (
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
            title={meta.uri}
          >
            {meta.uri}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, color: "#6b7280", fontSize: 13 }}>
        <TotalPill label="classes" value={totals.classes} color="#4338ca" />
        <TotalPill label="object properties" value={totals.relationships} color="#0e7490" />
        <TotalPill label="datatype properties" value={totals.properties} color="#b45309" />
      </div>
      <nav style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {(["classes", "relationships", "properties"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => onMode(m)}
            style={{
              background: mode === m ? "#eef2ff" : "transparent",
              color: mode === m ? "#4338ca" : "#6b7280",
              border:
                "1px solid " + (mode === m ? "#c7d2fe" : "#e5e7eb"),
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: mode === m ? 600 : 500,
              textTransform: "capitalize",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </nav>
    </div>
  );
}

function TotalPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 999,
        padding: "3px 10px",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ color: "#374151", fontWeight: 600 }}>
        {value.toLocaleString()}
      </span>
      <span>{label}</span>
    </span>
  );
}

function renderClassDetail(data: OntologyPayload, key: string | null) {
  const cls = data.classes.find((c) => c.name === key);
  if (!cls) return <div style={{ color: "#6b7280" }}>Select a class.</div>;
  return <ClassDetail cls={cls} />;
}

function renderRelationshipDetail(
  data: OntologyPayload,
  key: string | null,
) {
  const rel = data.relationships.find((r) => r.type === key);
  if (!rel) return <div style={{ color: "#6b7280" }}>Select a relationship.</div>;
  return <RelationshipDetail rel={rel} />;
}

function renderPropertyDetail(data: OntologyPayload, key: string | null) {
  const p = data.properties.find((x) => x.name === key);
  if (!p) return <div style={{ color: "#6b7280" }}>Select a property.</div>;
  return <PropertyDetail p={p} />;
}

function ClassDetail({ cls }: { cls: OntologyClass }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <TypeChip color="#4338ca" bg="#eef2ff">
          owl:Class
        </TypeChip>
        <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>{cls.name}</h2>
        {cls.label && cls.label !== cls.name && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>rdfs:label “{cls.label}”</span>
        )}
        <ExportMenu className={cls.name} />
      </div>
      {cls.uri && <UriRow uri={cls.uri} />}
      {cls.comment && (
        <p style={{ marginTop: 14, color: "#374151", lineHeight: 1.55 }}>
          {cls.comment}
        </p>
      )}

      <h3 style={sectionH}>Datatype properties ({cls.properties.length})</h3>
      {cls.properties.length === 0 ? (
        <p style={muted}>No datatype properties on this class.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>name</th>
              <th style={thStyle}>description</th>
            </tr>
          </thead>
          <tbody>
            {cls.properties.map((p) => (
              <tr key={p.name}>
                <td style={tdMono}>{p.name}</td>
                <td style={td}>{p.comment || <em style={muted}>—</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={sectionH}>Outgoing object properties ({cls.outgoing.length})</h3>
      {cls.outgoing.length === 0 ? (
        <p style={muted}>None.</p>
      ) : (
        <ul style={relList}>
          {cls.outgoing.map((r, i) => (
            <li key={`${r.type}-${i}`} style={relRow}>
              <code style={{ color: "#111827" }}>{cls.name}</code>
              <span style={arrow}>—</span>
              <code style={{ color: "#4338ca" }}>[:{r.type}]</code>
              <span style={arrow}>→</span>
              <code style={{ color: "#0e7490" }}>{r.target}</code>
              {r.comment && (
                <span style={{ color: "#6b7280", marginLeft: 10, fontSize: 12 }}>
                  {r.comment}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3 style={sectionH}>Incoming object properties ({cls.incoming.length})</h3>
      {cls.incoming.length === 0 ? (
        <p style={muted}>None.</p>
      ) : (
        <ul style={relList}>
          {cls.incoming.map((r, i) => (
            <li key={`${r.type}-${i}`} style={relRow}>
              <code style={{ color: "#0e7490" }}>{r.source}</code>
              <span style={arrow}>—</span>
              <code style={{ color: "#4338ca" }}>[:{r.type}]</code>
              <span style={arrow}>→</span>
              <code style={{ color: "#111827" }}>{cls.name}</code>
              {r.comment && (
                <span style={{ color: "#6b7280", marginLeft: 10, fontSize: 12 }}>
                  {r.comment}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RelationshipDetail({ rel }: { rel: OntologyRelationship }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <TypeChip color="#0e7490" bg="#ecfeff">
          owl:ObjectProperty
        </TypeChip>
        <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>{rel.type}</h2>
        {rel.label && rel.label !== rel.type && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            rdfs:label “{rel.label}”
          </span>
        )}
      </div>
      {rel.uri && <UriRow uri={rel.uri} />}
      {rel.comment && (
        <p style={{ marginTop: 14, color: "#374151", lineHeight: 1.55 }}>
          {rel.comment}
        </p>
      )}

      <h3 style={sectionH}>Domain → Range</h3>
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "16px 20px",
          flexWrap: "wrap",
        }}
      >
        <LabelStack title="rdfs:domain" values={rel.from} color="#111827" />
        <div style={{ fontSize: 20, color: "#9ca3af" }}>
          — [:{rel.type}] →
        </div>
        <LabelStack title="rdfs:range" values={rel.to} color="#0e7490" />
      </div>
    </div>
  );
}

function PropertyDetail({ p }: { p: OntologyDataProperty }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <TypeChip color="#b45309" bg="#fffbeb">
          owl:DatatypeProperty
        </TypeChip>
        <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>{p.name}</h2>
        {p.label && p.label !== p.name && (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            rdfs:label “{p.label}”
          </span>
        )}
      </div>
      {p.uri && <UriRow uri={p.uri} />}
      {p.comment && (
        <p style={{ marginTop: 14, color: "#374151", lineHeight: 1.55 }}>
          {p.comment}
        </p>
      )}

      <h3 style={sectionH}>Domain(s)</h3>
      {p.domains.length === 0 ? (
        <p style={muted}>—</p>
      ) : (
        <div style={chipRow}>
          {p.domains.map((d) => (
            <span key={d} style={chip("#eef2ff", "#4338ca")}>
              {d}
            </span>
          ))}
        </div>
      )}

      <h3 style={sectionH}>Range</h3>
      {p.ranges.length === 0 ? (
        <p style={muted}>—</p>
      ) : (
        <div style={chipRow}>
          {p.ranges.map((r) => (
            <span key={r} style={chip("#fffbeb", "#b45309")}>
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LabelStack({
  title,
  values,
  color,
}: {
  title: string;
  values: string[];
  color: string;
}) {
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {values.length === 0 ? (
          <em style={muted}>—</em>
        ) : (
          values.map((v) => (
            <code
              key={v}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                color,
                padding: "3px 8px",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {v}
            </code>
          ))
        )}
      </div>
    </div>
  );
}

function ExportMenu({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const download = async (fmt: "turtle" | "rdfxml", ext: string) => {
    setBusy(fmt);
    setErr(null);
    try {
      const url = `/api/schema/ontology/${encodeURIComponent(className)}/export?format=${fmt}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
      }
      const blob = await res.blob();
      const filename = `ia_ontology_${className.replace(/[^A-Za-z0-9_.-]+/g, "_")}.${ext}`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      setOpen(false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ position: "relative", marginLeft: "auto" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        title="Export the ontology triples for this class"
        style={{
          background: open ? "#eef2ff" : "#ffffff",
          color: "#4338ca",
          border: "1px solid #c7d2fe",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowDownIcon />
        Export
        <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 20,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(15,23,42,0.08)",
            minWidth: 220,
            padding: 6,
          }}
        >
          <ExportItem
            onClick={() => download("turtle", "ttl")}
            busy={busy === "turtle"}
            title="Turtle (.ttl)"
            hint="ia: vocabulary, matches ia_ontology.ttl"
          />
          <ExportItem
            onClick={() => download("rdfxml", "rdf")}
            busy={busy === "rdfxml"}
            title="RDF/XML (.rdf)"
            hint="XML serialization"
          />
          {err && (
            <div
              style={{
                color: "#b91c1c",
                fontSize: 12,
                padding: "6px 10px",
                borderTop: "1px solid #f3f4f6",
                marginTop: 4,
              }}
            >
              {err}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExportItem({
  onClick,
  busy,
  title,
  hint,
}: {
  onClick: () => void;
  busy: boolean;
  title: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        borderRadius: 6,
        cursor: busy ? "wait" : "pointer",
        color: "#111827",
        fontSize: 13,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ fontWeight: 600 }}>
        {busy ? "Downloading…" : title}
      </div>
      <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{hint}</div>
    </button>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M6 9l6 6 6-6" />
      <path d="M4 21h16" />
    </svg>
  );
}

function TypeChip({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "ui-monospace, Menlo, monospace",
        textTransform: "none",
      }}
    >
      {children}
    </span>
  );
}

function UriRow({ uri }: { uri: string }) {
  return (
    <div
      style={{
        marginTop: 6,
        color: "#6b7280",
        fontSize: 12,
        fontFamily: "ui-monospace, Menlo, monospace",
        wordBreak: "break-all",
      }}
      title={uri}
    >
      {uri}
    </div>
  );
}

const sectionH: React.CSSProperties = {
  marginTop: 24,
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#6b7280",
};
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 10px",
  color: "#6b7280",
  fontWeight: 500,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "top",
  color: "#374151",
};
const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, Menlo, monospace",
  color: "#b45309",
};
const muted: React.CSSProperties = { color: "#9ca3af" };
const relList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};
const relRow: React.CSSProperties = {
  padding: "6px 0",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  borderBottom: "1px dashed #f3f4f6",
};
const arrow: React.CSSProperties = { color: "#9ca3af" };
const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};
const chip = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  border: `1px solid ${color}33`,
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 13,
  fontFamily: "ui-monospace, Menlo, monospace",
});
const preBlock: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 8,
  fontSize: 12,
  overflowX: "auto",
};
