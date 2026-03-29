# Sistema QR para Fiestas

Sistema de check-in con QR codes para eventos. El staff escanea la pulsera de cada invitado con la cámara del celular; el proyector reproduce automáticamente un video de saludo indicando la mesa asignada.

## Stack

- **Next.js 16** (App Router, output standalone)
- **Prisma 7** + **SQLite** (base de datos local, sin servidor externo)
- **shadcn/ui** + **Tailwind CSS v4**
- **SSE** (Server-Sent Events) para comunicación en tiempo real entre scanner y proyector

---

## Arquitectura

```
Staff apunta cámara al QR  →  GET /api/scan?id=xxx  →  Next.js Server  →  SSE  →  /display (proyector)
                                        ↓
                              redirect /llegada  →  Celular muestra mesa asignada
```

- El servidor corre **localmente** en la PC de la fiesta, sin necesidad de internet
- El escaneo se hace con la **cámara nativa** de cualquier celular (iOS o Android)
- No se requiere ninguna app especial ni permisos de cámara en el navegador
- Los videos se sirven por `/api/videos/[filename]` — ruta de API que lee del disco en cada request, compatible con archivos subidos después del build

---

## Desarrollo local (macOS / Linux)

### Requisitos

- Node.js 20+
- npm

### Instalación

```bash
git clone <repo>
cd scanner-qr
npm install
npx prisma migrate dev
npm run dev
```

Abre `http://localhost:3000` → redirige al panel admin.

### Variables de entorno

```env
# .env
DATABASE_URL="file:./dev.db"
```

---

## Estructura del proyecto

```
scanner-qr/
├── prisma/
│   ├── schema.prisma              # Modelos Table y Guest
│   └── migrations/
├── public/
│   └── videos/                    # Videos subidos desde el admin (en producción)
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
│   │       ├── scan/              # Registra llegada y emite evento SSE
│   │       ├── events/            # Stream SSE hacia el display
│   │       ├── videos/[filename]/ # Sirve archivos de video desde disco
│   │       ├── tables/            # CRUD de mesas
│   │       ├── guests/            # CRUD de invitados
│   │       ├── upload-video/      # Recibe y guarda videos subidos
│   │       └── stats/             # Estadísticas del dashboard
│   ├── components/ui/             # shadcn/ui components
│   └── lib/
│       ├── prisma.ts              # Cliente Prisma (singleton)
│       └── events.ts              # EventEmitter para SSE
├── SETUP-WINDOWS.bat              # Setup inicial en Windows (ejecutar una sola vez)
└── iniciar.bat                    # Arrancar el sistema en Windows
```

---

## Pantallas del sistema

| URL | Descripción | Quién lo usa |
|-----|-------------|--------------|
| `/admin` | Dashboard con contadores en tiempo real | Organizador (PC) |
| `/admin/tables` | Paso 1: crear mesas y subir videos | Organizador |
| `/admin/guests` | Paso 2: cargar invitados y asignar mesa | Organizador |
| `/admin/qr-generator` | Paso 3: generar QR codes y descargar PDF | Organizador |
| `/display` | Pantalla del proyector (fullscreen) | Proyector / TV |
| `/llegada` | Bienvenida en el celular tras escanear el QR | Celular del invitado |

---

## Manual — Antes de la fiesta

### 1. Crear las mesas

Ir a **Paso 1 · Mesas** en el menú lateral:

1. Ingresar el número de mesa (1, 2, 3...)
2. Nombre opcional ("Mesa de la familia")
3. Click en **Agregar mesa**
4. Repetir para todas las mesas
5. En cada mesa, click en **Subir video de saludo** y seleccionar el video grabado

> Formatos aceptados: `.mp4`, `.mov`, `.webm`. Un video por mesa.

### 2. Cargar los invitados

Ir a **Paso 2 · Invitados**:

1. Ingresar nombre y apellido
2. Seleccionar la mesa asignada
3. Click en **Agregar invitado**
4. Repetir para todos los invitados

### 3. Generar los QR codes

> **Importante:** antes de generar los QRs, accedé al admin usando la **IP de la PC**, no `localhost`.
> El `iniciar.bat` muestra esa URL al arrancar, por ejemplo: `http://192.168.1.33:3000`

