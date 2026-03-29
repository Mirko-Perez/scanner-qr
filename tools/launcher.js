/**
 * Windows launcher compiled to Fiesta-QR.exe via @yao-pkg/pkg.
 * Spawns node.exe + Next.js standalone server, then opens the browser.
 */
const { spawn }   = require('child_process')
const path        = require('path')
const fs          = require('fs')

// When compiled with pkg, process.execPath = path to Fiesta-QR.exe
const dir        = path.dirname(process.execPath)
const nodeExe    = path.join(dir, 'node.exe')
const server     = path.join(dir, '.next', 'standalone', 'server.js')
const dbPath     = path.join(dir, 'dev.db')
const publicPath = path.join(dir, 'public')

console.clear()
console.log('==========================================')
console.log('   SISTEMA QR PARA FIESTA  🎉')
console.log('==========================================')
console.log()

// Basic sanity checks
if (!fs.existsSync(nodeExe)) {
  console.error('ERROR: No se encontro node.exe')
  console.error('Asegurate de que node.exe este en la misma carpeta.')
  console.log('\nPresiona Enter para cerrar...')
  process.stdin.resume()
  process.stdin.once('data', () => process.exit(1))
  return
}

if (!fs.existsSync(server)) {
  console.error('ERROR: No se encontro el servidor (.next/standalone/server.js)')
  console.error('El paquete puede estar incompleto.')
  console.log('\nPresiona Enter para cerrar...')
  process.stdin.resume()
  process.stdin.once('data', () => process.exit(1))
  return
}

// Ensure public/videos folder exists
fs.mkdirSync(path.join(publicPath, 'videos'), { recursive: true })

// Environment for the Next.js server
const env = {
  ...process.env,
  DATABASE_URL: 'file:' + dbPath,
  PORT:         '3000',
  HOSTNAME:     '0.0.0.0',
  NODE_ENV:     'production',
}

console.log('Iniciando servidor... aguarda unos segundos.')
console.log()
console.log('Acceso desde esta PC:   http://localhost:3000')
console.log('Proyector:              http://localhost:3000/display')
console.log('Scanner (celular):      usa la IP de esta PC + :3000/scan')
console.log()
console.log('NO CIERRES ESTA VENTANA mientras dure la fiesta.')
console.log()

// Open browser after server has time to start
setTimeout(() => {
  try {
    spawn('cmd', ['/c', 'start', '', 'http://localhost:3000'], {
      detached: true,
      stdio:    'ignore',
      shell:    false,
    }).unref()
  } catch (_) {}
}, 3000)

// Start Next.js server
const child = spawn(nodeExe, [server], { env, stdio: 'inherit' })

child.on('error', (err) => {
  console.error('\nError al iniciar el servidor:', err.message)
})

child.on('exit', (code) => {
  console.log(`\nEl servidor se detuvo (codigo ${code}).`)
  console.log('Presiona Enter para cerrar...')
  process.stdin.resume()
  process.stdin.once('data', () => process.exit(code ?? 0))
})
