'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from './icon'
import { Button, Tabs, Card, MetricCard, Avatar, StatusBadge, Field, Input, SelectInput } from './ui'
import {
  Camion,
  Viaje,
  Cliente,
  Chofer,
  DocVehiculo,
  TallerVisita,
  Neumatico,
  TIPOS_CAMION,
  TIPOS_DOC_VEHICULO,
  TRUCK_LAYOUTS,
  TIRE_BRANDS,
  TIRE_SIZES,
  TIRE_MODELS_BY_ROLE,
  estadoVencimiento,
  tireWearPct,
  tireWearLevel,
  tirePositionsFor,
  formatMoney,
  formatKm,
  formatDate,
  formatDateLong,
  formatTon,
} from '@/lib/agrofletes-data'
import { parseDocumentoPdf } from '@/lib/parse-poliza-pdf'
import { NuevaUnidadModal, NuevaUnidadData } from './secondary'

// ── Expiry badge ──────────────────────────────────────────────────────────────

function VencBadge({ iso }: { iso: string }) {
  if (!iso) return null
  const st = estadoVencimiento(iso)
  const map = {
    vigente:    { bg: 'var(--st-entregado-bg)', fg: 'var(--st-entregado-fg)', dot: 'var(--st-entregado-dot)' },
    por_vencer: { bg: '#FFF3E0', fg: '#B25800', dot: '#F57C00' },
    vencido:    { bg: 'var(--st-cancelado-bg)', fg: 'var(--st-cancelado-fg)', dot: 'var(--st-cancelado-dot)' },
  }[st.kind]
  const label =
    st.kind === 'vencido'    ? `Vencido hace ${Math.abs(st.dias)}d`
    : st.kind === 'por_vencer' ? `Vence en ${st.dias}d`
    : 'Vigente'
  return (
    <span className="badge" style={{ background: map.bg, color: map.fg }}>
      <span className="dot" style={{ background: map.dot }} />
      {label}
    </span>
  )
}

// ── Label/value row ───────────────────────────────────────────────────────────

function DataRow({ label, value, icon, mono }: { label: string; value: string; icon?: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <Icon name={icon} size={16} style={{ color: 'var(--text-tertiary)' }} />}
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
          {value}
        </span>
      </div>
    </div>
  )
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────

