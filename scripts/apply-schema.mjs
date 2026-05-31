import { readFile } from 'node:fs/promises'
import pg from 'pg'

let databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  try {
    const envLocal = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
    const match = envLocal.match(/^DATABASE_URL=(.+)$/m)
    if (match) {
      databaseUrl = match[1].trim()
    }
  } catch (e) {
    // ignore
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Please define it in process.env or in .env.local')
  process.exit(1)
}

const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(schema)
  console.log('Supabase schema applied.')
} finally {
  await client.end()
}
