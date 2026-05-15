'use client'
import React, { useState, useEffect } from 'react'
import { Icon } from './icon'

// ── Step definitions ──────────────────────────────────────────────────────────

type StepId = 'welcome' | 'flota' | 'viajes' | 'clientes' | 'listo'

interface Bullet { icon: string; text: string }

interface Step {
  id: StepId
  eyebrow: string
  icon: string
  title: string
  lead: string
  bullets?: Bullet[]
  preview: StepId
  primary: string
  secondary?: string
  targetNav?: string
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    eyebrow: 'Tour de 4 minutos',
    icon: 'waving_hand',
    title: 'Bienvenido a AgroFletes',
    lead: 'Tu sistema para gestionar fletes agropecuarios de punta a punta: camiones, viajes, clientes y cobranzas — todo en un solo lugar.',
    preview: 'welcome',
    primary: 'Empezar',
  },
  {
    id: 'flota',
    eyebrow: 'Paso 1 de 3 · Configuración inicial',
    icon: 'local_shipping',
    title: 'Cargá tu flota',
    lead: 'Empezá registrando los camiones que vas a usar. Cada viaje se asigna a una unidad — sin flota cargada no podés crear viajes.',
    bullets: [
      { icon: 'directions_car', text: 'Patente, tipo (carretón, semi tolva, camilla...) y marca/modelo.' },
      { icon: 'person',         text: 'Chofer asignado por unidad.' },
      { icon: 'speed',          text: 'Historial de kilómetros, viajes y rendimiento.' },
    ],
    preview: 'flota',
    primary: 'Siguiente',
    targetNav: 'camiones',
  },
  {
    id: 'viajes',
    eyebrow: 'Paso 2 de 3 · El día a día',
    icon: 'route',
    title: 'Registrá tus viajes',
    lead: 'El corazón del sistema. Cargá origen, destino, tipo de carga y monto. Después seguí el estado hasta el cobro.',
    bullets: [
      { icon: 'edit_note',   text: 'Asistente paso a paso: datos, carga, documentación y confirmación.' },
      { icon: 'task_alt',    text: 'Estados claros: Borrador, En tránsito, Entregado, Liquidado.' },
      { icon: 'attach_file', text: 'Adjuntá carta de porte, remito, ticket de balanza y factura.' },
    ],
    preview: 'viajes',
    primary: 'Siguiente',
    targetNav: 'viajes',
  },
  {
    id: 'clientes',
    eyebrow: 'Paso 3 de 3 · Quién te paga',
    icon: 'groups',
    title: 'Sumá tus clientes',
    lead: 'Asociá cada viaje a un cliente para llevar facturación, historial y datos fiscales en un solo lugar.',
    bullets: [
      { icon: 'business',      text: 'Razón social, CUIT, localidad y contacto.' },
      { icon: 'monitoring',    text: 'Facturación acumulada y cantidad de viajes por cliente.' },
      { icon: 'request_quote', text: 'Generá la factura del flete desde el detalle del viaje.' },
    ],
    preview: 'clientes',
    primary: 'Siguiente',
    targetNav: 'clientes',
  },
  {
    id: 'listo',
    eyebrow: '¡Todo listo!',
    icon: 'rocket_launch',
    title: 'Ya podés arrancar',
    lead: 'El primer paso es cargar tu flota. Después podés crear viajes y asociarlos a clientes.',
    bullets: [
      { icon: 'local_shipping', text: 'Cargá tu primer camión: patente, tipo y chofer.' },
      { icon: 'route',          text: 'Luego creá tu primer viaje asignándolo a esa unidad.' },
      { icon: 'help',           text: 'Volvé a abrir este tutorial desde el ícono de ayuda.' },
    ],
    preview: 'listo',
    primary: 'Agregar primer camión',
    secondary: 'Ir al Inicio',
  },
]

// ── Previews ──────────────────────────────────────────────────────────────────

