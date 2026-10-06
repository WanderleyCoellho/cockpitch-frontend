/**
 * Credencial do Google guardada só nesta aba enquanto a pessoa completa o cadastro
 * (o token do Google vale 1 hora; aqui expira em 30 minutos).
 */
const KEY = 'lumen_google_pending'
const TTL_MS = 30 * 60 * 1000

export type PendingGoogle = { credential: string; email: string; name: string }

export function storePendingGoogle(value: PendingGoogle) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ ...value, at: Date.now() }))
    } catch {
        // sem sessionStorage (modo privado restrito): o cadastro pede o Google de novo
    }
}

export function readPendingGoogle(): PendingGoogle | null {
    try {
        const raw = sessionStorage.getItem(KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as PendingGoogle & { at: number }
        if (!parsed.credential || Date.now() - parsed.at > TTL_MS) {
            sessionStorage.removeItem(KEY)
            return null
        }
        return { credential: parsed.credential, email: parsed.email, name: parsed.name }
    } catch {
        return null
    }
}

export function clearPendingGoogle() {
    try {
        sessionStorage.removeItem(KEY)
    } catch {
        // ignorado
    }
}
