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

// ── Policy journey ──────────────────────────────────────────────────────

export interface PolicySample {
  id: string;
  policy_number: string;
  line_of_business: string;
  policy_status: string;
  is_active: boolean;
  gwp: number;
  total_paid: number;
  outstanding: number;
  claim_count: number;
  loss_ratio_pct: number;
}

export type JourneyKind =
  | "issue"
  | "event"
  | "claim"
  | "pre_auth"
  | "payment"
  | "cancellation"
  | "expiry";

export interface JourneyEvent {
  kind: JourneyKind;
  ts: string;
  id: string;
  label: string;
  detail: string;
  amount: number | null;
}

export interface PolicyHeader {
  policy_id: string;
  policy_number: string;
  policy_type: string;
  line_of_business: string;
  policy_status: string;
  is_active: boolean;
  is_cancelled: boolean;
  is_reinsured: boolean;
  issue_date: string | null;
  effect_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  cancellation_date: string | null;
  cancellation_reason: string;
  gross_written_premium: number;
  net_written_premium: number;
  commission: number;
  total_claimed: number;
  total_approved: number;
  total_paid: number;
  total_outstanding: number;
  loss_ratio_pct: number;
  claim_count: number;
  open_claim_count: number;
  renewal_count: number;
  event_count: number;
  insurer: string[];
  channels: string[];
  products: string[];
  reinsurers: string[];
}

export interface PolicyJourneyPayload {
  policy: PolicyHeader;
  events: JourneyEvent[];
  counts: Partial<Record<JourneyKind, number>>;
}

// ── Ontology (n10s) ─────────────────────────────────────────────────────

export interface OntologyProperty {
  name: string;
  label: string;
  comment: string;
  uri: string;
}

export interface OntologyRelEndpoint {
  type: string;
  label: string;
  comment: string;
  target?: string;
  source?: string;
}

export interface OntologyClass {
  name: string;
  label: string;
  comment: string;
  uri: string;
  properties: OntologyProperty[];
  outgoing: OntologyRelEndpoint[];
  incoming: OntologyRelEndpoint[];
}

export interface OntologyRelationship {
  type: string;
  label: string;
  comment: string;
  uri: string;
  from: string[];
  to: string[];
}

export interface OntologyDataProperty {
  name: string;
  label: string;
  comment: string;
  uri: string;
  domains: string[];
  ranges: string[];
}

export interface OntologyMeta {
  label: string;
  comment: string;
  uri: string;
}

export interface OntologyPayload {
  meta: OntologyMeta;
  classes: OntologyClass[];
  relationships: OntologyRelationship[];
  properties: OntologyDataProperty[];
  totals: {
    classes: number;
    relationships: number;
    properties: number;
  };
}
