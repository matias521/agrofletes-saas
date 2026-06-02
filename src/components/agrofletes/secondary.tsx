'use client'
import React, { useState, useEffect } from 'react'
import { Icon } from './icon'
import { Button, Drawer, Tabs, Field, Input, SelectInput, Textarea, DataRow, useToast } from './ui'
import { PageHeader } from './layout'
import { ChoferModal, NuevoChoferData } from './camion-detail'
import {
  Cliente,
  Camion,
  Viaje,
  TIPOS_CAMION,
  GRAIN_CERT_OPTIONS,
  GrainCert,
  TipoCamion,
  formatMoney,
  formatKm,
  formatDate,
} from '@/lib/agrofletes-data'

// ── ClientesPage ──────────────────────────────────────────────────────────────

export interface NuevoClienteData {
  razon: string
  alias: string
  cuit: string
  tel: string
  localidad: string
  rubro: string
}

interface ClientesPageProps {
  clientes: Cliente[]
  viajes?: Viaje[]
  onNuevoCliente?: (data: NuevoClienteData) => Promise<void>
}

export function ClientesPage({ clientes, viajes = [], onNuevoCliente }: ClientesPageProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.razon.toLowerCase().includes(q) ||
      c.alias.toLowerCase().includes(q) ||
      (c.cuit && c.cuit.includes(q)) ||
      (c.localidad && c.localidad.toLowerCase().includes(q))
    )
  })

  const selected = selectedId ? clientes.find((c) => c.id === selectedId) : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="CRM"
        title="Clientes"
        subtitle={`${clientes.length} clientes registrados`}
        actions={
          <Button variant="primary" icon="add" onClick={() => setShowNuevo(true)}>
            Nuevo cliente
          </Button>
        }
      />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter */}
        <div className="filter-bar">
          <div className="input-affix-wrap" style={{ width: 300 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, height: 34 }}
              placeholder="Buscar por razón social, CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" icon="filter_list">
              Filtrar
            </Button>
            <Button variant="secondary" size="sm" icon="file_download">
              Exportar
            </Button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>CUIT</th>
                <th>Localidad</th>
                <th>Viajes</th>
                <th>Facturación total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="ico">
                        <Icon name="groups" size={30} />
                      </div>
                      <h3>Sin clientes</h3>
                      <p>No se encontraron clientes con ese criterio.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: 'pointer' }}
                  className={selectedId === c.id ? 'selected' : ''}
                  onClick={() => setSelectedId(c.id)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'var(--af-green-bg)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--af-green-press)',
                        }}
                      >
                        {(c.razon || c.alias).charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{c.razon || c.alias}</span>
                    </div>
                  </td>
                  <td>
                    <span className="num">{c.cuit || '—'}</span>
                  </td>
                  <td className="muted">{c.localidad || '—'}</td>
                  <td>
                    <span className="num">{c.viajes}</span>
                  </td>
                  <td>
                    <span className="money">{formatMoney(c.facturado)}</span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: c.activo ? 'var(--st-liquidado-bg)' : 'var(--st-borrador-bg)',
                        color: c.activo ? 'var(--st-liquidado-fg)' : 'var(--st-borrador-fg)',
                      }}
                    >
                      <span
                        className="dot"
                        style={{
                          background: c.activo ? 'var(--st-liquidado-dot)' : 'var(--st-borrador-dot)',
                        }}
                      />
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" size="sm" icon="open_in_new" onClick={() => setSelectedId(c.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer ver cliente */}
      <ClienteDrawer
        cliente={selected}
        onClose={() => setSelectedId(null)}
      />

      {/* Drawer nuevo cliente */}
      <NuevoClienteDrawer
        open={showNuevo}
        onClose={() => setShowNuevo(false)}
        onSave={async (data) => {
          await onNuevoCliente?.(data)
          setShowNuevo(false)
        }}
      />
    </div>
  )
}

// ── ClienteDrawer ─────────────────────────────────────────────────────────────

interface ClienteDrawerProps {
  cliente: Cliente | null | undefined
  onClose: () => void
}

