'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider, useToast } from '@/components/agrofletes/ui'
import { Sidebar, Topbar } from '@/components/agrofletes/layout'
import { DashboardPage } from '@/components/agrofletes/dashboard'
import { TripsListPage, TripDetailPage, TripWizard, WizardData } from '@/components/agrofletes/trips'
import { ClientesPage, CamionesPage, ReportesPage, ConfigPage, NuevaUnidadData } from '@/components/agrofletes/secondary'
import {
  Viaje,
  Cliente,
  Camion,
  EstadoKey,
  ESTADOS,
  viajeFromDB,
  clienteFromDB,
  camionFromDB,
} from '@/lib/agrofletes-data'
import { createClient } from '@/lib/supabase'

type PageKey = 'inicio' | 'viajes' | 'clientes' | 'camiones' | 'reportes' | 'configuracion'

function AppContent() {
  const router = useRouter()
  const { showToast } = useToast()

  const [activePage, setActivePage] = useState<PageKey>('inicio')
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [openViaje, setOpenViaje] = useState<Viaje | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [plan, setPlan] = useState<'Free' | 'Pro'>('Free')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const [
        { data: viajesDB },
        { data: clientesDB },
        { data: camionesDB },
        { data: perfil },
      ] = await Promise.all([
        supabase.from('viajes').select('*').order('fecha', { ascending: false }),
        supabase.from('clientes').select('*').order('razon'),
        supabase.from('camiones').select('*').order('patente'),
        supabase.from('perfiles').select('*').eq('id', authUser.id).single(),
      ])

      // Map DB rows to app types
      const mappedViajes = (viajesDB ?? []).map(viajeFromDB)
      const mappedClientes = (clientesDB ?? []).map(clienteFromDB)
      const mappedCamiones = (camionesDB ?? []).map(camionFromDB)

      // Compute derived fields
      const clientesWithStats = mappedClientes.map(c => ({
        ...c,
        viajes: mappedViajes.filter(v => v.clienteId === c.id).length,
        facturado: mappedViajes.filter(v => v.clienteId === c.id).reduce((s, v) => s + v.monto, 0),
      }))
      const camionesWithStats = mappedCamiones.map(c => ({
        ...c,
        viajes: mappedViajes.filter(v => v.camionId === c.id).length,
      }))

      setViajes(mappedViajes)
      setClientes(clientesWithStats)
      setCamiones(camionesWithStats)
      setPlan((perfil?.plan as 'Free' | 'Pro') ?? 'Free')
      setUser({ id: authUser.id, email: authUser.email })
      setLoading(false)
    }
    load()
  }, [router])

  const handleNavigate = useCallback((page: PageKey) => {
    setActivePage(page)
    setOpenViaje(null)
  }, [])

  const handleViewViaje = useCallback((v: Viaje) => {
    setActivePage('viajes')
    setOpenViaje(v)
  }, [])

  const handleChangeStatus = useCallback(async (viajeId: string, newStatus: EstadoKey) => {
    const supabase = createClient()
    await supabase.from('viajes').update({ estado: newStatus }).eq('id', viajeId)
    setViajes((prev) => prev.map((v) => (v.id === viajeId ? { ...v, estado: newStatus } : v)))
    setOpenViaje((prev) => (prev?.id === viajeId ? { ...prev, estado: newStatus } : prev))
    showToast(`Viaje actualizado a "${ESTADOS[newStatus].label}".`)
  }, [showToast])

  const handleDelete = useCallback(async (viajeId: string) => {
    const supabase = createClient()
    await supabase.from('viajes').delete().eq('id', viajeId)
    setViajes((vs) => vs.filter(v => v.id !== viajeId))
    setOpenViaje((prev) => (prev?.id === viajeId ? null : prev))
    showToast('Viaje eliminado.')
  }, [showToast])

  const handleSaveNew = useCallback(async (data: WizardData) => {
    const supabase = createClient()

    // Crear cliente nuevo si corresponde
    let clienteId: string | null = data.clienteId === '__new__' ? null : data.clienteId || null
    if (data.clienteId === '__new__' && data.nuevoClienteRazon) {
      const { data: nuevoCliente } = await supabase.from('clientes').insert({
        razon: data.nuevoClienteRazon,
        alias: data.nuevoClienteRazon,
        activo: true,
      }).select().single()
      if (nuevoCliente) {
        clienteId = nuevoCliente.id
        setClientes((prev) => [...prev, clienteFromDB(nuevoCliente)])
      }
    }

    const { data: row } = await supabase.from('viajes').insert({
      fecha: data.fechaSal,
      fecha_lleg: data.fechaLleg || null,
      cliente_id: clienteId,
      origen: data.origen,
      destino: data.destino,
      km: parseInt(data.km) || 0,
      camion_id: data.camionId || null,
      tipo_carga_id: data.tipoCargaId,
      tipo_carga_label: data.tipoCargaLabel,
      toneladas: parseFloat(data.toneladas) || 0,
      monto: data.total,
      estado: 'BORRADOR',
      docs: [],
      notas: data.notas || '',
    }).select().single()

    if (row) {
      const newViaje = viajeFromDB(row)
      setViajes((vs) => [newViaje, ...vs])
      showToast(`Viaje #${row.numero} creado como borrador.`)
    }
  }, [showToast])

  const handleNuevoCamion = useCallback(async (data: NuevaUnidadData) => {
    const supabase = createClient()
    const { data: row } = await supabase.from('camiones').insert({
      patente: data.patente.trim(),
      tipo: data.tipo,
      marca: data.marca || null,
      modelo: data.modelo || null,
      anio: parseInt(data.anio) || null,
      chofer: data.chofer || null,
      peso_max_ton: parseFloat(data.pesoMaxTon) || null,
      volumen_m3: parseFloat(data.volumenM3) || null,
      grain_cert: data.grainCert,
      has_gps: data.hasGps,
      activo: true,
    }).select().single()
    if (row) {
      setCamiones((prev) => [...prev, camionFromDB(row)])
      showToast(`Unidad ${row.patente} registrada.`)
    }
  }, [showToast])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-app)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'var(--af-green)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 20,
          color: '#fff',
        }}>
          A
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Cargando...</div>
      </div>
    )
  }

  function renderMain() {
    if (openViaje) {
      return (
        <TripDetailPage
          viaje={openViaje}
          clientes={clientes}
          camiones={camiones}
          onBack={() => setOpenViaje(null)}
          onUpdateEstado={handleChangeStatus}
        />
      )
    }

    switch (activePage) {
      case 'inicio':
        return (
          <DashboardPage
            viajes={viajes}
            clientes={clientes}
            camiones={camiones}
            onViewViaje={handleViewViaje}
            onNewViaje={() => setWizardOpen(true)}
            onNavigateViajes={() => handleNavigate('viajes')}
          />
        )
      case 'viajes':
        return (
          <TripsListPage
            viajes={viajes}
            clientes={clientes}
            camiones={camiones}
            onViewViaje={handleViewViaje}
            onNewViaje={() => setWizardOpen(true)}
            onUpdateEstado={handleChangeStatus}
            onDeleteViaje={handleDelete}
          />
        )
      case 'clientes':
        return <ClientesPage clientes={clientes} viajes={viajes} />
      case 'camiones':
        return <CamionesPage camiones={camiones} viajes={viajes} onNuevoCamion={handleNuevoCamion} />
      case 'reportes':
        return <ReportesPage />
      case 'configuracion':
        return <ConfigPage />
      default:
        return null
    }
  }

  const showTopbar = !openViaje

  return (
    <div className="app-shell">
      <Sidebar
        active={activePage}
        onNavigate={handleNavigate}
        plan={plan}
        onLogout={handleLogout}
        user={user ?? undefined}
      />
      <main className="main">
        {showTopbar && (
          <Topbar
            page={activePage}
            onSearchChange={() => {}}
            searchValue=""
          />
        )}
        {renderMain()}
      </main>

      {/* New trip wizard */}
      <TripWizard
        open={wizardOpen}
        clientes={clientes}
        camiones={camiones}
        onClose={() => setWizardOpen(false)}
        onSave={handleSaveNew}
      />
    </div>
  )
}

export default function DashboardPageWrapper() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
