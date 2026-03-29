#!/usr/bin/env node
/**
 * Build script: creates the Windows distribution package.
 *
 * Output: dist-windows/
 *   Fiesta-QR.exe   ← launcher with violet icon (double-click to start)
 *   node.exe         ← Node.js runtime for Windows
 *   .next/standalone ← Next.js server
 *   public/          ← static assets (videos, etc.)
 *   dev.db           ← SQLite database (empty)
 *
 * Run: node tools/build-windows.js
 * Requires: macOS or Linux with internet access.
 */

const { execSync }   = require('child_process')
const { execFileSync } = require('child_process')
const path           = require('path')
const fs             = require('fs')
const https          = require('https')
const { createGunzip } = require('zlib')

const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist-windows')
const EXE  = path.join(DIST, 'Fiesta-QR.exe')

// ─── helpers ────────────────────────────────────────────────────────────────

function step(label) {
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`  ${label}`)
  console.log('═'.repeat(50))
}

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts })
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(s, d)
    } else if (entry.isSymbolicLink()) {
      // Recreate symlink in destination
      try {
        const target = fs.readlinkSync(s)
        if (fs.existsSync(d)) fs.unlinkSync(d)
        fs.symlinkSync(target, d)
      } catch { /* skip broken symlinks */ }
    } else if (entry.isFile()) {
      // Only copy regular files; skip sockets, FIFOs, devices, etc.
      try {
        fs.copyFileSync(s, d)
      } catch { /* skip unreadable files */ }
    }
    // entry.isSocket() / entry.isFIFO() / entry.isBlockDevice() → skip
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { timeout: 60000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location)
          res.resume()
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`))
          return
        }
        const file = fs.createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve() })
        file.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {

  // 1. Build Next.js
  step('PASO 1 — Build de Next.js (output: standalone)')
  run('npm run build')

  // 2. Prepare dist folder
  step('PASO 2 — Preparar carpeta dist-windows/')
  fs.rmSync(DIST, { recursive: true, force: true })
  fs.mkdirSync(DIST, { recursive: true })

  // Copy standalone server
  const standaloneDir = path.join(ROOT, '.next', 'standalone')
  if (!fs.existsSync(standaloneDir)) {
    throw new Error('.next/standalone no encontrado. ¿Pusiste output:"standalone" en next.config.ts?')
  }
  copyDir(standaloneDir, path.join(DIST, '.next', 'standalone'))

  // Copy static files and public folder
  const staticSrc = path.join(ROOT, '.next', 'static')
  if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, path.join(DIST, '.next', 'standalone', '.next', 'static'))
  }
  copyDir(path.join(ROOT, 'public'), path.join(DIST, 'public'))

  // Copy empty database
  const dbSrc = path.join(ROOT, 'dev.db')
  fs.copyFileSync(
    fs.existsSync(dbSrc) ? dbSrc : path.join(ROOT, 'dev.db'),
    path.join(DIST, 'dev.db')
  )
  if (!fs.existsSync(path.join(DIST, 'dev.db'))) {
    fs.writeFileSync(path.join(DIST, 'dev.db'), '')
  }

  // Ensure public/videos exists
  fs.mkdirSync(path.join(DIST, 'public', 'videos'), { recursive: true })

  // 3. Compile launcher to Windows exe
  step('PASO 3 — Compilar Fiesta-QR.exe con pkg')
  run(
    `npx @yao-pkg/pkg tools/launcher.js --targets node20-win-x64 --output "${EXE}"`,
  )

  // 4. Embed violet icon
  step('PASO 4 — Incrustar ícono violeta')
  const { generateIco } = require('./generate-ico')
  const icoBuffer = generateIco()

  try {
    const resedit = require('resedit')
    const exeBuffer = fs.readFileSync(EXE)
    const exe = resedit.NtExecutable.from(exeBuffer)
    const res = resedit.NtExecutableResource.from(exe)

    // Convert Buffer to ArrayBuffer for resedit
    const icoAB = icoBuffer.buffer.slice(
      icoBuffer.byteOffset,
      icoBuffer.byteOffset + icoBuffer.byteLength
    )
    const iconFile = resedit.Data.IconFile.from(icoAB)

    resedit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      1,     // resource ID
      1033,  // LANG_ENGLISH / SUBLANG_ENGLISH_US
      iconFile.icons.map(i => i.data)
    )

    res.outputResource(exe)
    fs.writeFileSync(EXE, Buffer.from(exe.generate()))
    console.log('✓ Ícono incrustado correctamente')
  } catch (err) {
    console.warn('⚠ No se pudo incrustar el ícono:', err.message)
    console.warn('  El exe funciona igual, solo sin ícono personalizado.')
  }

  // 5. Download node.exe for Windows
  step('PASO 5 — Descargar node.exe para Windows x64')
  const nodeVersion = '20.19.0'  // LTS at time of writing; update as needed
  const nodeExeDest = path.join(DIST, 'node.exe')
  const tmpZip      = path.join(DIST, '_node-win.zip')
  const nodeUrl     = `https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-win-x64.zip`

  if (!fs.existsSync(nodeExeDest)) {
    console.log(`Descargando Node.js v${nodeVersion} para Windows...`)
    await download(nodeUrl, tmpZip)

    // Extract node.exe from zip using system unzip
    console.log('Extrayendo node.exe...')
    try {
      execFileSync('unzip', ['-j', tmpZip, `node-v${nodeVersion}-win-x64/node.exe`, '-d', DIST], {
        stdio: 'pipe'
      })
    } catch {
      // Fallback: try 7zip or bsdtar
      try {
        execFileSync('bsdtar', ['-xf', tmpZip, '--include', '*/node.exe', '-C', DIST, '--strip-components=1'], {
          stdio: 'pipe'
        })
      } catch {
        console.warn('⚠ No se pudo extraer node.exe automáticamente.')
        console.warn(`  Descargá manualmente: ${nodeUrl}`)
        console.warn(`  Extraé node.exe y ponelo en: ${DIST}`)
      }
    }

    if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip)
  } else {
    console.log('node.exe ya existe, salteando descarga.')
  }

  // 6. Summary
  step('✅ DISTRIBUCIÓN LISTA')
  console.log()
  console.log('Carpeta:', DIST)
  console.log()
  console.log('Contenido:')
  try {
    execSync(`ls -lh "${DIST}"`, { stdio: 'inherit' })
  } catch {
    for (const f of fs.readdirSync(DIST)) {
      console.log(' ', f)
    }
  }
  console.log()
  console.log('▶ Copiá TODA la carpeta dist-windows/ a un USB.')
  console.log('▶ En la PC Windows: doble click en Fiesta-QR.exe')
}

main().catch(err => {
  console.error('\n❌ Error en el build:', err.message)
  process.exit(1)
})
