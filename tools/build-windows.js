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

const { execSync }     = require('child_process')
const { execFileSync } = require('child_process')
const path             = require('path')
const fs               = require('fs')
const https            = require('https')
const zlib             = require('zlib')

const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist-windows')
const EXE  = path.join(DIST, 'Fiesta-QR.exe')

// Node.js version bundled for Windows — must match node.exe
const NODE_VERSION    = '20.19.0'
const NODE_WIN_ABI    = '115'           // ABI for Node 20.x

// better-sqlite3 version (must match package.json)
const BSQLITE_VERSION = '12.8.0'

// ─── helpers ────────────────────────────────────────────────────────────────

function step(label) {
  console.log(`\n${'═'.repeat(54)}`)
  console.log(`  ${label}`)
  console.log('═'.repeat(54))
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
      try {
        const target = fs.readlinkSync(s)
        if (fs.existsSync(d)) fs.unlinkSync(d)
        fs.symlinkSync(target, d)
      } catch { /* skip broken symlinks */ }
    } else if (entry.isFile()) {
      try {
        fs.copyFileSync(s, d)
      } catch { /* skip unreadable files */ }
    }
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { timeout: 120000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location)
          res.resume()
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} para ${u}`))
          return
        }
        const file = fs.createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve() })
        file.on('error', reject)
        res.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

/**
 * Downloads the Windows prebuilt binary for better-sqlite3 from GitHub
 * and replaces the macOS binary inside the standalone directory.
 */
async function fixBetterSqliteForWindows(standaloneNodeModules) {
  const bsqliteDest = path.join(
    standaloneNodeModules,
    'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'
  )

  if (!fs.existsSync(path.dirname(bsqliteDest))) {
    console.warn('⚠ No se encontró better-sqlite3 en standalone/node_modules. Salteando.')
    return
  }

  const tmpTar = path.join(DIST, '_better-sqlite3-win.tar.gz')
  const binaryUrl = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${BSQLITE_VERSION}/better-sqlite3-v${BSQLITE_VERSION}-node-v${NODE_WIN_ABI}-win32-x64.tar.gz`

  console.log(`Descargando better-sqlite3 Windows binary...`)
  console.log(`URL: ${binaryUrl}`)

  try {
    await download(binaryUrl, tmpTar)
  } catch (e) {
    console.warn(`⚠ No se pudo descargar el binario: ${e.message}`)
    console.warn('  El sistema puede no funcionar en Windows.')
    return
  }

  // Extract build/Release/better_sqlite3.node from the tarball using tar
  const tmpExtract = path.join(DIST, '_bsqlite-extract')
  fs.mkdirSync(tmpExtract, { recursive: true })

  try {
    execFileSync('tar', ['-xzf', tmpTar, '-C', tmpExtract], { stdio: 'pipe' })

    // Find the .node file in the extracted directory
    let found = null
    const search = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name)
        if (f.isDirectory()) search(p)
        else if (f.name === 'better_sqlite3.node') { found = p; return }
      }
    }
    search(tmpExtract)

    if (found) {
      fs.copyFileSync(found, bsqliteDest)
      console.log(`✓ better_sqlite3.node reemplazado con el binario para Windows`)
    } else {
      console.warn('⚠ No se encontró better_sqlite3.node dentro del tarball.')
    }
  } catch (e) {
    console.warn(`⚠ Error al extraer el binario: ${e.message}`)
  } finally {
    if (fs.existsSync(tmpTar))     fs.unlinkSync(tmpTar)
    if (fs.existsSync(tmpExtract)) fs.rmSync(tmpExtract, { recursive: true, force: true })
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {

  // 1. Build Next.js
  step('PASO 1 — Build de Next.js (output: standalone)')
  run('npm run build')

  const standaloneDir = path.join(ROOT, '.next', 'standalone')
  if (!fs.existsSync(standaloneDir)) {
    throw new Error('.next/standalone no encontrado. ¿Pusiste output:"standalone" en next.config.ts?')
  }
  if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
    throw new Error('.next/standalone/server.js no encontrado. El build de Next.js puede haber fallado.')
  }
  console.log('✓ .next/standalone/server.js encontrado')

  // 2. Prepare dist folder
  step('PASO 2 — Preparar carpeta dist-windows/')
  fs.rmSync(DIST, { recursive: true, force: true })
  fs.mkdirSync(DIST, { recursive: true })

  // Copy standalone server
  const destStandalone = path.join(DIST, '.next', 'standalone')
  console.log(`Copiando ${standaloneDir}  →  ${destStandalone}`)
  copyDir(standaloneDir, destStandalone)

  if (!fs.existsSync(path.join(destStandalone, 'server.js'))) {
    throw new Error('La copia de .next/standalone falló — server.js no está en destino.')
  }
  console.log('✓ standalone copiado')

  // Copy static files into the standalone directory (required for Next.js)
  const staticSrc  = path.join(ROOT, '.next', 'static')
  const staticDest = path.join(destStandalone, '.next', 'static')
  if (fs.existsSync(staticSrc)) {
    console.log('Copiando .next/static...')
    copyDir(staticSrc, staticDest)
    console.log('✓ static copiado')
  }

  // Copy public folder
  console.log('Copiando public/...')
  copyDir(path.join(ROOT, 'public'), path.join(DIST, 'public'))

  // Ensure public/videos exists
  fs.mkdirSync(path.join(DIST, 'public', 'videos'), { recursive: true })

  // Copy database (empty or existing)
  const dbSrc  = path.join(ROOT, 'dev.db')
  const dbDest = path.join(DIST, 'dev.db')
  if (fs.existsSync(dbSrc)) {
    fs.copyFileSync(dbSrc, dbDest)
    console.log('✓ dev.db copiado')
  } else {
    fs.writeFileSync(dbDest, '')
    console.log('✓ dev.db creado (vacío)')
  }

  // 3. Fix better-sqlite3 Windows binary
  step('PASO 3 — Reemplazar binario de better-sqlite3 para Windows')
  const standaloneNodeModules = path.join(destStandalone, 'node_modules')
  await fixBetterSqliteForWindows(standaloneNodeModules)

  // 4. Compile launcher to Windows exe
  step('PASO 4 — Compilar Fiesta-QR.exe con pkg')
  run(
    `npx @yao-pkg/pkg tools/launcher.js --targets node20-win-x64 --output "${EXE}"`,
  )

  // 5. Embed violet icon
  step('PASO 5 — Incrustar ícono violeta')
  const { generateIco } = require('./generate-ico')
  const icoBuffer = generateIco()

  try {
    const resedit = require('resedit')
    const exeBuffer = fs.readFileSync(EXE)
    const exe = resedit.NtExecutable.from(exeBuffer)
    const res = resedit.NtExecutableResource.from(exe)

    const icoAB = icoBuffer.buffer.slice(
      icoBuffer.byteOffset,
      icoBuffer.byteOffset + icoBuffer.byteLength
    )
    const iconFile = resedit.Data.IconFile.from(icoAB)

    resedit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      1,
      1033,
      iconFile.icons.map(i => i.data)
    )

    res.outputResource(exe)
    fs.writeFileSync(EXE, Buffer.from(exe.generate()))
    console.log('✓ Ícono incrustado correctamente')
  } catch (err) {
    console.warn('⚠ No se pudo incrustar el ícono:', err.message)
    console.warn('  El exe funciona igual, solo sin ícono personalizado.')
  }

  // 6. Download node.exe for Windows
  step('PASO 6 — Descargar node.exe para Windows x64')
  const nodeExeDest = path.join(DIST, 'node.exe')
  const tmpZip      = path.join(DIST, '_node-win.zip')
  const nodeUrl     = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`

  if (!fs.existsSync(nodeExeDest)) {
    console.log(`Descargando Node.js v${NODE_VERSION} para Windows...`)
    await download(nodeUrl, tmpZip)

    console.log('Extrayendo node.exe...')
    try {
      execFileSync('unzip', ['-j', tmpZip, `node-v${NODE_VERSION}-win-x64/node.exe`, '-d', DIST], {
        stdio: 'pipe'
      })
    } catch {
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

  // 7. Summary
  step('✅ DISTRIBUCIÓN LISTA')
  console.log()
  console.log('Carpeta:', DIST)
  console.log()
  console.log('Contenido:')
  try {
    execSync(`ls -lh "${DIST}"`, { stdio: 'inherit' })
  } catch {
    for (const f of fs.readdirSync(DIST)) console.log(' ', f)
  }
  console.log()

  // Verify critical files
  const criticalFiles = [
    path.join(DIST, 'Fiesta-QR.exe'),
    path.join(DIST, 'node.exe'),
    path.join(DIST, '.next', 'standalone', 'server.js'),
    path.join(DIST, 'dev.db'),
  ]
  let allOk = true
  for (const f of criticalFiles) {
    const ok = fs.existsSync(f)
    console.log(`  ${ok ? '✓' : '✗'} ${path.relative(DIST, f)}`)
    if (!ok) allOk = false
  }
  console.log()
  if (allOk) {
    console.log('▶ Copiá TODA la carpeta dist-windows/ a un USB.')
    console.log('▶ En la PC Windows: doble click en Fiesta-QR.exe')
  } else {
    console.error('❌ Algunos archivos críticos faltan — revisá los errores arriba.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ Error en el build:', err.message)
  process.exit(1)
})
