import { defineEventHandler, createError } from 'h3';
import { requireUser } from '../../utils/auth.js';
import { getDbPool } from '../../utils/db.js';
import { fetchPatientSummary } from '../../utils/fhir.js';

export default defineEventHandler(async (event) => {
  const user = requireUser(event);

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT id, username, display_name, fhir_patient_id FROM users WHERE id = ? LIMIT 1',
      [user.sub]
    );
    const row = rows[0];
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: '使用者不存在' });
    }

    let fhirPatient = null;
    if (row.fhir_patient_id) {
      fhirPatient = await fetchPatientSummary(row.fhir_patient_id);
    }

    return {
      id: String(row.id),
      username: row.username,
      name: row.display_name,
      fhirPatientId: row.fhir_patient_id,
      fhirPatientName: fhirPatient?.name || null,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    return {
      id: user.sub,
      username: user.username,
      name: user.name,
    };
  }
});
