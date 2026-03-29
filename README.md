# 🎉 Sistema QR para Fiestas

Sistema de check-in con QR codes para eventos. Permite generar pulseras con QR personalizadas por invitado, y al escanearlas reproduce un video de saludo en un proyector o pantalla grande indicando la mesa asignada.

## Stack

- **Next.js 16** (App Router, output standalone)
- **Prisma 7** + **SQLite** (base de datos local, sin servidor externo)
- **shadcn/ui** + **Tailwind CSS v4**
- **SSE** (Server-Sent Events) para comunicación en tiempo real entre scanner y proyector
- **@yao-pkg/pkg** para compilar el launcher a `.exe` con ícono

---

## Arquitectura

```
Celular (scanner)  →  POST /api/scan  →  Next.js Server  →  SSE  →  /display (proyector)
```

- El servidor corre **localmente** en la PC de la fiesta, sin necesidad de internet
- Los celulares se conectan por **WiFi local** (mismo router que la PC)
- Los videos se sirven desde `/public/videos/`, sin CDN ni servicios externos

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
│   ├── schema.prisma         # Modelos Table y Guest
│   └── migrations/
├── public/
│   └── videos/               # Videos por mesa (mesa-1.mp4, mesa-2.mp4, ...)
├── src/
│   ├── app/
│   │   ├── admin/            # Panel de administración
│   │   │   ├── page.tsx      # Dashboard con estadísticas
│   │   │   ├── tables/       # CRUD de mesas + upload de videos
│   │   │   ├── guests/       # CRUD de invitados
│   │   │   └── qr-generator/ # Generación y descarga de QR codes (PDF)
│   │   ├── display/          # Pantalla del proyector (fullscreen, SSE)
│   │   ├── scan/             # Scanner con cámara del celular
│   │   └── api/              # REST API + SSE stream
│   ├── components/ui/        # shadcn/ui components
│   └── lib/
│       ├── prisma.ts         # Cliente Prisma (singleton)
│       └── events.ts         # EventEmitter para SSE
└── tools/
    ├── launcher.js           # Script compilado como Fiesta-QR.exe
    ├── generate-ico.js       # Genera ícono violeta en ICO puro JS
    └── build-windows.js      # Pipeline completo de build para Windows
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
| `/scan` | Scanner QR con cámara | Celular del organizador |

---

## Manual — Antes de la fiesta

### 1. Crear las mesas

Ir a **Paso 1 · Mesas** en el menú lateral:

1. Ingresar el número de mesa (1, 2, 3...)
2. Nombre opcional ("Mesa de la familia")
3. Click en **Agregar mesa**
4. Repetir para todas las mesas
5. En cada mesa, click en **Subir video de saludo** y seleccionar el video grabado por la cumpleañera

> Los videos deben ser en formato `.mp4`. Habrá un video diferente por cada mesa.

### 2. Cargar los invitados

Ir a **Paso 2 · Invitados**:

1. Ingresar nombre y apellido
2. Seleccionar la mesa asignada
3. Click en **Agregar invitado**
4. Repetir para todos los invitados

### 3. Generar los QR codes

Ir a **Paso 3 · QR Codes**:

1. Click en **Generar QRs** — crea un código único por invitado
2. Click en **Descargar PDF** — genera el PDF para imprimir
3. Imprimir, recortar y pegar cada QR en su pulsera

> Cada QR está vinculado a un invitado específico con su mesa asignada.

---

## Manual — El día de la fiesta

### Preparar el proyector

1. Conectar el proyector a la PC
2. Abrir el navegador en la PC
3. Ir a `http://localhost:3000/display`
4. Presionar **F11** para pantalla completa
5. Mover la ventana al monitor del proyector

### Preparar el celular scanner

1. Conectar el celular al mismo WiFi que la PC
2. Obtener la IP de la PC:
   - **Windows:** abrir `cmd` → escribir `ipconfig` → anotar la **IPv4 Address** (ej: `192.168.1.100`)