Ir a **Paso 3 · QR Codes**:

1. Click en **Generar QRs** — crea un código único por invitado con la URL del servidor
2. Click en **Descargar PDF** — genera el PDF para imprimir
3. Imprimir, recortar y pegar cada QR en su pulsera

> Si accedés por `localhost`, el botón estará desactivado con un aviso de advertencia.

---

## Manual — El día de la fiesta

### Preparar el proyector

1. Conectar el proyector o TV a la PC
2. Abrir el navegador en la PC → `http://localhost:3000/display`
3. Presionar **F11** para pantalla completa
4. Mover la ventana al monitor del proyector

### Cuando llega un invitado

1. El staff apunta la **cámara del celular** al QR de la pulsera
2. El celular muestra una notificación para abrir el link — tocar para confirmar
3. El celular muestra una pantalla de bienvenida con el nombre y la mesa
4. El **proyector** reproduce automáticamente el video de saludo de esa mesa
5. Cuando el video termina, el proyector vuelve solo a la pantalla de bienvenida

> Si el invitado ya fue registrado, el celular muestra "Ya estás registrado" con su mesa, y el proyector reproduce el video de todos modos (sin contar como nueva llegada).

### Panel de control

En `http://[IP-PC]:3000/admin` se puede ver en tiempo real:
- Cuántos invitados llegaron vs. pendientes
- Estado por mesa
- Lista completa con filtros

---

## Instalación en Windows (producción)

### Requisitos

- **Node.js 20 LTS** — descargar de [nodejs.org](https://nodejs.org) e instalar

### Setup inicial (una sola vez)

1. Descomprimir el ZIP del proyecto en `C:\fiesta-qr\` (o cualquier carpeta)
2. Doble click en **`SETUP-WINDOWS.bat`**
3. Esperar 2-3 minutos — instala dependencias, genera la base de datos y compila la app
4. Al terminar muestra: *"Configuracion completada correctamente"*

### Uso diario

Doble click en **`iniciar.bat`** — arranca el servidor y abre el navegador con la URL correcta (IP real, no localhost).

> No cerrar la ventana negra mientras dure la fiesta.

---

## Notas técnicas

### Por qué la cámara nativa y no un navegador

Los navegadores móviles bloquean el acceso a la cámara en conexiones HTTP (solo lo permiten en HTTPS o localhost). La cámara nativa del sistema operativo no tiene esa restricción: detecta el QR y abre el link directamente sin permisos especiales.

### Flujo del scan

1. El QR contiene una URL: `http://[IP-PC]:3000/api/scan?id=[uuid]`
2. Al abrir esa URL, el servidor marca al invitado como llegado y emite un evento SSE
3. El display en `/display` recibe el evento por SSE y reproduce el video
4. El celular es redirigido a `/llegada` con el nombre y mesa del invitado

### Servicio de videos por API route

Los videos se sirven desde `/api/videos/[filename]` en lugar del directorio `public/`. Esto resuelve el problema de que Next.js standalone cachea las respuestas 404 para archivos que no existían al momento del build, impidiendo servir videos subidos dinámicamente. La ruta de API lee el archivo directamente del disco con soporte de `Range` para seeking.

### SSE — manejo de conexiones cerradas

El stream SSE usa el callback `cancel` del `ReadableStream` para limpiar listeners y timers cuando el display se desconecta, evitando el error `ERR_INVALID_STATE: Controller is already closed` que de lo contrario crashearía las requests de scan subsiguientes.

### Por qué SSE y no WebSockets

Los Server-Sent Events son unidireccionales (servidor → cliente), exactamente lo que se necesita para disparar el video en el proyector. No requieren librerías extra y funcionan sobre HTTP normal.

### Por qué SQLite y no PostgreSQL

El sistema está pensado para funcionar offline en una red local. SQLite es un archivo en disco sin servidor, lo que simplifica el deployment a un simple ZIP.

### Por qué buildear en Windows y no cross-compilar

`better-sqlite3` usa bindings nativos de Node.js. Al correr `npm install` en Windows, npm descarga automáticamente el binario correcto para esa plataforma, evitando todos los problemas de cross-compilación desde macOS.

---

## Licencia

MIT — proyecto académico / personal.
