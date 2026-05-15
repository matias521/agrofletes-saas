// AgroFletes SaaS — Data layer (seed data + types + helpers)

// ── Types ────────────────────────────────────────────────────────────────────

export type EstadoKey = 'BORRADOR' | 'EN_TRANSITO' | 'ENTREGADO' | 'LIQUIDADO' | 'CANCELADO'

export type TipoCarga =
  | 'soja'
  | 'maiz'
  | 'trigo'
  | 'girasol'
  | 'sorgo'
  | 'cebada'
  | 'fertilizante'
  | 'maquinaria'
  | 'cerdos'
  | 'otro'

export type TipoCamion =
  | 'acoplado'
  | 'semirremolque'
  | 'semi_playo'
  | 'semi_sider'
  | 'semi_batea'
  | 'semi_baranda'
  | 'tolva'
  | 'frigorifico'
  | 'plataforma'
  | 'cisterna'
  | 'carreton'
  | 'camilla'
  | 'chasis'
  | 'hidrogua'

export type GrainCert = 'none' | 'senasa' | 'organic'

export type TipoDoc = 'carta_porte' | 'remito' | 'factura' | 'seguro' | 'otro'

// App-level types (used by UI components)
export interface Cliente {
  id: string
  razon: string
  alias: string
  cuit: string
  tel: string
  localidad: string
  activo: boolean
  rubro: string
  viajes: number
  facturado: number
}

export interface Camion {
  id: string
  patente: string
  tipo: string
  marca: string
  modelo: string
  anio: number
  chofer: string
  activo: boolean
  viajes: number
  pesoMaxTon?: number | null
  volumenM3?: number | null
  grainCert?: GrainCert
  hasGps?: boolean
  kmAcumulados?: number
}

export interface TimelineItem {
  id: string
  estado: EstadoKey | 'creado'
  fecha: string
  hora: string
  desc: string
  usuario: string
}

export interface WeekData {
  label: string
  viajes: number
}

export interface Viaje {
  id: string
  numero: number
  fecha: string
  fechaLleg: string | null
  clienteId: string
  origen: string
  destino: string
  km: number
  camionId: string
  tipoCargaId: string
  tipoCargaLabel: string
  toneladas: number
  monto: number
  estado: EstadoKey
  docs: string[]
  notas: string
}

// ── DB row types (snake_case from Supabase) ──────────────────────────────────

export interface ClienteDB {
  id: string
  user_id: string
  razon: string
  alias: string
  cuit: string | null
  tel: string | null
  localidad: string | null
  activo: boolean
  rubro: string | null
  created_at: string
}

export interface CamionDB {
  id: string
  user_id: string
  patente: string
  tipo: string
  marca: string | null
  modelo: string | null
  anio: number | null
  chofer: string | null
  activo: boolean
  peso_max_ton?: number | null
  volumen_m3?: number | null
  grain_cert?: string | null
  has_gps?: boolean | null
  km_acumulados?: number | null
  created_at: string
}

