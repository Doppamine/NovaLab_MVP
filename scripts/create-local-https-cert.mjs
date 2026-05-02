import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const certsDir = path.resolve('certs')
const keyPath = path.join(certsDir, 'localhost-key.pem')
const certPath = path.join(certsDir, 'localhost-cert.pem')
const configPath = path.join(certsDir, 'localhost-openssl.cnf')

fs.mkdirSync(certsDir, { recursive: true })

const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((network) => network && network.family === 'IPv4' && !network.internal)
  .map((network) => network.address)

const altNames = [
  'DNS.1 = localhost',
  'IP.1 = 127.0.0.1',
  ...localIps.map((ip, index) => `IP.${index + 2} = ${ip}`),
].join('\n')

fs.writeFileSync(configPath, `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
${altNames}
`)

execFileSync('openssl', [
  'req',
  '-x509',
  '-nodes',
  '-days',
  '365',
  '-newkey',
  'rsa:2048',
  '-keyout',
  keyPath,
  '-out',
  certPath,
  '-config',
  configPath,
], { stdio: 'inherit' })

fs.chmodSync(keyPath, 0o600)

console.log('')
console.log(`Created HTTPS key: ${keyPath}`)
console.log(`Created HTTPS cert: ${certPath}`)
console.log('')
console.log('Start the HTTPS dev server with:')
console.log('  npm run dev:https')
console.log('')
console.log('Local URLs:')
console.log('  https://localhost:5173/')
console.log('  https://127.0.0.1:5173/')
localIps.forEach((ip) => console.log(`  https://${ip}:5173/`))
