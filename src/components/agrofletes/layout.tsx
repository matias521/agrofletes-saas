'use client'
import React from 'react'
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
  { key: 'viajes',        label: 'Viajes',          icon: 'local_shipping', badge: '3' },
  { key: 'clientes',      label: 'Clientes',        icon: 'groups' },
  { key: 'camiones',      label: 'Camiones',        icon: 'directions_car' },
]

const NAV_BOTTOM: NavItemDef[] = [
  { key: 'reportes',      label: 'Reportes',        icon: 'bar_chart' },
  { key: 'configuracion', label: 'Configuración',   icon: 'settings' },
]

interface SidebarProps {
  active: PageKey
  onNavigate: (page: PageKey) => void
  plan: 'Free' | 'Pro'
  onLogout?: () => void
  user?: { email?: string }
}

export function Sidebar({ active, onNavigate, plan, onLogout, user }: SidebarProps) {
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
            className={`nav-item${active === item.key ? ' active' : ''}`}
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
            className={`nav-item${active === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Plan card (only show for Free) */}
      {plan === 'Free' && (
        <div className="plan-card">
          <div className="plan-name">Plan {plan}</div>
          <div className="plan-desc">
            Usás {COMPANY.planMax} de 30 viajes disponibles este mes.
          </div>
          <button>Mejorar a Pro</button>
        </div>
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
  reportes:      'Reportes',
  configuracion: 'Configuración',
}

interface TopbarProps {
  page: PageKey
  subPage?: string
  onBack?: () => void
  searchValue?: string
  onSearchChange?: (v: string) => void
}

export function Topbar({ page, subPage, onBack, searchValue, onSearchChange }: TopbarProps) {
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
        <button className="icon-btn" title="Ayuda">
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
