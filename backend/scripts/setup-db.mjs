// Setup / migrasi database. Jalankan: npm run db:setup
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL belum di-set. Copy .env.example ke .env lalu isi dulu.');
  process.exit(1);
}

const sql = neon(url);
// Driver HTTP Neon hanya punya tagged-template; ini helper untuk menjalankan string SQL apa adanya.
const run = (text) => sql(Object.assign([text], { raw: [text] }));
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

// Buang baris komentar (-- ...) dulu, baru pisahkan per statement.
const statements = schema
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  await run(stmt);
}

console.log(`✅ Database siap (${statements.length} statement dijalankan).`);
