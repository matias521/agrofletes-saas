# AgroFletes SaaS Web — Contexto del proyecto

> Documento de contexto para Claude Code. Define el stack, la arquitectura, las reglas y el estado actual del proyecto `agrofletes-saas`.

---

## 1. Qué es este proyecto

AgroFletes SaaS es una **aplicación web independiente** que complementa la app mobile de AgroFletes. Es un panel de gestión orientado principalmente al rol **Broker** (empresas de transporte), aunque también cubre vistas para Shippers y Carriers.

### 1.1 Relación con la app mobile

- Este proyecto es **completamente independiente** de los repos `afletes-backend` y `afletes-frontend`.
- No se tocan, modifican ni importan archivos de esos repos bajo ninguna circunstancia.
- En el futuro se integrará con el backend Django, pero en esta etapa de prototipo usa **Supabase directamente** como fuente de datos.
- La compatibilidad futura se garantiza respetando los mismos modelos de datos y reglas de negocio definidos en el contexto de la app mobile.

### 1.2 Objetivo del prototipo

Validar los flujos principales del SaaS web antes de integrar con el backend Django:
- Autenticación y roles
- Dashboard por rol
- Gestión de órdenes
- Gestión de flota (vehículos y choferes)
- Cotizaciones y viajes
- Chat
- Billing y planes

---

## 2. Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript 5 |
| Base de datos | Supabase (PostgreSQL) — proyecto `agrofletes-saas` |
| Auth | Supabase Auth |
| Estilos | Tailwind CSS |
| Componentes | shadcn/ui (Base) |
| Estado global | Zustand |
| HTTP client | Supabase JS client (`@supabase/supabase-js`) |
| Deploy | VPS Hostinger con EasyPanel (Docker) |

### 2.1 Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=https://flezqspivqmlizqddcey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 2.2 Archivos base ya creados

- `src/lib/supabase.ts` — cliente browser
- `src/lib/supabase-server.ts` — cliente server
- `src/middleware.ts` — protección de rutas con auth
- `src/types/index.ts` — tipos del dominio

---

## 3. Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   └── (dashboard)/
│       ├── dashboard/
│       ├── orders/
│       ├── fleet/
│       ├── quotes/
│       ├── trips/
│       ├── chat/
│       └── billing/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Sidebar, Header, Screen wrappers
│   └── dashboard/   # Widgets y cards del dashboard
├── hooks/
├── lib/
├── services/        # Funciones de acceso a Supabase por dominio
├── store/           # Zustand stores
└── types/
```

---

## 4. Reglas obligatorias del proyecto

### 4.1 Idiomas
- **Código** (variables, funciones, clases, interfaces, comentarios técnicos): **inglés**
- **UI orientada al usuario** (labels, placeholders, mensajes de error, textos): **español rioplatense**
- No mezclar idiomas dentro de un mismo archivo

### 4.2 Generales
- Nunca hardcodear URLs ni credenciales — siempre desde variables de entorno
- Siempre usar TypeScript estricto — no usar `any`
- Componentes funcionales con hooks — no clases
- Todos los Server Components que puedan serlo; Client Components solo cuando sea necesario (interactividad, estado, eventos)
- Manejo de errores explícito en todas las llamadas a Supabase
- Loading states en todas las operaciones asíncronas

### 4.3 Deploy (EasyPanel + Docker)
- El proyecto debe poder construirse con `next build` en modo standalone
- Se agregará `Dockerfile` antes del primer deploy
- Las variables de entorno se cargan en EasyPanel, no en archivos del repo

---

## 5. Dominio de negocio

### 5.1 Roles

| Rol | Descripción |
|-----|-------------|
| `shipper` | Productor/dueño de campo. Crea órdenes de transporte. |
| `carrier` | Camionero individual. Cotiza y realiza viajes. |
| `broker` | Empresa de transporte. Administra flota y carriers. |

No existe el rol `driver` como usuario — es una entidad administrativa sin login creada por un Carrier o Broker.

### 5.2 Navegación por rol

Cada rol tiene un dashboard y sidebar distintos:

**Shipper**
- Dashboard → resumen de órdenes activas
- Órdenes → listado, detalle, crear orden
- Chat
- Perfil / Billing

**Carrier**
- Dashboard → resumen de viajes y cotizaciones
- Disponibles → órdenes publicadas para cotizar
- Mis Viajes → trips activos e histórico
- Chat
- Perfil / Billing

**Broker**
- Dashboard → resumen de flota, viajes y earnings
- Órdenes → órdenes del mercado
- Flota → vehículos y choferes
- Asignación → asignar carriers/drivers a viajes
- Cotizaciones
- Chat
- Billing

### 5.3 Modelos principales

#### User
```typescript
{
  id: string (UUID)
  email: string
  full_name: string
  role: 'shipper' | 'carrier' | 'broker'
  avatar_url?: string
  phone?: string
  cuit?: string
  rating_avg: number
  rating_count: number
  trips_completed: number
  has_basic_info: boolean
  has_kyc_approved: boolean
  has_payment_method: boolean
  has_profile_photo: boolean
  has_phone_verified: boolean
  has_vehicle: boolean
  has_zone: boolean
  onboarding_completed_at?: string
}
```

#### Order
```typescript
{
  id: string (UUID)
  shipper_id: string
  order_type: 'grain' | 'machinery' | 'general'
  status: 'draft' | 'published' | 'quoted' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
  origin_address: string
  destination_address: string
  pickup_date: string
  estimated_km?: number
  notes?: string
}
```

#### Vehicle
```typescript
{
  id: string (UUID)
  owner_id: string
  plate: string
  type: string // 14 tipos: carretón, semirremolque, tolva, etc.
  max_weight_ton: number
  is_available: boolean
  has_gps: boolean
}
```

#### Quote
```typescript
{
  id: string (UUID)
  order_id: string
  vehicle_id: string
  total_price: number
  currency: string // default 'ARS'
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
}
```

#### Trip
```typescript
{
  id: string (UUID)
  order_id: string
  vehicle_id: string
  driver_id?: string
  status: 'scheduled' | 'in_transit' | 'delivered' | 'disputed'
  started_at?: string
  delivered_at?: string
}
```

### 5.4 Flujo de negocio canónico

```
Shipper crea Order (draft)
  → Shipper publica Order (published)
    → Carrier/Broker cotiza con un Vehicle (Quote pending) → Order: quoted
      → Shipper acepta Quote → Order: assigned, Trip creado, Conversation creada
        → Carrier inicia Trip → Trip: in_transit, Order: in_transit
          → Carrier marca entrega → Trip: delivered, Order: delivered
            → Ambos dejan Review
