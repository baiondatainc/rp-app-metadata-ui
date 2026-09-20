import { useEffect, useState } from "react";
import { fetchSchema } from "./api";
import type { SchemaPayload } from "./types";
import { SchemaView } from "./components/SchemaView";
import { GraphView } from "./components/GraphView";
import { PolicyJourney } from "./components/PolicyJourney";

type Tab = "labels" | "relationships" | "graph" | "journey";

export default function App() {
  const [data, setData] = useState<SchemaPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("labels");

  useEffect(() => {
    fetchSchema().then(setData).catch((e) => setErr(String(e)));
  }, []);

  if (err) {
    return (
      <div style={{ padding: 24, color: "#111827" }}>
        <h2>Failed to load schema</h2>
        <pre style={{ color: "#b91c1c" }}>{err}</pre>
        <p>
          Make sure the agent is reachable at <code>/api/schema</code>. In dev,
          Vite proxies <code>/api</code> to <code>http://localhost:8001</code>.
        </p>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 24, color: "#6b7280" }}>Loading schema…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#ffffff" }}>
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
          display: "flex",
          alignItems: "baseline",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: -0.2, color: "#111827" }}>
          IA Knowledge Graph &mdash; Schema
        </h1>
        <Totals
          labels={data.totals.labels}
          relationships={data.totals.relationships}
          nodes={data.totals.nodes}
          edges={data.totals.edges}
        />
        <nav style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {(["labels", "relationships", "graph", "journey"] as Tab[]).map((t) => (
            <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === "journey" ? "Policy journey" : t}
            </TabButton>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        {tab === "graph" ? (
          <GraphView graph={data.graph} />
        ) : tab === "journey" ? (
          <PolicyJourney />
        ) : (
          <SchemaView data={data} mode={tab} />
        )}
      </main>
    </div>
  );
}

function Totals(props: { labels: number; relationships: number; nodes: number; edges: number }) {
  const items: [string, number][] = [
    ["labels", props.labels],
    ["relationships", props.relationships],
    ["nodes", props.nodes],
    ["edges", props.edges],
  ];
  return (
    <div style={{ display: "flex", gap: 14, color: "#6b7280", fontSize: 13 }}>
      {items.map(([k, v]) => (
        <span key={k}>
          {k}: <span style={{ color: "#111827", fontWeight: 600 }}>{v.toLocaleString()}</span>
        </span>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#eef2ff" : "transparent",
        color: active ? "#4338ca" : "#6b7280",
        border: "1px solid " + (active ? "#c7d2fe" : "#e5e7eb"),
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        textTransform: "capitalize",
      }}
    >
      {children}
    </button>
  );
}