function ClienteDrawer({ cliente, onClose }: ClienteDrawerProps) {
  const [tab, setTab] = useState('info')
  if (!cliente) return null

  return (
    <Drawer
      open={!!cliente}
      onClose={onClose}
      title={cliente.razon || cliente.alias}
      subtitle={cliente.cuit ? `CUIT ${cliente.cuit}` : undefined}
    >
      <Tabs
        tabs={[
          { key: 'info', label: 'Información' },
          { key: 'viajes', label: 'Viajes' },
          { key: 'facturacion', label: 'Facturación' },
        ]}
        active={tab}
        onChange={setTab}
        style={{ marginBottom: 16, marginLeft: -20, marginRight: -20, paddingLeft: 20 }}
      />

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {cliente.alias && <DataRow label="Alias" value={cliente.alias} />}
          {cliente.tel && <DataRow label="Teléfono" value={cliente.tel} />}
          {cliente.localidad && <DataRow label="Localidad" value={cliente.localidad} />}
          {cliente.rubro && <DataRow label="Rubro" value={cliente.rubro} />}
          <DataRow
            label="Estado"
            value={
              <span
                className="badge"
                style={{
                  background: cliente.activo ? 'var(--st-liquidado-bg)' : 'var(--st-borrador-bg)',
                  color: cliente.activo ? 'var(--st-liquidado-fg)' : 'var(--st-borrador-fg)',
                }}
              >
                <span
                  className="dot"
                  style={{
                    background: cliente.activo ? 'var(--st-liquidado-dot)' : 'var(--st-borrador-dot)',
                  }}
                />
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </span>
            }
          />
          <div style={{ height: 20 }} />
          <Button variant="secondary" icon="edit">
            Editar cliente
          </Button>
        </div>
      )}

      {tab === 'viajes' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total de viajes</span>
            <span
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--af-green)' }}
            >
              {cliente.viajes}
            </span>
          </div>
          <div style={{ padding: '16px 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
            Historial detallado disponible en la sección Viajes.
          </div>
        </div>
      )}

      {tab === 'facturacion' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Facturación total</span>
            <span
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--af-green-press)' }}
            >
              {formatMoney(cliente.facturado)}
            </span>
          </div>
          <div style={{ padding: '16px 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
            Reportes financieros detallados disponibles en el módulo Reportes (Plan Pro).
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ── NuevoClienteDrawer ────────────────────────────────────────────────────────

interface NuevoClienteDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (data: NuevoClienteData) => Promise<void>
}

function NuevoClienteDrawer({ open, onClose, onSave }: NuevoClienteDrawerProps) {
  const [razon, setRazon] = useState('')
  const [alias, setAlias] = useState('')
  const [cuit, setCuit] = useState('')
  const [tel, setTel] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [rubro, setRubro] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  function reset() {
    setRazon(''); setAlias(''); setCuit(''); setTel(''); setLocalidad(''); setRubro('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!razon.trim()) return
    setSaving(true)
    try {
      await onSave({ razon: razon.trim(), alias: alias.trim() || razon.trim(), cuit: cuit.trim(), tel: tel.trim(), localidad: localidad.trim(), rubro: rubro.trim() })
      showToast('Cliente agregado.')
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onClose={() => { reset(); onClose() }} title="Nuevo cliente">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Razón Social *">
          <Input value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Empresa S.A." required />
        </Field>
        <Field label="Alias">
          <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Nombre corto" />
        </Field>
        <Field label="CUIT">
          <Input value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="20-12345678-9" />
        </Field>
        <Field label="Teléfono">
          <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+54 9 341 000-0000" />
        </Field>
        <Field label="Localidad">
          <Input value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Rosario, Santa Fe" />
        </Field>
        <Field label="Rubro">
          <Input value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="Cerealista, Acopiador..." />
        </Field>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving || !razon.trim()}>
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose() }}>
            Cancelar
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

// ── CamionesPage ──────────────────────────────────────────────────────────────

export interface NuevaUnidadData {
  patente: string
  tipo: TipoCamion | ''
  marca: string
  modelo: string
  anio: string
  chofer: string
  pesoMaxTon: string
  volumenM3: string
  grainCert: GrainCert
  hasGps: boolean
  // Acoplado
  acopladoMarca: string
  acopladoModelo: string
  acopladoAnio: string
  acopladoPesoMaxTon: string
  acopladoLargo: string
  acopladoAncho: string
  acopladoAlto: string
  acopladoCabezas: string
  acopladoPisos: string
  // Certificaciones adicionales
  catCert: boolean
  rutaCert: boolean
  haciendaCert: boolean
}

interface CamionesPageProps {
  camiones: Camion[]
  viajes?: Viaje[]
  onNuevoCamion?: (data: NuevaUnidadData) => Promise<Camion | null>
  onSaveChofer?: (camionId: string, data: NuevoChoferData) => Promise<void>
  onSelectCamion?: (c: Camion) => void
  openNewUnitModal?: boolean
}

export function CamionesPage({ camiones, viajes = [], onNuevoCamion, onSaveChofer, onSelectCamion, openNewUnitModal }: CamionesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingChoferCamion, setPendingChoferCamion] = useState<Camion | null>(null)

  useEffect(() => {
    if (openNewUnitModal) setModalOpen(true)
  }, [openNewUnitModal])

  const filtered = camiones.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.patente.toLowerCase().includes(q) ||
      c.marca.toLowerCase().includes(q) ||
      c.chofer.toLowerCase().includes(q)
    )
  })

  const selected = selectedId ? camiones.find((c) => c.id === selectedId) : null

  const estadosCamion: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
    disponible:    { label: 'Disponible',    bg: 'var(--st-liquidado-bg)',  fg: 'var(--st-liquidado-fg)',  dot: 'var(--st-liquidado-dot)' },
    en_viaje:      { label: 'En viaje',      bg: 'var(--st-transito-bg)',   fg: 'var(--st-transito-fg)',   dot: 'var(--st-transito-dot)' },
    mantenimiento: { label: 'Mantenimiento', bg: 'var(--st-cancelado-bg)',  fg: 'var(--st-cancelado-fg)',  dot: 'var(--st-cancelado-dot)' },
  }

  // Compute active status from viajes
  function getCamionEstado(c: Camion): string {
    const hasViaje = viajes.some(v => v.camionId === c.id && v.estado === 'REALIZADO')
    return hasViaje ? 'en_viaje' : 'disponible'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Flota"
        title="Camiones"
        subtitle={`${camiones.length} unidades registradas`}
        actions={
          <Button variant="primary" icon="add" onClick={() => setModalOpen(true)}>
            Nueva unidad
          </Button>
        }
      />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter */}
        <div className="filter-bar">
          <div className="input-affix-wrap" style={{ width: 260 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, height: 34 }}
              placeholder="Buscar patente, chofer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border-soft)', margin: '0 4px' }} />
          {(['disponible', 'en_viaje'] as string[]).map((k) => {
            const est = estadosCamion[k]
            const count = filtered.filter((c) => getCamionEstado(c) === k).length
            return (
              <button key={k} className="chip">
                <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: est.dot }} />
                {est.label}
                <span className="count">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((c) => {
            const estadoKey = getCamionEstado(c)
            const est = estadosCamion[estadoKey]
            const tipoKey = c.tipo as keyof typeof TIPOS_CAMION
            const tipo = TIPOS_CAMION[tipoKey] ?? { label: c.tipo, icon: 'local_shipping' }
            return (
              <div
                key={c.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selectedId === c.id ? '1.5px solid var(--af-green)' : undefined,
                  transition: 'border-color 150ms',
                }}
                onClick={() => { if (onSelectCamion) { onSelectCamion(c) } else { setSelectedId(c.id) } }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-soft)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--surface-muted)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Icon name="local_shipping" size={22} />
                    </div>
                    <div>
                      <div
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}
                      >
                        {c.patente}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {tipo.label}
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{ background: est.bg, color: est.fg }}
                  >
                    <span className="dot" style={{ background: est.dot }} />
                    {est.label}
                  </span>
                </div>
                <div
                  style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Unidad</span>
                    <span style={{ fontWeight: 500 }}>
                      {c.marca} {c.modelo} {c.anio > 0 ? c.anio : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Chofer</span>
                    <span style={{ fontWeight: 500 }}>{c.chofer}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Viajes</span>
                    <span className="num" style={{ fontWeight: 500 }}>{c.viajes}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drawer */}
      <CamionDrawer
        camion={selected}
        onClose={() => setSelectedId(null)}
      />

      {/* Nueva unidad modal */}
      <NuevaUnidadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          const camion = await onNuevoCamion?.(data)
          setModalOpen(false)
          if (camion) setPendingChoferCamion(camion)
        }}
      />

      {pendingChoferCamion && (
        <ChoferModal
          camion={pendingChoferCamion}
          chofer={null}
          onClose={() => setPendingChoferCamion(null)}
          onBack={() => { setPendingChoferCamion(null); setModalOpen(true) }}
          onSave={async (data) => {
            if (onSaveChofer) await onSaveChofer(pendingChoferCamion.id, data)
            setPendingChoferCamion(null)
          }}
        />
      )}
    </div>
  )
}

