import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const shouldUseHttps = process.env.NOVALAB_HTTPS === 'true'
const httpsCertPath = path.resolve('certs/localhost-cert.pem')
const httpsKeyPath = path.resolve('certs/localhost-key.pem')

function getHttpsConfig() {
  if (!shouldUseHttps) {
    return undefined
  }

  if (!fs.existsSync(httpsCertPath) || !fs.existsSync(httpsKeyPath)) {
    throw new Error('HTTPS certs are missing. Run `npm run cert:https` before `npm run dev:https`.')
  }

  return {
    cert: fs.readFileSync(httpsCertPath),
    key: fs.readFileSync(httpsKeyPath),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    https: getHttpsConfig(),
  },
})
