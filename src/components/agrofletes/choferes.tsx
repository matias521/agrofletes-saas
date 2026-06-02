'use client'
import React, { useState } from 'react'
import { Icon } from './icon'
import { Button, Field, Input, SelectInput, useToast } from './ui'
import { Topbar } from './layout'
import {
  Chofer, Camion, Viaje, Cliente,
  estadoVencimiento, formatDate, formatMoney, formatKm, formatTon,
} from '@/lib/agrofletes-data'
import type { NuevoChoferData } from './camion-detail'

// ── Helpers ───────────────────────────────────────────────────────────────────

const LIC_CATS = ['E', 'E1', 'E2', 'E3', 'D', 'D1', 'D2', 'D3', 'F', 'Otra']

function VencBadge({ iso, compact }: { iso: string; compact?: boolean }) {
  if (!iso) return <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sin fecha</span>
  const st = estadoVencimiento(iso)
  const map = {
    vigente:    { bg: 'var(--st-entregado-bg)', fg: 'var(--st-entregado-fg)', dot: 'var(--st-entregado-dot)' },
    por_vencer: { bg: '#FFF3E0', fg: '#B25800', dot: '#F57C00' },
    vencido:    { bg: 'var(--st-cancelado-bg)', fg: 'var(--st-cancelado-fg)', dot: 'var(--st-cancelado-dot)' },
  }[st.kind]
  const label = compact
    ? (st.kind === 'vencido' ? `Venc. −${Math.abs(st.dias)}d` : st.kind === 'por_vencer' ? `Vence ${st.dias}d` : 'OK')
    : (st.kind === 'vencido' ? `Vencido hace ${Math.abs(st.dias)}d` : st.kind === 'por_vencer' ? `Vence en ${st.dias}d` : 'Vigente')
  return (
    <span className="badge" style={{ background: map.bg, color: map.fg }}>
      <span className="dot" style={{ background: map.dot }} />
      {label}
    </span>
  )
}

function DocAlertChip({ label, iso }: { label: string; iso: string }) {
  if (!iso) return null
  const st = estadoVencimiento(iso)
  if (st.kind === 'vigente') return null
  const color = st.kind === 'vencido' ? 'var(--st-cancelado-fg)' : '#B25800'
  const bg = st.kind === 'vencido' ? 'var(--st-cancelado-bg)' : '#FFF3E0'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: bg, color, fontSize: 11, fontWeight: 600 }}>
      <Icon name="warning" size={12} />
      {label}
    </span>
  )
}

// ── ChoferCard ────────────────────────────────────────────────────────────────

function ChoferCard({ chofer, camion, onClick }: { chofer: Chofer; camion?: Camion; onClick: () => void }) {
  const alerts = [
    { label: 'Licencia', iso: chofer.licencia.venc },
    { label: 'Psicofísico', iso: chofer.psicofisico.venc },
    { label: 'Libreta', iso: chofer.libretaSanidad.venc },
  ].filter(a => a.iso && estadoVencimiento(a.iso).kind !== 'vigente')

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-card)',
        border: `1.5px solid ${!chofer.activo ? 'var(--border-soft)' : alerts.length > 0 ? 'var(--st-cancelado-dot)' : 'var(--border-soft)'}`,
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        opacity: chofer.activo ? 1 : 0.6,
        transition: 'box-shadow 150ms, transform 150ms',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; (e.currentTarget as HTMLDivElement).style.transform = '' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: chofer.activo ? 'linear-gradient(135deg, var(--af-green), var(--af-lime))' : 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: chofer.activo ? '#fff' : 'var(--text-tertiary)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
          {chofer.iniciales}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chofer.nombre}
          </div>
          {chofer.dni && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>DNI {chofer.dni}</div>
          )}
        </div>
        {!chofer.activo && (
          <span className="badge" style={{ background: 'var(--surface-muted)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
            <span className="dot" style={{ background: 'var(--text-tertiary)' }} />
            Inactivo
          </span>
        )}
      </div>

      {/* Camion badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="local_shipping" size={15} style={{ color: camion ? 'var(--af-green-press)' : 'var(--text-tertiary)' }} />
        {camion ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--af-green-press)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{camion.patente}</span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin asignar</span>
        )}
      </div>

      {/* Alert chips */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {alerts.map(a => <DocAlertChip key={a.label} label={a.label} iso={a.iso} />)}
        </div>
      )}
    </div>
  )
}

// ── ChoferesPage ──────────────────────────────────────────────────────────────

