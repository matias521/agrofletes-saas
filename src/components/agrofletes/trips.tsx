'use client'
import React, { useRef, useState } from 'react'
import { Icon } from './icon'
import {
  Button,
  StatusBadge,
  ContextMenu,
  DataRow,
  Field,
  Input,
  SelectInput,
  Textarea,
  useToast,
} from './ui'
import { PageHeader, Topbar } from './layout'
import {
  EstadoKey,
  ESTADOS,
  Viaje,
  Cliente,
  Camion,
  TIPOS_CARGA,
  TIPOS_CAMION,
  TIPOS_DOC,
  TipoDoc,
  TIMELINE_V1023,
  formatMoney,
  formatDate,
  formatDateLong,
  formatTon,
  formatKm,
  clienteById,
  camionById,
} from '@/lib/agrofletes-data'

// ── WizardData type ───────────────────────────────────────────────────────────

export interface WizardData {
  clienteId: string
  nuevoClienteRazon: string
  tipoCargaId: string
  tipoCargaLabel: string
  tipoCargaCustomLabel: string
  toneladas: string
  notas: string
  camionId: string
  fechaSal: string
  fechaLleg: string
  origen: string
  destino: string
  km: string
  tarifa: string
  total: number
}

// ── TripsListPage ─────────────────────────────────────────────────────────────

interface TripsListPageProps {
  viajes: Viaje[]
  clientes: Cliente[]
  camiones: Camion[]
  onViewViaje: (v: Viaje) => void
  onNewViaje: () => void
  onUpdateEstado: (id: string, estado: EstadoKey) => void
  onDeleteViaje: (id: string) => void
}

