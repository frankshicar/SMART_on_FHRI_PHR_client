import mysql from 'mysql2/promise';

let pool;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      port: process.env.MYSQL_PORT || '3306',
      password: process.env.MYSQL_PASSWORD || 'phr_dev_password',
      database: process.env.MYSQL_DATABASE || 'FHIR_Appointment_Medicine',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}