export interface ViajeDB {
  id: string
  numero: number
  user_id: string
  fecha: string
  fecha_lleg: string | null
  cliente_id: string | null
  origen: string
  destino: string
  km: number | null
  camion_id: string | null
  tipo_carga_id: string | null
  tipo_carga_label: string | null
  toneladas: number | null
  monto: number | null
  estado: EstadoKey
  docs: string[]
  notas: string | null
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

export const COMPANY = {
  nombre: 'Transportes El Ombú S.R.L.',
  cuit: '30-71234567-8',
  plan: 'Free',
  planMax: 30,
}

export const USER = {
  nombre: 'Matías Bejegaleroux',
  rol: 'Admin',
  initials: 'MB',
  email: 'matias@elombu.com.ar',
}

export const ESTADOS: Record<EstadoKey, { label: string; bg: string; fg: string; dot: string }> = {
  BORRADOR:    { label: 'Borrador',    bg: 'var(--st-borrador-bg)',  fg: 'var(--st-borrador-fg)',  dot: 'var(--st-borrador-dot)' },
  EN_TRANSITO: { label: 'En tránsito', bg: 'var(--st-transito-bg)', fg: 'var(--st-transito-fg)', dot: 'var(--st-transito-dot)' },
  ENTREGADO:   { label: 'Entregado',   bg: 'var(--st-entregado-bg)', fg: 'var(--st-entregado-fg)', dot: 'var(--st-entregado-dot)' },
  LIQUIDADO:   { label: 'Liquidado',   bg: 'var(--st-liquidado-bg)', fg: 'var(--st-liquidado-fg)', dot: 'var(--st-liquidado-dot)' },
  CANCELADO:   { label: 'Cancelado',   bg: 'var(--st-cancelado-bg)', fg: 'var(--st-cancelado-fg)', dot: 'var(--st-cancelado-dot)' },
}

export const TIPOS_CAMION: Record<TipoCamion, { label: string; icon: string }> = {
  acoplado:      { label: 'Acoplado',              icon: 'local_shipping' },
  semirremolque: { label: 'Semirremolque',         icon: 'local_shipping' },
  semi_playo:    { label: 'Semi Playo',            icon: 'local_shipping' },
  semi_sider:    { label: 'Semi Sider',            icon: 'local_shipping' },
  semi_batea:    { label: 'Semi Batea',            icon: 'local_shipping' },
  semi_baranda:  { label: 'Semi Baranda Volcable', icon: 'local_shipping' },
  tolva:         { label: 'Tolva',                 icon: 'agriculture' },
  frigorifico:   { label: 'Frigorífico',           icon: 'ac_unit' },
  plataforma:    { label: 'Plataforma',            icon: 'flatware' },
  cisterna:      { label: 'Cisterna',              icon: 'water_drop' },
  carreton:      { label: 'Carretón',              icon: 'commute' },
  camilla:       { label: 'Camilla',               icon: 'commute' },
  chasis:        { label: 'Chasis',                icon: 'directions_car' },
  hidrogua:      { label: 'Hidrogrúa',             icon: 'construction' },
}

export const GRAIN_CERT_OPTIONS: { value: GrainCert; label: string; desc: string }[] = [
  { value: 'none',    label: 'Sin certificación', desc: 'No apto para granos certificados' },
  { value: 'senasa',  label: 'SENASA',            desc: 'Certificado para transporte de granos' },
  { value: 'organic', label: 'Orgánica',          desc: 'Certificación de producción orgánica' },
]

export const TIPOS_CARGA: Record<TipoCarga, { label: string; icon: string }> = {
  soja:         { label: 'Soja',         icon: 'grass' },
  maiz:         { label: 'Maíz',         icon: 'grass' },
  trigo:        { label: 'Trigo',        icon: 'grass' },
  girasol:      { label: 'Girasol',      icon: 'local_florist' },
  sorgo:        { label: 'Sorgo',        icon: 'grass' },
  cebada:       { label: 'Cebada',       icon: 'grass' },
  fertilizante: { label: 'Fertilizante', icon: 'science' },
  maquinaria:   { label: 'Maquinaria',   icon: 'agriculture' },
  cerdos:       { label: 'Cerdos',       icon: 'pets' },
  otro:         { label: 'Otro',         icon: 'category' },
}

export const TIPOS_DOC: Record<TipoDoc, { label: string; icon: string }> = {
  carta_porte: { label: 'Carta de Porte', icon: 'description' },
  remito:      { label: 'Remito',         icon: 'receipt' },
  factura:     { label: 'Factura',        icon: 'receipt_long' },
  seguro:      { label: 'Seguro',         icon: 'shield' },
  otro:        { label: 'Otro',           icon: 'attach_file' },
}

// ── Seed / demo data (kept for fallback) ─────────────────────────────────────

export const CLIENTES: Cliente[] = [
  {
    id: 'c1',
    razon: 'Agropecuaria Los Robles S.A.',
    alias: 'Los Robles',
    cuit: '30-65432100-5',
    tel: '+54 9 11 4321-0987',
    localidad: 'Pergamino, BA',
    activo: true,
    rubro: 'Granos',
    viajes: 48,
    facturado: 12_450_000,
  },
  {
    id: 'c2',
    razon: 'Cerealera Del Norte S.R.L.',
    alias: 'Cerealera Norte',
    cuit: '30-70123456-1',
    tel: '+54 9 341 555-1234',
    localidad: 'Rosario, SF',
    activo: true,
    rubro: 'Cereales',
    viajes: 72,
    facturado: 21_800_000,
  },
  {
    id: 'c3',
    razon: 'Graneros Pampero S.A.',
    alias: 'Pampero',
    cuit: '30-68901234-7',
    tel: '+54 9 230 444-5678',
    localidad: 'Junín, BA',
    activo: true,
    rubro: 'Granos',
    viajes: 34,
    facturado: 8_200_000,
  },
  {
    id: 'c4',
    razon: 'AgroExport Córdoba S.A.',
    alias: 'AgroExport',
    cuit: '30-72345678-9',
    tel: '+54 9 351 222-3456',
    localidad: 'Córdoba, CBA',
    activo: true,
    rubro: 'Exportación',
    viajes: 91,
    facturado: 27_600_000,
  },
  {
    id: 'c5',
    razon: 'Semillas Pampeanas S.R.L.',
    alias: 'Semipampeanas',
    cuit: '30-61234567-2',
    tel: '+54 9 2324 44-5566',
    localidad: 'Trenque Lauquen, BA',
    activo: false,
    rubro: 'Semillas',
    viajes: 19,
    facturado: 4_100_000,
  },
]

export const CAMIONES: Camion[] = [
  {
    id: 'k1',
    patente: 'AB 123 CD',
    tipo: 'semirremolque',
    marca: 'Scania',
    modelo: 'R 450',
    anio: 2020,
    chofer: 'Carlos Pérez',
    activo: true,
    viajes: 0,
  },
  {
    id: 'k2',
    patente: 'EF 456 GH',
    tipo: 'tolva',
    marca: 'Mercedes-Benz',
    modelo: 'Actros 2651',
    anio: 2019,
    chofer: 'Luis Romero',
    activo: true,
    viajes: 0,
  },
  {
    id: 'k3',
    patente: 'IJ 789 KL',
    tipo: 'acoplado',
    marca: 'Volvo',
    modelo: 'FH 460',
    anio: 2021,
    chofer: 'Jorge Sánchez',
    activo: true,
    viajes: 0,
  },
  {
    id: 'k4',
    patente: 'MN 012 OP',
    tipo: 'semirremolque',
    marca: 'Iveco',
    modelo: 'Stralis 480',
    anio: 2018,
    chofer: 'Pablo Torres',
    activo: true,
    viajes: 0,
  },
  {
    id: 'k5',
    patente: 'QR 345 ST',
    tipo: 'tolva',
    marca: 'Scania',
    modelo: 'G 440',
    anio: 2022,
    chofer: 'Facundo Ibáñez',
    activo: true,
    viajes: 0,
  },
  {
    id: 'k6',
    patente: 'UV 678 WX',
    tipo: 'cisterna',
    marca: 'Mercedes-Benz',
    modelo: 'Axor 2544',
    anio: 2017,
    chofer: 'Sebastián Morales',
    activo: true,
    viajes: 0,
  },
]

export const VIAJES_SEED: Viaje[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    numero: 1023,
    fecha: '2025-05-10',
    fechaLleg: null,
    clienteId: 'c1',
    origen: 'Pergamino, BA',
    destino: 'Rosario, SF',
    km: 218,
    camionId: 'k1',
    tipoCargaId: 'soja',
    tipoCargaLabel: 'Soja',
    toneladas: 26.4,
    monto: 1_108_800,
    estado: 'EN_TRANSITO',
    docs: [],
    notas: 'Cliente solicita llegada antes de las 10 hs.',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    numero: 1022,
    fecha: '2025-05-09',
    fechaLleg: null,
    clienteId: 'c2',
    origen: 'Rosario, SF',
    destino: 'Buenos Aires, BA',
    km: 302,
    camionId: 'k5',
    tipoCargaId: 'maiz',
    tipoCargaLabel: 'Maíz',
    toneladas: 29.8,
    monto: 1_162_200,
    estado: 'EN_TRANSITO',
    docs: [],
    notas: '',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    numero: 1021,
    fecha: '2025-05-08',
    fechaLleg: null,
    clienteId: 'c4',
    origen: 'Córdoba, CBA',
    destino: 'Bahía Blanca, BA',
    km: 510,
    camionId: 'k3',
    tipoCargaId: 'trigo',
    tipoCargaLabel: 'Trigo',
    toneladas: 24.1,
    monto: 1_084_500,
    estado: 'ENTREGADO',
    docs: [],
    notas: '',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000004',
    numero: 1020,
    fecha: '2025-05-07',
    fechaLleg: null,
    clienteId: 'c3',
    origen: 'Junín, BA',
    destino: 'Mar del Plata, BA',
    km: 380,
    camionId: 'k2',
    tipoCargaId: 'cebada',
    tipoCargaLabel: 'Cebada',
    toneladas: 22.5,
    monto: 922_500,
    estado: 'LIQUIDADO',
    docs: [],
    notas: '',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000005',
    numero: 1019,
    fecha: '2025-05-06',
    fechaLleg: null,
    clienteId: 'c2',
    origen: 'Santa Fe, SF',
    destino: 'Córdoba, CBA',
    km: 164,
    camionId: 'k1',
    tipoCargaId: 'soja',
    tipoCargaLabel: 'Soja',
    toneladas: 27.2,
    monto: 1_033_600,
    estado: 'LIQUIDADO',
    docs: [],
    notas: '',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000006',
    numero: 1018,
    fecha: '2025-05-05',
    fechaLleg: null,
    clienteId: 'c4',
    origen: 'La Carlota, CBA',
    destino: 'Rosario, SF',
    km: 295,
    camionId: 'k5',
    tipoCargaId: 'maiz',
    tipoCargaLabel: 'Maíz',
    toneladas: 30.0,
    monto: 1_125_000,
    estado: 'CANCELADO',
    docs: [],
    notas: 'Cancelado por el cliente por problemas en destino.',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000007',
    numero: 1017,
    fecha: '2025-05-04',
    fechaLleg: null,
    clienteId: 'c1',
    origen: 'Pergamino, BA',
    destino: 'San Nicolás, BA',
    km: 145,
    camionId: 'k6',
    tipoCargaId: 'fertilizante',
    tipoCargaLabel: 'Fertilizante',
    toneladas: 18.0,
    monto: 720_000,
    estado: 'ENTREGADO',
    docs: [],
    notas: '',
  },
  {
    id: 'a0000001-0000-0000-0000-000000000008',
    numero: 1016,
    fecha: '2025-05-02',
    fechaLleg: null,
    clienteId: 'c3',
    origen: 'Trenque Lauquen, BA',
    destino: 'Rosario, SF',
    km: 430,
    camionId: 'k2',
    tipoCargaId: 'girasol',
    tipoCargaLabel: 'Girasol',
    toneladas: 25.6,
    monto: 1_075_200,
    estado: 'BORRADOR',
    docs: [],
    notas: 'Pendiente de confirmación de fecha.',
  },
]

