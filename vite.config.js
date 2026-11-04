
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Com a CSP valendo, o navegador bloqueia chamadas a qualquer API fora do connect-src.
 * Se o VITE_API_URL mudar (ex.: domínio próprio da API), o build falha até o vercel.json ser atualizado,
 * em vez de publicar um site que não consegue falar com o backend.
 */
function cspAllowsApi(apiUrl) {
  return {
    name: 'csp-allows-api',
    apply: 'build',
    buildStart() {
      if (!apiUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(apiUrl)) return
      const origin = new URL(apiUrl).origin
      const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))
      const csp = vercel.headers.flatMap((rule) => rule.headers).find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
      const sources = (name) => csp.split(';').map((d) => d.trim().split(/\s+/)).find(([d]) => d === name)?.slice(1) ?? []
      const missing = ['connect-src', 'report-uri'].filter(
        (name) => !sources(name).some((src) => src === origin || src.startsWith(`${origin}/`))
      )
      if (missing.length) {
        this.error(`VITE_API_URL aponta para ${origin}, mas ${missing.join(' e ')} da CSP no vercel.json não incluem esse endereço.`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), cspAllowsApi(env.VITE_API_URL)],
  }
});
