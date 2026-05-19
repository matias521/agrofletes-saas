'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider, useToast } from '@/components/agrofletes/ui'
import { Sidebar, Topbar } from '@/components/agrofletes/layout'
import { DashboardPage } from '@/components/agrofletes/dashboard'
import { TripsListPage, TripDetailPage, TripWizard, WizardData } from '@/components/agrofletes/trips'
import type { TipoDoc } from '@/lib/agrofletes-data'
import { ClientesPage, CamionesPage, ReportesPage, ConfigPage, NuevaUnidadData, NuevoClienteData } from '@/components/agrofletes/secondary'
import { CamionDetailPage, CamionDetailData, NuevoDocData, NuevaTallerVisitaData, NuevoChoferData } from '@/components/agrofletes/camion-detail'
import { OnboardingFlow } from '@/components/agrofletes/onboarding'
import {
  Viaje,
  Cliente,
  Camion,
  Neumatico,
  EstadoKey,
  ESTADOS,
  viajeFromDB,
  clienteFromDB,
  camionFromDB,
  choferFromDB,
  docVehiculoFromDB,
  tallerVisitaFromDB,
  neumaticoFromDB,
  estadoVencimiento,
  TIPOS_DOC_VEHICULO,
  AlertaFlota,
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
  const [openCamion, setOpenCamion] = useState<Camion | null>(null)
  const [camionDetail, setCamionDetail] = useState<CamionDetailData>({ chofer: null, docs: [], taller: [], tires: [] })
  const [camionDetailLoading, setCamionDetailLoading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [spotlightNav, setSpotlightNav] = useState<string | undefined>(undefined)
  const [openCamionesModal, setOpenCamionesModal] = useState(false)
  const [plan, setPlan] = useState<'Free' | 'Pro'>('Free')
  const [loading, setLoading] = useState(true)
  const [alertasFlota, setAlertasFlota] = useState<AlertaFlota[]>([])
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

      // Load fleet alerts (docs + chofer docs)
      const [{ data: allDocs }, { data: allChoferes }] = await Promise.all([
        supabase.from('camion_docs').select('*'),
        supabase.from('camion_choferes').select('*'),
      ])
      const needs = (iso: string) => { if (!iso) return false; const st = estadoVencimiento(iso); return st.kind === 'vencido' || st.kind === 'por_vencer' }
      const alertas: AlertaFlota[] = []
      for (const d of (allDocs ?? [])) {
        if (!needs(d.venc)) continue
        const tipo = TIPOS_DOC_VEHICULO.find((t) => t.id === d.tipo_id)
        const st = estadoVencimiento(d.venc)
        alertas.push({ id: d.id, label: tipo?.label ?? d.tipo_id, icon: tipo?.icon ?? 'description', venc: d.venc, sub: d.numero || undefined, kind: st.kind as 'vencido' | 'por_vencer', dias: st.dias })
      }
      for (const c of (allChoferes ?? [])) {
        const checks = [
          { id: `${c.id}-lic`,  label: 'Licencia de conducir', icon: 'local_police',       venc: c.lic_venc },
          { id: `${c.id}-psic`, label: 'Psicofísico',           icon: 'medical_services',  venc: c.psicofisico_venc },
          { id: `${c.id}-lib`,  label: 'Libreta de sanidad',    icon: 'health_and_safety', venc: c.libreta_sanidad_venc },
        ]
        for (const ch of checks) {
          if (!needs(ch.venc)) continue
          const st = estadoVencimiento(ch.venc)
          alertas.push({ id: ch.id, label: ch.label, icon: ch.icon, venc: ch.venc, sub: c.nombre, kind: st.kind as 'vencido' | 'por_vencer', dias: st.dias })
        }
      }
      // Sort: vencidos first, then by proximity
      alertas.sort((a, b) => a.dias - b.dias)
      setAlertasFlota(alertas)

      setViajes(mappedViajes)
      setClientes(clientesWithStats)
      setCamiones(camionesWithStats)
      setPlan((perfil?.plan as 'Free' | 'Pro') ?? 'Free')
      setUser({ id: authUser.id, email: authUser.email })
      setLoading(false)

      // Show onboarding on first visit (keyed per user)
      try {
        if (!localStorage.getItem(`af_onboarding_done_${authUser.id}`)) {
          setOnboardingOpen(true)
        }
      } catch {
        // localStorage not available
      }
    }
    load()
  }, [router])

  const handleNavigate = useCallback((page: PageKey) => {
    setActivePage(page)
    setOpenViaje(null)
    setOpenCamion(null)
  }, [])

  const handleOnboardingNavigate = useCallback((page: string) => {
    setSpotlightNav(page === 'inicio' ? undefined : page)
  }, [])

  const handleOnboardingClose = useCallback(() => {
    setOnboardingOpen(false)
    setSpotlightNav(undefined)
    try {
      if (user?.id) localStorage.setItem(`af_onboarding_done_${user.id}`, '1')
    } catch { /* ignore */ }
  }, [user])

  const handleOnboardingFinish = useCallback(() => {
    handleOnboardingClose()
    handleNavigate('inicio')
  }, [handleOnboardingClose, handleNavigate])

  const handleOpenHelp = useCallback(() => {
    setOnboardingOpen(true)
  }, [])

  const handleAddFirstTruck = useCallback(() => {
    handleOnboardingClose()
    setActivePage('camiones')
    setOpenCamionesModal(true)
  }, [handleOnboardingClose])

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

  const handleAddViajeDoc = useCallback(async (viajeId: string, tipoId: TipoDoc, nombre: string, file: File | null) => {
    const supabase = createClient()
    let fileUrl = ''
    if (file) {
      const path = `${user!.id}/${viajeId}/${Date.now()}_${file.name}`
      const { data: uploaded, error: uploadError } = await supabase.storage.from('viaje-docs').upload(path, file)
      if (uploadError) { showToast(`Error al subir archivo: ${uploadError.message}`); return }
      const { data: urlData } = supabase.storage.from('viaje-docs').getPublicUrl(uploaded.path)
      fileUrl = urlData.publicUrl
    }
    const newDoc = JSON.stringify({ tipo: tipoId, nombre, url: fileUrl })
    const viaje = viajes.find(v => v.id === viajeId)
    if (!viaje) return
    const updatedDocs = [...viaje.docs, newDoc]
    const { error } = await supabase.from('viajes').update({ docs: updatedDocs }).eq('id', viajeId)
    if (error) { showToast(`Error: ${error.message}`); return }
    setViajes(prev => prev.map(v => v.id === viajeId ? { ...v, docs: updatedDocs } : v))
    setOpenViaje(prev => prev?.id === viajeId ? { ...prev, docs: updatedDocs } : prev)
    showToast('Documento agregado.')
  }, [user, viajes, showToast])

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
      const { data: nuevoCliente, error: cliErr } = await supabase.from('clientes').insert({
        user_id: user!.id,
        razon: data.nuevoClienteRazon,
        alias: data.nuevoClienteRazon,
        activo: true,
      }).select().single()
      if (nuevoCliente) {
        clienteId = nuevoCliente.id
        setClientes((prev) => [...prev, clienteFromDB(nuevoCliente)])
      } else if (cliErr) {
        showToast(`Error al crear cliente: ${cliErr.message}`)
        return
      }
    }

    const { data: row, error } = await supabase.from('viajes').insert({
      user_id: user!.id,
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
    } else if (error) {
      showToast(`Error al crear viaje: ${error.message}`)
    }
  }, [user, showToast])

  const handleNuevoCamion = useCallback(async (data: NuevaUnidadData) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('camiones').insert({
      user_id: user!.id,
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
    } else if (error) {
      showToast(`Error al guardar: ${error.message}`)
    }
  }, [user, showToast])

  const handleEditarCamion = useCallback(async (camionId: string, data: NuevaUnidadData) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('camiones').update({
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
    }).eq('id', camionId).select().single()
    if (row) {
      const updated = camionFromDB(row)
      setCamiones((prev) => prev.map((c) => c.id === camionId ? { ...updated, viajes: c.viajes } : c))
      setOpenCamion((prev) => prev ? { ...updated, viajes: prev.viajes } : prev)
      showToast(`Unidad ${row.patente} actualizada.`)
    } else if (error) {
      showToast(`Error al guardar: ${error.message}`)
    }
  }, [showToast])

  const handleNuevoCliente = useCallback(async (data: NuevoClienteData) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('clientes').insert({
      user_id: user!.id,
      razon: data.razon,
      alias: data.alias || data.razon,
      cuit: data.cuit || null,
      tel: data.tel || null,
      localidad: data.localidad || null,
      rubro: data.rubro || null,
      activo: true,
    }).select().single()
    if (row) {
      setClientes((prev) => [...prev, clienteFromDB(row)])
    } else if (error) {
      showToast(`Error al guardar: ${error.message}`)
    }
  }, [user, showToast])

  const handleSelectCamion = useCallback(async (camion: Camion) => {
    setOpenCamion(camion)
    setActivePage('camiones')
    setCamionDetailLoading(true)
    const supabase = createClient()
    const [
      { data: choferDB },
      { data: docsDB },
      { data: tallerDB },
      { data: neumaticosDB },
    ] = await Promise.all([
      supabase.from('camion_choferes').select('*').eq('camion_id', camion.id).single(),
      supabase.from('camion_docs').select('*').eq('camion_id', camion.id).order('venc'),
      supabase.from('camion_taller').select('*').eq('camion_id', camion.id).order('fecha', { ascending: false }),
      supabase.from('camion_neumaticos').select('*').eq('camion_id', camion.id),
    ])
    setCamionDetail({
      chofer: choferDB ? choferFromDB(choferDB) : null,
      docs: (docsDB ?? []).map(docVehiculoFromDB),
      taller: (tallerDB ?? []).map(tallerVisitaFromDB),
      tires: (neumaticosDB ?? []).map(neumaticoFromDB),
    })
    setCamionDetailLoading(false)
  }, [])

  const handleSetTires = useCallback(async (tires: Neumatico[]) => {
    if (!openCamion || !user) return
    setCamionDetail((prev) => ({ ...prev, tires }))
    const supabase = createClient()
    // Delete all existing tires for this truck and reinsert
    await supabase.from('camion_neumaticos').delete().eq('camion_id', openCamion.id)
    if (tires.length > 0) {
      await supabase.from('camion_neumaticos').insert(
        tires.map((t) => ({
          user_id: user.id,
          camion_id: openCamion.id,
          code: t.code,
          marca: t.marca,
          modelo: t.modelo,
          medida: t.medida,
          km_inicial: t.kmInicial,
          km_actual: t.kmActual,
          vida_util_esperada: t.vidaUtilEsperada,
          fecha_inst: t.fechaInst,
          seg: t.seg,
          axle: t.axle,
          side: t.side,
          is_inner: t.inner,
          role: t.role,
        }))
      )
    }
  }, [openCamion, user])

  const handleAddDoc = useCallback(async (camionId: string, data: NuevoDocData) => {
    const supabase = createClient()
    let archivoUrl: string | null = null
    if (data.file) {
      const path = `${user!.id}/${camionId}/${Date.now()}_${data.file.name}`
      const { data: uploaded, error: uploadError } = await supabase.storage.from('camion-docs').upload(path, data.file)
      if (uploadError) { showToast(`Error al subir archivo: ${uploadError.message}`); return }
      const { data: urlData } = supabase.storage.from('camion-docs').getPublicUrl(uploaded.path)
      archivoUrl = urlData.publicUrl
    }
    const { data: row, error } = await supabase.from('camion_docs').insert({
      user_id: user!.id,
      camion_id: camionId,
      tipo_id: data.tipoId,
      numero: data.numero || null,
      entidad: data.entidad || null,
      emision: data.emision || null,
      venc: data.venc,
      archivo: archivoUrl,
    }).select().single()
    if (row) {
      setCamionDetail((prev) => ({ ...prev, docs: [...prev.docs, docVehiculoFromDB(row)] }))
      showToast('Documento guardado.')
    } else if (error) {
      showToast(`Error: ${error.message}`)
    }
  }, [user, showToast])

  const handleDeleteDoc = useCallback(async (docId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('camion_docs').delete().eq('id', docId)
    if (error) { showToast(`Error: ${error.message}`); return }
    setCamionDetail((prev) => ({ ...prev, docs: prev.docs.filter((d) => d.id !== docId) }))
    showToast('Documento eliminado.')
  }, [showToast])

  const handleSaveChofer = useCallback(async (camionId: string, data: NuevoChoferData) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('camion_choferes').upsert({
      user_id: user!.id,
      camion_id: camionId,
      nombre: data.nombre,
      iniciales: data.nombre.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      dni: data.dni || null,
      tel: data.tel || null,
      email: data.email || null,
      lic_cat: data.licCat || null,
      lic_numero: data.licNumero || null,
      lic_venc: data.licVenc || null,
      psicofisico_venc: data.psicofisicoVenc || null,
      libreta_sanidad_venc: data.libretaSanidadVenc || null,
    }, { onConflict: 'camion_id' }).select().single()
    if (row) {
      setCamionDetail((prev) => ({ ...prev, chofer: choferFromDB(row) }))
      showToast(`Chofer ${data.nombre} guardado.`)
    } else if (error) {
      showToast(`Error: ${error.message}`)
    }
  }, [user, showToast])

  const handleAddTaller = useCallback(async (camionId: string, data: NuevaTallerVisitaData) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('camion_taller').insert({
      user_id: user!.id,
      camion_id: camionId,
      fecha: data.fecha,
      taller: data.taller || null,
      motivo: data.motivo,
      trabajos: data.trabajos,
      costo: data.costo,
      km: data.km,
      prox_km: data.proxKm,
      notas: data.notas || null,
    }).select().single()
    if (row) {
      setCamionDetail((prev) => ({
        ...prev,
        taller: [tallerVisitaFromDB(row), ...prev.taller],
      }))
      showToast('Visita al taller registrada.')
    } else if (error) {
      showToast(`Error: ${error.message}`)
    }
  }, [user, showToast])

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
        <img src="/logo.svg" alt="AgroFletes" style={{ height: 60, width: 'auto' }} />
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
          onAddDoc={handleAddViajeDoc}
        />
      )
    }

    if (openCamion) {
      return (
        <CamionDetailPage
          camion={openCamion}
          viajes={viajes}
          clientes={clientes}
          detailData={camionDetail}
          loading={camionDetailLoading}
          onBack={() => setOpenCamion(null)}
          onViewViaje={(v) => { setOpenCamion(null); handleViewViaje(v) }}
          onSetTires={handleSetTires}
          onAddDoc={handleAddDoc}
          onDeleteDoc={handleDeleteDoc}
          onAddTaller={handleAddTaller}
          onSaveChofer={handleSaveChofer}
          onEditarCamion={handleEditarCamion}
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
            alertasFlota={alertasFlota}
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
        return <ClientesPage clientes={clientes} viajes={viajes} onNuevoCliente={handleNuevoCliente} />
      case 'camiones':
        return <CamionesPage camiones={camiones} viajes={viajes} onNuevoCamion={handleNuevoCamion} onSelectCamion={handleSelectCamion} openNewUnitModal={openCamionesModal} />
      case 'reportes':
        return <ReportesPage />
      case 'configuracion':
        return <ConfigPage />
      default:
        return null
    }
  }

  const showTopbar = !openViaje && !openCamion

  return (
    <div className="app-shell">
      <Sidebar
        active={activePage}
        onNavigate={handleNavigate}
        plan={plan}
        onLogout={handleLogout}
        user={user ?? undefined}
        spotlightNav={onboardingOpen ? spotlightNav : undefined}
      />
      <main className="main">
        {showTopbar && (
          <Topbar
            onOpenHelp={handleOpenHelp}
            alertas={alertasFlota.map((a) => ({
              id: a.id,
              label: a.label + (a.sub ? ` · ${a.sub}` : ''),
              desc: a.kind === 'vencido' ? `Vencido hace ${Math.abs(a.dias)}d · ${a.venc}` : `Vence en ${a.dias}d · ${a.venc}`,
              icon: a.icon,
            }))}
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
        onGoToCamiones={() => { setWizardOpen(false); setActivePage('camiones'); setOpenCamionesModal(true) }}
      />

      {/* Onboarding tutorial */}
      <OnboardingFlow
        open={onboardingOpen}
        onClose={handleOnboardingClose}
        onFinish={handleOnboardingFinish}
        onNavigate={handleOnboardingNavigate}
        onAddFirstTruck={handleAddFirstTruck}
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
