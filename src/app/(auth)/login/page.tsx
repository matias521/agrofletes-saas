'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
      <div style={{ marginBottom: 8 }}>
        <img src="/logo.svg" alt="AgroFletes" style={{ height: 56, width: 'auto' }} />
      </div>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
          Ingresá a tu cuenta de AgroFletes
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
        ¿No tenés cuenta?{' '}
        <a
          href="/register"
          style={{ color: 'var(--af-green-press)', fontWeight: 600, textDecoration: 'none' }}
        >
          Registrate gratis
        </a>
      </div>
    </div>
  )
}
