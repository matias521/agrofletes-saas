'use client'
import React, { useState, useMemo } from 'react'
import { Icon } from './icon'
import { MetricCard, StatusBadge, Button } from './ui'
import { PageHeader } from './layout'
import {
  Viaje,
  Cliente,
  Camion,
  AlertaFlota,
  ESTADOS,
  formatMoney,
  formatDate,
  clienteById,
  estadoVencimiento,
} from '@/lib/agrofletes-data'

// ── Types ──────────────────────────────────────────────────────────────────────

type Periodo = 'semana' | 'mes' | '30d' | '3m'

interface ChartBar { label: string; count: number; key: string }

interface DashboardPageProps {
  viajes: Viaje[]
  clientes: Cliente[]
  camiones: Camion[]
  alertasFlota?: AlertaFlota[]
  onViewViaje: (v: Viaje) => void
  onNewViaje: () => void
  onNavigateViajes: () => void
}

// ── Chart helpers ──────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function mondayOf(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

function computeChartBars(viajes: Viaje[], periodo: Periodo): { bars: ChartBar[]; rangeStart: string; rangeEnd: string; label: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  if (periodo === 'semana') {
    const mon = mondayOf(today)
    const bars: ChartBar[] = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(mon, i)
      return { label: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], count: 0, key: isoDate(d) }
    })
    return { bars, rangeStart: isoDate(mon), rangeEnd: isoDate(addDays(mon, 6)), label: 'Semana actual' }
  }

  if (periodo === 'mes') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    // Group by week within month
    const weeks: ChartBar[] = []
    let cur = new Date(start)
    let wNum = 1
    while (cur <= end) {
      const wEnd = addDays(cur, 6)
      const realEnd = wEnd > end ? end : wEnd
      weeks.push({ label: `S${wNum}`, count: 0, key: `${isoDate(cur)}_${isoDate(realEnd)}` })
      cur = addDays(cur, 7)
      wNum++
    }
    return { bars: weeks, rangeStart: isoDate(start), rangeEnd: isoDate(end), label: 'Mes actual' }
  }

  if (periodo === '30d') {
    const start = addDays(today, -29)
    const weeks: ChartBar[] = Array.from({ length: 5 }, (_, i) => {
      const wStart = addDays(start, i * 6)
      const wEnd = addDays(start, i * 6 + 5)
      return { label: `S${i + 1}`, count: 0, key: `${isoDate(wStart)}_${isoDate(wEnd)}` }
    })
    return { bars: weeks, rangeStart: isoDate(start), rangeEnd: isoDate(today), label: 'Últimos 30 días' }
  }

  // 3m
  const bars: ChartBar[] = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (2 - i), 1)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { label: monthNames[d.getMonth()], count: 0, key: `${isoDate(d)}_${isoDate(end)}` }
  })
  const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  return { bars, rangeStart: isoDate(start), rangeEnd: isoDate(today), label: 'Últimos 3 meses' }
}

