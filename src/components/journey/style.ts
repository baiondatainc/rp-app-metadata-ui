import type { JourneyKind } from "../../types";

export interface KindStyle {
  color: string;
  bg: string;
  icon: string;
  label: string;
}

// Light-theme palette: darker colors for text/icons, tinted-white for chip fills.
export const KIND_STYLE: Record<JourneyKind, KindStyle> = {
  issue:        { color: "#4338ca", bg: "#eef2ff", icon: "🟢", label: "Issued" },
  event:        { color: "#0369a1", bg: "#e0f2fe", icon: "📌", label: "Event" },
  claim:        { color: "#b45309", bg: "#fef3c7", icon: "📝", label: "Claim" },
  pre_auth:     { color: "#7c3aed", bg: "#ede9fe", icon: "🛡️", label: "Pre-auth" },
  payment:      { color: "#047857", bg: "#d1fae5", icon: "💰", label: "Payment" },
  cancellation: { color: "#b91c1c", bg: "#fee2e2", icon: "⛔", label: "Cancelled" },
  expiry:       { color: "#525252", bg: "#f5f5f5", icon: "⌛", label: "Expiry" },
};

export const KIND_ORDER: JourneyKind[] = [
  "issue",
  "event",
  "claim",
  "pre_auth",
  "payment",
  "cancellation",
  "expiry",
];

export const PANEL_BG = "#ffffff";
export const PANEL_BORDER = "1px solid #e5e7eb";
export const PANEL_SHADOW = "0 1px 2px rgba(15, 23, 42, 0.04)";