```

### 5.5 Colores de estado de Order

| Estado | Color |
|--------|-------|
| draft | gris |
| published | `#58A400` (primary) |
| quoted | `#8BDF11` (lime) |
| assigned | verde oscuro |
| in_transit | negro |
| delivered | `#58A400` (primary) |
| cancelled | `#FF4444` |

---

## 6. Theming

### Paleta de colores AgroFletes

```css
--primary: #58A400;        /* Verde AgroFletes */
--primary-lime: #8BDF11;   /* Lime */
--ink: #000E08;            /* Negro verdoso */
--fg1: /* texto principal */
--fg5: /* texto muted */
--line: #D7D7D7;           /* Bordes */
--muted: #F4F4F4;          /* Fondos suaves */
--destructive: #FF4444;    /* Cancelado / Error */
```

El gradiente de marca es `#58A400 → #8BDF11`.

---

## 7. Convenciones de código

### Componentes
```typescript
// Siempre con tipos explícitos
interface Props {
  title: string
  onPress?: () => void
}

export function MyComponent({ title, onPress }: Props) {
  // ...
}
```

### Servicios (acceso a Supabase)
```typescript
// src/services/orders.ts
import { createClient } from '@/lib/supabase'

export async function getOrders() {
  const supabase = createClient()
  const { data, error } = await supabase.from('orders').select('*')
  if (error) throw error
  return data
}
```

### Naming
- Archivos de componentes: `PascalCase.tsx`
- Archivos de servicios/hooks/utils: `camelCase.ts`
- Carpetas: `kebab-case`
- Variables y funciones: `camelCase`
- Tipos e interfaces: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`

---

## 8. Estado actual del proyecto

- [x] Scaffold Next.js 14 con TypeScript y Tailwind
- [x] shadcn/ui instalado (Base)
- [x] Supabase conectado (cliente browser y server)
- [x] Middleware de auth configurado
- [x] Tipos del dominio definidos
- [x] Estructura de carpetas creada
- [ ] Schema de Supabase (tablas)
- [ ] Pantalla de login
- [ ] Layout del dashboard con sidebar por rol
- [ ] Dashboard home por rol
- [ ] Gestión de órdenes
- [ ] Gestión de flota
- [ ] Cotizaciones y viajes
- [ ] Chat
- [ ] Billing
- [ ] Dockerfile para EasyPanel

---

## 9. Próximos pasos (orden sugerido)

1. Crear el schema de Supabase (tablas, RLS policies)
2. Pantalla de login con Supabase Auth
3. Layout base del dashboard (sidebar + header)
4. Dashboard home con métricas por rol
5. Módulo de órdenes
6. Módulo de flota
7. Resto de módulos
8. Dockerfile y deploy en EasyPanel
