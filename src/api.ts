import type {
  OntologyPayload,
  PolicyJourneyPayload,
  PolicySample,
  SchemaPayload,
} from "./types";

export async function fetchSchema(): Promise<SchemaPayload> {
  const res = await fetch("/api/schema");
  if (!res.ok) {
    throw new Error(`/schema returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPolicySample(limit = 50): Promise<PolicySample[]> {
  const res = await fetch(`/api/schema/policies/sample?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`/schema/policies/sample returned HTTP ${res.status}`);
  }
  const j = await res.json();
  return j.policies ?? [];
}

export async function fetchPolicyJourney(
  policyId: string,
): Promise<PolicyJourneyPayload> {
  const res = await fetch(
    `/api/schema/policy-journey/${encodeURIComponent(policyId)}`,
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`No policy found with id: ${policyId}`);
    }
    throw new Error(`/schema/policy-journey returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchOntology(): Promise<OntologyPayload> {
  const res = await fetch("/api/schema/ontology");
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "No ontology loaded in Neo4j. Import ia_ontology.ttl via n10s.",
      );
    }
    throw new Error(`/schema/ontology returned HTTP ${res.status}`);
  }
  return res.json();
}
