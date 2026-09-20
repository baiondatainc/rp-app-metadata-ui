import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphEdge, GraphNode } from "../types";

interface Props {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
}

// Stable color per label so the graph reads at a glance.
// Tuned for legibility on a light background.
const PALETTE = [
  "#2563eb", "#059669", "#b45309", "#dc2626", "#7c3aed",
  "#0891b2", "#c2410c", "#db2777", "#65a30d", "#a21caf",
  "#475569", "#e11d48", "#0e7490", "#a16207", "#4d7c0f", "#6d28d9",
];

function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function GraphView({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Memoise so ForceGraph doesn't see a new object every render.
  const data = useMemo(() => {
    const maxCount = Math.max(1, ...graph.nodes.map((n) => n.count));
    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        count: n.count,
        // visual sqrt-scaled radius
        val: 1 + 6 * Math.sqrt(n.count / maxCount),
      })),
      links: graph.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        count: e.count,
      })),
    };
  }, [graph]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#f9fafb", position: "relative" }}
    >
      {size.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="#f9fafb"
          nodeRelSize={6}
          cooldownTicks={120}
          d3VelocityDecay={0.3}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={0.95}
          linkLabel={(l: any) => `${l.type} (${l.count.toLocaleString()})`}
          linkColor={() => "rgba(75,85,99,0.35)"}
          nodeCanvasObject={(node: any, ctx, scale) => {
            const r = node.val ?? 6;
            const color = colorFor(node.id);
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 1.4 / scale;
            ctx.stroke();

            // label
            const fontSize = Math.max(11 / scale, 2);
            ctx.font = `${fontSize}px ui-sans-serif, system-ui`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#111827";
            ctx.fillText(node.id, node.x, node.y + r + 2);
          }}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val ?? 6) + 4, 0, 2 * Math.PI);
            ctx.fill();
          }}
          onNodeClick={(node: any) => {
            fgRef.current?.centerAt(node.x, node.y, 600);
            fgRef.current?.zoom(2.5, 600);
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          fontSize: 11,
          color: "#6b7280",
          pointerEvents: "none",
        }}
      >
        click a node to focus · drag to pan · scroll to zoom
      </div>
    </div>
  );
}
