import { useMemo, useState } from "react";
import type { LabelMeta, RelationshipMeta, SchemaPayload } from "../types";

interface Props {
  data: SchemaPayload;
  mode: "labels" | "relationships";
}

export function SchemaView({ data, mode }: Props) {
  const [selected, setSelected] = useState<string | null>(
    mode === "labels" ? data.labels[0]?.name ?? null : data.relationships[0]?.type ?? null,
  );
  const [filter, setFilter] = useState("");

  // Reset selection when switching mode
  const items: (LabelMeta | RelationshipMeta)[] =
    mode === "labels" ? data.labels : data.relationships;

  const selectedKey = (it: LabelMeta | RelationshipMeta) =>
    "name" in it ? it.name : it.type;

  const filtered = useMemo(() => {
    if (!filter) return items;
    const q = filter.toLowerCase();
    return items.filter((it) => selectedKey(it).toLowerCase().includes(q));
  }, [items, filter]);

  const current = items.find((it) => selectedKey(it) === selected) ?? filtered[0] ?? null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        height: "100%",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          background: "#11162a",
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
              background: "#0b1023",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 13,
            }}
          />
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {filtered.map((it) => {
            const key = selectedKey(it);
            const active = current && selectedKey(current) === key;
            const count = it.count;
            return (
              <li key={key}>
                <button
                  onClick={() => setSelected(key)}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "9px 14px",
                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                    border: "none",
                    color: active ? "#c7d2fe" : "#d1d5db",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    textAlign: "left",
                    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
                  }}
                >
                  <span style={{ flex: 1 }}>{key}</span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    {count.toLocaleString()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <section style={{ overflowY: "auto", padding: "24px 28px" }}>
        {current ? (
          mode === "labels" ? (
            <LabelDetail item={current as LabelMeta} relationships={data.relationships} />
          ) : (
            <RelationshipDetail item={current as RelationshipMeta} />
          )
        ) : (
          <div style={{ color: "#9ca3af" }}>No matches.</div>
        )}
      </section>
    </div>
  );
}

function LabelDetail({
  item,
  relationships,
}: {
  item: LabelMeta;
  relationships: RelationshipMeta[];
}) {
  const inbound = relationships.filter((r) => r.to.includes(item.name));
  const outbound = relationships.filter((r) => r.from.includes(item.name));
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 22 }}>{item.name}</h2>
      <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>
        {item.count.toLocaleString()} nodes
        {item.pii.length > 0 && (
          <span style={{ marginLeft: 10, color: "#fda4af" }}>
            • PII: {item.pii.join(", ")}
          </span>
        )}
      </div>
      {item.description && (
        <p style={{ marginTop: 14, color: "#d1d5db", lineHeight: 1.55 }}>{item.description}</p>
      )}

      <h3 style={sectionH}>Properties</h3>
      {item.properties.length === 0 ? (
        <p style={muted}>No annotated properties in the data dictionary.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>name</th>
              <th style={thStyle}>description</th>
              <th style={thStyle}>values</th>
            </tr>
          </thead>
          <tbody>
            {item.properties.map((p) => (
              <tr key={p.name}>
                <td style={tdMono}>{p.name}</td>
                <td style={td}>{p.description || <em style={muted}>—</em>}</td>
                <td style={td}>
                  {Object.keys(p.values).length === 0 ? (
                    <em style={muted}>—</em>
                  ) : (
                    Object.entries(p.values).map(([code, label]) => (
                      <div key={code}>
                        <code>{code}</code> → {label}
                      </div>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={sectionH}>Relationships</h3>
      <RelGroup label="outgoing" items={outbound} dir="out" thisLabel={item.name} />
      <RelGroup label="incoming" items={inbound} dir="in" thisLabel={item.name} />
    </div>
  );
}

function RelGroup({
  label,
  items,
  dir,
  thisLabel,
}: {
  label: string;
  items: RelationshipMeta[];
  dir: "in" | "out";
  thisLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p style={muted}>
        No {label} relationships.
      </p>
    );
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((r) => {
          const others = dir === "out" ? r.to : r.from;
          return (
            <li key={r.type + dir} style={{ padding: "4px 0", fontSize: 13 }}>
              <code>{thisLabel}</code>{" "}
              {dir === "out" ? "—" : "—"} <code style={{ color: "#a5b4fc" }}>[{r.type}]</code>{" "}
              {dir === "out" ? "→" : "←"}{" "}
              {others.length > 0 ? (
                others.map((l) => <code key={l}>{l}</code>).reduce(
                  (acc, el, idx) => (idx === 0 ? [el] : [...acc, <span key={`s${idx}`}> | </span>, el]),
                  [] as React.ReactNode[],
                )
              ) : (
                <em style={muted}>—</em>
              )}{" "}
              <span style={{ color: "#6b7280", fontSize: 12 }}>
                ({r.count.toLocaleString()})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RelationshipDetail({ item }: { item: RelationshipMeta }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 22 }}>{item.type}</h2>
      <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>
        {item.count.toLocaleString()} edges
      </div>
      {item.description && (
        <p style={{ marginTop: 14, color: "#d1d5db", lineHeight: 1.55 }}>{item.description}</p>
      )}
      <h3 style={sectionH}>Endpoints (observed in the graph)</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>from</th>
            <th style={thStyle}>type</th>
            <th style={thStyle}>to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>
              {item.from.length === 0 ? (
                <em style={muted}>—</em>
              ) : (
                item.from.map((l) => <div key={l}><code>{l}</code></div>)
              )}
            </td>
            <td style={tdMono}>{item.type}</td>
            <td style={td}>
              {item.to.length === 0 ? (
                <em style={muted}>—</em>
              ) : (
                item.to.map((l) => <div key={l}><code>{l}</code></div>)
              )}
            </td>
          </tr>
        </tbody>
      </table>
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
  color: "#9ca3af",
};
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  padding: "8px 10px",
  color: "#9ca3af",
  fontWeight: 500,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "top",
};
const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, Menlo, monospace",
  color: "#fde68a",
};
const muted: React.CSSProperties = { color: "#6b7280" };
