export interface PropertyMeta {
  name: string;
  description: string;
  values: Record<string, string>;
}

export interface LabelMeta {
  name: string;
  description: string;
  count: number;
  pii: string[];
  properties: PropertyMeta[];
}

export interface RelationshipMeta {
  type: string;
  description: string;
  count: number;
  from: string[];
  to: string[];
}

export interface GraphNode {
  id: string;
  count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  count: number;
}

export interface SchemaPayload {
  labels: LabelMeta[];
  relationships: RelationshipMeta[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  totals: {
    labels: number;
    relationships: number;
    nodes: number;
    edges: number;
  };
}

// ── Patient journey ─────────────────────────────────────────────────────

export interface PatientSample {
  id: string;
  state: string | null;
  payor_cohort: string | null;
  call_tier: string | null;
  balance: number;
  bad_debt: number;
  visit_count: number;
  charge_count: number;
}

export type JourneyKind =
  | "visit"
  | "charge"
  | "transaction"
  | "statement"
  | "ivr"
  | "dialler";

export interface JourneyEvent {
  kind: JourneyKind;
  ts: string;
  id: string;
  label: string;
  detail: string;
  amount: number | null;
}

export interface PatientHeader {
  patient_id: string;
  state: string | null;
  city: string | null;
  payor_cohort: string | null;
  call_tier: string | null;
  carrier_name: string | null;
  outstanding_balance: number;
  total_charged: number;
  total_paid: number;
  adj_bad_debt: number;
  visit_count: number;
  charge_count: number;
  statement_count: number;
  practices: string[];
}

export interface PatientJourneyPayload {
  patient: PatientHeader;
  events: JourneyEvent[];
  counts: Partial<Record<JourneyKind, number>>;
}