export function TripsListPage({
  viajes,
  clientes,
  camiones,
  onViewViaje,
  onNewViaje,
  onUpdateEstado,
  onDeleteViaje,
}: TripsListPageProps) {
  const [filterEstado, setFilterEstado] = useState<EstadoKey | 'todos'>('todos')
  const [search, setSearch] = useState('')
  const [menuTarget, setMenuTarget] = useState<{ rect: { bottom: number; right: number }; viaje: Viaje } | null>(null)
  const { showToast } = useToast()

  const estadoKeys = Object.keys(ESTADOS) as EstadoKey[]

  const filtered = viajes.filter((v) => {
    const matchEstado = filterEstado === 'todos' || v.estado === filterEstado
    const q = search.toLowerCase()
    const cliente = clienteById(v.clienteId, clientes)
    const clienteNombre = cliente?.razon ?? cliente?.alias ?? ''
    const matchSearch =
      !q ||
      String(v.numero).includes(q) ||
      clienteNombre.toLowerCase().includes(q) ||
      v.origen.toLowerCase().includes(q) ||
      v.destino.toLowerCase().includes(q)
    return matchEstado && matchSearch
  })

  function openMenu(e: React.MouseEvent, viaje: Viaje) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuTarget({ rect: { bottom: rect.bottom, right: rect.right }, viaje })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Operaciones"
        title="Viajes"
        subtitle={`${viajes.length} viajes registrados`}
        actions={
          <Button variant="primary" icon="add" onClick={onNewViaje}>
            Nuevo viaje
          </Button>
        }
      />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="input-affix-wrap" style={{ width: 260 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, height: 34 }}
              placeholder="Buscar viaje, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border-soft)', margin: '0 4px' }} />

          <button
            className={`chip${filterEstado === 'todos' ? ' active' : ''}`}
            onClick={() => setFilterEstado('todos')}
          >
            Todos
            <span className="count">{viajes.length}</span>
          </button>

          {estadoKeys.map((k) => {
            const count = viajes.filter((v) => v.estado === k).length
            return (
              <button
                key={k}
                className={`chip${filterEstado === k ? ' active' : ''}`}
                onClick={() => setFilterEstado(k)}
              >
                {ESTADOS[k].label}
                <span className="count">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>N° Viaje</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Carga</th>
                <th>Toneladas</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="empty">
                      <div className="ico">
                        <Icon name="local_shipping" size={30} />
                      </div>
                      <h3>Sin resultados</h3>
                      <p>No hay viajes que coincidan con los filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <DTRow
                  key={v.id}
                  viaje={v}
                  clientes={clientes}
                  onView={() => onViewViaje(v)}
                  onMenu={(e) => openMenu(e, v)}
                />
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    Total ({filtered.length} viajes)
                  </td>
                  <td colSpan={3}>
                    <span className="money">
                      {formatMoney(filtered.reduce((a, v) => a + v.monto, 0))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Context menu */}
      {menuTarget && (
        <ContextMenu
          anchorRect={menuTarget.rect}
          onClose={() => setMenuTarget(null)}
          items={[
            {
              label: 'Ver detalle',
              icon: 'open_in_new',
              onClick: () => {
                onViewViaje(menuTarget.viaje)
              },
            },
            { separator: true },
            {
              label: 'Marcar en tránsito',
              icon: 'local_shipping',
              onClick: () => {
                onUpdateEstado(menuTarget.viaje.id, 'EN_TRANSITO')
                showToast(`Viaje #${menuTarget.viaje.numero} marcado en tránsito`)
              },
            },
            {
              label: 'Marcar entregado',
              icon: 'check_circle',
              onClick: () => {
                onUpdateEstado(menuTarget.viaje.id, 'ENTREGADO')
                showToast(`Viaje #${menuTarget.viaje.numero} marcado como entregado`)
              },
            },
            {
              label: 'Liquidar',
              icon: 'payments',
              onClick: () => {
                onUpdateEstado(menuTarget.viaje.id, 'LIQUIDADO')
                showToast(`Viaje #${menuTarget.viaje.numero} liquidado`)
              },
            },
            { separator: true },
            {
              label: 'Cancelar viaje',
              icon: 'cancel',
              danger: true,
              onClick: () => {
                onUpdateEstado(menuTarget.viaje.id, 'CANCELADO')
                showToast(`Viaje cancelado`, 'error')
              },
            },
            {
              label: 'Eliminar',
              icon: 'delete',
              danger: true,
              onClick: () => {
                onDeleteViaje(menuTarget.viaje.id)
                showToast(`Viaje eliminado`, 'error')
              },
            },
          ]}
        />
      )}
    </div>
  )
}

// ── DTRow ─────────────────────────────────────────────────────────────────────

interface DTRowProps {
  viaje: Viaje
  clientes: Cliente[]
  onView: () => void
  onMenu: (e: React.MouseEvent) => void
}

function DTRow({ viaje: v, clientes, onView, onMenu }: DTRowProps) {
  const cliente = clienteById(v.clienteId, clientes)
  const clienteNombre = cliente?.razon ?? cliente?.alias ?? '—'

  return (
    <tr style={{ cursor: 'pointer' }} onClick={onView}>
      <td>
        <span className="num" style={{ fontWeight: 600 }}>
          #{v.numero}
        </span>
      </td>
      <td className="muted">{formatDate(v.fecha)}</td>
      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {clienteNombre}
      </td>
      <td className="muted">{v.origen}</td>
      <td className="muted">{v.destino}</td>
      <td style={{ textTransform: 'capitalize' }}>{v.tipoCargaLabel || v.tipoCargaId}</td>
      <td>
        <span className="num">{v.tipoCargaId === 'cerdos' ? `${v.toneladas} cab.` : formatTon(v.toneladas)}</span>
      </td>
      <td>
        <span className="money">{formatMoney(v.monto)}</span>
      </td>
      <td>
        <StatusBadge estado={v.estado} />
      </td>
      <td>
        <div className="row-actions">
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onMenu}
            title="Opciones"
          >
            <Icon name="more_horiz" size={18} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── TripDetailPage ────────────────────────────────────────────────────────────

interface TripDetailPageProps {
  viaje: Viaje
  clientes: Cliente[]
  camiones: Camion[]
  onBack: () => void
  onUpdateEstado: (id: string, estado: EstadoKey) => void
  onAddDoc: (viajeId: string, tipoId: TipoDoc, nombre: string, file: File | null) => Promise<void>
}

// ── Doc types ─────────────────────────────────────────────────────────────────

interface ViajeDoc { tipo: TipoDoc; nombre: string; url: string }

function parseViajeDoc(s: string): ViajeDoc {
  try { return JSON.parse(s) } catch { return { tipo: 'otro', nombre: s, url: '' } }
}

// ── ViajeDocModal ──────────────────────────────────────────────────────────────

function ViajeDocModal({ viajeId, onClose, onSave }: {
  viajeId: string
  onClose: () => void
  onSave: (viajeId: string, tipoId: TipoDoc, nombre: string, file: File | null) => Promise<void>
}) {
  const tipoKeys = Object.keys(TIPOS_DOC) as TipoDoc[]
  const [tipoId, setTipoId] = useState<TipoDoc>('remito')
  const [nombre, setNombre] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!nombre.trim() && !file) return
    setSaving(true)
    await onSave(viajeId, tipoId, nombre.trim() || (file?.name ?? ''), file)
    onClose()
  }

  const tipoInfo = TIPOS_DOC[tipoId]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, width: 480, maxWidth: '100%', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            Agregar documento
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Tipo de documento *">
            <SelectInput
              value={tipoId}
              onChange={e => setTipoId(e.target.value as TipoDoc)}
              options={tipoKeys.map(k => ({ value: k, label: TIPOS_DOC[k].label }))}
            />
          </Field>

          <Field label="Nombre / número">
            <Input
              placeholder={`Ej: ${tipoId === 'carta_porte' ? 'CP 00123456' : tipoId === 'factura' ? 'FAC-A 00001-00000123' : tipoId === 'remito' ? 'REM 00001' : 'Nombre del documento'}`}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Archivo (opcional)">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1.5px dashed ${file ? 'var(--af-green)' : 'var(--border-soft)'}`, borderRadius: 8, background: file ? 'var(--af-green-bg)' : 'var(--surface-muted)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <Icon name={file ? 'check_circle' : 'upload_file'} size={18} style={{ color: file ? 'var(--af-green)' : 'var(--text-tertiary)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: file ? 'var(--af-green-press)' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file ? file.name : 'Seleccionar archivo PDF o imagen...'}
              </span>
            </button>
          </Field>
        </div>

        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || (!nombre.trim() && !file)}
          >
            <Icon name={saving ? 'hourglass_top' : tipoInfo.icon} size={15} />
            {saving ? 'Guardando...' : 'Agregar documento'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TripDetailPage({ viaje, clientes, camiones, onBack, onUpdateEstado, onAddDoc }: TripDetailPageProps) {
  const { showToast } = useToast()
  const [docModalOpen, setDocModalOpen] = useState(false)
  const timeline = TIMELINE_V1023.slice(0, 0) // empty for real trips; keep for demo
  const statusKeys = Object.keys(ESTADOS) as EstadoKey[]

  const cliente = clienteById(viaje.clienteId, clientes)
  const camion = camionById(viaje.camionId, camiones)

  function nextEstado(current: EstadoKey): EstadoKey | null {
    const flow: EstadoKey[] = ['BORRADOR', 'EN_TRANSITO', 'ENTREGADO', 'LIQUIDADO']
    const idx = flow.indexOf(current)
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
  }

  const next = nextEstado(viaje.estado)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Topbar page="viajes" subPage={`#${viaje.numero}`} onBack={onBack} />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}
            >
              Viaje #{viaje.numero}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {formatDateLong(viaje.fecha)} · {viaje.origen} → {viaje.destino}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge estado={viaje.estado} />
            {next && (
              <Button
                variant="primary"
                icon="arrow_forward"
                onClick={() => {
                  onUpdateEstado(viaje.id, next)
                  showToast(`Estado actualizado a ${ESTADOS[next].label}`)
                }}
              >
                Avanzar a {ESTADOS[next].label}
              </Button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Trip info */}
            <div className="card">
              <div className="card-header">
                <h3>Información del viaje</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <DataRow label="Cliente" value={cliente?.razon ?? cliente?.alias ?? '—'} />
                  <DataRow label="Carga" value={<span style={{ textTransform: 'capitalize' }}>{viaje.tipoCargaLabel || viaje.tipoCargaId || '—'}</span>} />
                  <DataRow label="Origen" value={viaje.origen} />
                  <DataRow label={viaje.tipoCargaId === 'cerdos' ? 'Cabezas' : 'Toneladas'} value={viaje.tipoCargaId === 'cerdos' ? `${viaje.toneladas} cab.` : formatTon(viaje.toneladas)} />
                  <DataRow label="Destino" value={viaje.destino} />
                  <DataRow label="Kilómetros" value={formatKm(viaje.km)} />
                  <DataRow label="Camión" value={camion?.patente ?? '—'} />
                  <DataRow label="Monto" value={
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {formatMoney(viaje.monto)}
                    </span>
                  } />
                  <DataRow label="Chofer" value={camion?.chofer ?? '—'} />
                </div>
                {viaje.notas && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: 'var(--surface-muted)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong>Notas: </strong>
                    {viaje.notas}
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {docModalOpen && (
              <ViajeDocModal
                viajeId={viaje.id}
                onClose={() => setDocModalOpen(false)}
                onSave={async (viajeId, tipoId, nombre, file) => {
                  await onAddDoc(viajeId, tipoId, nombre, file)
                  setDocModalOpen(false)
                }}
              />
            )}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Documentación del viaje</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Remitos, facturas, cartas de porte, seguros</div>
                </div>
                <Button variant="secondary" size="sm" icon="upload" onClick={() => setDocModalOpen(true)}>
                  Subir archivo
                </Button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viaje.docs.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Sin documentos adjuntos.
                  </div>
                ) : (
                  viaje.docs.map((raw, i) => {
                    const doc = parseViajeDoc(raw)
                    const tipoInfo = TIPOS_DOC[doc.tipo] ?? { label: doc.tipo, icon: 'description' }
                    return (
                      <div key={i} className="doc-tile">
                        <div className="doc-icon">
                          <Icon name={tipoInfo.icon} size={20} />
                        </div>
                        <div className="doc-meta">
                          <div className="doc-name">{doc.nombre || tipoInfo.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{tipoInfo.label}</div>
                        </div>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" icon="download" />
                          </a>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status change */}
            <div className="card">
              <div className="card-header">
                <h3>Cambiar estado</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {statusKeys.map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      onUpdateEstado(viaje.id, k)
                      showToast(`Estado: ${ESTADOS[k].label}`)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${viaje.estado === k ? 'var(--af-green)' : 'var(--border-soft)'}`,
                      background: viaje.estado === k ? 'var(--af-green-bg)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ESTADOS[k].dot,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ESTADOS[k].label}</span>
                    {viaje.estado === k && (
                      <Icon name="check" size={16} color="var(--af-green)" style={{ marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h3>Historial</h3>
              </div>
              <div className="card-body">
                {timeline.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Sin historial registrado.
                  </div>
                ) : (
                  <div className="timeline">
                    {timeline.map((tl, i) => {
                      const isLast = i === timeline.length - 1
                      const cls = isLast ? 'tl-item current' : 'tl-item done'
                      return (
                        <div key={tl.id} className={cls}>
                          <div className="tl-dot">
                            {!isLast && <Icon name="check" size={14} color="#fff" />}
                          </div>
                          <div className="tl-body">
                            <div className="tl-title">{tl.desc}</div>
                            <div className="tl-meta">
                              {tl.fecha} {tl.hora} · {tl.usuario}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TripWizard ────────────────────────────────────────────────────────────────

interface TripWizardProps {
  open: boolean
  clientes: Cliente[]
  camiones: Camion[]
  onClose: () => void
  onSave: (data: WizardData) => void
}

interface WizardFormData {
  clienteId: string
  nuevoClienteRazon: string
  tipoCargaId: string
  tipoCargaCustomLabel: string
  toneladas: string
  notas: string
  camionId: string
  fechaSal: string
  fechaLleg: string
  origen: string
  destino: string
  km: string
  tarifa: string
}

const EMPTY_DATA: WizardFormData = {
  clienteId: '',
  nuevoClienteRazon: '',
  tipoCargaId: '',
  tipoCargaCustomLabel: '',
  toneladas: '',
  notas: '',
  camionId: '',
  fechaSal: '',
  fechaLleg: '',
  origen: '',
  destino: '',
  km: '',
  tarifa: '',
}

export function TripWizard({ open, clientes, camiones, onClose, onSave }: TripWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardFormData>(EMPTY_DATA)
  const { showToast } = useToast()

  function set(field: keyof WizardFormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setStep(0)
    setData(EMPTY_DATA)
    onClose()
  }

  function handleSave() {
    const cargaKey = data.tipoCargaId as keyof typeof TIPOS_CARGA
    const isMaquinaria = data.tipoCargaId === 'maquinaria'
    const isCerdos = data.tipoCargaId === 'cerdos'
    const cargaLabel = isMaquinaria
      ? data.tipoCargaCustomLabel || 'Maquinaria'
      : (TIPOS_CARGA[cargaKey]?.label ?? data.tipoCargaId)
    const tons = isMaquinaria ? 0 : (parseFloat(data.toneladas) || 0)
    const tarifa = parseFloat(data.tarifa) || 0
    const total = (isMaquinaria || isCerdos) ? tarifa : Math.round(tons * tarifa)

    onSave({
      clienteId: data.clienteId,
      nuevoClienteRazon: data.nuevoClienteRazon,
      tipoCargaId: data.tipoCargaId,
      tipoCargaLabel: cargaLabel,
      tipoCargaCustomLabel: data.tipoCargaCustomLabel,
      toneladas: isMaquinaria ? '0' : data.toneladas,
      notas: data.notas,
      camionId: data.camionId,
      fechaSal: data.fechaSal || new Date().toISOString().slice(0, 10),
      fechaLleg: data.fechaLleg,
      origen: data.origen,
      destino: data.destino,
      km: data.km,
      tarifa: data.tarifa,
      total,
    })
    handleClose()
  }

  if (!open) return null

  const steps = [
    { title: 'Carga', sub: 'Cliente y mercadería' },
    { title: 'Logística', sub: 'Ruta y camión' },
    { title: 'Tarifa', sub: 'Resumen y precio' },
  ]

  const isMaquinaria = data.tipoCargaId === 'maquinaria'
  const clienteOk = !!data.clienteId && (data.clienteId !== '__new__' || !!data.nuevoClienteRazon)
  const cargaOk = !!data.tipoCargaId && (isMaquinaria ? !!data.tipoCargaCustomLabel : !!data.toneladas)
  const canNext0 = clienteOk && cargaOk
  const canNext1 = !!data.camionId && !!data.origen && !!data.destino
  const canSave = canNext0 && canNext1 && !!data.tarifa

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="modal modal-wide" onMouseDown={(e) => e.stopPropagation()}>
        {/* Modal head */}
        <div className="modal-head">
          <h2>Nuevo viaje</h2>
          <Button variant="ghost" size="sm" icon="close" onClick={handleClose} />
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div
                className={`step${i === step ? ' active' : i < step ? ' done' : ''}`}
              >
                <div className="step-circle">
                  {i < step ? <Icon name="check" size={14} color="#fff" /> : i + 1}
                </div>
                <div className="step-info">
                  <span className="step-title">{s.title}</span>
                  <span className="step-sub">{s.sub}</span>
                </div>
              </div>
              {i < steps.length - 1 && <div className="step-connector" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {step === 0 && <WizardStep1 data={data} set={set} clientes={clientes} />}
          {step === 1 && <WizardStep2 data={data} set={set} camiones={camiones} />}
          {step === 2 && <WizardStep3 data={data} set={set} clientes={clientes} camiones={camiones} />}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <Button variant="secondary" icon="arrow_back" onClick={() => setStep((s) => s - 1)}>
                Anterior
              </Button>
            )}
            {step < 2 && (
              <Button
                variant="primary"
                iconEnd="arrow_forward"
                disabled={step === 0 ? !canNext0 : !canNext1}
                onClick={() => setStep((s) => s + 1)}
              >
                Siguiente
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" icon="check" disabled={!canSave} onClick={handleSave}>
                Crear viaje
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Wizard steps ──────────────────────────────────────────────────────────────

interface StepProps {
  data: WizardFormData
  set: (field: keyof WizardFormData, value: string) => void
}

interface Step1Props extends StepProps {
  clientes: Cliente[]
}

interface Step2Props extends StepProps {
  camiones: Camion[]
}

interface Step3Props extends StepProps {
  clientes: Cliente[]
  camiones: Camion[]
}

function WizardStep1({ data, set, clientes }: Step1Props) {
  const cargaKeys = Object.keys(TIPOS_CARGA) as Array<keyof typeof TIPOS_CARGA>
  const isMaquinaria = data.tipoCargaId === 'maquinaria'
  const isCerdos = data.tipoCargaId === 'cerdos'
  const clientesActivos = clientes.filter(c => c.activo)

  const clienteOptions = [
    ...clientesActivos.map((c) => ({ value: c.id, label: c.razon || c.alias })),
    { value: '__new__', label: '+ Agregar nuevo cliente' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Cliente *">
        <SelectInput
          value={data.clienteId}
          onChange={(e) => set('clienteId', e.target.value)}
          placeholder="Seleccionar cliente..."
          options={clienteOptions}
        />
      </Field>

      {data.clienteId === '__new__' && (
        <Field key="nuevo-cliente" label="Razón social / Nombre de la empresa *">
          <Input
            placeholder="Ej: Agropecuaria Los Robles S.A."
            value={data.nuevoClienteRazon ?? ''}
            onChange={(e) => set('nuevoClienteRazon', e.target.value)}
          />
        </Field>
      )}

      <div>
        <label className="field-label">Tipo de carga *</label>
        <div className="radio-cards">
          {cargaKeys.map((k) => {
            const tc = TIPOS_CARGA[k]
            return (
              <div
                key={k}
                className={`radio-card${data.tipoCargaId === k ? ' selected' : ''}`}
                onClick={() => set('tipoCargaId', k)}
              >
                <div className="ico">
                  <Icon name={tc.icon} size={26} />
                </div>
                <span className="lbl">{tc.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {isMaquinaria ? (
        <Field key="carga-desc" label="Tipo de carga (descripción) *">
          <Input
            placeholder="Ej: Tractor New Holland, Cosechadora John Deere..."
            value={data.tipoCargaCustomLabel ?? ''}
            onChange={(e) => set('tipoCargaCustomLabel', e.target.value)}
          />
        </Field>
      ) : (
        <Field key="toneladas" label={isCerdos ? 'Cabezas (N° de animales) *' : 'Toneladas *'}>
          <Input
            type="number"
            min="0"
            step={isCerdos ? '1' : '0.1'}
            placeholder={isCerdos ? 'Ej: 120' : 'Ej: 26.5'}
            value={data.toneladas ?? ''}
            onChange={(e) => set('toneladas', e.target.value)}
          />
        </Field>
      )}

      <Field label="Notas internas">
        <Textarea
          placeholder="Instrucciones especiales, referencias, etc."
          value={data.notas}
          onChange={(e) => set('notas', e.target.value)}
        />
      </Field>
    </div>
  )
}

function WizardStep2({ data, set, camiones }: Step2Props) {
  const disponibles = camiones.filter((k) => k.activo)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Origen *">
          <Input
            placeholder="Ej: Pergamino, BA"
            value={data.origen}
            onChange={(e) => set('origen', e.target.value)}
          />
        </Field>
        <Field label="Destino *">
          <Input
            placeholder="Ej: Rosario, SF"
            value={data.destino}
            onChange={(e) => set('destino', e.target.value)}
          />
        </Field>
        <Field label="Distancia (km)">
          <Input
            type="number"
            placeholder="Ej: 218"
            value={data.km}
            onChange={(e) => set('km', e.target.value)}
          />
        </Field>
        <Field label="Fecha de salida *">
          <Input
            type="date"
            value={data.fechaSal}
            onChange={(e) => set('fechaSal', e.target.value)}
          />
        </Field>
        <Field label="Fecha de llegada">
          <Input
            type="date"
            value={data.fechaLleg}
            onChange={(e) => set('fechaLleg', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Camión asignado *">
        <SelectInput
          value={data.camionId}
          onChange={(e) => set('camionId', e.target.value)}
          placeholder="Seleccionar unidad..."
          options={disponibles.map((k) => ({
            value: k.id,
            label: `${k.patente} — ${k.marca} ${k.modelo} · ${k.chofer}`,
          }))}
        />
      </Field>

      {data.camionId && (() => {
        const c = camiones.find((k) => k.id === data.camionId)
        if (!c) return null
        return (
          <div
            style={{
              padding: 14,
              background: 'var(--af-green-bg)',
              borderRadius: 8,
              border: '1px solid var(--af-green)',
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Chofer: </span>
                <strong>{c.chofer}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Tipo: </span>
                <strong style={{ textTransform: 'capitalize' }}>{c.tipo}</strong>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function WizardStep3({ data, set, clientes, camiones }: Step3Props) {
  const isMaquinaria = data.tipoCargaId === 'maquinaria'
  const isCerdos = data.tipoCargaId === 'cerdos'
  const cliente = clientes.find((c) => c.id === data.clienteId)
  const camion = camiones.find((k) => k.id === data.camionId)
  const tons = parseFloat(data.toneladas) || 0
  const tarifa = parseFloat(data.tarifa || '0') || 0
  const total = (isMaquinaria || isCerdos) ? tarifa : Math.round(tons * tarifa)

  const clienteLabel = data.clienteId === '__new__'
    ? data.nuevoClienteRazon || '(cliente nuevo)'
    : (cliente?.razon || cliente?.alias || '—')

  const cargaLabel = isMaquinaria
    ? data.tipoCargaCustomLabel || 'Maquinaria'
    : (TIPOS_CARGA[data.tipoCargaId as keyof typeof TIPOS_CARGA]?.label || data.tipoCargaId || '—')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div className="card" style={{ margin: 0 }}>
        <div className="card-header">
          <h3>Resumen del viaje</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <DataRow label="Cliente" value={clienteLabel} />
            <DataRow label="Carga" value={<span style={{ textTransform: 'capitalize' }}>{cargaLabel}</span>} />
            <DataRow label="Origen" value={data.origen || '—'} />
            {isMaquinaria
              ? <DataRow label="Descripción" value={data.tipoCargaCustomLabel || '—'} />
              : isCerdos
                ? <DataRow label="Cabezas" value={tons ? `${tons} cab.` : '—'} />
                : <DataRow label="Toneladas" value={formatTon(tons)} />
            }
            <DataRow label="Destino" value={data.destino || '—'} />
            <DataRow label="Km" value={data.km ? `${data.km} km` : '—'} />
            <DataRow label="Camión" value={camion?.patente || '—'} />
            <DataRow label="Chofer" value={camion?.chofer || '—'} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <Field label={(isMaquinaria || isCerdos) ? 'Precio total (ARS) *' : 'Tarifa por tonelada (ARS) *'}>
        <Input
          type="number"
          min="0"
          placeholder={(isMaquinaria || isCerdos) ? 'Ej: 350000' : 'Ej: 4200'}
          value={data.tarifa}
          onChange={(e) => set('tarifa', e.target.value)}
        />
      </Field>

      {total > 0 && (
        <div
          style={{
            padding: 20,
            background: 'linear-gradient(135deg, var(--af-green-bg), var(--af-green-bg-2))',
            borderRadius: 12,
            border: '1px solid var(--af-green)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {(isMaquinaria || isCerdos) ? 'Precio final' : 'Total estimado'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--af-green-press)',
              letterSpacing: -1,
            }}
          >
            {formatMoney(total)}
          </div>
          {!isMaquinaria && !isCerdos && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {formatTon(tons)} × {formatMoney(tarifa)}/tn
            </div>
          )}
        </div>
      )}
    </div>
  )
}
