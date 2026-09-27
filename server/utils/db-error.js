export function formatDbError(error) {
  const code = error?.code || '';
  const msg = error?.message || '資料庫連線失敗';

  if (code === 'ECONNREFUSED') {
    if (process.env.MYSQL_SOCKET_PATH) {
      return '無法連線 Cloud SQL，請確認 Cloud Run 已加入 Cloud SQL 連線且 MYSQL_SOCKET_PATH 正確';
    }
    return 'MySQL 未啟動，本機請執行 npm run db:up';
  }

  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return '資料庫帳密錯誤，請检查 MYSQL_USER / MYSQL_PASSWORD';
  }

  if (code === 'ENOENT') {
    return '找不到 Cloud SQL socket，请确认 Cloud Run 已绑定 fhirdb 实例';
  }

  return msg;
}