// ── NuevaUnidadModal ──────────────────────────────────────────────────────────

const EMPTY_UNIDAD: NuevaUnidadData = {
  patente: '',
  tipo: '',
  marca: '',
  modelo: '',
  anio: '',
  chofer: '',
  pesoMaxTon: '',
  volumenM3: '',
  grainCert: 'none',
  hasGps: false,
  acopladoMarca: '',
  acopladoModelo: '',
  acopladoAnio: '',
  acopladoPesoMaxTon: '',
  acopladoLargo: '',
  acopladoAncho: '',
  acopladoAlto: '',
  acopladoCabezas: '',
  acopladoPisos: '',
  catCert: false,
  rutaCert: false,
  haciendaCert: false,
}

interface NuevaUnidadModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: NuevaUnidadData) => Promise<void>
  initialData?: NuevaUnidadData
}

// Tipos que muestran certificaciones de carretón (CAT + RUTA)
const TIPOS_CARRETON: TipoCamion[] = ['carreton', 'camilla']
// Tipos que muestran cert. hacienda (SENASA hacienda)
const TIPOS_HACIENDA: TipoCamion[] = ['jaula_hacienda']
// Tipos sin acoplado propio (unidad autoportante)
const TIPOS_SIN_ACOPLADO: TipoCamion[] = ['chasis', 'hidrogua']