export const TIMELINE_V1023: TimelineItem[] = [
  {
    id: 'tl1',
    estado: 'creado',
    fecha: '10/05/2025',
    hora: '07:30',
    desc: 'Viaje creado y asignado a unidad AB 123 CD.',
    usuario: 'Matías B.',
  },
  {
    id: 'tl2',
    estado: 'BORRADOR',
    fecha: '10/05/2025',
    hora: '08:15',
    desc: 'Documentación cargada: Carta de Porte N° 00123456.',
    usuario: 'Matías B.',
  },
  {
    id: 'tl3',
    estado: 'EN_TRANSITO',
    fecha: '10/05/2025',
    hora: '09:00',
    desc: 'Unidad partió desde Pergamino. Chofer confirmó salida.',
    usuario: 'Carlos P. (Chofer)',
  },
]

export const VIAJES_POR_SEMANA: WeekData[] = [
  { label: 'Lun', viajes: 4 },
  { label: 'Mar', viajes: 6 },
  { label: 'Mié', viajes: 5 },
  { label: 'Jue', viajes: 8 },
  { label: 'Vie', viajes: 7 },
  { label: 'Sáb', viajes: 3 },
  { label: 'Dom', viajes: 1 },
]

// ── DB → App mappers ──────────────────────────────────────────────────────────

