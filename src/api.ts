import type {
  PatientJourneyPayload,
  PatientSample,
  SchemaPayload,
} from "./types";

export async function fetchSchema(): Promise<SchemaPayload> {
  const res = await fetch("/api/schema");
  if (!res.ok) {
    throw new Error(`/schema returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPatientSample(limit = 50): Promise<PatientSample[]> {
  const res = await fetch(`/api/schema/patients/sample?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`/schema/patients/sample returned HTTP ${res.status}`);
  }
  const j = await res.json();
  return j.patients ?? [];
}

export async function fetchPatientJourney(
  patientId: string,
): Promise<PatientJourneyPayload> {
  const res = await fetch(
    `/api/schema/patient-journey/${encodeURIComponent(patientId)}`,
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`No patient found with id: ${patientId}`);
    }
    throw new Error(`/schema/patient-journey returned HTTP ${res.status}`);
  }
  return res.json();
}