// Categorías de acoplado — determinan qué campos mostrar en el formulario
// Categoría 1: Máquinas + Cargas generales → Marca/Modelo/Año + Peso + Dimensiones
// Categoría 2: Animales → Marca/Modelo/Año + Peso + Cabezas + Pisos
// Categoría 3: Cereales/Fertilizantes → Marca/Modelo/Año + Peso
const TIPOS_ACOPLADO_ANIMALES: TipoCamion[] = ['jaula_hacienda']
const TIPOS_ACOPLADO_CEREALES: TipoCamion[] = ['tolva', 'acoplado', 'semirremolque']
// El resto con acoplado (carreton, camilla, plataforma, semi_playo, semi_sider, semi_batea, semi_baranda, frigorifico, cisterna)
// caen en categoría 1 (Máquinas + Cargas generales)

export function NuevaUnidadModal({ open, onClose, onSave, initialData }: NuevaUnidadModalProps) {
  const [data, setData] = useState<NuevaUnidadData>(EMPTY_UNIDAD)
  const [saving, setSaving] = useState(false)
  const tipoKeys = Object.keys(TIPOS_CAMION) as TipoCamion[]
  const isEditing = !!initialData

  useEffect(() => {
    if (open) setData(initialData ?? EMPTY_UNIDAD)
  }, [open])

  function set<K extends keyof NuevaUnidadData>(field: K, value: NuevaUnidadData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setData(EMPTY_UNIDAD)
    onClose()
  }

  async function handleSave() {
    setSaving(true)
    await onSave(data)
    setSaving(false)
    setData(EMPTY_UNIDAD)
  }

  const canSave = !!data.patente.trim() && !!data.tipo

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="modal modal-wide" onMouseDown={(e) => e.stopPropagation()}>
        {/* Head */}
        <div className="modal-head">
          <h2>{isEditing ? 'Editar unidad' : 'Nueva unidad de flota'}</h2>
          <Button variant="ghost" size="sm" icon="close" onClick={handleClose} />
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 28, maxHeight: '70vh', overflowY: 'auto' }}>

          {/* ── Sección 1: Identificación ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              Identificación
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <Field label="Patente *">
                <Input
                  placeholder="Ej: ABC 123 o AB 123 CD"
                  value={data.patente}
                  onChange={(e) => set('patente', e.target.value.toUpperCase())}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: 2, fontWeight: 700 }}
                />
              </Field>
            </div>
            <label className="field-label" style={{ marginBottom: 10, display: 'block' }}>Tipo de vehículo *</label>
            <div className="radio-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {tipoKeys.map((k) => {
                const tc = TIPOS_CAMION[k]
                return (
                  <div
                    key={k}
                    className={`radio-card${data.tipo === k ? ' selected' : ''}`}
                    onClick={() => set('tipo', k)}
                  >
                    <div className="ico">
                      <Icon name={tc.icon} size={22} />
                    </div>
                    <span className="lbl" style={{ fontSize: 11 }}>{tc.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Sección 2: Datos del vehículo ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              Datos del vehículo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16, marginBottom: 16 }}>
              <Field label="Marca">
                <Input
                  placeholder="Ej: Scania, Volvo, Mercedes..."
                  value={data.marca}
                  onChange={(e) => set('marca', e.target.value)}
                />
              </Field>
              <Field label="Modelo">
                <Input
                  placeholder="Ej: G 440, FH 460..."
                  value={data.modelo}
                  onChange={(e) => set('modelo', e.target.value)}
                />
              </Field>
              <Field label="Año">
                <Input
                  type="number"
                  placeholder="Ej: 2021"
                  min="1990"
                  max="2030"
                  value={data.anio}
                  onChange={(e) => set('anio', e.target.value)}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Peso máximo (toneladas)">
                <Input
                  type="number"
                  placeholder="Ej: 30"
                  min="0"
                  step="0.5"
                  value={data.pesoMaxTon}
                  onChange={(e) => set('pesoMaxTon', e.target.value)}
                />
              </Field>
              <Field label="Volumen (m³)">
                <Input
                  type="number"
                  placeholder="Ej: 85"
                  min="0"
                  step="1"
                  value={data.volumenM3}
                  onChange={(e) => set('volumenM3', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* ── Sección 4: Datos del acoplado ── */}
          {data.tipo && !TIPOS_SIN_ACOPLADO.includes(data.tipo as TipoCamion) && (() => {
            const esAnimales = TIPOS_ACOPLADO_ANIMALES.includes(data.tipo as TipoCamion)
            const esCereales = TIPOS_ACOPLADO_CEREALES.includes(data.tipo as TipoCamion)
            const titulo = esAnimales ? 'Datos del acoplado — Animales' : esCereales ? 'Datos del acoplado — Cereales / Fertilizantes' : 'Datos del acoplado — Cargas'
            return (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                  {titulo}
                </div>
                {/* Marca / Modelo / Año — común a las 3 categorías */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16, marginBottom: 16 }}>
                  <Field label="Marca">
                    <Input
                      placeholder="Ej: Bañado, Agroinox..."
                      value={data.acopladoMarca}
                      onChange={(e) => set('acopladoMarca', e.target.value)}
                    />
                  </Field>
                  <Field label="Modelo">
                    <Input
                      placeholder={esAnimales ? 'Ej: Jaula 3 pisos' : esCereales ? 'Ej: Tolva 3 ejes' : 'Ej: Plataforma extensible'}
                      value={data.acopladoModelo}
                      onChange={(e) => set('acopladoModelo', e.target.value)}
                    />
                  </Field>
                  <Field label="Año">
                    <Input
                      type="number"
                      placeholder="2018"
                      min="1990"
                      max="2030"
                      value={data.acopladoAnio}
                      onChange={(e) => set('acopladoAnio', e.target.value)}
                    />
                  </Field>
                </div>

                {/* Categoría 1: Máquinas + Cargas generales → Peso + Dimensiones */}
                {!esAnimales && !esCereales && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                    <Field label="Tn máximas">
                      <Input type="number" placeholder="32" min="0" step="0.5" value={data.acopladoPesoMaxTon} onChange={(e) => set('acopladoPesoMaxTon', e.target.value)} />
                    </Field>
                    <Field label="Largo (m)">
                      <Input type="number" placeholder="14.5" min="0" step="0.1" value={data.acopladoLargo} onChange={(e) => set('acopladoLargo', e.target.value)} />
                    </Field>
                    <Field label="Ancho (m)">
                      <Input type="number" placeholder="2.6" min="0" step="0.05" value={data.acopladoAncho} onChange={(e) => set('acopladoAncho', e.target.value)} />
                    </Field>
                    <Field label="Alto (m)">
                      <Input type="number" placeholder="3.2" min="0" step="0.05" value={data.acopladoAlto} onChange={(e) => set('acopladoAlto', e.target.value)} />
                    </Field>
                  </div>
                )}

                {/* Categoría 2: Animales → Peso + Cabezas + Pisos */}
                {esAnimales && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <Field label="Tn máximas">
                      <Input type="number" placeholder="20" min="0" step="0.5" value={data.acopladoPesoMaxTon} onChange={(e) => set('acopladoPesoMaxTon', e.target.value)} />
                    </Field>
                    <Field label="N° cabezas (bovinos)">
                      <Input type="number" placeholder="Ej: 24" min="1" value={data.acopladoCabezas} onChange={(e) => set('acopladoCabezas', e.target.value)} />
                    </Field>
                    <Field label="Pisos">
                      <SelectInput
                        options={[{ value: '1', label: '1 piso' }, { value: '2', label: '2 pisos' }, { value: '3', label: '3 pisos' }]}
                        value={data.acopladoPisos || '1'}
                        onChange={(e) => set('acopladoPisos', e.target.value)}
                      />
                    </Field>
                  </div>
                )}

                {/* Categoría 3: Cereales/Fertilizantes → solo Peso */}
                {esCereales && (
                  <div style={{ display: 'grid', gridTemplateColumns: '160px', gap: 16 }}>
                    <Field label="Tn máximas">
                      <Input type="number" placeholder="32" min="0" step="0.5" value={data.acopladoPesoMaxTon} onChange={(e) => set('acopladoPesoMaxTon', e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Sección 5: Certificaciones y equipamiento ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              Certificaciones y equipamiento
            </div>

            {/* Cert. carretón: CAT + RUTA */}
            {data.tipo && TIPOS_CARRETON.includes(data.tipo as TipoCamion) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <label className="field-label" style={{ marginBottom: 4, display: 'block' }}>Habilitaciones de carretón</label>
                {[
                  { field: 'catCert' as const, label: 'CAT', desc: 'Certificado de Aptitud Técnica' },
                  { field: 'rutaCert' as const, label: 'Permiso de Ruta', desc: 'Habilitación para circulación en rutas provinciales/nacionales' },
                ].map(({ field, label, desc }) => (
                  <div
                    key={field}
                    onClick={() => set(field, !data[field])}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: `1.5px solid ${data[field] ? 'var(--af-green)' : 'var(--border-soft)'}`,
                      background: data[field] ? 'var(--af-green-bg)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{desc}</div>
                    </div>
                    <div
                      style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: data[field] ? 'var(--af-green)' : 'var(--border-strong)',
                        position: 'relative', transition: 'background 200ms', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, left: data[field] ? 21 : 3,
                        transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cert. hacienda */}
            {data.tipo && TIPOS_HACIENDA.includes(data.tipo as TipoCamion) && (
              <div style={{ marginBottom: 20 }}>
                <label className="field-label" style={{ marginBottom: 10, display: 'block' }}>Certificación hacienda</label>
                <div
                  onClick={() => set('haciendaCert', !data.haciendaCert)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${data.haciendaCert ? 'var(--af-green)' : 'var(--border-soft)'}`,
                    background: data.haciendaCert ? 'var(--af-green-bg)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>SENASA Hacienda</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Habilitado para transporte de animales en pie</div>
                  </div>
                  <div
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: data.haciendaCert ? 'var(--af-green)' : 'var(--border-strong)',
                      position: 'relative', transition: 'background 200ms', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: data.haciendaCert ? 21 : 3,
                      transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* Cert. granos (resto de tipos) */}
            {(!data.tipo || (!TIPOS_CARRETON.includes(data.tipo as TipoCamion) && !TIPOS_HACIENDA.includes(data.tipo as TipoCamion))) && (
              <>
                <label className="field-label" style={{ marginBottom: 10, display: 'block' }}>Certificación de granos</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                  {GRAIN_CERT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => set('grainCert', opt.value)}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${data.grainCert === opt.value ? 'var(--af-green)' : 'var(--border-soft)'}`,
                        background: data.grainCert === opt.value ? 'var(--af-green-bg)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* GPS toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 10,
                border: `1.5px solid ${data.hasGps ? 'var(--af-green)' : 'var(--border-soft)'}`,
                background: data.hasGps ? 'var(--af-green-bg)' : '#fff',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onClick={() => set('hasGps', !data.hasGps)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="location_on" size={20} color={data.hasGps ? 'var(--af-green-press)' : 'var(--text-tertiary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>GPS instalado</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>El vehículo cuenta con rastreo GPS activo</div>
                </div>
              </div>
              {/* Toggle */}
              <div
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: data.hasGps ? 'var(--af-green)' : 'var(--border-strong)',
                  position: 'relative',
                  transition: 'background 200ms',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: data.hasGps ? 21 : 3,
                    transition: 'left 200ms',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon="check"
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar unidad'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── CamionDrawer ──────────────────────────────────────────────────────────────

interface CamionDrawerProps {
  camion: Camion | null | undefined
  onClose: () => void
}

function CamionDrawer({ camion, onClose }: CamionDrawerProps) {
  const [tab, setTab] = useState('info')
  if (!camion) return null

  const tipoKey = camion.tipo as keyof typeof TIPOS_CAMION
  const tipo = TIPOS_CAMION[tipoKey] ?? { label: camion.tipo, icon: 'local_shipping' }

  return (
    <Drawer
      open={!!camion}
      onClose={onClose}
      title={camion.patente}
      subtitle={`${camion.marca} ${camion.modelo}${camion.anio > 0 ? ' ' + camion.anio : ''}`}
    >
      <Tabs
        tabs={[
          { key: 'info', label: 'Datos' },
        ]}
        active={tab}
        onChange={setTab}
        style={{ marginBottom: 16, marginLeft: -20, marginRight: -20, paddingLeft: 20 }}
      />

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DataRow label="Tipo" value={tipo.label} />
          <DataRow label="Marca / Modelo" value={`${camion.marca} ${camion.modelo}`.trim() || '—'} />
          {camion.anio > 0 && <DataRow label="Año" value={String(camion.anio)} />}
          <DataRow label="Chofer asignado" value={camion.chofer || '—'} />
          {camion.pesoMaxTon != null && (
            <DataRow label="Peso máximo" value={`${camion.pesoMaxTon} tn`} />
          )}
          {camion.volumenM3 != null && (
            <DataRow label="Volumen" value={`${camion.volumenM3} m³`} />
          )}

          {/* Acoplado */}
          {(camion.acopladoMarca || camion.acopladoModelo) && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '14px 0 6px' }}>
                Acoplado / Remolque
              </div>
              <DataRow label="Marca / Modelo" value={`${camion.acopladoMarca ?? ''} ${camion.acopladoModelo ?? ''}`.trim() || '—'} />
              {camion.acopladoAnio && camion.acopladoAnio > 0 && <DataRow label="Año" value={String(camion.acopladoAnio)} />}
              {camion.acopladoPesoMaxTon != null && <DataRow label="Tn máximas" value={`${camion.acopladoPesoMaxTon} tn`} />}
              {(camion.acopladoLargo || camion.acopladoAncho || camion.acopladoAlto) && (
                <DataRow
                  label="Medidas"
                  value={[
                    camion.acopladoLargo ? `${camion.acopladoLargo}m largo` : null,
                    camion.acopladoAncho ? `${camion.acopladoAncho}m ancho` : null,
                    camion.acopladoAlto  ? `${camion.acopladoAlto}m alto`  : null,
                  ].filter(Boolean).join(' · ')}
                />
              )}
            </>
          )}

          {/* Certificaciones */}
          {TIPOS_CARRETON.includes(camion.tipo as TipoCamion) ? (
            <>
              <DataRow label="CAT" value={camion.catCert ? 'Vigente' : 'Sin habilitación'} />
              <DataRow label="Permiso de Ruta" value={camion.rutaCert ? 'Vigente' : 'Sin habilitación'} />
            </>
          ) : TIPOS_HACIENDA.includes(camion.tipo as TipoCamion) ? (
            <DataRow label="SENASA Hacienda" value={camion.haciendaCert ? 'Habilitado' : 'Sin habilitación'} />
          ) : (
            camion.grainCert && camion.grainCert !== 'none' && (
              <DataRow
                label="Cert. granos"
                value={GRAIN_CERT_OPTIONS.find(o => o.value === camion.grainCert)?.label ?? '—'}
              />
            )
          )}

          <DataRow
            label="GPS"
            value={
              <span style={{ fontSize: 13, fontWeight: 500, color: camion.hasGps ? 'var(--af-green-press)' : 'var(--text-tertiary)' }}>
                {camion.hasGps ? 'Instalado' : 'No'}
              </span>
            }
          />
          <DataRow label="Viajes realizados" value={String(camion.viajes)} />
          <DataRow
            label="Estado"
            value={
              <span className="badge" style={{ background: 'var(--st-liquidado-bg)', color: 'var(--st-liquidado-fg)' }}>
                <span className="dot" style={{ background: 'var(--st-liquidado-dot)' }} />
                {camion.activo ? 'Activo' : 'Inactivo'}
              </span>
            }
          />
          <div style={{ height: 20 }} />
          <Button variant="secondary" icon="edit">
            Editar unidad
          </Button>
        </div>
      )}
    </Drawer>
  )
}

// ── ReportesPage ──────────────────────────────────────────────────────────────

export function ReportesPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Analítica"
        title="Reportes"
        subtitle="Visualizaciones y exportaciones avanzadas"
      />
      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Pro CTA */}
        <div
          style={{
            padding: 32,
            background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1A3010 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            marginBottom: 28,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(139, 223, 17, 0.06)',
            }}
          />
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: 'rgba(139, 223, 17, 0.15)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="bar_chart" size={30} color="var(--af-lime)" />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: -0.2,
              }}
            >
              Próximamente
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Estamos trabajando en reportes avanzados de rentabilidad, eficiencia de flota y exportaciones.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Fake preview helpers ──────────────────────────────────────────────────────

function PreviewCard({
  title,
  icon,
  children,
  blurred,
}: {
  title: string
  icon: string
  children: React.ReactNode
  blurred?: boolean
}) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="card-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={16} color="var(--af-green)" />
          {title}
        </h3>
        <span
          style={{
            background: 'var(--af-green-bg)',
            color: 'var(--af-green-press)',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Pro
        </span>
      </div>
      <div className="card-body" style={{ position: 'relative' }}>
        {children}
        {blurred && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(4px)',
              background: 'rgba(247,248,245,0.7)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Icon name="lock" size={24} color="var(--text-tertiary)" />
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                Disponible en Plan Pro
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FakeBarsPreview({ bars }: { bars: number[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h * 100}%`,
            background: 'linear-gradient(180deg, var(--af-lime), var(--af-green))',
            borderRadius: '4px 4px 0 0',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

function FakePiePreview() {
  const slices = [
    { color: 'var(--af-green)', pct: 35 },
    { color: 'var(--af-lime)', pct: 25 },
    { color: '#4A8C00', pct: 20 },
    { color: '#B8EE6A', pct: 12 },
    { color: 'var(--border-strong)', pct: 8 },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `conic-gradient(
            var(--af-green) 0% 35%,
            var(--af-lime) 35% 60%,
            #4A8C00 60% 80%,
            #B8EE6A 80% 92%,
            var(--border-strong) 92% 100%
          )`,
          flexShrink: 0,
          opacity: 0.7,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {['Soja', 'Maíz', 'Trigo', 'Girasol', 'Otros'].map((l, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: slices[i].color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{slices[i].pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FakeTablePreview({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                padding: '6px 8px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                borderBottom: '1px solid var(--border-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  padding: '7px 8px',
                  borderBottom: '1px solid var(--border-soft)',
                  color: 'var(--text-primary)',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── ConfigPage ────────────────────────────────────────────────────────────────

interface ConfigData {
  empresaNombre: string
  empresaCuit: string
  empresaCiudad: string
  userNombre: string
  userEmail: string
}

export function ConfigPage() {
  const [tab, setTab] = useState('empresa')
  const { showToast } = useToast()
  const [configData, setConfigData] = useState<ConfigData | null>(null)

  useEffect(() => {
    const load = async () => {
      const { createClient: mkClient } = await import('@/lib/supabase')
      const supabase = mkClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      const meta = user.user_metadata ?? {}
      setConfigData({
        empresaNombre: perfil?.empresa_nombre && perfil.empresa_nombre !== 'Mi Empresa'
          ? perfil.empresa_nombre
          : (meta.empresa_nombre ?? ''),
        empresaCuit: perfil?.empresa_cuit ?? '',
        empresaCiudad: perfil?.empresa_ciudad ?? '',
        userNombre: meta.nombre_completo ?? '',
        userEmail: user.email ?? '',
      })
    }
    load()
  }, [])

  async function handleSaveEmpresa(data: { nombre: string; cuit: string; ciudad: string }) {
    const { createClient: mkClient } = await import('@/lib/supabase')
    const supabase = mkClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('perfiles').update({
      empresa_nombre: data.nombre,
      empresa_cuit: data.cuit,
      empresa_ciudad: data.ciudad,
    }).eq('id', user.id)
    if (!error) {
      setConfigData((prev) => prev ? { ...prev, empresaNombre: data.nombre, empresaCuit: data.cuit, empresaCiudad: data.ciudad } : prev)
      showToast('Cambios guardados')
    } else {
      showToast('Error al guardar: ' + error.message)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        subtitle="Ajustes de la empresa y del sistema"
      />

      <div style={{ padding: '0 32px' }}>
        <Tabs
          tabs={[
            { key: 'empresa', label: 'Empresa', icon: 'business' },
            { key: 'usuarios', label: 'Usuarios', icon: 'manage_accounts' },
            { key: 'plan', label: 'Plan & Billing', icon: 'credit_card' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'empresa' && <EmpresaTab data={configData} onSave={handleSaveEmpresa} />}
        {tab === 'usuarios' && <UsuariosTab data={configData} />}
        {tab === 'plan' && <PlanTab />}
      </div>
    </div>
  )
}

// ── Config sub-tabs ───────────────────────────────────────────────────────────

function EmpresaTab({ data, onSave }: { data: ConfigData | null; onSave: (d: { nombre: string; cuit: string; ciudad: string }) => Promise<void> }) {
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setNombre(data.empresaNombre)
      setCuit(data.empresaCuit)
      setCiudad(data.empresaCiudad)
    }
  }, [data])

  async function handleSave() {
    setSaving(true)
    await onSave({ nombre, cuit, ciudad })
    setSaving(false)
  }

  if (!data) return <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 14 }}>Cargando...</div>

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <div className="card-header">
          <h3>Datos de la empresa</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Razón social">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la empresa" />
            </Field>
            <Field label="CUIT">
              <Input value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="30-00000000-0" />
            </Field>
          </div>
          <Field label="Ciudad">
            <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad, Provincia" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsuariosTab({ data }: { data: ConfigData | null }) {
  if (!data) return <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 14 }}>Cargando...</div>

  const initials = data.userNombre
    ? data.userNombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : data.userEmail.slice(0, 2).toUpperCase()

  const users = [
    { name: data.userNombre || data.userEmail, email: data.userEmail, role: 'Admin', initials },
  ]

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <h3>Usuarios del equipo</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {users.map((u) => (
            <div
              key={u.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: 'var(--font-display)',
                  flexShrink: 0,
                }}
              >
                {u.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.email}</div>
              </div>
              <span
                style={{
                  background: u.role === 'Admin' ? 'var(--af-green-bg)' : 'var(--surface-muted)',
                  color: u.role === 'Admin' ? 'var(--af-green-press)' : 'var(--text-secondary)',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                }}
              >
                {u.role}
              </span>
              <Button variant="ghost" size="sm" icon="more_horiz" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanTab() {
  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 16, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center' }}>
        <Icon name="credit_card" size={28} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
        Próximamente
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 340 }}>
        La gestión de plan y facturación estará disponible pronto.
      </div>
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  current,
  highlight,
}: {
  name: string
  price: string
  features: string[]
  current?: boolean
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        border: `1.5px solid ${highlight ? 'var(--af-green)' : 'var(--border-soft)'}`,
        background: highlight ? 'var(--af-green-bg)' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {name}
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>
            {price}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> / mes</span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Icon name="check" size={16} color="var(--af-green)" />
            {f}
          </li>
        ))}
      </ul>
      {current ? (
        <div
          style={{
            textAlign: 'center',
            padding: '8px',
            background: 'var(--surface-muted)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          Plan actual
        </div>
      ) : (
        <button
          style={{
            background: 'var(--af-green)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
        >
          Cambiar a {name}
        </button>
      )}
    </div>
  )
}
