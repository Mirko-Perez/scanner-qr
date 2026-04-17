# Sistema QR para Fiestas

Sistema de check-in con QR codes para eventos. El staff escanea la pulsera de cada invitado con la cámara del celular; el proyector reproduce automáticamente un video de saludo indicando la mesa asignada.

## Stack

- **Next.js 16** (App Router)
- **Prisma 7** + **PostgreSQL** (Vercel Postgres / Neon)
- **Vercel Blob** para almacenamiento de videos
- **shadcn/ui** + **Tailwind CSS v4**
- **SSE** (Server-Sent Events) para comunicación en tiempo real

---

## Arquitectura

```
Staff apunta cámara al QR  →  GET /api/scan?id=xxx  →  Vercel  →  SSE (DB polling)  →  /display (proyector)
                                        ↓
                              redirect /llegada  →  Celular muestra mesa asignada
```

- El sistema corre en **Vercel** — accesible desde cualquier lugar con internet
- Los QR codes usan el **dominio fijo** de Vercel, funcionan desde cualquier red
- Los videos se almacenan en **Vercel Blob** (persistentes, CDN global)
- El escaneo se hace con la **cámara nativa** de cualquier celular

---

## Deploy en Vercel

### Requisitos

- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub

### Servicios a configurar

1. **Vercel Postgres** — crear desde el dashboard de Vercel (Storage → Create → Postgres)
2. **Vercel Blob** — crear desde el dashboard de Vercel (Storage → Create → Blob)

### Variables de entorno

Configurar en Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL="postgresql://..."        # Se auto-configura al crear Vercel Postgres
BLOB_READ_WRITE_TOKEN="vercel_blob_..." # Se auto-configura al crear Vercel Blob
```

### Deploy

1. Conectar el repositorio en Vercel
2. Crear Vercel Postgres y Vercel Blob desde Storage
3. Vercel detecta Next.js automáticamente
4. Primera vez: ejecutar `npx prisma migrate deploy` o `npx prisma db push`

### Desarrollo local

```bash
git clone <repo>
cd scanner-qr
npm install
# Configurar .env con DATABASE_URL de Postgres y BLOB_READ_WRITE_TOKEN
npx prisma migrate dev
npm run dev
```

---

## Estructura del proyecto

```
scanner-qr/
├── prisma/
│   └── schema.prisma              # Modelos Table, Guest y ScanLog
├── src/
│   ├── app/
│   │   ├── admin/                 # Panel de administración
│   │   │   ├── page.tsx           # Dashboard con estadísticas en tiempo real
│   │   │   ├── tables/            # CRUD de mesas + upload de videos
│   │   │   ├── guests/            # CRUD de invitados
│   │   │   └── qr-generator/      # Generación y descarga de QR codes (PDF)
│   │   ├── display/               # Pantalla del proyector (fullscreen, SSE)
│   │   ├── llegada/               # Página de bienvenida mostrada en el celular
│   │   └── api/
│   │       ├── scan/              # Registra llegada y crea ScanLog
│   │       ├── events/            # Stream SSE (polling DB por nuevos ScanLogs)
│   │       ├── tables/            # CRUD de mesas
│   │       ├── guests/            # CRUD de invitados
│   │       ├── upload-video/      # Sube videos a Vercel Blob
│   │       └── stats/             # Estadísticas del dashboard
│   ├── components/ui/             # shadcn/ui components
│   └── lib/
│       ├── prisma.ts              # Cliente Prisma (singleton)
│       └── events.ts              # Tipos de eventos SSE
```

---

## Pantallas del sistema

| URL | Descripción | Quién lo usa |
|-----|-------------|--------------|
| `/admin` | Dashboard con contadores en tiempo real | Organizador |
| `/admin/tables` | Paso 1: crear mesas y subir videos | Organizador |
| `/admin/guests` | Paso 2: cargar invitados y asignar mesa | Organizador |
| `/admin/qr-generator` | Paso 3: generar QR codes y descargar PDF | Organizador |
| `/display` | Pantalla del proyector (fullscreen) | Proyector / TV |
| `/llegada` | Bienvenida en el celular tras escanear el QR | Celular del invitado |

---

## Manual — Antes de la fiesta

### 1. Crear las mesas

Ir a **Paso 1 · Mesas**:
1. Ingresar el número de mesa y nombre opcional
2. Click en **Agregar mesa**
3. Subir el video de saludo para cada mesa

### 2. Cargar los invitados

Ir a **Paso 2 · Invitados**:
1. Ingresar nombre, apellido y mesa asignada
2. Click en **Agregar invitado**

### 3. Generar los QR codes

Ir a **Paso 3 · QR Codes**:
1. Click en **Generar QRs** — crea un código por invitado con la URL del servidor
2. Click en **Descargar PDF** — genera el PDF para imprimir
3. Imprimir, recortar y pegar cada QR en su pulsera

> Los QRs usan el dominio fijo de Vercel — se pueden generar desde cualquier lugar y funcionan siempre.

---

## Manual — El día de la fiesta

### Preparar el proyector

1. Abrir un navegador → ir a `https://tu-app.vercel.app/display`
2. Presionar **F11** para pantalla completa

### Cuando llega un invitado

1. El staff apunta la **cámara del celular** al QR de la pulsera
2. El celular muestra una pantalla de bienvenida con el nombre y la mesa
3. El **proyector** reproduce automáticamente el video de saludo de esa mesa
4. Cuando el video termina, el proyector vuelve a la pantalla de bienvenida

---

## Notas técnicas

### SSE — polling de base de datos

El display se conecta a `/api/events` que abre un stream SSE. Internamente, el endpoint pollea la tabla `ScanLog` cada 2 segundos buscando nuevos escaneos. Cada scan (nuevo o repetido) inserta un registro en `ScanLog`. La conexión se auto-cierra antes del timeout de Vercel y `EventSource` reconecta automáticamente.

### Videos en Vercel Blob

Los videos se suben a Vercel Blob y se sirven directamente desde su CDN. El campo `videoPath` en la tabla `Table` almacena la URL pública del blob.

### Por qué la cámara nativa y no un navegador

Los navegadores móviles bloquean el acceso a la cámara en conexiones HTTP. La cámara nativa del sistema operativo detecta el QR y abre el link directamente sin permisos especiales.

---

## Licencia

MIT — proyecto académico / personal.
