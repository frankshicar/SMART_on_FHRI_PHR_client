import fetch from 'node-fetch';
import { createError } from 'h3';

const hapiFhirUrl = process.env.FHIR_SERVER_URL || 'https://hapi.fhir.org/baseR4';

function getMedicationName(resource) {
  const concept = resource.medicationCodeableConcept;
  return (
    concept?.text
    || concept?.coding?.find((c) => c.display)?.display
    || concept?.coding?.[0]?.code
    || '未知藥品'
  );
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '未知日期';
  return new Date(isoDate).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function normalizePatientId(patientId) {
  if (!patientId) return null;
  return patientId.startsWith('Patient/') ? patientId : `Patient/${patientId}`;
}

export async function fetchPatientSummary(patientId) {
  const ref = normalizePatientId(patientId);
  const response = await fetch(`${hapiFhirUrl}/${ref}`);
  if (!response.ok) {
    return { id: patientId, name: null };
  }
  const patient = await response.json();
  const name = patient.name?.[0]?.text
    || [patient.name?.[0]?.family, ...(patient.name?.[0]?.given || [])].filter(Boolean).join('');
  return { id: ref.replace('Patient/', ''), name: name || null };
}

/** 每一筆 MedicationRequest 為一張處方（同天多藥不合并） */
export async function fetchMedicationRequestsForPatient(patientId) {
  const ref = normalizePatientId(patientId);
  if (!ref) {
    throw createError({ statusCode: 400, statusMessage: '未設定 FHIR Patient ID' });
  }

  const url = `${hapiFhirUrl}/MedicationRequest?patient=${encodeURIComponent(ref)}&status=active&_count=100`;
  const response = await fetch(url);
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: `FHIR 連線失敗 (HTTP ${response.status})` });
  }

  const bundle = await response.json();

  return (bundle.entry || [])
    .map((entry) => entry.resource)
    .filter((resource) => resource.status === 'active')
    .map((resource) => {
      const medName = getMedicationName(resource);
      const doctor = resource.requester?.display || '未指定醫師';
      const dateLabel = formatDateLabel(resource.authoredOn);

      return {
        id: resource.id,
        authoredOn: resource.authoredOn || null,
        dateLabel,
        doctor,
        medications: [medName],
        medicationRequestIds: [resource.id],
        label: `${dateLabel}｜${doctor}｜${medName}`,
      };
    })
    .sort((a, b) => (b.authoredOn || '').localeCompare(a.authoredOn || ''));
}
