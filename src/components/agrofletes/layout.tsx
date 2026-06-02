'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Icon } from './icon'
import { COMPANY } from '@/lib/agrofletes-data'

// ── Sidebar ───────────────────────────────────────────────────────────────────

type PageKey = 'inicio' | 'viajes' | 'clientes' | 'camiones' | 'choferes' | 'liquidaciones' | 'reportes' | 'configuracion'

interface NavItemDef {
  key: PageKey
  label: string
  icon: string
  badge?: string
}

const NAV_ITEMS: NavItemDef[] = [
  { key: 'inicio',        label: 'Inicio',         icon: 'home' },
  { key: 'viajes',        label: 'Viajes',          icon: 'local_shipping' },
  { key: 'clientes',      label: 'Clientes',        icon: 'groups' },
  { key: 'camiones',      label: 'Camiones',        icon: 'directions_car' },
  { key: 'choferes',      label: 'Choferes',        icon: 'badge' },
  { key: 'liquidaciones', label: 'Liquidaciones',   icon: 'payments' },
]

const NAV_BOTTOM: NavItemDef[] = [
  { key: 'reportes',      label: 'Reportes',        icon: 'bar_chart' },
  { key: 'configuracion', label: 'Configuración',   icon: 'settings' },
]

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim()) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok || data.ok === false) {
        setSendError(data.error ?? 'Error al enviar. Intentá de nuevo.')
        setSending(false)
        return
      }
    } catch {
      setSendError('Error de red. Revisá tu conexión.')
      setSending(false)
      return
    }
    setSending(false)
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--af-green)', display: 'grid', placeItems: 'center',
            }}>
              <Icon name="feedback" size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                ¿En qué podemos mejorar?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Prototipo AgroFletes</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', borderRadius: 6 }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {sent ? (
          <div style={{
            padding: '20px 0', textAlign: 'center',
            color: 'var(--af-green)', fontWeight: 600, fontSize: 15,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <Icon name="check_circle" size={32} />
            ¡Gracias por tu sugerencia!
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contanos qué mejorarías, qué te faltó o qué no funcionó como esperabas..."
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface-app)',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.55,
                outline: 'none',
              }}
              autoFocus
            />
            {sendError && (
              <div style={{ fontSize: 13, color: 'var(--st-cancelado-fg)', background: 'var(--st-cancelado-bg)', borderRadius: 8, padding: '8px 12px' }}>
                {sendError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!text.trim() || sending}
              >
                <Icon name="send" size={15} /> {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface SidebarProps {
  active: PageKey
  onNavigate: (page: PageKey) => void
  plan: 'Free' | 'Pro'
  onLogout?: () => void
  user?: { email?: string }
  spotlightNav?: string
}

export function Sidebar({ active, onNavigate, plan, onLogout, user, spotlightNav }: SidebarProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const displayName = user?.email
    ? user.email.split('@')[0]
    : 'Usuario'

  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <Image src="/icon-logo.png" alt="AgroFletes icon" width={28} height={28} style={{ objectFit: 'contain' }} priority />
        </div>
        <div className="brand-text">
          <span className="name">AgroFletes</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="nav">
        <div className="nav-section-label">Principal</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            className={`nav-item${active === item.key ? ' active' : ''}${spotlightNav === item.key ? ' ob-spotlight' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
        ))}

        <div className="nav-section-label">Sistema</div>
        {NAV_BOTTOM.map((item) => (
          <div
            key={item.key}
            className={`nav-item${active === item.key ? ' active' : ''}${spotlightNav === item.key ? ' ob-spotlight' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Beta user card */}
      <div className="plan-card">
        <div className="plan-name">Usuario Beta</div>
        <div className="plan-desc">
          Esto es un prototipo brindado para personas seleccionadas.
        </div>
        <button onClick={() => setFeedbackOpen(true)}>Enviar sugerencias</button>
      </div>

      {feedbackOpen && typeof document !== 'undefined' && createPortal(
        <FeedbackModal onClose={() => setFeedbackOpen(false)} />,
        document.body
      )}

      {/* User tile */}
      <div
        className="user-tile"
        style={{ cursor: onLogout ? 'pointer' : 'default' }}
        title={onLogout ? 'Cerrar sesión' : undefined}
      >
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'Usuario'}
          </div>
          <div className="role">Admin</div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-tertiary)',
              borderRadius: 6,
            }}
          >
            <Icon name="logout" size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<PageKey, string> = {
  inicio:        'Inicio',
  viajes:        'Viajes',
  clientes:      'Clientes',
  camiones:      'Camiones',
  choferes:      'Choferes',
  liquidaciones: 'Liquidaciones',
  reportes:      'Reportes',
  configuracion: 'Configuración',
}

interface TopbarProps {
  onOpenHelp?: () => void
  alertas?: { id: string; label: string; desc: string; icon: string }[]
}

export function Topbar({ onOpenHelp, alertas = [] }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const hasAlertas = alertas.length > 0

  return (
    <header className="app-topbar">
      <div style={{ position: 'relative' }}>
        <button className="icon-btn" title="Notificaciones" onClick={() => setNotifOpen((v) => !v)}>
          <Icon name="notifications" size={20} />
          {hasAlertas && <span className="ping" />}
        </button>
        {notifOpen && (
          <div
            style={{
              position: 'absolute',
              top: 44,
              right: 0,
              width: 320,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notificaciones</span>
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2 }}>
                <Icon name="close" size={16} />
              </button>
            </div>
            {alertas.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                Sin notificaciones pendientes
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {alertas.map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF3E0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={a.icon} size={16} style={{ color: '#B25800' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {notifOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setNotifOpen(false)} />
        )}
      </div>
      <button className="icon-btn" title="Ayuda" onClick={onOpenHelp}>
        <Icon name="help_outline" size={20} fill={0} />
      </button>
    </header>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="title-block">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}
