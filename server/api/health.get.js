import { defineEventHandler } from 'h3';
import { getDbPool } from '../utils/db.js';

import { formatDbError } from '../utils/db-error.js';

export default defineEventHandler(async () => {
  let db = 'ok';
  let dbError = null;
  try {
    await getDbPool().query('SELECT 1');
  } catch (err) {
    db = 'error';
    dbError = formatDbError(err);
  }

  return {
    ok: db === 'ok',
    db,
    dbError,
    hasSocketPath: Boolean(process.env.MYSQL_SOCKET_PATH),
    timestamp: new Date().toISOString(),
  };
});
