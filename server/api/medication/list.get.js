import { defineEventHandler, createError } from 'h3';
import { requireUser } from '../../utils/auth.js';
import { getDbPool } from '../../utils/db.js';
import { fetchMedicationRequestsForPatient, fetchPatientSummary } from '../../utils/fhir.js';

export default defineEventHandler(async (event) => {
  const user = requireUser(event);

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT fhir_patient_id FROM users WHERE id = ? LIMIT 1',
      [user.sub]
    );
    const fhirPatientId = rows[0]?.fhir_patient_id;

    if (!fhirPatientId) {
      throw createError({
        statusCode: 400,
        statusMessage: '此帳號未綁定 FHIR Patient ID，請聯絡管理員',
      });
    }

    const [prescriptions, fhirPatient] = await Promise.all([
      fetchMedicationRequestsForPatient(fhirPatientId),
      fetchPatientSummary(fhirPatientId),
    ]);

    return {
      fhirPatient,
      prescriptions,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
});
