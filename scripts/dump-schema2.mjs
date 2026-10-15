// Diagnostic: probe PostgREST root auth variants and dump the OpenAPI schema.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('key prefix:', key.slice(0, 16))

const variants = [
  ['apikey only', { apikey: key }],
  ['apikey+bearer', { apikey: key, Authorization: `Bearer ${key}` }],
  ['apikey+bearer+openapi', { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' }],
]

for (const [name, headers] of variants) {
  const res = await fetch(`${url}/rest/v1/`, { headers })
  const body = await res.text()
  console.log(`\n[${name}] -> ${res.status}`)
  console.log('  body:', body.slice(0, 300))
  if (res.status === 200 && body.startsWith('{')) {
    try {
      const json = JSON.parse(body)
      writeFileSync(resolve(root, 'schema-dump.json'), JSON.stringify(json, null, 2))
      const paths = Object.keys(json.paths ?? {})
      console.log('  tables:', paths.join(', '))
      for (const [path, def] of Object.entries(json.paths ?? {})) {
        const schema = (def.get ?? {}).responses?.['200']?.schema
        const defKey = schema?.items?.$ref?.split('/').pop()
        const tableDef = defKey ? json.components?.schemas?.[defKey] : null
        console.log(`\n${path}`)
        if (tableDef?.properties) {
          for (const [col, spec] of Object.entries(tableDef.properties)) {
            console.log(`  - ${col}: ${spec.type ?? spec.format ?? '?'}${spec.enum ? ` enum=${spec.enum.join('|')}` : ''}${spec.items ? ` items=${spec.items.type ?? ''}` : ''}`)
          }
        }
      }
    } catch {}
    break
  }
}
