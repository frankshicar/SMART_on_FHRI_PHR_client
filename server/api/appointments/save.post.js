import { defineEventHandler, readBody, createError } from 'h3';
import { getDbPool } from '../../utils/db.js';
import { requireUser } from '../../utils/auth.js';

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseAppointmentDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default defineEventHandler(async (event) => {
  const user = requireUser(event);
  const body = await readBody(event);
  const { prescription, prescriptionId, appointmentDate, location } = body;

  if (!prescription || !appointmentDate || !location) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要欄位' });
  }

  const dateObj = parseAppointmentDate(appointmentDate);
  if (!dateObj) {
    throw createError({ statusCode: 400, statusMessage: '日期格式不正確，請重新選擇' });
  }

  try {
    const pool = getDbPool();
    await pool.execute(
      `INSERT INTO Patients_Appointment (PatientID, Prescription, prescription_id, AppointmentDate, location)
       VALUES (?, ?, ?, ?, ?)`,
      [user.sub, String(prescription).slice(0, 2000), prescriptionId || null, formatDateTime(dateObj), location]
    );
    return { success: true, message: '預約成功！可至「我的預約」查看' };
  } catch (error) {
    console.error('Appointment save error:', error);
    throw createError({
      statusCode: error.code === 'ECONNREFUSED' ? 503 : 500,
      statusMessage: error.code === 'ECONNREFUSED'
        ? 'MySQL 未啟動，請執行 npm run db:up'
        : (error.code === 'ER_BAD_FIELD_ERROR'
          ? '資料庫 schema 需更新，請執行 node scripts/migrate-db.js'
          : '儲存失敗，請稍後再試'),
    });
  }
});