function fillBars(bars: ChartBar[], viajes: Viaje[], periodo: Periodo): ChartBar[] {
  return bars.map((bar) => {
    let count = 0
    if (periodo === 'semana') {
      count = viajes.filter((v) => v.fecha === bar.key).length
    } else {
      const [start, end] = bar.key.split('_')
      count = viajes.filter((v) => v.fecha >= start && v.fecha <= end).length
    }
    return { ...bar, count }
  })
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DashboardPage({
  viajes,
  clientes,
  camiones,
  alertasFlota = [],
  onViewViaje,
  onNewViaje,
  onNavigateViajes,
}: DashboardPageProps) {
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [filterCarga, setFilterCarga] = useState('')
  const [filterCliente, setFilterCliente] = useState('')

  // Unique cargo types from real viajes
  const cargaOptions = useMemo(() => {
    const map = new Map<string, string>()
    viajes.forEach((v) => { if (v.tipoCargaId) map.set(v.tipoCargaId, v.tipoCargaLabel || v.tipoCargaId) })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [viajes])

  // Chart structure for selected period
  const { bars: baseBars, rangeStart, rangeEnd, label: periodoLabel } = useMemo(
    () => computeChartBars(viajes, periodo),
    [periodo, viajes]
  )

  // Apply carga + cliente filters to viajes within the range
  const viajesFiltrados = useMemo(() => {
    return viajes.filter((v) => {
      if (v.fecha < rangeStart || v.fecha > rangeEnd) return false
      if (filterCarga && v.tipoCargaId !== filterCarga) return false
      if (filterCliente && v.clienteId !== filterCliente) return false
      return true
    })
  }, [viajes, rangeStart, rangeEnd, filterCarga, filterCliente])

  const bars = useMemo(() => fillBars(baseBars, viajesFiltrados, periodo), [baseBars, viajesFiltrados, periodo])
  const maxBar = Math.max(...bars.map((b) => b.count), 1)

  // Metrics (use all viajes with carga/cliente filter only, no date range)
  const viajesMetrics = useMemo(() => {
    return viajes.filter((v) => {
      if (filterCarga && v.tipoCargaId !== filterCarga) return false
      if (filterCliente && v.clienteId !== filterCliente) return false
      return true
    })
  }, [viajes, filterCarga, filterCliente])

  const programados = viajesMetrics.filter((v) => v.estado === 'PROGRAMADO').length
  const realizados = viajesMetrics.filter((v) => v.estado === 'REALIZADO').length
  const totalTons = viajesFiltrados.reduce((acc, v) => acc + v.toneladas, 0)
  const totalFacturado = viajesFiltrados
    .filter((v) => v.estado === 'LIQUIDADO' || v.estado === 'REALIZADO')
    .reduce((acc, v) => acc + v.monto, 0)

  const totalAlertas = (programados > 0 ? 1 : 0) + alertasFlota.length

  const recentViajes = [...viajesFiltrados]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5)

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes' },
    { key: '30d',    label: '30 días' },
    { key: '3m',     label: '3 meses' },
  ]

  const selectStyle: React.CSSProperties = {
    height: 34,
    padding: '0 28px 0 10px',
    borderRadius: 8,
    border: '1.5px solid var(--border)',
    background: 'var(--surface-card)',
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Panel principal"
        title="Inicio"
        subtitle="Resumen operativo de hoy"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Period pills */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface-muted)', borderRadius: 8, padding: 2 }}>
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background: periodo === p.key ? 'var(--surface-card)' : 'transparent',
                    color: periodo === p.key ? 'var(--af-green-press)' : 'var(--text-secondary)',
                    boxShadow: periodo === p.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 120ms',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Carga filter */}
            <select style={selectStyle} value={filterCarga} onChange={(e) => setFilterCarga(e.target.value)}>
              <option value="">Toda la carga</option>
              {cargaOptions.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>

            {/* Cliente filter */}
            <select style={selectStyle} value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)}>
              <option value="">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razon || c.alias}</option>
              ))}
            </select>

            <Button variant="primary" icon="add" onClick={onNewViaje}>
              Nuevo viaje
            </Button>
          </div>
        }
      />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricCard label="Programados" value={String(programados)} icon="event" trendText="" trend="up" sub="próximos viajes" />
          <MetricCard label="Realizados" value={String(realizados)} icon="check_circle" trendText="" trend="up" sub="este mes" />
          <MetricCard label="Toneladas" value={`${totalTons.toLocaleString('es-AR', { maximumFractionDigits: 0 })} tn`} icon="scale" trendText="+12%" trend="up" sub="vs mes anterior" />
          <MetricCard label="Facturación liquidada" value={formatMoney(totalFacturado)} icon="payments" trendText="+8%" trend="up" sub="vs mes anterior" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
          {/* Bar chart */}
          <div className="card">
            <div className="card-header">
              <h3>Viajes por {periodo === 'semana' ? 'día' : periodo === 'mes' || periodo === '30d' ? 'semana' : 'mes'}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{periodoLabel}</span>
            </div>
            <div className="card-body">
              {bars.every((b) => b.count === 0) ? (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  Sin viajes en este período
                </div>
              ) : (
                <div className="bars">
                  {bars.map((bar) => {
                    const pct = maxBar > 0 ? (bar.count / maxBar) * 100 : 0
                    return (
                      <div key={bar.key} className="bar-col">
                        <div className="bar-grow" style={{ height: `${Math.max(pct, bar.count > 0 ? 8 : 0)}%` }}>
                          {bar.count > 0 ? bar.count : ''}
                        </div>
                        <span className="bar-label">{bar.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Alerts panel */}
          <div className="card">
            <div className="card-header">
              <h3>Alertas</h3>
              <span style={{ background: '#FCE4E4', color: '#B3261E', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                {totalAlertas > 0 ? `${totalAlertas} activas` : '0 activas'}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {totalAlertas === 0 && (
                <AlertItem type="info" icon="check_circle" title="Sin alertas activas" desc="Todos los viajes y la flota están al día" />
              )}
              {programados > 0 && (
                <AlertItem type="info" icon="event" title={`${programados} viaje${programados > 1 ? 's' : ''} programado${programados > 1 ? 's' : ''}`} desc="Próximos viajes cargados en la sección Viajes" />
              )}
              {alertasFlota.map((a) => {
                const st = estadoVencimiento(a.venc)
                const isVencido = st.kind === 'vencido'
                const label = isVencido ? `Vencido hace ${Math.abs(st.dias)}d` : `Vence en ${st.dias}d`
                return (
                  <AlertItem key={a.id} type="warn" icon={a.icon} title={`${a.label}${a.sub ? ` · ${a.sub}` : ''}`} desc={`${label} · ${formatDate(a.venc)}`} />
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent trips */}
        <div className="card">
          <div className="card-header">
            <h3>Últimos viajes</h3>
            <Button variant="ghost" size="sm" iconEnd="arrow_forward" onClick={onNavigateViajes}>Ver todos</Button>
          </div>
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>N° Viaje</th><th>Fecha</th><th>Cliente</th><th>Origen → Destino</th><th>Carga</th><th>Total</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentViajes.map((v) => {
                  const cliente = clienteById(v.clienteId, clientes)
                  return (
                    <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => onViewViaje(v)}>
                      <td><span className="num">#{v.numero}</span></td>
                      <td className="muted">{formatDate(v.fecha)}</td>
                      <td>{cliente?.razon ?? cliente?.alias ?? v.clienteId}</td>
                      <td className="muted" style={{ fontSize: 13 }}>{v.origen} → {v.destino}</td>
                      <td style={{ textTransform: 'capitalize' }}>{v.tipoCargaLabel || v.tipoCargaId}</td>
                      <td><span className="money">{formatMoney(v.monto)}</span></td>
                      <td><StatusBadge estado={v.estado} /></td>
                    </tr>
                  )
                })}
                {recentViajes.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px' }}>No hay viajes en este período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Alert item helper ─────────────────────────────────────────────────────────

interface AlertItemProps { type: 'warn' | 'info'; icon: string; title: string; desc: string }

function AlertItem({ type, icon, title, desc }: AlertItemProps) {
  const bg = type === 'warn' ? 'var(--alert-warn-bg)' : 'var(--alert-info-bg)'
  const fg = type === 'warn' ? 'var(--alert-warn-fg)' : 'var(--alert-info-fg)'
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} color={fg} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}
