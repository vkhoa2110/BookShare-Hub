import { readFile } from 'node:fs/promises'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required.')
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
