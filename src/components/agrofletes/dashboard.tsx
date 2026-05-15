'use client'
import React from 'react'
import { Icon } from './icon'
import { MetricCard, StatusBadge, Button } from './ui'
import { PageHeader } from './layout'
import {
  Viaje,
  Cliente,
  Camion,
  VIAJES_POR_SEMANA,
  ESTADOS,
  formatMoney,
  formatDate,
  clienteById,
} from '@/lib/agrofletes-data'

interface DashboardPageProps {
  viajes: Viaje[]
  clientes: Cliente[]
  camiones: Camion[]
  onViewViaje: (v: Viaje) => void
  onNewViaje: () => void
  onNavigateViajes: () => void
}

export function DashboardPage({
  viajes,
  clientes,
  camiones,
  onViewViaje,
  onNewViaje,
  onNavigateViajes,
}: DashboardPageProps) {
  const totalFacturado = viajes
    .filter((v) => v.estado === 'LIQUIDADO' || v.estado === 'ENTREGADO')
    .reduce((acc, v) => acc + v.monto, 0)

  const enTransito = viajes.filter((v) => v.estado === 'EN_TRANSITO').length
  const camionsSinChofer = camiones.filter((c) => c.activo && (!c.chofer || c.chofer === 'Sin asignar')).length
  const camionesInactivos = camiones.filter((c) => !c.activo).length
  const totalAlertas = (enTransito > 0 ? 1 : 0) + (camionsSinChofer > 0 ? 1 : 0) + (camionesInactivos > 0 ? 1 : 0)
  const entregados = viajes.filter((v) => v.estado === 'ENTREGADO').length
  const totalTons = viajes.reduce((acc, v) => acc + v.toneladas, 0)

  const maxViajes = Math.max(...VIAJES_POR_SEMANA.map((w) => w.viajes))

  const recentViajes = [...viajes]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        eyebrow="Panel principal"
        title="Inicio"
        subtitle="Resumen operativo de hoy"
        actions={
          <Button variant="primary" icon="add" onClick={onNewViaje}>
            Nuevo viaje
          </Button>
        }
      />

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <MetricCard
            label="Viajes en tránsito"
            value={String(enTransito)}
            icon="local_shipping"
            trendText="+1 vs ayer"
            trend="up"
            sub="este mes"
          />
          <MetricCard
            label="Entregados"
            value={String(entregados)}
            icon="check_circle"
            trendText="+3 vs semana ant."
            trend="up"
            sub="este mes"
          />
          <MetricCard
            label="Toneladas transportadas"
            value={`${totalTons.toLocaleString('es-AR', { maximumFractionDigits: 0 })} tn`}
            icon="scale"
            trendText="+12%"
            trend="up"
            sub="vs mes anterior"
          />
          <MetricCard
            label="Facturación liquidada"
            value={formatMoney(totalFacturado)}
            icon="payments"
            trendText="+8%"
            trend="up"
            sub="vs mes anterior"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
          {/* Bar chart */}
          <div className="card">
            <div className="card-header">
              <h3>Viajes por día (semana actual)</h3>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Semana actual
              </span>
            </div>
            <div className="card-body">
              <div className="bars">
                {VIAJES_POR_SEMANA.map((w) => {
                  const pct = (w.viajes / maxViajes) * 100
                  return (
                    <div key={w.label} className="bar-col">
                      <div className="bar-grow" style={{ height: `${pct}%` }}>
                        {w.viajes}
                      </div>
                      <span className="bar-label">{w.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Alerts panel */}
          <div className="card">
            <div className="card-header">
              <h3>Alertas</h3>
              <span
                style={{
                  background: '#FCE4E4',
                  color: '#B3261E',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                }}
              >
                {totalAlertas > 0 ? `${totalAlertas} activas` : '0 activas'}
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {totalAlertas === 0 && (
                <AlertItem
                  type="info"
                  icon="check_circle"
                  title="Sin alertas activas"
                  desc="Todos los viajes y la flota están al día"
                />
              )}
              {enTransito > 0 && (
                <AlertItem
                  type="info"
                  icon="local_shipping"
                  title={`${enTransito} viaje${enTransito > 1 ? 's' : ''} en tránsito`}
                  desc="Monitoreá el estado desde la sección Viajes"
                />
              )}
              {camionsSinChofer > 0 && (
                <AlertItem
                  type="warn"
                  icon="person_off"
                  title={`${camionsSinChofer} camión${camionsSinChofer > 1 ? 'es' : ''} sin chofer`}
                  desc="Asigná un chofer desde la sección Camiones"
                />
              )}
              {camionesInactivos > 0 && (
                <AlertItem
                  type="warn"
                  icon="directions_car"
                  title={`${camionesInactivos} unidad${camionesInactivos > 1 ? 'es' : ''} inactiva${camionesInactivos > 1 ? 's' : ''}`}
                  desc="Revisá el estado de la flota en la sección Camiones"
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent trips */}
        <div className="card">
          <div className="card-header">
            <h3>Últimos viajes</h3>
            <Button variant="ghost" size="sm" iconEnd="arrow_forward" onClick={onNavigateViajes}>
              Ver todos
            </Button>
          </div>
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>N° Viaje</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Origen → Destino</th>
                  <th>Carga</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentViajes.map((v) => {
                  const cliente = clienteById(v.clienteId, clientes)
                  return (
                    <tr
                      key={v.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onViewViaje(v)}
                    >
                      <td>
                        <span className="num">#{v.numero}</span>
                      </td>
                      <td className="muted">{formatDate(v.fecha)}</td>
                      <td>{cliente?.razon ?? cliente?.alias ?? v.clienteId}</td>
                      <td className="muted" style={{ fontSize: 13 }}>
                        {v.origen} → {v.destino}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{v.tipoCargaLabel || v.tipoCargaId}</td>
                      <td>
                        <span className="money">{formatMoney(v.monto)}</span>
                      </td>
                      <td>
                        <StatusBadge estado={v.estado} />
                      </td>
                    </tr>
                  )
                })}
                {recentViajes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px' }}>
                      No hay viajes registrados aún.
                    </td>
                  </tr>
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

interface AlertItemProps {
  type: 'warn' | 'info'
  icon: string
  title: string
  desc: string
}

function AlertItem({ type, icon, title, desc }: AlertItemProps) {
  const bg = type === 'warn' ? 'var(--alert-warn-bg)' : 'var(--alert-info-bg)'
  const fg = type === 'warn' ? 'var(--alert-warn-fg)' : 'var(--alert-info-fg)'
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-soft)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: bg,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} color={fg} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}
