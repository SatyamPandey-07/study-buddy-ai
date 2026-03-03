// One-off script to promote a user to ADMIN
// Usage: node scripts/make-admin.mjs [email]
//   - No email arg: lists all users
//   - With email arg: promotes that user to ADMIN

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const sql = neon(process.env.DATABASE_URL);
const emailArg = process.argv[2];

if (!emailArg) {
  const users = await sql`SELECT id, email, name, role FROM "User" ORDER BY "createdAt"`;
  console.log('\nUsers in database:\n');
  for (const u of users) {
    console.log(`  ${u.role.padEnd(6)}  ${u.email}  (${u.name ?? 'no name'})`);
  }
  console.log('\nTo promote: node scripts/make-admin.mjs <email>\n');
} else {
  const [updated] = await sql`
    UPDATE "User" SET role = 'ADMIN' WHERE email = ${emailArg}
    RETURNING id, email, role
  `;
  if (!updated) {
    console.error(`\nNo user found with email: ${emailArg}\n`);
    process.exit(1);
  }
  console.log(`\n✓ ${updated.email} is now ADMIN\n`);
}