function CamDashboardTab({
  camion, viajes, chofer, docs, taller, tires,
}: {
  camion: Camion
  viajes: Viaje[]
  chofer: Chofer | null
  docs: DocVehiculo[]
  taller: TallerVisita[]
  tires: Neumatico[]
}) {
  const totalTon = viajes.reduce((s, v) => s + v.toneladas, 0)
  const totalFact = viajes.reduce((s, v) => s + v.monto, 0)
  const ultimoViaje = viajes[0] ?? null
  const km = camion.kmAcumulados ?? 0

  const ultimoTaller = taller[0] ?? null

  // Unified 15-day alert list: vehicle docs + chofer docs
  const alertas = useMemo(() => {
    type AlertaItem = { id: string; label: string; icon: string; venc: string; sub?: string }
    const needs = (iso: string) => { if (!iso) return false; const st = estadoVencimiento(iso); return st.kind === 'vencido' || st.dias <= 15 }
    const items: AlertaItem[] = []
    for (const d of docs) {
      if (!needs(d.venc)) continue
      const tipo = TIPOS_DOC_VEHICULO.find((t) => t.id === d.tipoId)
      items.push({ id: d.id, label: tipo?.label ?? d.tipoId, icon: tipo?.icon ?? 'description', venc: d.venc, sub: d.numero || undefined })
    }
    if (chofer) {
      const checks: { id: string; label: string; icon: string; venc: string }[] = [
        { id: 'lic',  label: 'Licencia de conducir', icon: 'local_police',      venc: chofer.licencia.venc },
        { id: 'psic', label: 'Psicofísico',           icon: 'medical_services', venc: chofer.psicofisico.venc },
        { id: 'lib',  label: 'Libreta de sanidad',    icon: 'health_and_safety', venc: chofer.libretaSanidad.venc },
      ]
      for (const c of checks) {
        if (needs(c.venc)) items.push({ ...c, sub: chofer.nombre })
      }
    }
    return items
  }, [docs, chofer])

  const tireSummary = useMemo(() => {
    if (tires.length === 0) return null
    const promedio = Math.round(tires.reduce((s, t) => s + tireWearPct(t), 0) / tires.length)
    const criticos = tires.filter((t) => tireWearLevel(tireWearPct(t)) === 'critico').length
    const alerta = tires.filter((t) => tireWearLevel(tireWearPct(t)) === 'alerta').length
    return { promedio, criticos, alerta, total: tires.length }
  }, [tires])

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard label="Viajes realizados" value={String(camion.viajes)} icon="route" />
        <MetricCard label="Toneladas transportadas" value={formatTon(totalTon)} icon="scale" />
        <MetricCard label="Facturado total" value={formatMoney(totalFact)} icon="payments" />
        <MetricCard
          label="Kilometraje"
          value={formatKm(km)}
          icon="speed"
          sub={ultimoViaje ? `Últ. viaje ${formatDate(ultimoViaje.fecha)}` : 'Sin viajes'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title={`Alertas y vencimientos${alertas.length > 0 ? ` · ${alertas.length} requieren atención` : ''}`}>
          {alertas.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Icon name="task_alt" size={32} style={{ color: 'var(--af-green)' }} />
              <span style={{ fontSize: 13 }}>Todos los documentos están vigentes.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border-soft)', background: 'var(--surface-muted)', borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid var(--border-soft)' }}>
                    <Icon name={a.icon} size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {a.sub ? `${a.sub} · ` : ''}vence el {formatDate(a.venc)}
                    </div>
                  </div>
                  <VencBadge iso={a.venc} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Chofer asignado">
          {chofer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {chofer.iniciales}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{chofer.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>DNI {chofer.dni} · Lic. {chofer.licencia.cat}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Licencia</span>
                  <VencBadge iso={chofer.licencia.venc} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Psicofísico</span>
                  <VencBadge iso={chofer.psicofisico.venc} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Icon name="person_off" size={28} />
              <div style={{ fontSize: 13, marginTop: 4 }}>Sin chofer asignado</div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title={`Neumáticos${tires.length > 0 ? ` · ${tires.length} unidades` : ''}`}>
          {tireSummary ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{tireSummary.promedio}%</span>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>desgaste promedio</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface-muted)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${tireSummary.promedio}%`, background: tireSummary.promedio >= 70 ? '#E03E3E' : tireSummary.promedio >= 50 ? '#F5A623' : 'var(--af-green)', transition: 'width 300ms' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 12 }}>
                <div style={{ padding: 10, background: 'var(--af-green-bg)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--af-green-press)', fontWeight: 700, fontSize: 18 }}>{tireSummary.total - tireSummary.alerta - tireSummary.criticos}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>OK</div>
                </div>
                <div style={{ padding: 10, background: '#FFF3E0', borderRadius: 8 }}>
                  <div style={{ color: '#B25800', fontWeight: 700, fontSize: 18 }}>{tireSummary.alerta}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Alerta</div>
                </div>
                <div style={{ padding: 10, background: 'var(--st-cancelado-bg)', borderRadius: 8 }}>
                  <div style={{ color: 'var(--st-cancelado-fg)', fontWeight: 700, fontSize: 18 }}>{tireSummary.criticos}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Crítico</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Icon name="trip_origin" size={28} />
              <div style={{ fontSize: 13, marginTop: 4 }}>Cargá los datos iniciales desde la pestaña Neumáticos.</div>
            </div>
          )}
        </Card>

        <Card title="Último paso por taller">
          {ultimoTaller ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{formatDateLong(ultimoTaller.fecha)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-tertiary)' }}>@ {formatKm(ultimoTaller.km)}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                {ultimoTaller.taller} ·{' '}
                <span style={{ textTransform: 'capitalize', color: ultimoTaller.motivo === 'correctivo' ? '#B25800' : 'var(--af-green-press)', fontWeight: 600 }}>
                  {ultimoTaller.motivo}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                {ultimoTaller.trabajos.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <Icon name="check" size={14} style={{ color: 'var(--af-green)', marginTop: 3 }} />
                    {t}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Próximo service</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatKm(ultimoTaller.proxKm)}</span>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Icon name="build" size={28} />
              <div style={{ fontSize: 13, marginTop: 4 }}>Sin visitas registradas.</div>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

// ── VIAJES TAB ────────────────────────────────────────────────────────────────

function CamViajesTab({ viajes, clientes, onViewViaje }: { viajes: Viaje[]; clientes: Cliente[]; onViewViaje: (v: Viaje) => void }) {
  const clienteById = (id: string) => clientes.find((c) => c.id === id)
  return (
    <Card title={`Historial de viajes · ${viajes.length} viaje${viajes.length === 1 ? '' : 's'}`} bodyStyle={{ padding: 0 }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Ruta</th>
            <th>Carga</th>
            <th style={{ textAlign: 'right' }}>Ton.</th>
            <th style={{ textAlign: 'right' }}>Km</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Monto</th>
          </tr>
        </thead>
        <tbody>
          {viajes.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="empty">
                  <div className="ico"><Icon name="route" /></div>
                  <h3>Sin viajes</h3>
                  <p>Este camión todavía no realizó viajes.</p>
                </div>
              </td>
            </tr>
          ) : (
            viajes.map((v) => (
              <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => onViewViaje(v)}>
                <td className="muted">{formatDate(v.fecha)}</td>
                <td>{clienteById(v.clienteId)?.alias ?? '—'}</td>
                <td className="muted">{v.origen} → {v.destino}</td>
                <td className="muted">{v.tipoCargaLabel}</td>
                <td className="num" style={{ textAlign: 'right' }}>{formatTon(v.toneladas)}</td>
                <td className="num" style={{ textAlign: 'right' }}>{formatKm(v.km)}</td>
                <td><StatusBadge estado={v.estado} /></td>
                <td className="money" style={{ textAlign: 'right' }}>{formatMoney(v.monto)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  )
}

// ── DOCUMENTOS TAB ────────────────────────────────────────────────────────────

interface NuevoDocData {
  tipoId: string
  numero: string
  entidad: string
  emision: string
  venc: string
  file?: File | null
}

function SubirDocumentoModal({ onClose, onSave }: { onClose: () => void; onSave: (data: NuevoDocData) => Promise<void> }) {
  const today = new Date().toISOString().slice(0, 10)
  const [tipoId, setTipoId] = useState(TIPOS_DOC_VEHICULO[0].id)
  const [numero, setNumero] = useState('')
  const [entidad, setEntidad] = useState('')
  const [emision, setEmision] = useState(today)
  const [venc, setVenc] = useState('')
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [pdfName, setPdfName] = useState('')
  const [autoDetected, setAutoDetected] = useState<Set<string>>(new Set())
  const [parseError, setParseError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const tipo = TIPOS_DOC_VEHICULO.find((t) => t.id === tipoId)!

  async function handlePdf(file: File) {
    setSelectedFile(file)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('El archivo debe ser un PDF.')
      return
    }
    setPdfName(file.name)
    setParsing(true)
    setParseError('')
    setAutoDetected(new Set())
    try {
      const result = await parseDocumentoPdf(file)
      const detected = new Set<string>()
      if (result.tipoId) { setTipoId(result.tipoId);   detected.add('tipoId') }
      if (result.numero)  { setNumero(result.numero);   detected.add('numero') }
      if (result.entidad) { setEntidad(result.entidad); detected.add('entidad') }
      if (result.venc)    { setVenc(result.venc);        detected.add('venc') }
      if (result.emision) { setEmision(result.emision);  detected.add('emision') }
      setAutoDetected(detected)
      if (detected.size === 0) {
        setParseError('No se pudo extraer información del PDF. Completá los campos manualmente.')
      }
    } catch {
      setParseError('Error al leer el PDF. Completá los campos manualmente.')
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit() {
    if (!venc) return
    setSaving(true)
    await onSave({ tipoId, numero, entidad, emision, venc, file: selectedFile })
    onClose()
  }

  function AutoBadge() {
    return (
      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 999, background: 'var(--af-lime)', color: '#1a3a00' }}>
        Auto
      </span>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, padding: '28px 28px 24px', width: 520, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', gap: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center' }}>
              <Icon name={tipo.icon} size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Cargar documento</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Documentación del vehículo</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* PDF drop zone */}
        <div>
          <label
            htmlFor="pdf-upload"
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) handlePdf(file)
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '20px 16px',
              border: `2px dashed ${dragging ? 'var(--af-green)' : 'var(--border)'}`,
              borderRadius: 12,
              background: dragging ? 'var(--af-green-bg)' : 'var(--surface-muted)',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdf(f) }}
            />
            {parsing ? (
              <>
                <Icon name="hourglass_top" size={28} style={{ color: 'var(--af-green)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Leyendo el PDF...</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Extrayendo póliza, compañía y vencimiento</div>
              </>
            ) : pdfName ? (
              <>
                <Icon name="picture_as_pdf" size={28} style={{ color: 'var(--af-green)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {autoDetected.size > 0 ? `${autoDetected.size} campo${autoDetected.size > 1 ? 's' : ''} detectado${autoDetected.size > 1 ? 's' : ''}` : 'Cargá otro PDF o editá manualmente'}
                </div>
              </>
            ) : (
              <>
                <Icon name="upload_file" size={28} style={{ color: 'var(--text-tertiary)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Subí la póliza en PDF</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>El sistema va a leer número, compañía y vencimiento automáticamente</div>
              </>
            )}
          </label>

          {parseError && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#B25800', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="warning" size={14} /> {parseError}
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={<>Tipo de documento{autoDetected.has('tipoId') && <AutoBadge />}</>}>
            <SelectInput
              options={TIPOS_DOC_VEHICULO.map((t) => ({ value: t.id, label: t.label }))}
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              style={{ borderColor: autoDetected.has('tipoId') ? 'var(--af-green)' : undefined }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={<>N° / Póliza{autoDetected.has('numero') && <AutoBadge />}</>}>
              <Input
                placeholder="ej. 3021-7483920"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', borderColor: autoDetected.has('numero') ? 'var(--af-green)' : undefined }}
              />
            </Field>
            <Field label={<>Entidad / Compañía{autoDetected.has('entidad') && <AutoBadge />}</>}>
              <Input
                placeholder="ej. MAPFRE, RTO Sur"
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                style={{ borderColor: autoDetected.has('entidad') ? 'var(--af-green)' : undefined }}
              />
            </Field>
            <Field label={<>Fecha de emisión{autoDetected.has('emision') && <AutoBadge />}</>}>
              <Input
                type="date"
                value={emision}
                onChange={(e) => setEmision(e.target.value)}
                style={{ borderColor: autoDetected.has('emision') ? 'var(--af-green)' : undefined }}
              />
            </Field>
            <Field label={<>Fecha de vencimiento *{autoDetected.has('venc') && <AutoBadge />}</>}>
              <Input
                type="date"
                value={venc}
                onChange={(e) => setVenc(e.target.value)}
                style={{ borderColor: autoDetected.has('venc') ? 'var(--af-green)' : undefined }}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || !venc}
          >
            <Icon name="save" size={15} />
            {saving ? 'Guardando...' : 'Guardar documento'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CamDocumentosTab({ docs, onAddDoc, onDeleteDoc }: {
  docs: DocVehiculo[]
  onAddDoc: (data: NuevoDocData) => Promise<void>
  onDeleteDoc: (docId: string) => Promise<void>
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const tipoMap = Object.fromEntries(TIPOS_DOC_VEHICULO.map((t) => [t.id, t]))

  async function handleDelete(docId: string) {
    if (!confirm('¿Eliminar este documento?')) return
    setDeleting(docId)
    await onDeleteDoc(docId)
    setDeleting(null)
  }

  return (
    <>
    {modalOpen && <SubirDocumentoModal onClose={() => setModalOpen(false)} onSave={onAddDoc} />}
    <Card
      title="Documentación del vehículo"
      actions={<Button variant="primary" size="sm" icon="upload" onClick={() => setModalOpen(true)}>Subir documento</Button>}
      bodyStyle={{ padding: 0 }}
    >
      {docs.length === 0 ? (
        <div className="empty" style={{ padding: 32 }}>
          <div className="ico"><Icon name="description" /></div>
          <h3>Sin documentos cargados</h3>
          <p>Subí la VTV, el seguro y la cédula para empezar.</p>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Documento</th>
              <th>N° / Póliza</th>
              <th>Entidad</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const tipo = tipoMap[d.tipoId]
              return (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center' }}>
                        <Icon name={tipo?.icon ?? 'description'} size={16} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{tipo?.label ?? d.tipoId}</span>
                    </div>
                  </td>
                  <td className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{d.numero}</td>
                  <td className="muted">{d.entidad}</td>
                  <td className="muted">{d.emision ? formatDate(d.emision) : '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{formatDate(d.venc)}</td>
                  <td><VencBadge iso={d.venc} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {d.archivo ? (
                        <>
                          <a href={d.archivo} target="_blank" rel="noopener noreferrer">
                            <button className="btn btn-ghost btn-icon btn-sm" title="Ver archivo"><Icon name="visibility" size={16} /></button>
                          </a>
                          <a href={d.archivo} download>
                            <button className="btn btn-ghost btn-icon btn-sm" title="Descargar"><Icon name="download" size={16} /></button>
                          </a>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Sin archivo" disabled style={{ opacity: 0.35 }}><Icon name="visibility" size={16} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Sin archivo" disabled style={{ opacity: 0.35 }}><Icon name="download" size={16} /></button>
                        </>
                      )}
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Eliminar"
                        disabled={deleting === d.id}
                        onClick={() => handleDelete(d.id)}
                        style={{ color: 'var(--st-cancelado-fg)' }}
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Card>
    </>
  )
}

// ── CHOFER FORM ───────────────────────────────────────────────────────────────

const LIC_CATS = ['E', 'E1', 'E2', 'E3', 'D', 'D1', 'D2', 'D3', 'F', 'Otra']

export interface NuevoChoferData {
  nombre: string
  dni: string
  tel: string
  email: string
  porcentaje: string
  licCat: string
  licNumero: string
  licVenc: string
  psicofisicoVenc: string
  libretaSanidadVenc: string
}

export function ChoferModal({ camion, chofer, onClose, onSave, onBack }: {
  camion: Camion
  chofer: Chofer | null
  onClose: () => void
  onSave: (data: NuevoChoferData) => Promise<void>
  onBack?: () => void
}) {
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
  const [saving, setSaving] = useState(false)

  const initials = nombre.trim()
    ? nombre.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  async function handleSubmit() {
    if (!nombre.trim()) return
    setSaving(true)
    await onSave({ nombre: nombre.trim(), dni, tel, email, porcentaje, licCat, licNumero, licVenc, psicofisicoVenc: psicVenc, libretaSanidadVenc: libVenc })
    onClose()
  }

  const isEdit = !!chofer

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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, width: 540, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface-card)', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Live avatar preview */}
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0, transition: 'opacity 200ms', opacity: nombre.trim() ? 1 : 0.4 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {isEdit ? 'Editar chofer' : 'Asignar chofer'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{camion.patente}</div>
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
                <Input
                  placeholder="ej. Juan Carlos Pérez"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  autoFocus
                />
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

          {/* Licencia profesional — toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionToggle open={licOpen} onToggle={() => setLicOpen(v => !v)} label="Licencia profesional" icon="local_police" />
            {licOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12, padding: '14px 16px', background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                <Field label="Categoría">
                  <SelectInput
                    options={LIC_CATS.map(c => ({ value: c, label: c }))}
                    value={licCat}
                    onChange={e => setLicCat(e.target.value)}
                  />
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

          {/* Habilitaciones médicas — toggle */}
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
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: onBack ? 'space-between' : 'flex-end', alignItems: 'center', gap: 8, position: 'sticky', bottom: 0, background: 'var(--surface-card)', borderRadius: '0 0 16px 16px' }}>
          {onBack && (
            <button className="btn btn-ghost" onClick={onBack} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="arrow_back" size={15} />
              Volver
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>{onBack ? 'Omitir' : 'Cancelar'}</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving || !nombre.trim()}
            >
              <Icon name={isEdit ? 'save' : 'person_add'} size={15} />
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Asignar chofer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CHOFER TAB ────────────────────────────────────────────────────────────────

function SeleccionarChoferModal({ camion, choferes, onClose, onSelect }: { camion: Camion; choferes: Chofer[]; onClose: () => void; onSelect: (choferId: string) => Promise<void> }) {
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await onSelect(selected)
    onClose()
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: 480, maxWidth: '100%', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Seleccionar chofer</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{camion.patente}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {choferes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px 0' }}>
              <Icon name="badge" size={28} />
              <div style={{ marginTop: 8, fontSize: 13 }}>No hay choferes disponibles sin camión asignado.</div>
            </div>
          ) : (
            choferes.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${selected === c.id ? 'var(--af-green)' : 'var(--border-soft)'}`, borderRadius: 10, cursor: 'pointer', background: selected === c.id ? 'var(--af-green-bg)' : 'transparent', transition: 'all 150ms' }}>
                <input type="radio" name="chofer" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} style={{ accentColor: 'var(--af-green)' }} />
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{c.iniciales}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                  {c.dni && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>DNI {c.dni}</div>}
                </div>
              </label>
            ))
          )}
        </div>
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!selected || saving}>
            <Icon name="person_add" size={15} />
            {saving ? 'Guardando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CamChoferTab({ chofer, camion, choferes, onSaveChofer, onDesvincularChofer, onSeleccionarChofer }: { chofer: Chofer | null; camion: Camion; choferes?: Chofer[]; onSaveChofer: (data: NuevoChoferData) => Promise<void>; onDesvincularChofer?: () => Promise<void>; onSeleccionarChofer?: (choferId: string) => Promise<void> }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)

  if (!chofer) {
    return (
      <>
        {modalOpen && <ChoferModal camion={camion} chofer={null} onClose={() => setModalOpen(false)} onSave={onSaveChofer} />}
        {selectorOpen && choferes && onSeleccionarChofer && (
          <SeleccionarChoferModal camion={camion} choferes={choferes} onClose={() => setSelectorOpen(false)} onSelect={onSeleccionarChofer} />
        )}
        <Card>
          <div className="empty" style={{ padding: 32 }}>
            <div className="ico"><Icon name="person_off" /></div>
            <h3>Sin chofer asignado</h3>
            <p>Asigná un chofer para registrar viajes con este camión.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {choferes && choferes.length > 0 && onSeleccionarChofer && (
                <Button variant="secondary" icon="badge" onClick={() => setSelectorOpen(true)}>Del listado</Button>
              )}
              <Button variant="primary" icon="person_add" onClick={() => setModalOpen(true)}>Crear nuevo</Button>
            </div>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      {modalOpen && <ChoferModal camion={camion} chofer={chofer} onClose={() => setModalOpen(false)} onSave={onSaveChofer} />}
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
      <Card title="Datos personales" actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {onDesvincularChofer && (
            <Button variant="danger" size="sm" icon="person_remove" onClick={onDesvincularChofer}>Desvincular</Button>
          )}
          <Button variant="secondary" size="sm" icon="edit" onClick={() => setModalOpen(true)}>Editar</Button>
        </div>
      }>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            {chofer.iniciales}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{chofer.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{chofer.antiguedad}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <DataRow label="DNI" value={chofer.dni} icon="badge" mono />
          {chofer.fechaNac && <DataRow label="Fecha de nacimiento" value={formatDateLong(chofer.fechaNac)} icon="cake" />}
          <DataRow label="Teléfono" value={chofer.tel} icon="call" mono />
          <DataRow label="Email" value={chofer.email} icon="mail" />
          <DataRow label="Dirección" value={chofer.direccion} icon="home" />
          <DataRow label="Viajes realizados" value={String(chofer.viajesRealizados)} icon="route" mono />
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Licencia profesional">
          <DataRow label="Categoría" value={chofer.licencia.cat} icon="local_police" />
          <div style={{ height: 12 }} />
          <DataRow label="Número de licencia" value={chofer.licencia.numero} mono />
          <div style={{ height: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Vencimiento</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, marginTop: 2 }}>{formatDate(chofer.licencia.venc)}</div>
            </div>
            <VencBadge iso={chofer.licencia.venc} />
          </div>
        </Card>

        <Card title="Habilitaciones médicas" bodyStyle={{ padding: 0 }}>
          {[
            { label: 'Psicofísico',       iso: chofer.psicofisico.venc,    icon: 'medical_services' },
            { label: 'Libreta de sanidad', iso: chofer.libretaSanidad.venc, icon: 'health_and_safety' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={item.icon} size={18} style={{ color: 'var(--text-tertiary)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    Vence {formatDate(item.iso)}
                  </div>
                </div>
              </div>
              <VencBadge iso={item.iso} />
            </div>
          ))}
        </Card>
      </div>
    </div>
    </>
  )
}

// ── TALLER FORM ───────────────────────────────────────────────────────────────

export interface NuevaTallerVisitaData {
  fecha: string
  taller: string
  motivo: 'preventivo' | 'correctivo'
  trabajos: string[]
  costo: number
  km: number | null
  proxKm: number | null
  notas: string
}

function NuevaTallerVisitaModal({ camion, onClose, onSave, editVisita }: {
  camion: Camion
  onClose: () => void
  onSave: (data: NuevaTallerVisitaData) => Promise<void>
  editVisita?: TallerVisita
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [fecha, setFecha] = useState(editVisita?.fecha ?? today)
  const [taller, setTaller] = useState(editVisita?.taller ?? '')
  const [motivo, setMotivo] = useState<'preventivo' | 'correctivo'>(editVisita?.motivo ?? 'preventivo')
  const [trabajos, setTrabajos] = useState<string[]>(editVisita?.trabajos ?? [])
  const [trabajoInput, setTrabajoInput] = useState('')
  const [costo, setCosto] = useState(editVisita?.costo ? String(editVisita.costo) : '')
  const [km, setKm] = useState(editVisita?.km ? String(editVisita.km) : (camion.kmAcumulados != null && camion.kmAcumulados > 0 ? String(camion.kmAcumulados) : ''))
  const [proxKm, setProxKm] = useState(editVisita?.proxKm ? String(editVisita.proxKm) : '')
  const [notas, setNotas] = useState(editVisita?.notas ?? '')
  const [saving, setSaving] = useState(false)

  function addTrabajo() {
    const t = trabajoInput.trim()
    if (!t || trabajos.includes(t)) return
    setTrabajos((prev) => [...prev, t])
    setTrabajoInput('')
  }

  function removeTrabajo(idx: number) {
    setTrabajos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!fecha) return
    setSaving(true)
    await onSave({
      fecha,
      taller: taller.trim(),
      motivo,
      trabajos,
      costo: parseFloat(costo) || 0,
      km: km ? parseInt(km) : null,
      proxKm: proxKm ? parseInt(proxKm) : null,
      notas: notas.trim(),
    })
    onClose()
  }

  const esPreventivo = motivo === 'preventivo'
  const canSave = !!fecha && trabajos.length > 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, width: 580, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface-card)', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center' }}>
              <Icon name="build" size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{editVisita ? 'Editar visita al taller' : 'Registrar visita al taller'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{camion.patente}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Motivo — visual toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-tertiary)', marginBottom: 8 }}>Tipo de visita</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['preventivo', 'correctivo'] as const).map((opt) => {
                const active = motivo === opt
                const isPrev = opt === 'preventivo'
                return (
                  <button
                    key={opt}
                    onClick={() => setMotivo(opt)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: `2px solid ${active ? (isPrev ? 'var(--af-green)' : '#F57C00') : 'var(--border-soft)'}`,
                      background: active ? (isPrev ? 'var(--af-green-bg)' : '#FFF3E0') : 'var(--surface-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <Icon
                      name={isPrev ? 'event_available' : 'car_crash'}
                      size={20}
                      style={{ color: active ? (isPrev ? 'var(--af-green-press)' : '#B25800') : 'var(--text-tertiary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: active ? (isPrev ? 'var(--af-green-press)' : '#B25800') : 'var(--text-secondary)', textTransform: 'capitalize' }}>{opt}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {isPrev ? 'Service programado, revisión rutinaria' : 'Falla o reparación no planificada'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fecha + Taller */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12 }}>
            <Field label="Fecha de la visita *">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
            <Field label="Taller / Mecánico">
              <Input
                placeholder="ej. Taller Rodríguez, Scania Oficial"
                value={taller}
                onChange={(e) => setTaller(e.target.value)}
              />
            </Field>
          </div>

          {/* Trabajos realizados */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              Trabajos realizados *
            </div>

            {/* Tag list */}
            {trabajos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {trabajos.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px 5px 12px',
                      background: esPreventivo ? 'var(--af-green-bg)' : '#FFF3E0',
                      color: esPreventivo ? 'var(--af-green-press)' : '#B25800',
                      borderRadius: 999,
                      fontSize: 13, fontWeight: 500,
                      border: `1px solid ${esPreventivo ? 'var(--af-green)' : '#F57C00'}`,
                    }}
                  >
                    {t}
                    <button
                      onClick={() => removeTrabajo(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center', opacity: 0.6, color: 'inherit' }}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input + add */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="ej. Cambio de aceite y filtros, Ajuste de frenos..."
                value={trabajoInput}
                onChange={(e) => setTrabajoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTrabajo() } }}
              />
              <button
                className="btn btn-secondary"
                onClick={addTrabajo}
                disabled={!trabajoInput.trim()}
                style={{ flexShrink: 0, padding: '0 14px' }}
              >
                <Icon name="add" size={16} /> Agregar
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
              Presioná Enter o hacé clic en Agregar para sumar cada trabajo a la lista.
            </div>
          </div>

          {/* KM + Próximo + Costo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 16, background: 'var(--surface-muted)', borderRadius: 10 }}>
            <Field label="Km del camión">
              <div style={{ position: 'relative' }}>
                <Input
                  type="number"
                  placeholder={camion.kmAcumulados ? String(camion.kmAcumulados) : '0'}
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', paddingRight: 32 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-tertiary)', pointerEvents: 'none' }}>km</span>
              </div>
            </Field>
            <Field label="Próximo service (km)">
              <div style={{ position: 'relative' }}>
                <Input
                  type="number"
                  placeholder={km ? String(parseInt(km) + 10000) : 'opcional'}
                  value={proxKm}
                  onChange={(e) => setProxKm(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', paddingRight: 32 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-tertiary)', pointerEvents: 'none' }}>km</span>
              </div>
            </Field>
            <Field label="Costo total">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-tertiary)', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>$</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', paddingLeft: 22 }}
                />
              </div>
            </Field>
          </div>

          {/* Notas opcionales */}
          <Field label="Notas adicionales">
            <textarea
              className="input"
              rows={3}
              placeholder="Observaciones, repuestos usados, garantías, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: 'var(--surface-card)', borderRadius: '0 0 16px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {trabajos.length === 0
              ? 'Agregá al menos un trabajo para guardar.'
              : `${trabajos.length} trabajo${trabajos.length > 1 ? 's' : ''} cargado${trabajos.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving || !canSave}
            >
              <Icon name="save" size={15} />
              {saving ? 'Guardando...' : editVisita ? 'Guardar cambios' : 'Registrar visita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TALLER TAB ────────────────────────────────────────────────────────────────

function CamTallerTab({ taller, camion, onAddTaller, onEditTaller, onDeleteTaller }: {
  taller: TallerVisita[]
  camion: Camion
  onAddTaller: (data: NuevaTallerVisitaData) => Promise<void>
  onEditTaller: (visitaId: string, data: NuevaTallerVisitaData) => Promise<void>
  onDeleteTaller: (visitaId: string) => Promise<void>
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVisita, setEditingVisita] = useState<TallerVisita | null>(null)
  const km = camion.kmAcumulados ?? 0
  const proxima = taller[0]?.proxKm ?? null
  const kmRestantes = proxima != null ? proxima - km : null
  const totalGasto = taller.reduce((s, v) => s + v.costo, 0)

  function handleOpenEdit(v: TallerVisita) {
    setEditingVisita(v)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingVisita(null)
  }

  async function handleDelete(visitaId: string) {
    if (!confirm('¿Eliminar esta visita?')) return
    await onDeleteTaller(visitaId)
  }

  return (
    <>
      {modalOpen && (
        <NuevaTallerVisitaModal
          camion={camion}
          onClose={handleCloseModal}
          editVisita={editingVisita ?? undefined}
          onSave={async (data) => {
            if (editingVisita) {
              await onEditTaller(editingVisita.id, data)
            } else {
              await onAddTaller(data)
            }
            handleCloseModal()
          }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard label="Visitas registradas" value={String(taller.length)} icon="build" />
        <MetricCard
          label="Próximo service"
          value={proxima ? formatKm(proxima) : '—'}
          icon="schedule"
          sub={kmRestantes != null ? (kmRestantes <= 0 ? `Atrasado por ${formatKm(Math.abs(kmRestantes))}` : `Faltan ${formatKm(kmRestantes)}`) : ''}
        />
        <MetricCard label="Gastado en mantenimiento" value={formatMoney(totalGasto)} icon="payments" />
      </div>

      <Card title="Historial de visitas al taller" actions={<Button variant="primary" size="sm" icon="add" onClick={() => setModalOpen(true)}>Registrar visita</Button>}>
        {taller.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            <div className="ico"><Icon name="build" /></div>
            <h3>Sin visitas registradas</h3>
            <p>Registrá los services y reparaciones para llevar el historial.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, background: 'var(--border-soft)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {taller.map((v) => (
                <div key={v.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 14, width: 16, height: 16, borderRadius: '50%', background: v.motivo === 'correctivo' ? '#F57C00' : 'var(--af-green)', border: '3px solid var(--surface-card)', boxShadow: '0 0 0 2px var(--border-soft)' }} />
                  <div style={{ padding: 14, border: '1px solid var(--border-soft)', borderRadius: 10, background: 'var(--surface-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{formatDateLong(v.fecha)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: v.motivo === 'correctivo' ? '#FFF3E0' : 'var(--af-green-bg)', color: v.motivo === 'correctivo' ? '#B25800' : 'var(--af-green-press)' }}>
                            {v.motivo}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {v.taller} · <span style={{ fontFamily: 'var(--font-mono)' }}>@ {formatKm(v.km)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(v.costo)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Próx: {formatKm(v.proxKm)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => handleOpenEdit(v)}><Icon name="edit" size={15} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(v.id)} style={{ color: 'var(--st-cancelado-fg)' }}><Icon name="delete" size={15} /></button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {v.trabajos.map((t, i) => (
                        <span key={i} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--surface-muted)', borderRadius: 999, color: 'var(--text-secondary)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  )
}

// ── TIRE COMPONENTS ───────────────────────────────────────────────────────────

const TIRE_W = 36
const TIRE_H = 24

function TireDot({ tire, x, y, selected, onClick }: { tire: Neumatico | undefined; x: number; y: number; selected: boolean; onClick: (code: string) => void }) {
  if (!tire) return null
  const pct = tireWearPct(tire)
  const level = tireWearLevel(pct)
  const palette = {
    ok:      { bg: '#7CC944', border: '#4A8C00', text: '#fff' },
    alerta:  { bg: '#F5A623', border: '#C77D0A', text: '#fff' },
    critico: { bg: '#E03E3E', border: '#9A1F1F', text: '#fff' },
  }[level]
  return (
    <button
      onClick={() => onClick(tire.code)}
      title={`${tire.code} · ${tire.marca} ${tire.modelo} · ${pct}% desgaste`}
      style={{
        position: 'absolute', left: x - TIRE_W / 2, top: y,
        width: TIRE_W, height: TIRE_H,
        background: palette.bg,
        border: `2px solid ${selected ? 'var(--af-green-press)' : palette.border}`,
        borderRadius: 6, padding: 0, cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(11,148,68,.3), 0 2px 6px rgba(0,0,0,.15)' : '0 1px 2px rgba(0,0,0,.10)',
        zIndex: selected ? 3 : 2,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, color: palette.text, fontFamily: 'var(--font-mono)', letterSpacing: -0.2 }}>
        {pct}%
      </span>
    </button>
  )
}

function TruckTopDown({ camion, tires, selectedCode, onSelectTire }: { camion: Camion; tires: Neumatico[]; selectedCode: string | null; onSelectTire: (code: string) => void }) {
  const layout = TRUCK_LAYOUTS[camion.tipo] ?? TRUCK_LAYOUTS['semirremolque']
  const tireMap = useMemo(() => Object.fromEntries(tires.map((t) => [t.code, t])), [tires])
  const SECTION_H = 200

  function renderSection(seg: string, axles: typeof layout.tractor, sectionW: number) {
    return (
      <div style={{ position: 'relative', width: sectionW, height: SECTION_H, flexShrink: 0 }}>
        {/* Chassis body */}
        <div style={{ position: 'absolute', left: 4, right: 4, top: 50, height: 100, background: '#FFFFFF', border: '2px solid var(--border-strong)', borderRadius: seg === 'tractor' ? '20px 6px 6px 20px' : '6px 18px 18px 6px', boxShadow: 'inset 0 0 0 1px #fff, 0 2px 6px rgba(15,27,10,.06)' }} />

        {/* Cabin marker */}
        {seg === 'tractor' && (
          <div style={{ position: 'absolute', left: 10, top: 60, height: 80, width: 56, background: 'var(--af-green-bg)', border: '1.5px solid var(--af-green)', borderRadius: '16px 4px 4px 16px', display: 'grid', placeItems: 'center', color: 'var(--af-green-press)' }}>
            <Icon name="airline_seat_recline_normal" size={22} />
          </div>
        )}

        {/* Trailer load hint */}
        {seg === 'trailer' && (
          <div style={{ position: 'absolute', left: 12, right: 12, top: 60, height: 80, backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(15,27,10,.04) 8px 9px)', borderRadius: 6 }} />
        )}

        {/* Axle lines */}
        {axles.map((axle) => (
          <div key={`line-${axle.id}`} style={{ position: 'absolute', left: axle.x - 1, top: axle.steer ? 36 : 12, width: 2, height: axle.steer ? 128 : 176, background: 'var(--border-strong)', opacity: 0.55, zIndex: 1 }} />
        ))}

        {/* Tires */}
        {axles.map((axle) => {
          if (axle.steer) {
            return (
              <React.Fragment key={axle.id}>
                <TireDot tire={tireMap[`${axle.id}-I`]} x={axle.x} y={24}  selected={selectedCode === `${axle.id}-I`} onClick={onSelectTire} />
                <TireDot tire={tireMap[`${axle.id}-D`]} x={axle.x} y={152} selected={selectedCode === `${axle.id}-D`} onClick={onSelectTire} />
              </React.Fragment>
            )
          }
          return (
            <React.Fragment key={axle.id}>
              <TireDot tire={tireMap[`${axle.id}-IE`]} x={axle.x} y={0}   selected={selectedCode === `${axle.id}-IE`} onClick={onSelectTire} />
              <TireDot tire={tireMap[`${axle.id}-II`]} x={axle.x} y={25}  selected={selectedCode === `${axle.id}-II`} onClick={onSelectTire} />
              <TireDot tire={tireMap[`${axle.id}-DI`]} x={axle.x} y={151} selected={selectedCode === `${axle.id}-DI`} onClick={onSelectTire} />
              <TireDot tire={tireMap[`${axle.id}-DE`]} x={axle.x} y={176} selected={selectedCode === `${axle.id}-DE`} onClick={onSelectTire} />
            </React.Fragment>
          )
        })}

        {/* Axle labels */}
        {axles.map((axle) => (
          <div key={`lbl-${axle.id}`} style={{ position: 'absolute', left: axle.x - 18, top: 204, width: 36, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: 0.4 }}>
            {axle.id}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 12px 32px', background: 'var(--surface-muted)', borderRadius: 12, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: 'fit-content', margin: '0 auto', minWidth: '100%', justifyContent: 'center' }}>
        {renderSection('tractor', layout.tractor, layout.tractorW)}
        {layout.trailer.length > 0 && (
          <>
            <div style={{ width: 18, height: 8, background: 'var(--text-tertiary)', margin: '0 -2px', borderRadius: 2 }} />
            {renderSection('trailer', layout.trailer, layout.trailerW)}
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-tertiary)', gap: 6, alignItems: 'center', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
        <Icon name="arrow_back" size={14} /> Frente de marcha
      </div>
    </div>
  )
}

function TireDetailPanel({ tire, onChange, onReplace }: { tire: Neumatico; onChange: (t: Neumatico) => void; onReplace: (code: string) => void }) {
  const [draft, setDraft] = useState(tire)
  useEffect(() => { setDraft(tire) }, [tire.code])

  const pct = tireWearPct(draft)
  const level = tireWearLevel(pct)
  const kmRecorridos = Math.max(0, draft.kmActual - draft.kmInicial)
  const kmRestantes = Math.max(0, draft.vidaUtilEsperada - kmRecorridos)

  const roleLabel = { steer: 'Direccional', drive: 'Tracción', trailer: 'Acoplado' }[draft.role]
  const sideLabel = draft.side === 'I' ? 'Izquierda' : 'Derecha'
  const innerLabel = draft.inner == null ? '' : draft.inner ? ' · interna' : ' · externa'

  const levelStyles = {
    ok:      { bg: 'var(--af-green-bg)', color: 'var(--af-green-press)', label: 'Óptimo' },
    alerta:  { bg: '#FFF3E0', color: '#B25800', label: 'Alerta' },
    critico: { bg: 'var(--st-cancelado-bg)', color: 'var(--st-cancelado-fg)', label: 'Crítico' },
  }[level]

  const wearColor = level === 'critico' ? '#E03E3E' : level === 'alerta' ? '#F5A623' : 'var(--af-green)'

  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5 }}>{draft.code}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{roleLabel} · {sideLabel}{innerLabel}</div>
        </div>
        <span style={{ padding: '4px 10px', background: levelStyles.bg, color: levelStyles.color, borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {levelStyles.label}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Desgaste</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: levelStyles.color }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-muted)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: wearColor, transition: 'width 300ms' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          <span>{formatKm(kmRecorridos)} usados</span>
          <span>{formatKm(kmRestantes)} restantes</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Marca">
          <SelectInput options={TIRE_BRANDS.map((b) => ({ value: b, label: b }))} value={draft.marca} onChange={(e) => setDraft((d) => ({ ...d, marca: e.target.value }))} />
        </Field>
        <Field label="Modelo">
          <Input value={draft.modelo} onChange={(e) => setDraft((d) => ({ ...d, modelo: e.target.value }))} />
        </Field>
        <Field label="Medida">
          <SelectInput options={TIRE_SIZES.map((s) => ({ value: s, label: s }))} value={draft.medida} onChange={(e) => setDraft((d) => ({ ...d, medida: e.target.value }))} />
        </Field>
        <Field label="Vida útil (km)">
          <Input type="number" value={String(draft.vidaUtilEsperada)} onChange={(e) => setDraft((d) => ({ ...d, vidaUtilEsperada: Number(e.target.value) }))} style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>
        <Field label="Km al instalar">
          <Input type="number" value={String(draft.kmInicial)} onChange={(e) => setDraft((d) => ({ ...d, kmInicial: Number(e.target.value) }))} style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>
        <Field label="Km actual del camión">
          <Input type="number" value={String(draft.kmActual)} onChange={(e) => setDraft((d) => ({ ...d, kmActual: Number(e.target.value) }))} style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>
        <Field label="Fecha de instalación" style={{ gridColumn: 'span 2' }}>
          <Input type="date" value={draft.fechaInst} onChange={(e) => setDraft((d) => ({ ...d, fechaInst: e.target.value }))} />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <Button variant="ghost" size="sm" icon="swap_horiz" onClick={() => onReplace(draft.code)}>Reemplazar</Button>
        <Button variant="primary" size="sm" icon="save" onClick={() => onChange(draft)}>Guardar</Button>
      </div>
    </div>
  )
}

// ── Tire first-load form ──────────────────────────────────────────────────────

type GroupValue = { marca: string; modelo: string; vidaUtil: number; kmRecorridos: number }

function GroupRow({ title, count, value, onChange: onChg, helper, models }: { title: string; count: number; value: GroupValue; onChange: (v: GroupValue) => void; helper: string; models: string[] }) {
  if (count === 0) return null
  return (
    <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: 16, background: 'var(--surface-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{helper}</div>
        </div>
        <span className="badge" style={{ background: 'var(--af-green-bg)', color: 'var(--af-green-press)' }}>{count} unidades</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr 1fr', gap: 10 }}>
        <Field label="Marca">
          <SelectInput options={TIRE_BRANDS.map((b) => ({ value: b, label: b }))} value={value.marca} onChange={(e) => onChg({ ...value, marca: e.target.value })} />
        </Field>
        <Field label="Modelo">
          <SelectInput options={models.map((m) => ({ value: m, label: m }))} value={value.modelo} onChange={(e) => onChg({ ...value, modelo: e.target.value })} />
        </Field>
        <Field label="Vida útil (km)">
          <Input type="number" value={String(value.vidaUtil)} onChange={(e) => onChg({ ...value, vidaUtil: Number(e.target.value) })} style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>
        <Field label="Km ya recorridos">
          <Input type="number" value={String(value.kmRecorridos)} onChange={(e) => onChg({ ...value, kmRecorridos: Number(e.target.value) })} style={{ fontFamily: 'var(--font-mono)' }} placeholder="0" />
        </Field>
      </div>
    </div>
  )
}

function TireFirstLoadForm({ camion, onCreate, onCancel }: { camion: Camion; onCreate: (tires: Neumatico[]) => void; onCancel: () => void }) {
  const positions = useMemo(() => tirePositionsFor(camion.tipo), [camion.tipo])
  const groups = useMemo(() => ({
    steer:   positions.filter((p) => p.role === 'steer'),
    drive:   positions.filter((p) => p.role === 'drive'),
    trailer: positions.filter((p) => p.role === 'trailer'),
  }), [positions])

  const todayISO = new Date().toISOString().slice(0, 10)
  const [kmCamion, setKmCamion] = useState(camion.kmAcumulados ?? 0)
  const [medida, setMedida] = useState('295/80R22.5')
  const [fechaInst, setFechaInst] = useState(todayISO)
  const [steer,   setSteer]   = useState({ marca: 'Goodyear',    modelo: 'KMAX S', vidaUtil: 100000, kmRecorridos: 0 })
  const [drive,   setDrive]   = useState({ marca: 'Goodyear',    modelo: 'KMAX D', vidaUtil: 120000, kmRecorridos: 0 })
  const [trailer, setTrailer] = useState({ marca: 'Bridgestone', modelo: 'R168',   vidaUtil: 150000, kmRecorridos: 0 })
  const totalCount = positions.length

  function submit() {
    const grupos = { steer, drive, trailer }
    const tires: Neumatico[] = positions.map((p) => {
      const g = grupos[p.role]
      return {
        code: p.code, camionId: camion.id,
        marca: g.marca, modelo: g.modelo, medida,
        kmInicial: Math.max(0, kmCamion - g.kmRecorridos), kmActual: kmCamion,
        vidaUtilEsperada: g.vidaUtil, fechaInst,
        seg: p.seg, axle: p.axle, side: p.side, inner: p.inner, role: p.role,
      }
    })
    onCreate(tires)
  }

  return (
    <Card>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="trip_origin" size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Cargá los datos iniciales de los {totalCount} neumáticos
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            Configurá los valores por grupo. Después podés ajustar cada neumático individualmente.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: 14, background: 'var(--surface-muted)', borderRadius: 10, marginBottom: 16 }}>
        <Field label="Kilometraje actual del camión">
          <Input type="number" value={String(kmCamion)} onChange={(e) => setKmCamion(Number(e.target.value))} style={{ fontFamily: 'var(--font-mono)' }} />
        </Field>
        <Field label="Medida estándar">
          <SelectInput options={TIRE_SIZES.map((s) => ({ value: s, label: s }))} value={medida} onChange={(e) => setMedida(e.target.value)} />
        </Field>
        <Field label="Fecha de instalación">
          <Input type="date" value={fechaInst} onChange={(e) => setFechaInst(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GroupRow title="Direccionales (eje delantero)" count={groups.steer.length} value={steer} onChange={setSteer} helper="Neumáticos del eje delantero, simples." models={TIRE_MODELS_BY_ROLE.steer} />
        <GroupRow title="Tracción (eje trasero del tractor)" count={groups.drive.length} value={drive} onChange={setDrive} helper="Eje motriz, ruedas duales. Mayor desgaste." models={TIRE_MODELS_BY_ROLE.drive} />
        <GroupRow title="Acoplado / semirremolque" count={groups.trailer.length} value={trailer} onChange={setTrailer} helper="Ejes del acoplado, ruedas duales." models={TIRE_MODELS_BY_ROLE.trailer} />
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          Se crearán {totalCount} registros para {camion.patente}.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" icon="check" onClick={submit}>Cargar {totalCount} neumáticos</Button>
        </div>
      </div>
    </Card>
  )
}

// ── NEUMÁTICOS TAB ────────────────────────────────────────────────────────────

function CamNeumaticosTab({ camion, tires, onSetTires }: { camion: Camion; tires: Neumatico[]; onSetTires: (tires: Neumatico[]) => void }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(tires.length === 0)

  useEffect(() => { setShowForm(tires.length === 0) }, [tires.length])

  const selected = tires.find((t) => t.code === selectedCode)
  const layout = TRUCK_LAYOUTS[camion.tipo] ?? TRUCK_LAYOUTS['semirremolque']

  if (showForm && tires.length === 0) {
    return (
      <TireFirstLoadForm
        camion={camion}
        onCreate={(newTires) => { onSetTires(newTires); setShowForm(false); setSelectedCode(newTires[0]?.code ?? null) }}
        onCancel={() => setShowForm(false)}
      />
    )
  }

  if (tires.length === 0) {
    return (
      <Card>
        <div className="empty" style={{ padding: 32 }}>
          <div className="ico"><Icon name="trip_origin" /></div>
          <h3>Sin neumáticos cargados</h3>
          <p>Cargá los datos iniciales para llevar el control de desgaste por posición.</p>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" icon="add" onClick={() => setShowForm(true)}>Cargar neumáticos</Button>
          </div>
        </div>
      </Card>
    )
  }

  const promedio = Math.round(tires.reduce((s, t) => s + tireWearPct(t), 0) / tires.length)
  const criticos = tires.filter((t) => tireWearLevel(tireWearPct(t)) === 'critico').length
  const alerta = tires.filter((t) => tireWearLevel(tireWearPct(t)) === 'alerta').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Métricas rápidas — ancho completo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ padding: '12px 16px', background: 'var(--af-green-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--af-green-press)' }}>{promedio}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Desgaste promedio</div>
        </div>
        <div style={{ padding: '12px 16px', background: '#FFF3E0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: '#B25800' }}>{alerta}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>En alerta</div>
        </div>
        <div style={{ padding: '12px 16px', background: 'var(--st-cancelado-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--st-cancelado-fg)' }}>{criticos}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Críticos</div>
        </div>
      </div>

      {/* Diagrama — ancho completo */}
      <Card
        title={`Vista superior — ${layout.label}`}
        actions={
          <Button variant="secondary" size="sm" icon="refresh" onClick={() => { onSetTires([]); setShowForm(true) }}>
            Recargar todos
          </Button>
        }
      >
        <TruckTopDown camion={camion} tires={tires} selectedCode={selectedCode} onSelectTire={setSelectedCode} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, padding: 12, background: 'var(--surface-muted)', borderRadius: 8, fontSize: 12 }}>
          {[
            { label: '0–55% · Óptimo', color: '#7CC944' },
            { label: '55–80% · Alerta', color: '#F5A623' },
            { label: '80–100% · Crítico', color: '#E03E3E' },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: '1px solid rgba(0,0,0,.1)', display: 'block' }} />
              {l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Lista + panel de detalle — side by side solo en la parte inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: 16, alignItems: 'start' }}>
        <Card title={`Listado de neumáticos · ${tires.length} unidades`} bodyStyle={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Marca / Modelo</th>
                <th>Medida</th>
                <th style={{ textAlign: 'right' }}>Km usados</th>
                <th style={{ width: 160 }}>Desgaste</th>
              </tr>
            </thead>
            <tbody>
              {tires.map((t) => {
                const pct = tireWearPct(t)
                const level = tireWearLevel(pct)
                const color = level === 'critico' ? '#E03E3E' : level === 'alerta' ? '#F5A623' : 'var(--af-green)'
                return (
                  <tr key={t.code} className={t.code === selectedCode ? 'selected' : ''} onClick={() => setSelectedCode(t.code === selectedCode ? null : t.code)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.code}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.marca}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.modelo}</div>
                    </td>
                    <td className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{t.medida}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{formatKm(t.kmActual - t.kmInicial)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--surface-muted)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!selected && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
              <Icon name="touch_app" size={16} />
              Tocá un neumático en el plano o en la lista para ver el detalle.
            </div>
          )}
        </Card>

        {selected && (
          <div style={{ position: 'sticky', top: 16 }}>
            <TireDetailPanel
              key={selected.code}
              tire={selected}
              onChange={(updated) => onSetTires(tires.map((t) => (t.code === updated.code ? updated : t)))}
              onReplace={(code) => {
                const km = tires.find((t) => t.code === code)?.kmActual ?? 0
                const today = new Date().toISOString().slice(0, 10)
                onSetTires(tires.map((t) => (t.code === code ? { ...t, kmInicial: km, kmActual: km, fechaInst: today } : t)))
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── CamionDetailPage ──────────────────────────────────────────────────────────

export interface CamionDetailData {
  chofer: Chofer | null
  docs: DocVehiculo[]
  taller: TallerVisita[]
  tires: Neumatico[]
}

interface CamionDetailPageProps {
  camion: Camion
  viajes: Viaje[]
  clientes: Cliente[]
  detailData: CamionDetailData
  loading?: boolean
  onBack: () => void
  onViewViaje: (v: Viaje) => void
  onSetTires: (tires: Neumatico[]) => void
  onAddDoc: (camionId: string, data: NuevoDocData) => Promise<void>
  onDeleteDoc: (docId: string) => Promise<void>
  onAddTaller: (camionId: string, data: NuevaTallerVisitaData) => Promise<void>
  onEditTaller: (camionId: string, visitaId: string, data: NuevaTallerVisitaData) => Promise<void>
  onDeleteTaller: (visitaId: string) => Promise<void>
  choferes?: Chofer[]
  onSaveChofer: (camionId: string, data: NuevoChoferData, existingChoferId?: string) => Promise<void>
  onDesvincularChofer: (camionId: string) => Promise<void>
  onSeleccionarChofer?: (camionId: string, choferId: string) => Promise<void>
  onEditarCamion: (camionId: string, data: NuevaUnidadData) => Promise<void>
}

export type { NuevoDocData }

function camionToFormData(c: Camion): NuevaUnidadData {
  return {
    patente: c.patente,
    tipo: c.tipo as NuevaUnidadData['tipo'],
    marca: c.marca,
    modelo: c.modelo,
    anio: c.anio > 0 ? String(c.anio) : '',
    chofer: c.chofer === 'Sin asignar' ? '' : c.chofer,
    pesoMaxTon: c.pesoMaxTon != null ? String(c.pesoMaxTon) : '',
    volumenM3: c.volumenM3 != null ? String(c.volumenM3) : '',
    grainCert: c.grainCert ?? 'none',
    hasGps: c.hasGps ?? false,
    acopladoMarca: c.acopladoMarca ?? '',
    acopladoModelo: c.acopladoModelo ?? '',
    acopladoAnio: c.acopladoAnio != null ? String(c.acopladoAnio) : '',
    acopladoPesoMaxTon: c.acopladoPesoMaxTon != null ? String(c.acopladoPesoMaxTon) : '',
    acopladoLargo: c.acopladoLargo != null ? String(c.acopladoLargo) : '',
    acopladoAncho: c.acopladoAncho != null ? String(c.acopladoAncho) : '',
    acopladoAlto: c.acopladoAlto != null ? String(c.acopladoAlto) : '',
    acopladoCabezas: c.acopladoCabezas != null ? String(c.acopladoCabezas) : '',
    acopladoPisos: c.acopladoPisos != null ? String(c.acopladoPisos) : '',
    catCert: c.catCert ?? false,
    rutaCert: c.rutaCert ?? false,
    haciendaCert: c.haciendaCert ?? false,
  }
}

// ── FICHA TÉCNICA MODAL ───────────────────────────────────────────────────────

const TIPOS_ACOPLADO_ANIMALES_DETAIL = ['jaula_hacienda']
const TIPOS_ACOPLADO_CEREALES_DETAIL = ['tolva', 'acoplado', 'semirremolque']
const TIPOS_SIN_ACOPLADO_DETAIL = ['chasis', 'hidrogua']

function FichaTecnicaModal({ camion, onClose }: { camion: Camion; onClose: () => void }) {
  const tipoInfo = TIPOS_CAMION[camion.tipo as keyof typeof TIPOS_CAMION] ?? { label: camion.tipo, icon: 'local_shipping' }
  const tieneAcoplado = !TIPOS_SIN_ACOPLADO_DETAIL.includes(camion.tipo)
  const esAnimales = TIPOS_ACOPLADO_ANIMALES_DETAIL.includes(camion.tipo)
  const esCereales = TIPOS_ACOPLADO_CEREALES_DETAIL.includes(camion.tipo)

  const hayDatosAcoplado =
    camion.acopladoMarca || camion.acopladoModelo || camion.acopladoPesoMaxTon != null ||
    camion.acopladoLargo || camion.acopladoCabezas

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-tertiary)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border-soft)' }}>
          {title}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {children}
        </div>
      </div>
    )
  }

  function Row({ label, value }: { label: string; value?: string | number | null | boolean }) {
    if (value == null || value === '' || value === false) return null
    const display = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{display}</div>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-card)', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface-card)', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={tipoInfo.icon} size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>Ficha técnica</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{camion.patente}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Vehículo principal */}
          <Section title="Vehículo">
            <Row label="Tipo" value={tipoInfo.label} />
            <Row label="Patente" value={camion.patente} />
            <Row label="Marca" value={camion.marca || null} />
            <Row label="Modelo" value={camion.modelo || null} />
            <Row label="Año" value={camion.anio > 0 ? camion.anio : null} />
            <Row label="Peso máx." value={camion.pesoMaxTon != null ? `${camion.pesoMaxTon} tn` : null} />
            {camion.volumenM3 != null && <Row label="Volumen" value={`${camion.volumenM3} m³`} />}
            <Row label="GPS" value={camion.hasGps ? 'Instalado' : null} />
          </Section>

          {/* Acoplado */}
          {tieneAcoplado && hayDatosAcoplado && (
            <Section title={esAnimales ? 'Acoplado — Animales' : esCereales ? 'Acoplado — Cereales / Fertilizantes' : 'Acoplado / Remolque'}>
              <Row label="Marca" value={camion.acopladoMarca || null} />
              <Row label="Modelo" value={camion.acopladoModelo || null} />
              <Row label="Año" value={camion.acopladoAnio && camion.acopladoAnio > 0 ? camion.acopladoAnio : null} />
              <Row label="Tn máximas" value={camion.acopladoPesoMaxTon != null ? `${camion.acopladoPesoMaxTon} tn` : null} />
              {!esAnimales && !esCereales && (
                <>
                  <Row label="Largo" value={camion.acopladoLargo != null ? `${camion.acopladoLargo} m` : null} />
                  <Row label="Ancho" value={camion.acopladoAncho != null ? `${camion.acopladoAncho} m` : null} />
                  <Row label="Alto" value={camion.acopladoAlto != null ? `${camion.acopladoAlto} m` : null} />
                </>
              )}
              {esAnimales && (
                <>
                  <Row label="N° cabezas" value={camion.acopladoCabezas ?? null} />
                  <Row label="Pisos" value={camion.acopladoPisos ?? null} />
                </>
              )}
            </Section>
          )}
          {tieneAcoplado && !hayDatosAcoplado && (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <Icon name="info" size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Sin datos del acoplado. Completalos desde "Editar".
            </div>
          )}

          {/* Certificaciones */}
          <Section title="Certificaciones">
            {camion.catCert && <Row label="CAT" value="Vigente" />}
            {camion.rutaCert && <Row label="Permiso de Ruta" value="Vigente" />}
            {camion.haciendaCert && <Row label="SENASA Hacienda" value="Habilitado" />}
            {camion.grainCert && camion.grainCert !== 'none' && (
              <Row label="Cert. granos" value={camion.grainCert === 'senasa' ? 'SENASA' : 'Orgánico'} />
            )}
            {!camion.catCert && !camion.rutaCert && !camion.haciendaCert && (!camion.grainCert || camion.grainCert === 'none') && (
              <div style={{ gridColumn: 'span 2', color: 'var(--text-tertiary)', fontSize: 13 }}>Sin certificaciones cargadas.</div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

export function CamionDetailPage({ camion, viajes, clientes, detailData, loading = false, onBack, onViewViaje, onSetTires, onAddDoc, onDeleteDoc, onAddTaller, onEditTaller, onDeleteTaller, choferes, onSaveChofer, onDesvincularChofer, onSeleccionarChofer, onEditarCamion }: CamionDetailPageProps) {
  const [tab, setTab] = useState('dashboard')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [fichaOpen, setFichaOpen] = useState(false)
  const { chofer, docs, taller, tires } = detailData

  useEffect(() => { setTab('dashboard') }, [camion.id])

  const camionViajes = viajes.filter((v) => v.camionId === camion.id)
  const tipoInfo = TIPOS_CAMION[camion.tipo as keyof typeof TIPOS_CAMION] ?? { label: camion.tipo, icon: 'local_shipping' }
  const docsAlerta = docs.filter((d) => estadoVencimiento(d.venc).kind !== 'vigente').length

  return (
    <>
      {/* Custom page header */}
      <div className="page-header">
        <div className="title-block">
          <div className="eyebrow" style={{ cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }} onClick={onBack}>
            ← Volver a la flota
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24 }}>
            <span style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--af-green-bg)', color: 'var(--af-green-press)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={tipoInfo.icon} size={24} />
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>{camion.patente}</span>
            {camion.activo ? (
              <span className="badge" style={{ background: 'var(--st-entregado-bg)', color: 'var(--st-entregado-fg)', fontSize: 11 }}>
                <span className="dot" style={{ background: 'var(--st-entregado-dot)' }} />Activo
              </span>
            ) : (
              <span className="badge" style={{ background: 'var(--st-borrador-bg)', color: 'var(--st-borrador-fg)', fontSize: 11 }}>
                <span className="dot" style={{ background: 'var(--st-borrador-dot)' }} />Inactivo
              </span>
            )}
          </h1>
          <p>{tipoInfo.label} · {camion.marca} {camion.modelo} {camion.anio > 0 ? `· ${camion.anio}` : ''}{chofer ? ` · Chofer ${chofer.nombre}` : ''}</p>
        </div>
        <div className="actions">
          <Button variant="secondary" icon="edit" onClick={() => setEditModalOpen(true)}>Editar</Button>
          <Button variant="secondary" icon="picture_as_pdf" onClick={() => setFichaOpen(true)}>Ficha técnica</Button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: 'var(--text-tertiary)' }}>
            Cargando datos del vehículo...
          </div>
        ) : (
          <>
            <Tabs
              tabs={[
                { key: 'dashboard',  label: 'Dashboard',       icon: 'dashboard' },
                { key: 'viajes',     label: `Viajes (${camionViajes.length})`,   icon: 'route' },
                { key: 'documentos', label: `Documentos${docsAlerta > 0 ? ` (${docsAlerta})` : ''}`, icon: 'description' },
                { key: 'chofer',     label: 'Chofer',          icon: 'person', dot: !chofer },
                { key: 'taller',     label: `Taller (${taller.length})`,  icon: 'build' },
                { key: 'neumaticos', label: `Neumáticos${tires.length > 0 ? ` (${tires.length})` : ''}`, icon: 'trip_origin' },
              ]}
              active={tab}
              onChange={setTab}
            />

            <div style={{ marginTop: 16 }}>
              {tab === 'dashboard'  && <CamDashboardTab camion={camion} viajes={camionViajes} chofer={chofer} docs={docs} taller={taller} tires={tires} />}
              {tab === 'viajes'     && <CamViajesTab viajes={camionViajes} clientes={clientes} onViewViaje={onViewViaje} />}
              {tab === 'documentos' && <CamDocumentosTab docs={docs} onAddDoc={(data) => onAddDoc(camion.id, data)} onDeleteDoc={onDeleteDoc} />}
              {tab === 'chofer'     && <CamChoferTab chofer={chofer} camion={camion} choferes={choferes} onSaveChofer={(data) => onSaveChofer(camion.id, data, chofer?.id)} onDesvincularChofer={() => onDesvincularChofer(camion.id)} onSeleccionarChofer={onSeleccionarChofer ? (id) => onSeleccionarChofer(camion.id, id) : undefined} />}
              {tab === 'taller'     && <CamTallerTab taller={taller} camion={camion} onAddTaller={(data) => onAddTaller(camion.id, data)} onEditTaller={(visitaId, data) => onEditTaller(camion.id, visitaId, data)} onDeleteTaller={onDeleteTaller} />}
              {tab === 'neumaticos' && <CamNeumaticosTab camion={camion} tires={tires} onSetTires={onSetTires} />}
            </div>
          </>
        )}
      </div>

      <NuevaUnidadModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={camionToFormData(camion)}
        onSave={async (data) => {
          await onEditarCamion(camion.id, data)
          setEditModalOpen(false)
        }}
      />
      {fichaOpen && <FichaTecnicaModal camion={camion} onClose={() => setFichaOpen(false)} />}
    </>
  )
}