3. En el celular, abrir el navegador y entrar a:
   ```
   http://192.168.1.100:3000/scan
   ```
4. Dar permiso a la cámara cuando lo solicite

### Cuando llega un invitado

1. Acercar la pulsera al celular
2. El scanner detecta el QR automáticamente
3. El proyector muestra el video de la mesa + nombre del invitado
4. El invitado ve "Dirigite a la Mesa X"

### Panel de control

En `http://localhost:3000/admin` se puede ver en tiempo real:
- Cuántos invitados llegaron vs. pendientes
- Estado por mesa
- Lista completa con filtros

---

## Build para Windows (distribución portable)

Genera un paquete completo que funciona **sin instalar nada** en la PC destino.

### Requisitos (en tu Mac)

- `unzip` disponible en terminal (viene por defecto en macOS)
- Conexión a internet (para descargar Node.js para Windows)

### Comando

```bash
npm run build:windows
```

### Qué hace internamente

1. `next build` — build de Next.js con `output: standalone`
2. Copia `.next/standalone`, `public/`, `dev.db` a `dist-windows/`
3. Compila `tools/launcher.js` → `Fiesta-QR.exe` con `@yao-pkg/pkg`
4. Incrusta el ícono violeta circular (generado en JS puro con `resedit`)
5. Descarga `node.exe` v20 LTS para Windows x64

### Resultado

```
dist-windows/
├── Fiesta-QR.exe   ← doble click para iniciar (tiene ícono violeta 🟣)
├── node.exe        ← motor Node.js para Windows (incluido automáticamente)
├── .next/          ← servidor Next.js
│   └── standalone/
├── public/
│   └── videos/     ← carpeta vacía, se llena desde el panel admin
└── dev.db          ← base de datos SQLite (vacía, lista para usar)
```

### Cómo transferir a la PC Windows

**Opción A — USB exFAT (recomendado):**
Formatear el USB como `exFAT` con Disk Utility en Mac (compatible con Mac escritura + Windows lectura/escritura), copiar la carpeta `dist-windows/`.

**Opción B — ZIP + nube/red:**
```bash
cd /ruta/al/proyecto
zip -r ~/Desktop/fiesta-qr-sistema.zip dist-windows/
```
Subir el `.zip` a Google Drive, WhatsApp, etc. y descomprimir en la PC Windows.

**Opción C — Compartir por red local:**
```bash
scp -r dist-windows/ usuario@IP-PC-WINDOWS:C:/fiesta-qr/
```

### Uso en la PC Windows

1. Descomprimir (si llegó como `.zip`)
2. Doble click en **`Fiesta-QR.exe`**
3. Se abre el navegador en `http://localhost:3000` automáticamente
4. Seguir el manual de "Antes de la fiesta" desde ahí
5. ⚠️ **No cerrar la ventana negra** mientras dure la fiesta

---

## Notas técnicas

### Por qué SSE y no WebSockets

Los Server-Sent Events son unidireccionales (servidor → cliente), lo que es exactamente lo que se necesita para disparar el video en el proyector. No requieren librerías extra, funcionan sobre HTTP normal y no dependen de internet.

### Por qué SQLite y no PostgreSQL

El sistema está pensado para funcionar offline en una red local. SQLite es un archivo en disco, sin servidor de base de datos, lo que simplifica el deployment a un simple ZIP/USB.

### Módulos nativos y cross-compilación

`better-sqlite3` usa bindings nativos de Node.js. El build de Windows descarga automáticamente `node.exe` para la versión correcta. Si hay problemas con los bindings en Windows, ejecutar en la carpeta de distribución:

```bash
node.exe -e "require('./node_modules/better-sqlite3')"
```

Si falla, reinstalar el módulo en Windows con:
```bash
node.exe node_modules/.bin/node-gyp rebuild
```

---

## Licencia

MIT — proyecto académico / personal.
