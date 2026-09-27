import mysql from 'mysql2/promise';
import { getMysqlConfig } from './db-config.mjs';

const config = getMysqlConfig();
const maxAttempts = Number(process.env.MYSQL_WAIT_ATTEMPTS || 30);
const delayMs = Number(process.env.MYSQL_WAIT_DELAY_MS || 2000);
const label = config.socketPath || `${config.host}:${config.port}`;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const conn = await mysql.createConnection(config);
    await conn.query('SELECT 1');
    await conn.end();
    console.log(`MySQL ready (${label})`);
    process.exit(0);
  } catch (err) {
    console.log(`Waiting for MySQL (${attempt}/${maxAttempts}): ${err.message}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

console.error('MySQL did not become ready in time');
process.exit(1);