function PreviewWelcome() {
  const tiles = [
    { icon: 'local_shipping', label: 'Flota',    sub: 'Camiones y choferes' },
    { icon: 'route',          label: 'Viajes',   sub: 'Origen, carga, estado' },
    { icon: 'groups',         label: 'Clientes', sub: 'CUIT y facturación' },
    { icon: 'monitoring',     label: 'Reportes', sub: 'Métricas y cobranzas' },
  ]
  return (
    <div className="ob-tiles">
      {tiles.map((t) => (
        <div key={t.label} className="ob-tile">
          <div className="ob-tile-ico"><Icon name={t.icon} size={20} /></div>
          <div>
            <div className="ob-tile-label">{t.label}</div>
            <div className="ob-tile-sub">{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewFlota() {
  const rows = [
    { patente: 'AB 123 CD', tipo: 'Carretón',   marca: 'Scania R450',     chofer: 'Juan Pérez',      viajes: 28 },
    { patente: 'EF 456 GH', tipo: 'Semi tolva', marca: 'Mercedes Actros', chofer: 'Roberto Sánchez', viajes: 41 },
  ]
  return (
    <div className="ob-list">
      {rows.map((r) => (
        <div key={r.patente} className="ob-row">
          <div className="ob-row-ico"><Icon name="local_shipping" size={18} /></div>
          <div className="ob-row-main">
            <div className="ob-row-title" style={{ fontFamily: 'var(--font-mono)' }}>{r.patente}</div>
            <div className="ob-row-sub">{r.tipo} · {r.marca}</div>
          </div>
          <div className="ob-row-meta">
            <div className="ob-row-meta-top">{r.chofer}</div>
            <div className="ob-row-meta-bot">{r.viajes} viajes</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewViajes() {
  const flow = [
    { label: 'Borrador',    cls: 'ob-st-borrador' },
    { label: 'En tránsito', cls: 'ob-st-transito' },
    { label: 'Entregado',   cls: 'ob-st-entregado' },
    { label: 'Liquidado',   cls: 'ob-st-liquidado' },
  ]
  return (
    <div>
      <div className="ob-flow-label">Ciclo de vida del viaje</div>
      <div className="ob-flow-track">
        {flow.map((s, i) => (
          <React.Fragment key={s.label}>
            <span className={`ob-pill ${s.cls}`}>
              <span className="ob-pill-dot" />
              {s.label}
            </span>
            {i < flow.length - 1 && (
              <Icon name="chevron_right" size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function PreviewClientes() {
  const rows = [
    { razon: 'Agropecuaria Los Aromos S.A.', cuit: '30-70654321-2', viajes: 14, fact: '$1.842.500' },
    { razon: 'Acopio Río Tercero S.R.L.',    cuit: '30-71987654-3', viajes: 22, fact: '$2.860.400' },
  ]
  return (
    <div className="ob-list">
      {rows.map((r) => (
        <div key={r.cuit} className="ob-row">
          <div className="ob-row-avatar">
            {r.razon.split(' ').slice(0, 2).map((w) => w[0]).join('')}
          </div>
          <div className="ob-row-main">
            <div className="ob-row-title">{r.razon}</div>
            <div className="ob-row-sub" style={{ fontFamily: 'var(--font-mono)' }}>CUIT {r.cuit}</div>
          </div>
          <div className="ob-row-meta">
            <div className="ob-row-meta-top" style={{ fontFamily: 'var(--font-mono)' }}>{r.fact}</div>
            <div className="ob-row-meta-bot">{r.viajes} viajes</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewListo() {
  const items = [
    { v: '3', l: 'Camiones', i: 'local_shipping' },
    { v: '6', l: 'Clientes', i: 'groups' },
    { v: '0', l: 'Viajes',   i: 'route' },
  ]
  return (
    <div className="ob-stats">
      {items.map((it) => (
        <div key={it.l} className="ob-stat">
          <div className="ob-stat-ico"><Icon name={it.i} size={16} /></div>
          <div>
            <div className="ob-stat-val">{it.v}</div>
            <div className="ob-stat-lbl">{it.l}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const PREVIEWS: Record<StepId, React.ReactNode> = {
  welcome:  <PreviewWelcome />,
  flota:    <PreviewFlota />,
  viajes:   <PreviewViajes />,
  clientes: <PreviewClientes />,
  listo:    <PreviewListo />,
}

// ── Main component ────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  open: boolean
  onClose: () => void
  onFinish: () => void
  onNavigate: (page: string) => void
  onAddFirstTruck: () => void
}

export function OnboardingFlow({ open, onClose, onFinish, onNavigate, onAddFirstTruck }: OnboardingFlowProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => { if (open) setIdx(0) }, [open])

  // ESC closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Sync sidebar nav as steps advance
  useEffect(() => {
    if (!open) return
    const step = STEPS[idx]
    if (step?.targetNav) onNavigate(step.targetNav)
    else onNavigate('inicio')
  }, [open, idx, onNavigate])

  if (!open) return null

  const step = STEPS[idx]
  const isFirst = idx === 0
  const isLast = idx === STEPS.length - 1

  const go = (next: number) => setIdx(Math.max(0, Math.min(STEPS.length - 1, next)))

  function handlePrimary() {
    if (isLast) {
      onFinish()
      onAddFirstTruck()
    } else {
      go(idx + 1)
    }
  }

  return (
    <div className="ob-backdrop" onClick={onClose}>
      <div className="ob-card" onClick={(e) => e.stopPropagation()}>

        {/* Top: dots + skip */}
        <div className="ob-top">
          <div className="ob-dots">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                className={`ob-dot${i === idx ? ' active' : ''}${i < idx ? ' done' : ''}`}
                onClick={() => go(i)}
                aria-label={`Paso ${i + 1}`}
              />
            ))}
          </div>
          <button className="ob-skip" onClick={onClose}>
            {isLast ? 'Cerrar' : 'Saltar tutorial'}
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Hero */}
        <div className={`ob-hero ob-hero-${step.id}`}>
          <div className="ob-hero-pattern" />
          <div className="ob-hero-badge">
            <Icon name={step.icon} size={44} />
          </div>
        </div>

        {/* Body */}
        <div className="ob-body">
          {step.eyebrow && <div className="ob-eyebrow">{step.eyebrow}</div>}
          <h2 className="ob-title">{step.title}</h2>
          <p className="ob-lead">{step.lead}</p>

          {step.bullets && (
            <ul className="ob-bullets">
              {step.bullets.map((b, i) => (
                <li key={i}>
                  <span className="ob-bullet-ico"><Icon name={b.icon} size={16} /></span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="ob-preview">{PREVIEWS[step.preview]}</div>
        </div>

        {/* Footer */}
        <div className="ob-foot">
          <button
            className="btn btn-ghost"
            onClick={() => go(idx - 1)}
            disabled={isFirst}
            style={{ visibility: isFirst ? 'hidden' : 'visible' }}
          >
            <Icon name="arrow_back" size={16} /> Atrás
          </button>

          <div className="ob-counter">
            <span className="ob-counter-cur">{idx + 1}</span>
            <span className="ob-counter-sep">/</span>
            <span>{STEPS.length}</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {isLast && step.secondary && (
              <button className="btn btn-secondary" onClick={onFinish}>{step.secondary}</button>
            )}
            <button className="btn btn-primary" onClick={handlePrimary}>
              {step.primary}
              <Icon name={isLast ? 'add' : 'arrow_forward'} size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
