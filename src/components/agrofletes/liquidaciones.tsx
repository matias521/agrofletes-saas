'use client'
import React, { useState, useMemo } from 'react'
import { Icon } from './icon'
import {
  ChoferLiquidacionResumen,
  Liquidacion,
  Viaje,
  Cliente,
  formatDate,
} from '@/lib/agrofletes-data'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pesos(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

function monthLabel(date: Date): string {
  const s = date.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isCurrentMonth(desde: string): boolean {
  const now = new Date()
  const d = new Date(desde + 'T12:00:00')
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LiquidacionesPageProps {
  resumenes: ChoferLiquidacionResumen[]
  liquidaciones: Liquidacion[]
  viajes: Viaje[]
  clientes: Cliente[]
  periodoFiltro: { desde: string; hasta: string; label: string }
  onRegistrarPago: (choferId: string, camionId: string | null, monto: number, fecha: string, periodoDede: string, periodoHasta: string, totalBruto: number) => Promise<void>
  onCambioPeriodoCustom: (desde: string, hasta: string) => void
  onEditarPorcentajeChofer: (choferId: string, porcentaje: number) => Promise<void>
  onActualizarPorcentajeViaje: (viajeId: string, porcentaje: number | null) => Promise<void>
}

// ── Registrar Pago Modal ──────────────────────────────────────────────────────

function RegistrarPagoModal({
  resumen,
  periodoFiltro,
  ultimoPago,
  onClose,
  onSave,
}: {
  resumen: ChoferLiquidacionResumen
  periodoFiltro: { desde: string; hasta: string }
  ultimoPago: { monto: number; fecha: string } | null
  onClose: () => void
  onSave: (monto: number, fecha: string) => Promise<void>
}) {
  const saldo = Math.max(0, resumen.deudaPendiente)
  const [monto, setMonto] = useState(String(saldo || ''))
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const n = parseFloat(monto)
    if (!n || n <= 0) return
    setSaving(true)
    await onSave(n, fecha)
    onClose()
    setSaving(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, width: 520, maxWidth: '100%', padding: '28px 28px 24px', boxShadow: 'var(--shadow-xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
          Registrar pago — {resumen.choferNombre}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
              Facturado ({resumen.camionPatente || '—'})
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>{pesos(resumen.facturacionBruta)}</div>
          </div>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
              Le corresponde ({resumen.choferPorcentajeBase}%)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>{pesos(resumen.totalCorresponde)}</div>
          </div>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Ya pagado</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: resumen.totalPagado > 0 ? 'var(--af-green-press)' : 'var(--text-tertiary)' }}>{pesos(resumen.totalPagado)}</div>
          </div>
          <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Saldo pendiente</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: saldo > 0 ? 'var(--st-cancelado-fg)' : 'var(--text-tertiary)' }}>{pesos(saldo)}</div>
          </div>
        </div>

        {ultimoPago && (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <Icon name="schedule" size={14} />
            Último pago: {pesos(ultimoPago.monto)} el {formatDate(ultimoPago.fecha)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <input
            type="number"
            min={1}
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="Monto"
            className="input"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15 }}
          />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="input"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !monto || parseFloat(monto) <= 0}>
            <Icon name="check" size={15} />
            {saving ? 'Guardando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chofer Card ───────────────────────────────────────────────────────────────

function ChoferCard({
  resumen,
  viajes,
  clientes,
  periodoFiltro,
  ultimoPago,
  onRegistrarPago,
  onEditarPorcentajeChofer,
  onActualizarPorcentajeViaje,
}: {
  resumen: ChoferLiquidacionResumen
  viajes: Viaje[]
  clientes: Cliente[]
  periodoFiltro: { desde: string; hasta: string }
  ultimoPago: { monto: number; fecha: string } | null
  onRegistrarPago: (monto: number, fecha: string) => Promise<void>
  onEditarPorcentajeChofer: (choferId: string, porcentaje: number) => Promise<void>
  onActualizarPorcentajeViaje: (viajeId: string, porcentaje: number | null) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [pagoModalOpen, setPagoModalOpen] = useState(false)

  // Edición % base del chofer
  const [editingPct, setEditingPct] = useState(false)
  const [pctDraft, setPctDraft] = useState(String(resumen.choferPorcentajeBase))
  const [savingPct, setSavingPct] = useState(false)

  // Edición % por viaje
  const [editingViajeId, setEditingViajeId] = useState<string | null>(null)
  const [viajePctDraft, setViajePctDraft] = useState('')

  async function handleSavePctChofer() {
    const val = parseFloat(pctDraft)
    if (isNaN(val) || val < 0 || val > 100) return
    setSavingPct(true)
    await onEditarPorcentajeChofer(resumen.choferId, val)
    setSavingPct(false)
    setEditingPct(false)
  }

  async function handleSavePctViaje(viajeId: string, basePct: number) {
    const val = parseFloat(viajePctDraft)
    if (isNaN(val) || val < 0 || val > 100) { setEditingViajeId(null); return }
    // si es igual al % base del chofer, resetear a null (usa default)
    await onActualizarPorcentajeViaje(viajeId, val === basePct ? null : val)
    setEditingViajeId(null)
  }

  const viajesDelPeriodo = useMemo(() => viajes.filter(
    v => v.camionId === resumen.camionId &&
      v.fecha >= periodoFiltro.desde && v.fecha <= periodoFiltro.hasta
  ), [viajes, resumen.camionId, periodoFiltro])

  const clienteNombre = (id: string) => clientes.find(c => c.id === id)?.alias ?? '—'

  const alDia = resumen.estado === 'al_dia'
  const pendiente = resumen.deudaPendiente > 0

  const badge = alDia
    ? { bg: 'var(--st-entregado-bg)', fg: 'var(--st-entregado-fg)', dot: 'var(--st-entregado-dot)', label: 'Al día' }
    : { bg: 'var(--st-cancelado-bg)', fg: 'var(--st-cancelado-fg)', dot: 'var(--st-cancelado-dot)', label: 'Pendiente' }

  const totalMonto = viajesDelPeriodo.reduce((s, v) => s + v.monto, 0)
  // totalCorresponde calculado desde los viajes usando % por viaje
  const totalCorresponde = Math.round(viajesDelPeriodo.reduce((s, v) => {
    const pct = v.porcentaje ?? resumen.choferPorcentajeBase
    return s + v.monto * pct / 100
  }, 0))

  return (
    <>
      {pagoModalOpen && (
        <RegistrarPagoModal
          resumen={resumen}
          periodoFiltro={periodoFiltro}
          ultimoPago={ultimoPago}
          onClose={() => setPagoModalOpen(false)}
          onSave={onRegistrarPago}
        />
      )}

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16,
          }}>
            {resumen.choferIniciales}
          </div>

          <div style={{ flex: '0 0 200px', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {resumen.choferNombre}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span>{resumen.camionPatente} · {resumen.camionInfo} ·</span>
              {editingPct ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={pctDraft}
                    autoFocus
                    onChange={e => setPctDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSavePctChofer(); if (e.key === 'Escape') setEditingPct(false) }}
                    style={{ width: 52, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, border: '1.5px solid var(--af-green)', borderRadius: 6, padding: '2px 4px', background: 'var(--surface-input)', color: 'var(--text-primary)', textAlign: 'center' }}
                  />
                  <span>%</span>
                  <button onClick={handleSavePctChofer} disabled={savingPct} style={{ background: 'var(--af-green)', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>OK</button>
                  <button onClick={() => setEditingPct(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px 3px', fontSize: 11 }}>✕</button>
                </span>
              ) : (
                <button
                  onClick={() => { setPctDraft(String(resumen.choferPorcentajeBase)); setEditingPct(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)', padding: 0, fontSize: 12, fontWeight: 600 }}
                  title="Editar % base"
                >
                  {resumen.choferPorcentajeBase}%
                  <Icon name="edit" size={11} />
                </button>
              )}
              <span>· {resumen.totalViajes} viaje{resumen.totalViajes !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, minWidth: 320 }}>
            {[
              { label: 'Facturado', value: pesos(resumen.facturacionBruta), color: 'var(--text-primary)' },
              { label: 'Le corresponde', value: pesos(totalCorresponde), color: 'var(--text-primary)' },
              { label: 'Pagado', value: pesos(resumen.totalPagado), color: resumen.totalPagado > 0 ? 'var(--af-green-press)' : 'var(--text-tertiary)' },
              { label: 'Debe cobrar', value: pesos(Math.max(0, totalCorresponde - resumen.totalPagado)), color: pendiente ? 'var(--st-cancelado-fg)' : 'var(--text-tertiary)' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <span className="badge" style={{ background: badge.bg, color: badge.fg, flexShrink: 0 }}>
            <span className="dot" style={{ background: badge.dot }} />
            {badge.label}
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 20px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface-muted)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Ocultar detalle' : 'Ver detalle de los viajes'}
          </button>
          {pendiente && (
            <button className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }} onClick={() => setPagoModalOpen(true)}>
              Registrar pago
            </button>
          )}
        </div>

        {/* Trip detail */}
        {expanded && (
          <div style={{ borderTop: '1px solid var(--border-soft)' }}>
            {viajesDelPeriodo.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                Sin viajes en este período.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    {['N° viaje', 'Fecha', 'Origen → Destino', 'Cliente', 'Monto', '% aplicado', 'Corresponde'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: i >= 4 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viajesDelPeriodo.map(v => {
                    const pct = v.porcentaje ?? resumen.choferPorcentajeBase
                    const isCustom = v.porcentaje !== null && v.porcentaje !== resumen.choferPorcentajeBase
                    const corresponde = Math.round(v.monto * pct / 100)
                    const isEditingThis = editingViajeId === v.id
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>#{v.numero}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{formatDate(v.fecha)}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{v.origen} → {v.destino}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{clienteNombre(v.clienteId)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pesos(v.monto)}</td>
                        <td style={{ padding: '6px 16px', textAlign: 'right' }}>
                          {isEditingThis ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                              <input
                                type="number" min={0} max={100} step={0.5}
                                value={viajePctDraft}
                                autoFocus
                                onChange={e => setViajePctDraft(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSavePctViaje(v.id, resumen.choferPorcentajeBase); if (e.key === 'Escape') setEditingViajeId(null) }}
                                onBlur={() => handleSavePctViaje(v.id, resumen.choferPorcentajeBase)}
                                style={{ width: 56, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, border: '1.5px solid var(--af-green)', borderRadius: 6, padding: '3px 5px', background: 'var(--surface-input)', color: 'var(--text-primary)', textAlign: 'center' }}
                              />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>%</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => { setEditingViajeId(v.id); setViajePctDraft(String(pct)) }}
                              title={isCustom ? `% personalizado (base: ${resumen.choferPorcentajeBase}%)` : 'Clic para editar % de este viaje'}
                              style={{
                                background: isCustom ? 'var(--af-green-bg)' : 'none',
                                border: isCustom ? '1px solid var(--af-green)' : '1px solid transparent',
                                borderRadius: 6, cursor: 'pointer',
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                                color: isCustom ? 'var(--af-green-press)' : 'var(--text-secondary)',
                                padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 3,
                              }}
                            >
                              {pct}%
                              <Icon name="edit" size={11} style={{ opacity: 0.5 }} />
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--af-green-press)' }}>{pesos(corresponde)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td colSpan={4} style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                      +{viajesDelPeriodo.length} viajes · total {viajesDelPeriodo.length} viajes
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pesos(totalMonto)}</td>
                    <td />
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--af-green-press)' }}>{pesos(totalCorresponde)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── LiquidacionesPage ─────────────────────────────────────────────────────────

export function LiquidacionesPage({
  resumenes,
  liquidaciones,
  viajes,
  clientes,
  periodoFiltro,
  onRegistrarPago,
  onCambioPeriodoCustom,
  onEditarPorcentajeChofer,
  onActualizarPorcentajeViaje,
}: LiquidacionesPageProps) {
  const [selectedTab, setSelectedTab] = useState<string>('todos')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')

  const currentMonthDate = useMemo(() => new Date(periodoFiltro.desde + 'T12:00:00'), [periodoFiltro.desde])
  const isActual = isCurrentMonth(periodoFiltro.desde)

  function navigateMonth(delta: number) {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + delta, 1)
    const desde = d.toISOString().slice(0, 10)
    const hasta = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    onCambioPeriodoCustom(desde, hasta)
  }

  const activos = useMemo(() => resumenes.filter(r => r.estado !== 'sin_viajes'), [resumenes])

  const filtered = useMemo(() => {
    if (selectedTab === 'todos') return activos
    const match = activos.filter(r => r.choferId === selectedTab)
    return match.length > 0 ? match : activos
  }, [activos, selectedTab])

  const globalBruto = filtered.reduce((s, r) => s + r.facturacionBruta, 0)
  const globalCorresponde = filtered.reduce((s, r) => s + r.totalCorresponde, 0)
  const globalPagado = filtered.reduce((s, r) => s + r.totalPagado, 0)
  const globalPendiente = filtered.reduce((s, r) => s + Math.max(0, r.deudaPendiente), 0)

  function ultimoPagoFor(choferId: string): { monto: number; fecha: string } | null {
    const pagos = liquidaciones.filter(
      l => l.choferId === choferId && l.estado === 'pagado' && l.fechaPago &&
        l.periodoDede >= periodoFiltro.desde && l.periodoHasta <= periodoFiltro.hasta
    )
    if (pagos.length === 0) return null
    const latest = [...pagos].sort((a, b) => new Date(b.fechaPago!).getTime() - new Date(a.fechaPago!).getTime())[0]
    return { monto: latest.totalChofer, fecha: latest.fechaPago! }
  }

  function viajeCount(r: ChoferLiquidacionResumen) {
    return viajes.filter(
      v => v.camionId === r.camionId &&
        v.fecha >= periodoFiltro.desde && v.fecha <= periodoFiltro.hasta &&
        true
    ).length
  }

  // Pagos registrados en el período (para el historial simple)
  const pagosDelPeriodo = useMemo(() => liquidaciones.filter(
    l => l.estado === 'pagado' &&
      l.periodoDede >= periodoFiltro.desde &&
      l.periodoHasta <= periodoFiltro.hasta
  ).sort((a, b) => new Date(b.fechaPago ?? b.createdAt).getTime() - new Date(a.fechaPago ?? a.createdAt).getTime()),
  [liquidaciones, periodoFiltro])

  const resPorChofer = (choferId: string) => resumenes.find(r => r.choferId === choferId)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Liquidaciones</h1>
        </div>
        <div className="actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(-1)} style={{ borderRadius: 10 }}>
              <Icon name="chevron_left" size={20} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)', borderRadius: 10,
              fontWeight: 600, fontSize: 15, color: 'var(--text-primary)',
            }}>
              {monthLabel(currentMonthDate)}
              {isActual && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'var(--af-green-bg)', color: 'var(--af-green-press)', borderRadius: 20 }}>
                  actual
                </span>
              )}
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(1)} style={{ borderRadius: 10 }}>
              <Icon name="chevron_right" size={20} />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowDatePicker(v => !v)}
              style={{ borderRadius: 10 }}
              title="Período personalizado"
            >
              <Icon name="calendar_today" size={18} />
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <div style={{ margin: '-8px 24px 16px', padding: '12px 16px', background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Período personalizado:</span>
          <input type="date" className="input" style={{ width: 150, height: 34 }} value={customDesde} onChange={e => setCustomDesde(e.target.value)} />
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <input type="date" className="input" style={{ width: 150, height: 34 }} value={customHasta} onChange={e => setCustomHasta(e.target.value)} />
          <button
            className="btn btn-secondary btn-sm"
            disabled={!customDesde || !customHasta}
            onClick={() => { if (customDesde && customHasta) { onCambioPeriodoCustom(customDesde, customHasta); setShowDatePicker(false) } }}
          >
            Aplicar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowDatePicker(false)}>Cancelar</button>
        </div>
      )}

      <div className="page-body">
        {/* Tabs por camión */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-soft)', overflowX: 'auto', marginBottom: 20, gap: 0 }}>
          <button
            onClick={() => setSelectedTab('todos')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: selectedTab === 'todos' ? '2px solid var(--af-green)' : '2px solid transparent',
              marginBottom: -2, color: selectedTab === 'todos' ? 'var(--af-green-press)' : 'var(--text-secondary)',
              fontWeight: selectedTab === 'todos' ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap',
            }}
          >
            <Icon name="format_list_bulleted" size={16} />
            Todos
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
              background: selectedTab === 'todos' ? 'var(--af-green-bg)' : 'var(--surface-muted)',
              color: selectedTab === 'todos' ? 'var(--af-green-press)' : 'var(--text-tertiary)',
            }}>
              {activos.length}
            </span>
          </button>

          {activos.map(r => {
            const count = viajeCount(r)
            const active = selectedTab === r.choferId
            return (
              <button
                key={r.choferId}
                onClick={() => setSelectedTab(r.choferId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? '2px solid var(--af-green)' : '2px solid transparent',
                  marginBottom: -2, color: active ? 'var(--af-green-press)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name="local_shipping" size={15} style={{ flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>{r.camionPatente || r.camionInfo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.2 }}>{r.choferNombre}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                  background: active ? 'var(--af-green-bg)' : 'var(--surface-muted)',
                  color: active ? 'var(--af-green-press)' : 'var(--text-tertiary)',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Métricas globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Facturado total', value: pesos(globalBruto), color: 'var(--text-primary)' },
            { label: 'Corresponde a choferes', value: pesos(globalCorresponde), color: 'var(--text-primary)' },
            { label: 'Ya pagado', value: pesos(globalPagado), color: 'var(--af-green-press)' },
            { label: 'Pendiente de pago', value: pesos(globalPendiente), color: globalPendiente > 0 ? 'var(--st-cancelado-fg)' : 'var(--text-tertiary)' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Cards de choferes */}
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="ico"><Icon name="payments" /></div>
            <h3>Sin viajes en este período</h3>
            <p>No hay camiones con viajes registrados para el período seleccionado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <ChoferCard
                key={r.choferId}
                resumen={r}
                viajes={viajes}
                clientes={clientes}
                periodoFiltro={periodoFiltro}
                ultimoPago={ultimoPagoFor(r.choferId)}
                onRegistrarPago={async (monto, fecha) => {
                  await onRegistrarPago(r.choferId, r.camionId, monto, fecha, periodoFiltro.desde, periodoFiltro.hasta, r.facturacionBruta)
                }}
                onEditarPorcentajeChofer={onEditarPorcentajeChofer}
                onActualizarPorcentajeViaje={onActualizarPorcentajeViaje}
              />
            ))}
          </div>
        )}

        {/* Historial simple de pagos del período */}
        {pagosDelPeriodo.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Pagos registrados en el período · {pagosDelPeriodo.length}
            </div>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    {['Fecha de pago', 'Chofer', 'Camión', 'Monto pagado'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: i === 3 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagosDelPeriodo.map(l => {
                    const res = resPorChofer(l.choferId)
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{l.fechaPago ? formatDate(l.fechaPago) : '—'}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600 }}>{res?.choferNombre ?? '—'}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{res?.camionPatente ?? '—'}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--af-green-press)' }}>{pesos(l.totalChofer)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
