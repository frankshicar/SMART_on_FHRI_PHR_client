import { defineEventHandler, readBody, createError } from 'h3';
import { getDbPool } from '../../utils/db.js';
import { requireUser } from '../../utils/auth.js';

export default defineEventHandler(async (event) => {
  const user = requireUser(event);
  const { date } = await readBody(event);

  if (!date) {
    throw createError({ statusCode: 400, statusMessage: '請提供日期' });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT * FROM Patients_Appointment WHERE PatientID = ? AND DATE(AppointmentDate) = ? ORDER BY AppointmentDate',
      [user.sub, date]
    );
    return rows;
  } catch (error) {
    throw createError({
      statusCode: error.code === 'ECONNREFUSED' ? 503 : 500,
      statusMessage: error.code === 'ECONNREFUSED'
        ? 'MySQL 未啟動，請執行 docker compose up -d'
        : error.message,
    });
  }
});
