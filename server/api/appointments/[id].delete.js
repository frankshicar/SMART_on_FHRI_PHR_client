import { defineEventHandler, createError, getRouterParam } from 'h3';
import { requireUser } from '../../utils/auth.js';
import { getDbPool } from '../../utils/db.js';

export default defineEventHandler(async (event) => {
  const user = requireUser(event);
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少預約 ID' });
  }

  try {
    const pool = getDbPool();
    const [result] = await pool.execute(
      'DELETE FROM Patients_Appointment WHERE id = ? AND PatientID = ?',
      [id, user.sub]
    );

    if (result.affectedRows === 0) {
      throw createError({ statusCode: 404, statusMessage: '找不到預約或無權限刪除' });
    }

    return { success: true, message: '已取消預約' };
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: '刪除失敗' });
  }
});
