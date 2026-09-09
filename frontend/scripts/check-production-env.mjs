import process from 'node:process'
import { loadEnv } from 'vite'

const strict = process.argv.includes('--strict')
const env = {
  ...loadEnv('production', process.cwd(), ''),
  ...process.env,
}

const requiredVariables = [
  'VITE_API_BASE_URL',
  'VITE_SOCKET_URL',
  'VITE_GEOAPIFY_API_KEY',
]

const errors = []
const warnings = []

for (const variable of requiredVariables) {
  if (!env[variable]?.trim()) {
    errors.push(`${variable} is missing.`)
  }
}

const validateUrl = (name) => {
  const value = env[name]?.trim()
  if (!value) return null

  try {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push(`${name} must use http:// or https://.`)
    }

    if (url.pathname.endsWith('/') && url.pathname !== '/') {
      warnings.push(`${name} has a trailing slash; remove it to avoid doubled paths.`)
    }

    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      const message = `${name} points to ${url.hostname}, which is not reachable from a public deployment.`
      ;(strict ? errors : warnings).push(message)
    }

    return url
  } catch {
    errors.push(`${name} must be a valid absolute URL.`)
    return null
  }
}

const apiUrl = validateUrl('VITE_API_BASE_URL')
const socketUrl = validateUrl('VITE_SOCKET_URL')

if (apiUrl && !apiUrl.pathname.replace(/\/$/, '').endsWith('/api')) {
  errors.push('VITE_API_BASE_URL must end with /api.')
}

if (socketUrl && socketUrl.pathname.replace(/\/$/, '').endsWith('/api')) {
  errors.push('VITE_SOCKET_URL must be the server origin without /api.')
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`)
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`Error: ${error}`)
  }

  process.exitCode = 1
} else {
  console.log('Frontend deployment environment is valid.')
}
