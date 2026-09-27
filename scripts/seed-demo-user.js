import mysql from 'mysql2/promise';
import { getMysqlConfig } from './db-config.mjs';

const DEMO_FHIR_PATIENT_ID = process.env.DEMO_FHIR_PATIENT_ID || '20830';

const pool = mysql.createPool(getMysqlConfig());

await pool.query(`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fhir_patient_id VARCHAR(128) NULL AFTER display_name
`).catch(async () => {
  const [cols] = await pool.query(
    "SHOW COLUMNS FROM users LIKE 'fhir_patient_id'"
  );
  if (!cols.length) {
    await pool.query(
      'ALTER TABLE users ADD COLUMN fhir_patient_id VARCHAR(128) NULL AFTER display_name'
    );
  }
});

await pool.query(
  'UPDATE users SET display_name = ?, fhir_patient_id = ? WHERE username = ?',
  ['測試病患', DEMO_FHIR_PATIENT_ID, 'demo']
);

console.log(`Demo user updated: display_name=測試病患, fhir_patient_id=${DEMO_FHIR_PATIENT_ID}`);
await pool.end();