export function clienteFromDB(row: ClienteDB): Cliente {
  return {
    id: row.id,
    razon: row.razon,
    alias: row.alias,
    cuit: row.cuit ?? '',
    tel: row.tel ?? '',
    localidad: row.localidad ?? '',
    activo: row.activo,
    rubro: row.rubro ?? '',
    viajes: 0,       // computed separately from viajes table
    facturado: 0,    // computed separately
  }
}

export function camionFromDB(row: CamionDB): Camion {
  return {
    id: row.id,
    patente: row.patente,
    tipo: row.tipo,
    marca: row.marca ?? '',
    modelo: row.modelo ?? '',
    anio: row.anio ?? 0,
    chofer: row.chofer ?? 'Sin asignar',
    activo: row.activo,
    viajes: 0,
    pesoMaxTon: row.peso_max_ton ?? null,
    volumenM3: row.volumen_m3 ?? null,
    grainCert: (row.grain_cert as GrainCert) ?? 'none',
    hasGps: row.has_gps ?? false,
    kmAcumulados: row.km_acumulados ?? 0,
  }
}

export function viajeFromDB(row: ViajeDB): Viaje {
  return {
    id: row.id,
    numero: row.numero,
    fecha: row.fecha,
    fechaLleg: row.fecha_lleg,
    clienteId: row.cliente_id ?? '',
    origen: row.origen,
    destino: row.destino,
    km: row.km ?? 0,
    camionId: row.camion_id ?? '',
    tipoCargaId: row.tipo_carga_id ?? '',
    tipoCargaLabel: row.tipo_carga_label ?? '',
    toneladas: Number(row.toneladas ?? 0),
    monto: Number(row.monto ?? 0),
    estado: row.estado,
    docs: row.docs ?? [],
    notas: row.notas ?? '',
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatTon(n: number): string {
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} tn`
}

export function formatKm(n: number): string {
  return `${n.toLocaleString('es-AR')} km`
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateLong(dateStr: string): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} de ${months[m - 1]} de ${y}`
}

export function clienteById(id: string, list: Cliente[]): Cliente | undefined {
  return list.find(c => c.id === id)
}

export function camionById(id: string, list: Camion[]): Camion | undefined {
  return list.find(c => c.id === id)
}

export function docById(id: TipoDoc): { label: string; icon: string } {
  return TIPOS_DOC[id]
}
