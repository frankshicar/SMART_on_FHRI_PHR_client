import mysql from 'mysql2/promise';

const host = process.env.MYSQL_HOST || '127.0.0.1';
const port = Number(process.env.MYSQL_PORT || 3306);
const user = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || 'phr_dev_password';
const database = process.env.MYSQL_DATABASE || 'FHIR_Appointment_Medicine';
const maxAttempts = Number(process.env.MYSQL_WAIT_ATTEMPTS || 30);
const delayMs = Number(process.env.MYSQL_WAIT_DELAY_MS || 2000);

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const conn = await mysql.createConnection({ host, port, user, password, database });
    await conn.query('SELECT 1');
    await conn.end();
    console.log(`MySQL ready (${host}:${port})`);
    process.exit(0);
  } catch (err) {
    console.log(`Waiting for MySQL (${attempt}/${maxAttempts}): ${err.message}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

console.error('MySQL did not become ready in time');
process.exit(1);
