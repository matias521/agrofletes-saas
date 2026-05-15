'use client'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Icon } from './icon'
import { EstadoKey, ESTADOS } from '@/lib/agrofletes-data'

// ── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  initials: string
  size?: number
  style?: React.CSSProperties
}

export function Avatar({ initials, size = 34, style }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--af-green), var(--af-lime))',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: 'var(--font-display)',
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  estado: EstadoKey
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const e = ESTADOS[estado]
  return (
    <span
      className="badge"
      style={{ background: e.bg, color: e.fg }}
    >
      <span className="dot" style={{ background: e.dot }} />
      {e.label}
    </span>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: string
  iconEnd?: string
  children?: React.ReactNode
}

export function Button({
  variant = 'secondary',
  size,
  icon,
  iconEnd,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const variantClass = `btn-${variant}`
  const sizeClass = size === 'sm' ? 'btn-sm' : ''
  const iconOnlyClass = !children && (icon || iconEnd) ? 'btn-icon' : ''
  return (
    <button className={`btn ${variantClass} ${sizeClass} ${iconOnlyClass} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 16 : 18} />}
    </button>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label?: React.ReactNode
  hint?: string
  error?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Field({ label, hint, error, children, style }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string
}

export function Input({ icon, className = '', ...rest }: InputProps) {
  if (icon) {
    return (
      <div className="input-affix-wrap">
        <Icon name={icon} size={18} />
        <input className={`input ${className}`} {...rest} />
      </div>
    )
  }
  return <input className={`input ${className}`} {...rest} />
}

// ── SelectInput ───────────────────────────────────────────────────────────────

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectInput({ options, placeholder, className = '', ...rest }: SelectInputProps) {
  return (
    <select className={`select-input ${className}`} {...rest}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────

export function Textarea({ className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`textarea ${className}`} {...rest} />
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  title?: string
  actions?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  className?: string
}

export function Card({ title, actions, children, style, bodyStyle, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3>{title}</h3>}
          {actions}
        </div>
      )}
      <div className="card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
  trendText?: string
  icon: string
}

export function MetricCard({ label, value, sub, trend, trendText, icon }: MetricCardProps) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon name={icon} size={20} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {(sub || trendText) && (
        <div className="metric-sub">
          {trendText && (
            <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
              <Icon name={trend === 'up' ? 'trending_up' : 'trending_down'} size={14} color="inherit" />
              {trendText}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  wide?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, wide, children, footer }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal${wide ? ' modal-wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" size="sm" icon="close" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

// ── ContextMenu ───────────────────────────────────────────────────────────────

interface MenuItemDef {
  label: string
  icon: string
  danger?: boolean
  separator?: false
  onClick: () => void
}
interface SeparatorDef {
  separator: true
}
type MenuDef = MenuItemDef | SeparatorDef

interface ContextMenuProps {
  items: MenuDef[]
  anchorRect: { bottom: number; right: number } | null
  onClose: () => void
}

export function ContextMenu({ items, anchorRect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!anchorRect) return null

  return (
    <div
      ref={ref}
      className="menu"
      style={{
        top: anchorRect.bottom + 4,
        right: window.innerWidth - anchorRect.right,
      }}
    >
      {items.map((item, i) => {
        if ('separator' in item && item.separator) {
          return <div key={i} className="menu-sep" />
        }
        const it = item as MenuItemDef
        return (
          <div
            key={i}
            className={`menu-item${it.danger ? ' danger' : ''}`}
            onClick={() => {
              it.onClick()
              onClose()
            }}
          >
            <Icon name={it.icon} size={18} />
            {it.label}
          </div>
        )
      })}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface TabDef {
  key: string
  label: string
  icon?: string
}

interface TabsProps {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
  style?: React.CSSProperties
}

export function Tabs({ tabs, active, onChange, style }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid var(--border-soft)',
        padding: '0 4px',
        ...style,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 14px',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${active === t.key ? 'var(--af-green)' : 'transparent'}`,
            color: active === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: active === t.key ? 600 : 500,
            fontSize: 14,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'color 150ms, border-color 150ms',
          }}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, subtitle, width = 480, children }: DrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,27,10,.35)',
          backdropFilter: 'blur(1px)',
          zIndex: 150,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width,
          background: '#fff',
          boxShadow: 'var(--shadow-modal)',
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 220ms ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-soft)',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-0.2px',
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" icon="close" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>{children}</div>
      </div>
    </>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const toastIconMap: Record<Toast['type'], string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={toastIconMap[t.type]} size={18} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// ── DataRow helper ────────────────────────────────────────────────────────────

interface DataRowProps {
  label: string
  value: React.ReactNode
}

export function DataRow({ label, value }: DataRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '9px 0',
        borderBottom: '1px solid var(--border-soft)',
        gap: 12,
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