interface ChoferesPageProps {
  choferes: Chofer[]
  camiones: Camion[]
  onViewChofer: (c: Chofer) => void
  onNewChofer: () => void
}

export function ChoferesPage({ choferes, camiones, onViewChofer, onNewChofer }: ChoferesPageProps) {
  const [filter, setFilter] = useState<'todos' | 'activos' | 'inactivos'>('activos')
  const [asignFilter, setAsignFilter] = useState<'todos' | 'asignados' | 'libres'>('todos')

  const visible = choferes
    .filter(c => filter === 'todos' ? true : filter === 'activos' ? c.activo : !c.activo)
    .filter(c => asignFilter === 'todos' ? true : asignFilter === 'asignados' ? !!c.camionId : !c.camionId)

  const totalActivos = choferes.filter(c => c.activo).length
  const totalConCamion = choferes.filter(c => c.activo && c.camionId).length
  const totalLibres = choferes.filter(c => c.activo && !c.camionId).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="page-header">
        <div className="title-block">
          <div className="eyebrow">Gestión de flota</div>
          <h1>Choferes</h1>
          <p className="subtitle">{totalActivos} activo{totalActivos !== 1 ? 's' : ''} · {totalConCamion} asignado{totalConCamion !== 1 ? 's' : ''} · {totalLibres} libre{totalLibres !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" icon="person_add" onClick={onNewChofer}>Nuevo chofer</Button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-muted)', borderRadius: 10, padding: 3 }}>
            {(['activos', 'todos', 'inactivos'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: filter === f ? 'var(--surface-card)' : 'transparent', color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)', boxShadow: filter === f ? 'var(--shadow-card)' : 'none', transition: 'all 150ms' }}
              >
                {f === 'activos' ? 'Activos' : f === 'todos' ? 'Todos' : 'Inactivos'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-muted)', borderRadius: 10, padding: 3 }}>
            {(['todos', 'asignados', 'libres'] as const).map(f => (
              <button
                key={f}
                onClick={() => setAsignFilter(f)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: asignFilter === f ? 'var(--surface-card)' : 'transparent', color: asignFilter === f ? 'var(--text-primary)' : 'var(--text-tertiary)', boxShadow: asignFilter === f ? 'var(--shadow-card)' : 'none', transition: 'all 150ms' }}
              >
                {f === 'todos' ? 'Todos' : f === 'asignados' ? 'Con camión' : 'Libres'}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <div className="ico"><Icon name="badge" /></div>
            <h3>Sin choferes{filter !== 'todos' ? ' en esta categoría' : ''}</h3>
            <p>{filter === 'activos' && choferes.length === 0 ? 'Registrá tu primer chofer para empezar.' : 'Probá cambiando el filtro.'}</p>
            {choferes.length === 0 && (
              <div style={{ marginTop: 16 }}>
                <Button variant="primary" icon="person_add" onClick={onNewChofer}>Nuevo chofer</Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {visible.map(c => (
              <ChoferCard
                key={c.id}
                chofer={c}
                camion={camiones.find(k => k.id === c.camionId)}
                onClick={() => onViewChofer(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ChoferDetailPage ──────────────────────────────────────────────────────────

interface ChoferDetailPageProps {
  chofer: Chofer
  camiones: Camion[]
  viajes: Viaje[]
  clientes: Cliente[]
  onBack: () => void
  onEdit: () => void
  onToggleActivo: (choferId: string, activo: boolean) => Promise<void>
  onAsignarCamion: (choferId: string, camionId: string) => Promise<void>
  onDesvincular: (choferId: string) => Promise<void>
}

export function ChoferDetailPage({ chofer, camiones, viajes, clientes, onBack, onEdit, onToggleActivo, onAsignarCamion, onDesvincular }: ChoferDetailPageProps) {
  const { showToast } = useToast()
  const [asignarOpen, setAsignarOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)

  const camionAsignado = camiones.find(c => c.id === chofer.camionId) ?? null
  const camionesLibres = camiones.filter(c => !viajes.some(() => false) && c.activo)
    .filter(c => {
      if (c.id === chofer.camionId) return false
      return true
    })

  const choferViajes = viajes.filter(v => chofer.camionId && v.camionId === chofer.camionId)

  async function handleToggle() {
    setToggling(true)
    await onToggleActivo(chofer.id, !chofer.activo)
    setToggling(false)
  }

  async function handleDesvincular() {
    if (!confirm(`¿Desvincular a ${chofer.nombre} del camión ${camionAsignado?.patente}?`)) return
    setDesvinculando(true)
    await onDesvincular(chofer.id)
    setDesvinculando(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Topbar />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 8, width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <div style={{ width: 56, height: 56, borderRadius: '50%', background: chofer.activo ? 'linear-gradient(135deg, var(--af-green), var(--af-lime))' : 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: chofer.activo ? '#fff' : 'var(--text-tertiary)', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
            {chofer.iniciales}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{chofer.nombre}</div>
              <span className="badge" style={{ background: chofer.activo ? 'var(--st-entregado-bg)' : 'var(--surface-muted)', color: chofer.activo ? 'var(--st-entregado-fg)' : 'var(--text-tertiary)' }}>
                <span className="dot" style={{ background: chofer.activo ? 'var(--st-entregado-dot)' : 'var(--text-tertiary)' }} />
                {chofer.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {chofer.dni ? `DNI ${chofer.dni}` : 'Sin DNI cargado'}
              {camionAsignado ? ` · Asignado a ${camionAsignado.patente}` : ' · Sin camión asignado'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Button variant="secondary" icon="edit" onClick={onEdit}>Editar</Button>
            <Button
              variant={chofer.activo ? 'danger' : 'secondary'}
              icon={chofer.activo ? 'person_off' : 'person'}
              onClick={handleToggle}
              disabled={toggling}
            >
              {chofer.activo ? 'Dar de baja' : 'Reactivar'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Datos personales */}
            <div className="card">
              <div className="card-header"><h3>Datos personales</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <DetailRow label="Nombre completo" value={chofer.nombre} />
                  <DetailRow label="DNI" value={chofer.dni || '—'} mono />
                  {chofer.tel && <DetailRow label="Teléfono" value={chofer.tel} mono />}
                  {chofer.email && <DetailRow label="Email" value={chofer.email} />}
                  {chofer.direccion && <DetailRow label="Dirección" value={chofer.direccion} />}
                  {chofer.fechaNac && <DetailRow label="Fecha de nacimiento" value={formatDate(chofer.fechaNac)} />}
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div className="card">
              <div className="card-header"><h3>Documentación</h3></div>
              <div className="card-body" style={{ padding: 0 }}>
                {[
                  { label: 'Licencia de conducir', detail: chofer.licencia.cat ? `Cat. ${chofer.licencia.cat}${chofer.licencia.numero ? ` · ${chofer.licencia.numero}` : ''}` : '', iso: chofer.licencia.venc, icon: 'local_police' },
                  { label: 'Psicofísico', detail: '', iso: chofer.psicofisico.venc, icon: 'medical_services' },
                  { label: 'Libreta de sanidad', detail: '', iso: chofer.libretaSanidad.venc, icon: 'health_and_safety' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name={item.icon} size={18} style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                        {item.detail && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{item.detail}</div>}
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                          {item.iso ? `Vence ${formatDate(item.iso)}` : 'Sin fecha cargada'}
                        </div>
                      </div>
                    </div>
                    <VencBadge iso={item.iso} />
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de viajes */}
            <div className="card">
              <div className="card-header">
                <h3>Historial de viajes</h3>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {camionAsignado ? `Viajes de ${camionAsignado.patente}` : 'Sin camión asignado'}
                </span>
              </div>
              {choferViajes.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>
                  <div className="ico"><Icon name="route" /></div>
                  <h3>Sin viajes</h3>
                  <p>{chofer.camionId ? 'Este camión todavía no realizó viajes.' : 'Asigná un camión para ver el historial.'}</p>
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha</th>
                      <th>Ruta</th>
                      <th>Carga</th>
                      <th style={{ textAlign: 'right' }}>Ton.</th>
                      <th style={{ textAlign: 'right' }}>Km</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {choferViajes.slice(0, 20).map(v => {
                      const cli = clientes.find(c => c.id === v.clienteId)
                      return (
                        <tr key={v.id}>
                          <td className="num muted">#{v.numero}</td>
                          <td className="muted">{formatDate(v.fecha)}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{v.origen} → {v.destino}</td>
                          <td className="muted">{v.tipoCargaLabel || '—'}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatTon(v.toneladas)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatKm(v.km)}</td>
                          <td className="money" style={{ textAlign: 'right' }}>{formatMoney(v.monto)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Camion asignado */}
            <div className="card">
              <div className="card-header"><h3>Camión asignado</h3></div>
              <div className="card-body">
                {camionAsignado ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon name="local_shipping" size={22} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{camionAsignado.patente}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{camionAsignado.marca} {camionAsignado.modelo}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" icon="swap_horiz" onClick={() => setAsignarOpen(true)}>Cambiar</Button>
                      <Button variant="danger" size="sm" icon="link_off" onClick={handleDesvincular} disabled={desvinculando}>Desvincular</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <div style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      <Icon name="local_shipping" size={28} />
                      <div style={{ fontSize: 13, marginTop: 6 }}>Sin camión asignado</div>
                    </div>
                    <Button variant="primary" size="sm" icon="add_link" onClick={() => setAsignarOpen(true)}>Asignar camión</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="card">
              <div className="card-header"><h3>Actividad</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 14, background: 'var(--surface-muted)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{choferViajes.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Viajes</div>
                  </div>
                  <div style={{ padding: 14, background: 'var(--surface-muted)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{formatKm(choferViajes.reduce((s, v) => s + v.km, 0))}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Km aprox.</div>
                  </div>
                </div>
                {choferViajes.length > 0 && (
                  <div style={{ marginTop: 12, padding: 14, background: 'var(--af-green-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--af-green-press)' }}>{formatMoney(choferViajes.reduce((s, v) => s + v.monto, 0))}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Facturado (aprox.)</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asignar camión modal */}
      {asignarOpen && (
        <AsignarCamionModal
          chofer={chofer}
          camiones={camionesLibres}
          onClose={() => setAsignarOpen(false)}
          onSave={async (camionId) => {
            await onAsignarCamion(chofer.id, camionId)
            setAsignarOpen(false)
            showToast('Camión asignado.')
          }}
        />
      )}
    </div>
  )
}

// ── DetailRow helper ──────────────────────────────────────────────────────────

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ paddingBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value || '—'}</div>
    </div>
  )
}

// ── AsignarCamionModal ────────────────────────────────────────────────────────

function AsignarCamionModal({ chofer, camiones, onClose, onSave }: { chofer: Chofer; camiones: Camion[]; onClose: () => void; onSave: (camionId: string) => Promise<void> }) {
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await onSave(selected)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: 480, maxWidth: '100%', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Asignar camión</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Chofer: {chofer.nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {camiones.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px 0' }}>
              <Icon name="local_shipping" size={28} />
              <div style={{ marginTop: 8, fontSize: 13 }}>No hay camiones sin chofer asignado.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {camiones.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${selected === c.id ? 'var(--af-green)' : 'var(--border-soft)'}`, borderRadius: 10, cursor: 'pointer', background: selected === c.id ? 'var(--af-green-bg)' : 'transparent', transition: 'all 150ms' }}>
                  <input type="radio" name="camion" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} style={{ accentColor: 'var(--af-green)' }} />
                  <Icon name="local_shipping" size={18} style={{ color: 'var(--af-green-press)' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 1 }}>{c.patente}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.marca} {c.modelo}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!selected || saving}>
            <Icon name="add_link" size={15} />
            {saving ? 'Guardando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ChoferFormModal ───────────────────────────────────────────────────────────

interface ChoferFormModalProps {
  chofer?: Chofer
  camiones: Camion[]
  onClose: () => void
  onSave: (data: NuevoChoferData, camionId?: string) => Promise<void>
}

export function ChoferFormModal({ chofer, camiones, onClose, onSave }: ChoferFormModalProps) {
  const isEdit = !!chofer
  const [nombre, setNombre] = useState(chofer?.nombre ?? '')
  const [dni, setDni] = useState(chofer?.dni ?? '')
  const [tel, setTel] = useState(chofer?.tel ?? '')
  const [email, setEmail] = useState(chofer?.email ?? '')
  const [porcentaje, setPorcentaje] = useState(String(chofer?.porcentajeBase ?? 0))
  const [licOpen, setLicOpen] = useState(!!(chofer?.licencia.cat))
  const [licCat, setLicCat] = useState(chofer?.licencia.cat ?? 'E')
  const [licNumero, setLicNumero] = useState(chofer?.licencia.numero ?? '')
  const [licVenc, setLicVenc] = useState(chofer?.licencia.venc ?? '')
  const [medOpen, setMedOpen] = useState(!!(chofer?.psicofisico.venc || chofer?.libretaSanidad.venc))
  const [psicVenc, setPsicVenc] = useState(chofer?.psicofisico.venc ?? '')
  const [libVenc, setLibVenc] = useState(chofer?.libretaSanidad.venc ?? '')
  const [camionId, setCamionId] = useState(chofer?.camionId ?? '')
  const [saving, setSaving] = useState(false)

  const camionesOpciones = camiones.filter(c => c.activo && (!c.id || c.id === chofer?.camionId || true))
  const camionesDisponibles = camiones.filter(c => c.activo)

  const initials = nombre.trim()
    ? nombre.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  async function handleSubmit() {
    if (!nombre.trim()) return
    setSaving(true)
    await onSave(
      { nombre: nombre.trim(), dni, tel, email, porcentaje, licCat, licNumero, licVenc, psicofisicoVenc: psicVenc, libretaSanidadVenc: libVenc },
      camionId || undefined
    )
    onClose()
  }

  function SectionToggle({ open, onToggle, label, icon }: { open: boolean; onToggle: () => void; label: string; icon: string }) {
    return (
      <button
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: open ? 'var(--af-green-bg)' : 'var(--surface-muted)', border: `1.5px solid ${open ? 'var(--af-green)' : 'var(--border-soft)'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 150ms', textAlign: 'left' }}
      >
        <Icon name={icon} size={18} style={{ color: open ? 'var(--af-green-press)' : 'var(--text-tertiary)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: open ? 'var(--af-green-press)' : 'var(--text-secondary)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Opcional — hacé clic para {open ? 'ocultar' : 'completar'}</div>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} style={{ color: 'var(--text-tertiary)' }} />
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: 540, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface-card)', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0, transition: 'opacity 200ms', opacity: nombre.trim() ? 1 : 0.4 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                {isEdit ? 'Editar chofer' : 'Nuevo chofer'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                {isEdit ? 'Modificá los datos del chofer' : 'Completá los datos para registrar al chofer'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Datos básicos */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-tertiary)', marginBottom: 12 }}>Datos personales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Nombre completo *">
                <Input placeholder="ej. Juan Carlos Pérez" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="DNI">
                  <Input placeholder="ej. 28.456.789" value={dni} onChange={e => setDni(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                </Field>
                <Field label="Teléfono">
                  <Input placeholder="ej. +54 9 351 000-0000" value={tel} onChange={e => setTel(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                </Field>
                <Field label="Email" style={{ gridColumn: 'span 2' }}>
                  <Input type="email" placeholder="ej. chofer@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="% de liquidación base">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      placeholder="0"
                      value={porcentaje}
                      onChange={e => setPorcentaje(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 600 }}>%</span>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Licencia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionToggle open={licOpen} onToggle={() => setLicOpen(v => !v)} label="Licencia profesional" icon="local_police" />
            {licOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12, padding: '14px 16px', background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                <Field label="Categoría">
                  <SelectInput options={LIC_CATS.map(c => ({ value: c, label: c }))} value={licCat} onChange={e => setLicCat(e.target.value)} />
                </Field>
                <Field label="Número de licencia">
                  <Input placeholder="ej. 12345678" value={licNumero} onChange={e => setLicNumero(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                </Field>
                <Field label="Vencimiento">
                  <Input type="date" value={licVenc} onChange={e => setLicVenc(e.target.value)} />
                </Field>
              </div>
            )}
          </div>

          {/* Habilitaciones médicas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionToggle open={medOpen} onToggle={() => setMedOpen(v => !v)} label="Habilitaciones médicas" icon="medical_services" />
            {medOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px 16px', background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                <Field label="Psicofísico — vencimiento">
                  <Input type="date" value={psicVenc} onChange={e => setPsicVenc(e.target.value)} />
                </Field>
                <Field label="Libreta sanitaria — vencimiento">
                  <Input type="date" value={libVenc} onChange={e => setLibVenc(e.target.value)} />
                </Field>
              </div>
            )}
          </div>

          {/* Camión (solo en crear, o si editando sin camion) */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-tertiary)', marginBottom: 12 }}>Asignación de camión</div>
            <Field label="Camión (opcional)">
              <SelectInput
                value={camionId}
                onChange={e => setCamionId(e.target.value)}
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...camionesDisponibles.map(c => ({ value: c.id, label: `${c.patente}${c.marca ? ` — ${c.marca}` : ''}` })),
                ]}
              />
            </Field>
            {camionId && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                Este camión se asignará al chofer al guardar.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: 'var(--surface-card)', borderRadius: '0 0 16px 16px' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !nombre.trim()}>
            <Icon name={isEdit ? 'save' : 'person_add'} size={15} />
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear chofer'}
          </button>
        </div>
      </div>
    </div>
  )
}
