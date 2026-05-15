/**
 * AgroFletes — Seed script
 *
 * Prerequisites:
 *   1. Run supabase-schema.sql in the Supabase SQL editor
 *   2. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
 *   3. node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load env vars from .env.local ─────────────────────────────
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(p => p.trim()))
    .filter(([k]) => k)
)

const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL)     { console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL in .env.local'); process.exit(1) }
if (!SERVICE_ROLE_KEY) {
  console.error(`
❌  Missing SUPABASE_SERVICE_ROLE_KEY in .env.local

Para obtenerla:
  1. Andá a https://supabase.com/dashboard/project/flezqspivqmlizqddcey/settings/api
  2. Copiá la clave "service_role" (secret)
  3. Agregala a .env.local:
     SUPABASE_SERVICE_ROLE_KEY=eyJ...

Luego volvé a correr: node scripts/seed.mjs
`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── Test user ─────────────────────────────────────────────────
const TEST_EMAIL    = 'demo@agrofletes.com'
const TEST_PASSWORD = 'Demo1234!'

// ── Seed data ─────────────────────────────────────────────────
const CLIENTES_SEED = [
  { razon: 'Agropecuaria Los Aromos S.A.',     alias: 'Los Aromos',   cuit: '30-70654321-2', tel: '+54 3472 412-309', localidad: 'Marcos Juárez, Córdoba', activo: true,  rubro: 'Granos' },
  { razon: 'Campo La Esperanza',               alias: 'La Esperanza', cuit: '20-12345678-9', tel: '+54 353 415-7720', localidad: 'Villa María, Córdoba',    activo: true,  rubro: 'Maquinaria' },
  { razon: 'Acopio Río Tercero S.R.L.',        alias: 'Acopio R3',    cuit: '30-71987654-3', tel: '+54 3571 633-118', localidad: 'Río Tercero, Córdoba',    activo: true,  rubro: 'Granos' },
  { razon: 'Establecimiento San Roque',        alias: 'San Roque',    cuit: '20-23456789-1', tel: '+54 3585 422-019', localidad: 'Río Cuarto, Córdoba',     activo: true,  rubro: 'Granos' },
  { razon: 'Sembradoras del Centro S.A.',      alias: 'Sem. Centro',  cuit: '30-72345678-4', tel: '+54 358 466-2200', localidad: 'Las Higueras, Córdoba',   activo: false, rubro: 'Maquinaria' },
  { razon: 'Cooperativa Agrícola Bell Ville',  alias: 'Coop. Bell',   cuit: '30-50012345-7', tel: '+54 3537 414-200', localidad: 'Bell Ville, Córdoba',     activo: true,  rubro: 'Granos' },
]

const CAMIONES_SEED = [
  { patente: 'AB123CD', tipo: 'Carretón',   marca: 'Scania',   modelo: 'R450',        anio: 2020, chofer: 'Juan Pérez',      activo: true  },
  { patente: 'EF456GH', tipo: 'Semi tolva', marca: 'Mercedes', modelo: 'Actros 2545', anio: 2019, chofer: 'Roberto Sánchez', activo: true  },
  { patente: 'IJ789KL', tipo: 'Semi playo', marca: 'Volvo',    modelo: 'FH500',       anio: 2021, chofer: 'Carlos Gómez',    activo: true  },
  { patente: 'MN012PQ', tipo: 'Carretón',   marca: 'Iveco',    modelo: 'Stralis 720', anio: 2018, chofer: 'Diego Molina',    activo: true  },
  { patente: 'RS345TU', tipo: 'Camilla',    marca: 'Scania',   modelo: 'G410',        anio: 2017, chofer: 'Sin asignar',     activo: false },
]

async function run() {
  console.log('🌱  AgroFletes — Seed script\n')

  // ── 1. Check tables ──────────────────────────────────────────
  console.log('⏳  Verificando tablas...')
  const { error: tableCheck } = await supabase.from('clientes').select('id').limit(1)
  if (tableCheck) {
    console.error(`
❌  Las tablas no existen todavía.

Pasos:
  1. Andá a https://supabase.com/dashboard/project/flezqspivqmlizqddcey/sql/new
  2. Pegá el contenido de supabase-schema.sql y ejecutalo
  3. Volvé a correr: node scripts/seed.mjs
`)
    process.exit(1)
  }
  console.log('✓  Tablas OK\n')

  // ── 2. Create / get test user ────────────────────────────────
  console.log(`⏳  Creando usuario de prueba (${TEST_EMAIL})...`)
  let userId

  // Try to get existing user first
  const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.find(u => u.email === TEST_EMAIL)

  if (existing) {
    userId = existing.id
    console.log(`✓  Usuario ya existe (${userId})`)
  } else {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,   // bypass email confirmation
      user_metadata: { full_name: 'Carlos Romero' },
    })
    if (error) { console.error('❌  Error creando usuario:', error.message); process.exit(1) }
    userId = user.id
    console.log(`✓  Usuario creado (${userId})`)
  }
  console.log()

  // ── 3. Ensure perfil exists ──────────────────────────────────
  await supabase.from('perfiles').upsert({
    id: userId,
    empresa_nombre: 'Transportes Don Carlos S.R.L.',
    empresa_cuit:   '30-71234567-8',
    empresa_ciudad: 'Córdoba, Argentina',
    plan: 'Free',
  }, { onConflict: 'id' })
  console.log('✓  Perfil de empresa actualizado\n')

  // ── 4. Clear existing seed data for this user ────────────────
  console.log('⏳  Limpiando datos anteriores...')
  await supabase.from('viajes').delete().eq('user_id', userId)
  await supabase.from('clientes').delete().eq('user_id', userId)
  await supabase.from('camiones').delete().eq('user_id', userId)
  console.log('✓  Limpio\n')

  // ── 5. Insert clientes ───────────────────────────────────────
  console.log('⏳  Insertando clientes...')
  const { data: clientes, error: cliErr } = await supabase
    .from('clientes')
    .insert(CLIENTES_SEED.map(c => ({ ...c, user_id: userId })))
    .select()
  if (cliErr) { console.error('❌', cliErr.message); process.exit(1) }
  console.log(`✓  ${clientes.length} clientes\n`)

  // ── 6. Insert camiones ───────────────────────────────────────
  console.log('⏳  Insertando camiones...')
  const { data: camiones, error: camErr } = await supabase
    .from('camiones')
    .insert(CAMIONES_SEED.map(c => ({ ...c, user_id: userId })))
    .select()
  if (camErr) { console.error('❌', camErr.message); process.exit(1) }
  console.log(`✓  ${camiones.length} camiones\n`)

  // Map aliases to UUIDs
  const cliMap = Object.fromEntries(clientes.map((c, i) => [i, c.id]))
  const camMap = Object.fromEntries(camiones.map((c, i) => [i, c.id]))

  // ── 7. Insert viajes ─────────────────────────────────────────
  console.log('⏳  Insertando viajes...')
  const VIAJES = [
    { fecha: '2026-05-08', fecha_lleg: '2026-05-09', cliente_id: cliMap[2], camion_id: camMap[1], origen: 'Río Tercero',    destino: 'Rosario',         km: 412, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 28.5, monto: 128250, estado: 'ENTREGADO',   docs: ['carta_porte','ticket','remito'],           notas: 'Recibido conforme por planta Vicentin.' },
    { fecha: '2026-05-07', fecha_lleg: null,         cliente_id: cliMap[1], camion_id: camMap[0], origen: 'Villa María',   destino: 'Córdoba Capital', km: 145, tipo_carga_id: 'cosechadora', tipo_carga_label: 'Cosechadora John Deere S680', toneladas: 18.5, monto: 266000, estado: 'EN_TRANSITO', docs: ['carta_porte'],                            notas: 'Salida 07:40. Cliente avisado.' },
    { fecha: '2026-05-06', fecha_lleg: null,         cliente_id: cliMap[3], camion_id: camMap[3], origen: 'Río Cuarto',    destino: 'Buenos Aires',    km: 638, tipo_carga_id: 'maiz',        tipo_carga_label: 'Maíz',                       toneladas: 30.0, monto: 156000, estado: 'BORRADOR',    docs: [],                                         notas: '' },
    { fecha: '2026-05-05', fecha_lleg: '2026-05-05', cliente_id: cliMap[0], camion_id: camMap[1], origen: 'Marcos Juárez', destino: 'San Lorenzo',     km: 358, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 29.2, monto: 132100, estado: 'LIQUIDADO',   docs: ['carta_porte','ticket','remito','factura'], notas: 'Pagado por transferencia 06/05.' },
    { fecha: '2026-05-04', fecha_lleg: '2026-05-05', cliente_id: cliMap[5], camion_id: camMap[3], origen: 'Bell Ville',    destino: 'Timbúes',         km: 388, tipo_carga_id: 'maiz',        tipo_carga_label: 'Maíz',                       toneladas: 31.0, monto: 142800, estado: 'ENTREGADO',   docs: ['carta_porte','ticket'],                   notas: '' },
    { fecha: '2026-05-03', fecha_lleg: '2026-05-04', cliente_id: cliMap[2], camion_id: camMap[1], origen: 'Río Tercero',   destino: 'Rosario',         km: 412, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 28.0, monto: 126000, estado: 'LIQUIDADO',   docs: ['carta_porte','ticket','remito','factura'], notas: '' },
    { fecha: '2026-05-02', fecha_lleg: '2026-05-03', cliente_id: cliMap[0], camion_id: camMap[1], origen: 'Marcos Juárez', destino: 'San Lorenzo',     km: 358, tipo_carga_id: 'trigo',       tipo_carga_label: 'Trigo',                      toneladas: 28.8, monto: 129600, estado: 'ENTREGADO',   docs: ['carta_porte','ticket','remito'],           notas: '' },
    { fecha: '2026-04-30', fecha_lleg: '2026-05-01', cliente_id: cliMap[1], camion_id: camMap[0], origen: 'Villa María',   destino: 'Pergamino',       km: 392, tipo_carga_id: 'tractor',     tipo_carga_label: 'Tractor MF 7726',            toneladas: 12.0, monto: 198000, estado: 'LIQUIDADO',   docs: ['carta_porte','remito','factura'],          notas: '' },
    { fecha: '2026-04-28', fecha_lleg: '2026-04-29', cliente_id: cliMap[5], camion_id: camMap[3], origen: 'Bell Ville',    destino: 'Timbúes',         km: 388, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 30.5, monto: 137250, estado: 'CANCELADO',   docs: ['carta_porte'],                            notas: 'Cliente canceló por lluvia.' },
    { fecha: '2026-04-27', fecha_lleg: '2026-04-28', cliente_id: cliMap[2], camion_id: camMap[2], origen: 'Río Tercero',   destino: 'Rosario',         km: 412, tipo_carga_id: 'maiz',        tipo_carga_label: 'Maíz',                       toneladas: 27.5, monto: 124000, estado: 'LIQUIDADO',   docs: ['carta_porte','ticket','remito','factura'], notas: '' },
    { fecha: '2026-04-25', fecha_lleg: '2026-04-26', cliente_id: cliMap[0], camion_id: camMap[3], origen: 'Marcos Juárez', destino: 'Necochea',        km: 712, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 29.0, monto: 218000, estado: 'LIQUIDADO',   docs: ['carta_porte','ticket','remito','factura'], notas: '' },
    { fecha: '2026-04-23', fecha_lleg: '2026-04-24', cliente_id: cliMap[1], camion_id: camMap[0], origen: 'Villa María',   destino: 'Río Cuarto',      km: 122, tipo_carga_id: 'sembradora',  tipo_carga_label: 'Sembradora 23 cuerpos',      toneladas:  9.8, monto: 145000, estado: 'LIQUIDADO',   docs: ['carta_porte','remito','factura'],          notas: '' },
    { fecha: '2026-04-21', fecha_lleg: '2026-04-22', cliente_id: cliMap[3], camion_id: camMap[2], origen: 'Río Cuarto',    destino: 'Bahía Blanca',    km: 545, tipo_carga_id: 'maiz',        tipo_carga_label: 'Maíz',                       toneladas: 30.5, monto: 178000, estado: 'ENTREGADO',   docs: ['carta_porte','ticket'],                   notas: '' },
    { fecha: '2026-04-19', fecha_lleg: '2026-04-20', cliente_id: cliMap[2], camion_id: camMap[1], origen: 'Río Tercero',   destino: 'Rosario',         km: 412, tipo_carga_id: 'soja',        tipo_carga_label: 'Soja',                       toneladas: 28.7, monto: 129150, estado: 'LIQUIDADO',   docs: ['carta_porte','ticket','remito','factura'], notas: '' },
  ]

  const { data: viajes, error: viaErr } = await supabase
    .from('viajes')
    .insert(VIAJES.map(v => ({ ...v, user_id: userId })))
    .select()
  if (viaErr) { console.error('❌', viaErr.message); process.exit(1) }
  console.log(`✓  ${viajes.length} viajes\n`)

  // ── Done ─────────────────────────────────────────────────────
  console.log('═'.repeat(50))
  console.log('✅  Seed completo!\n')
  console.log('Credenciales de prueba:')
  console.log(`  Email:    ${TEST_EMAIL}`)
  console.log(`  Password: ${TEST_PASSWORD}`)
  console.log('\nCorré la app:')
  console.log('  npm run dev  →  http://localhost:3000')
  console.log('═'.repeat(50))
}

run().catch(e => { console.error('❌ Error inesperado:', e); process.exit(1) })
