import type { JourneyKind } from "../../types";

export interface KindStyle {
  color: string;
  bg: string;
  icon: string;
  label: string;
}

export const KIND_STYLE: Record<JourneyKind, KindStyle> = {
  visit:       { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  icon: "🏥", label: "Visit" },
  charge:      { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  icon: "💵", label: "Charge" },
  transaction: { color: "#34d399", bg: "rgba(52,211,153,0.15)",  icon: "💸", label: "Payment" },
  statement:   { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", icon: "📄", label: "Statement" },
  ivr:         { color: "#22d3ee", bg: "rgba(34,211,238,0.15)",  icon: "📞", label: "IVR call" },
  dialler:     { color: "#f472b6", bg: "rgba(244,114,182,0.15)", icon: "☎️", label: "Dialler" },
};

export const KIND_ORDER: JourneyKind[] = [
  "visit",
  "charge",
  "transaction",
  "statement",
  "ivr",
  "dialler",
];

export const PANEL_BG = "linear-gradient(135deg, #1c2240, #131830)";
export const PANEL_BORDER = "1px solid rgba(255,255,255,0.06)";
