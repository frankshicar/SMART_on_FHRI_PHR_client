import { defineEventHandler } from 'h3';
import { getDbPool } from '../utils/db.js';

export default defineEventHandler(async () => {
  let db = 'ok';
  try {
    await getDbPool().query('SELECT 1');
  } catch {
    db = 'error';
  }

  return {
    ok: db === 'ok',
    db,
    timestamp: new Date().toISOString(),
  };
});
