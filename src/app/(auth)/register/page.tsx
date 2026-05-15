'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombre,
          empresa_nombre: empresa,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--st-entregado-bg)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto',
          fontSize: 28,
        }}>
          ✓
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Verificá tu email
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
            Te enviamos un email de confirmación a <strong>{email}</strong>.
            Hacé clic en el enlace para activar tu cuenta.
          </p>
        </div>
        <a
          href="/login"
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--af-green-press)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Volver al inicio de sesión
        </a>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 400,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      padding: '40px 36px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Brand mark */}
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <img src="/logo.svg" alt="AgroFletes" style={{ height: 56, width: 'auto' }} />
      </div>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>
          Crear cuenta
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
          Empezá a gestionar tus fletes hoy
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Nombre completo</label>
          <input
            className="input"
            type="text"
            placeholder="Ej: Matías García"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Nombre de la empresa</label>
          <input
            className="input"
            type="text"
            placeholder="Ej: Transportes García S.R.L."
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="tu@empresa.com.ar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Contraseña</label>
          <input
            className="input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--st-cancelado-bg)',
            color: 'var(--st-cancelado-fg)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 4, justifyContent: 'center' }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
        ¿Ya tenés cuenta?{' '}
        <a
          href="/login"
          style={{ color: 'var(--af-green-press)', fontWeight: 600, textDecoration: 'none' }}
        >
          Iniciá sesión
        </a>
      </div>
    </div>
  )
}
