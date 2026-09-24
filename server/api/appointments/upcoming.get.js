import { defineEventHandler, createError } from 'h3';
import { getDbPool } from '../../utils/db.js';
import { requireUser } from '../../utils/auth.js';

export default defineEventHandler(async (event) => {
  const user = requireUser(event);

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT * FROM Patients_Appointment
       WHERE PatientID = ? AND DATE(AppointmentDate) >= CURDATE()
       ORDER BY AppointmentDate ASC
       LIMIT 10`,
      [user.sub]
    );
    return rows;
  } catch (error) {
    throw createError({
      statusCode: error.code === 'ECONNREFUSED' ? 503 : 500,
      statusMessage: error.code === 'ECONNREFUSED'
        ? 'MySQL 未啟動，請執行 npm run db:up'
        : error.message,
    });
  }
});
