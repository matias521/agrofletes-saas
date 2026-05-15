'use client'
import React, { useState } from 'react'
import { Icon } from './icon'
import { Button, Drawer, Tabs, Field, Input, SelectInput, Textarea, DataRow, useToast } from './ui'
import { PageHeader } from './layout'
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

interface ClientesPageProps {
  clientes: Cliente[]
  viajes?: Viaje[]
}

export function ClientesPage({ clientes, viajes = [] }: ClientesPageProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
          <Button variant="primary" icon="add">
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

      {/* Drawer */}
      <ClienteDrawer
        cliente={selected}
        onClose={() => setSelectedId(null)}
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
}

interface CamionesPageProps {
  camiones: Camion[]
  viajes?: Viaje[]
  onNuevoCamion?: (data: NuevaUnidadData) => Promise<void>
}

export function CamionesPage({ camiones, viajes = [], onNuevoCamion }: CamionesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

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
    const hasViaje = viajes.some(v => v.camionId === c.id && v.estado === 'EN_TRANSITO')
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
                onClick={() => setSelectedId(c.id)}
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
          await onNuevoCamion?.(data)
          setModalOpen(false)
        }}
      />
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
}

interface NuevaUnidadModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: NuevaUnidadData) => Promise<void>
}

function NuevaUnidadModal({ open, onClose, onSave }: NuevaUnidadModalProps) {
  const [data, setData] = useState<NuevaUnidadData>(EMPTY_UNIDAD)
  const [saving, setSaving] = useState(false)
  const tipoKeys = Object.keys(TIPOS_CAMION) as TipoCamion[]

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
          <h2>Nueva unidad de flota</h2>
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

          {/* ── Sección 3: Chofer ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              Chofer asignado
            </div>
            <Field label="Nombre del chofer">
              <Input
                placeholder="Ej: Juan Pérez"
                value={data.chofer}
                onChange={(e) => set('chofer', e.target.value)}
              />
            </Field>
          </div>

          {/* ── Sección 4: Certificaciones y equipamiento ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              Certificaciones y equipamiento
            </div>

            {/* Grain cert */}
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
            {saving ? 'Guardando...' : 'Guardar unidad'}
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
          {camion.grainCert && camion.grainCert !== 'none' && (
            <DataRow
              label="Cert. granos"
              value={GRAIN_CERT_OPTIONS.find(o => o.value === camion.grainCert)?.label ?? '—'}
            />
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
              Reportes avanzados con Plan Pro
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Accedé a análisis de rentabilidad por cliente, eficiencia de flota, comparativas mensuales,
              y exportación a Excel/PDF ilimitada.
            </div>
          </div>
          <button
            style={{
              background: 'var(--af-lime)',
              color: '#0F1B0A',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Mejorar a Pro
          </button>
        </div>

        {/* Preview grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
          <PreviewCard title="Rentabilidad por cliente" icon="groups" blurred>
            <FakeBarsPreview bars={[0.6, 0.85, 0.45, 0.7, 0.9]} />
          </PreviewCard>
          <PreviewCard title="Distribución por tipo de carga" icon="scale" blurred>
            <FakePiePreview />
          </PreviewCard>
          <PreviewCard title="Eficiencia de flota" icon="directions_car" blurred>
            <FakeBarsPreview bars={[0.55, 0.75, 0.9, 0.6, 0.8, 0.4]} />
          </PreviewCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <PreviewCard title="Evolución mensual de toneladas" icon="trending_up" blurred>
            <FakeTablePreview
              headers={['Mes', 'Toneladas', 'Viajes', 'Facturación', 'Var. %']}
              rows={[
                ['Enero 2025', '1.240 tn', '42', '$ 5.2M', '+12%'],
                ['Febrero 2025', '1.080 tn', '36', '$ 4.5M', '-8%'],
                ['Marzo 2025', '1.530 tn', '51', '$ 6.4M', '+42%'],
                ['Abril 2025', '1.410 tn', '47', '$ 5.9M', '-8%'],
                ['Mayo 2025', '1.220 tn', '41', '$ 5.1M', '-13%'],
              ]}
            />
          </PreviewCard>
          <PreviewCard title="Top 5 clientes" icon="star" blurred>
            <FakeTablePreview
              headers={['Cliente', 'Fact.']}
              rows={[
                ['AgroExport CBA', '$ 27.6M'],
                ['Cerealera Norte', '$ 21.8M'],
                ['Los Robles', '$ 12.5M'],
                ['Pampero', '$ 8.2M'],
                ['Semillas PA', '$ 4.1M'],
              ]}
            />
          </PreviewCard>
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

export function ConfigPage() {
  const [tab, setTab] = useState('empresa')
  const { showToast } = useToast()

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
        {tab === 'empresa' && <EmpresaTab onSave={() => showToast('Cambios guardados')} />}
        {tab === 'usuarios' && <UsuariosTab />}
        {tab === 'plan' && <PlanTab />}
      </div>
    </div>
  )
}

// ── Config sub-tabs ───────────────────────────────────────────────────────────

function EmpresaTab({ onSave }: { onSave: () => void }) {
  const [nombre, setNombre] = useState('Transportes El Ombú S.R.L.')
  const [cuit, setCuit] = useState('30-71234567-8')
  const [email, setEmail] = useState('admin@elombu.com.ar')
  const [tel, setTel] = useState('+54 9 11 1234-5678')
  const [dir, setDir] = useState('Av. del Libertador 1234, CABA')

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <div className="card-header">
          <h3>Datos de la empresa</h3>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Razón social">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Field>
            <Field label="CUIT">
              <Input value={cuit} onChange={(e) => setCuit(e.target.value)} />
            </Field>
            <Field label="Email de contacto">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <Input value={tel} onChange={(e) => setTel(e.target.value)} />
            </Field>
          </div>
          <Field label="Dirección fiscal">
            <Input value={dir} onChange={(e) => setDir(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={onSave}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsuariosTab() {
  const users = [
    { name: 'Matías Bejegaleroux', email: 'matias@elombu.com.ar', role: 'Admin', initials: 'MB' },
    { name: 'Laura Fernández',     email: 'laura@elombu.com.ar',  role: 'Operador', initials: 'LF' },
  ]

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <h3>Usuarios del equipo</h3>
          <Button variant="primary" size="sm" icon="person_add">
            Invitar usuario
          </Button>
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
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current plan */}
      <div className="card">
        <div className="card-header">
          <h3>Plan actual</h3>
          <span
            style={{
              background: 'var(--af-green-bg)',
              color: 'var(--af-green-press)',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Free
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Viajes utilizados
              </div>
              <div
                style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--af-green-press)' }}
              >
                — / 30
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--border-soft)',
                  width: 200,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '0%',
                    background: 'var(--af-green)',
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PlanCard
          name="Free"
          price="USD 0"
          current
          features={[
            '30 viajes / mes',
            'Hasta 3 usuarios',
            'Gestión básica de flota',
            'Soporte por email',
          ]}
        />
        <PlanCard
          name="Pro"
          price="USD 79"
          highlight
          features={[
            'Viajes ilimitados',
            'Usuarios ilimitados',
            'Reportes avanzados',
            'Exportación Excel/PDF',
            'API access',
            'Soporte prioritario',
          ]}
        />
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
