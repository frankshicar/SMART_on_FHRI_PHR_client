/** Shared MySQL connection options (TCP or Cloud SQL unix socket). */
export function getMysqlConfig() {
  const socketPath = process.env.MYSQL_SOCKET_PATH;
  const base = {
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'phr_dev_password',
    database: process.env.MYSQL_DATABASE || 'FHIR_Appointment_Medicine',
    charset: 'utf8mb4',
  };

  if (socketPath) {
    return { ...base, socketPath };
  }

  return {
    ...base,
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
  };
}
