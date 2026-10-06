import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpGateway } from '../../../infra/gateway/HttpGateway'

/* Tipos mínimos do Google Identity Services (script oficial carregado sob demanda). */
type GoogleId = {
    initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup'; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void
    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
}
declare global {
    interface Window {
        google?: { accounts: { id: GoogleId } }
    }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve()
    scriptPromise ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => {
            scriptPromise = null
            reject(new Error('Não foi possível carregar o login do Google.'))
        }
        document.head.appendChild(script)
    })
    return scriptPromise
}

export function useGoogleConfig() {
    return useQuery({ queryKey: ['google-config'], queryFn: () => httpGateway.getGoogleConfig(), staleTime: Infinity, retry: 1 })
}

/**
 * Botão oficial "Continuar com Google". Some sozinho se o login com Google não estiver configurado
 * no servidor ou se o script do Google não carregar (bloqueador, rede).
 */
export default function GoogleButton({
    onCredential,
    text = 'continue_with',
}: {
    onCredential: (credential: string) => void
    text?: 'signin_with' | 'signup_with' | 'continue_with'
}) {
    const { data: config } = useGoogleConfig()
    const container = useRef<HTMLDivElement>(null)
    const callbackRef = useRef(onCredential)
    callbackRef.current = onCredential
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!config?.enabled || !config.clientId) return
        let cancelled = false
        loadGoogleScript()
            .then(() => {
                const el = container.current
                const gsi = window.google?.accounts?.id
                if (cancelled || !el || !gsi) return
                gsi.initialize({
                    client_id: config.clientId!,
                    callback: (response) => callbackRef.current(response.credential),
                    ux_mode: 'popup',
                    auto_select: false,
                    cancel_on_tap_outside: true,
                })
                el.innerHTML = ''
                gsi.renderButton(el, {
                    type: 'standard',
                    theme: 'filled_black',
                    size: 'large',
                    shape: 'pill',
                    text,
                    logo_alignment: 'center',
                    locale: 'pt-BR',
                    width: Math.min(400, Math.max(240, el.offsetWidth || 320)),
                })
            })
            .catch(() => !cancelled && setFailed(true))
        return () => {
            cancelled = true
        }
    }, [config?.enabled, config?.clientId, text])

    if (!config?.enabled || failed) return null
    return (
        <div className="space-y-4">
            <div ref={container} className="flex justify-center min-h-[44px]" />
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/30">
                <span className="h-px flex-1 bg-white/10" /> ou com e-mail <span className="h-px flex-1 bg-white/10" />
            </div>
        </div>
    )
}
