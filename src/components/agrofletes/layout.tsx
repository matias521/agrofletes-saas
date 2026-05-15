'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Icon } from './icon'
import { COMPANY } from '@/lib/agrofletes-data'

// ── Sidebar ───────────────────────────────────────────────────────────────────

type PageKey = 'inicio' | 'viajes' | 'clientes' | 'camiones' | 'reportes' | 'configuracion'

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
]

const NAV_BOTTOM: NavItemDef[] = [
  { key: 'reportes',      label: 'Reportes',        icon: 'bar_chart' },
  { key: 'configuracion', label: 'Configuración',   icon: 'settings' },
]

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    } finally {
      setSending(false)
    }
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

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

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
  reportes:      'Reportes',
  configuracion: 'Configuración',
}

interface TopbarProps {
  page: PageKey
  subPage?: string
  onBack?: () => void
  searchValue?: string
  onSearchChange?: (v: string) => void
  onOpenHelp?: () => void
}

export function Topbar({ page, subPage, onBack, searchValue, onSearchChange, onOpenHelp }: TopbarProps) {
  return (
    <header className="app-topbar">
      {onBack && (
        <button
          className="icon-btn"
          onClick={onBack}
          title="Volver"
        >
          <Icon name="arrow_back" size={20} />
        </button>
      )}
      <div className="crumbs">
        <span>AgroFletes</span>
        <span className="sep">/</span>
        <span className={subPage ? '' : 'here'}>{PAGE_LABELS[page]}</span>
        {subPage && (
          <>
            <span className="sep">/</span>
            <span className="here">{subPage}</span>
          </>
        )}
      </div>

      {onSearchChange !== undefined && (
        <div className="quick-search">
          <div className="input-affix-wrap">
            <Icon name="search" size={16} style={{ left: 10 }} />
            <input
              className="input"
              style={{ paddingLeft: 34, height: 34 }}
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginLeft: onSearchChange === undefined ? 'auto' : 0 }}>
        <button className="icon-btn" title="Notificaciones">
          <Icon name="notifications" size={20} />
          <span className="ping" />
        </button>
        <button className="icon-btn" title="Ayuda" onClick={onOpenHelp}>
          <Icon name="help_outline" size={20} fill={0} />
        </button>
      </div>
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
