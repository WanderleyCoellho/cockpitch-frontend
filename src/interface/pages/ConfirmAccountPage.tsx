import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Loader2, MailCheck } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'

const MIN_PASSWORD = 8

/**
 * Primeiro login com Google.
 * Sem token: "verifique seu e-mail". Com token (link do e-mail): cria a senha e entra.
 */
export default function ConfirmAccountPage() {
    const { token } = useParams()
    const location = useLocation()
    const sentTo = (location.state as { email?: string } | null)?.email ?? null

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                    <MailCheck className="w-5 h-5" />
                </div>
                {token ? <CreatePassword token={token} /> : <CheckYourEmail email={sentTo} />}
            </div>
        </div>
    )
}

function CheckYourEmail({ email }: { email: string | null }) {
    return (
        <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C9A84C]">Lumen Deal</p>
            <h1 className="text-2xl font-semibold leading-snug">Confirme seu e-mail</h1>
            <p className="text-sm text-white/60">
                Enviamos um link para {email ? <strong className="text-white/80">{email}</strong> : 'o seu e-mail'}. Abra o e-mail, clique em{' '}
                <strong className="text-white/80">Confirmar e criar senha</strong> e pronto: daí em diante você entra com Google ou com e-mail e senha.
            </p>
            <p className="text-xs text-white/40">O link vale por 24 horas. Não chegou? Confira o spam ou entre com Google de novo para receber outro.</p>
            <Link to="/login" className="text-[#C9A84C] text-sm hover:underline">Voltar para o login</Link>
        </div>
    )
}

function CreatePassword({ token }: { token: string }) {
    const navigate = useNavigate()
    const { confirmGoogleAccount } = useAuth()
    const [password, setPassword] = useState('')
    const [repeat, setRepeat] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const { data: confirmation, isLoading, error } = useQuery({
        queryKey: ['google-confirmation', token],
        queryFn: () => httpGateway.getGoogleConfirmation(token),
        retry: false,
    })

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSubmitError(null)
        if (password.length < MIN_PASSWORD) return setSubmitError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`)
        if (password !== repeat) return setSubmitError('As duas senhas não são iguais.')
        setSubmitting(true)
        try {
            await confirmGoogleAccount(token, password)
            navigate('/dashboard')
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Não foi possível confirmar a conta.')
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <p className="text-white/50 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Conferindo o link...
            </p>
        )
    }

    if (error || !confirmation) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Link indisponível</h1>
                <p className="text-white/50 text-sm">{error instanceof Error ? error.message : 'Link inválido ou expirado.'}</p>
                <Link to="/login" className="text-[#C9A84C] text-sm hover:underline">Ir para o login</Link>
            </div>
        )
    }

    const inputClass =
        'w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/60'

    return (
        <form onSubmit={onSubmit} className="space-y-5 text-left">
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#C9A84C]">Lumen Deal</p>
                <h1 className="mt-3 text-2xl font-semibold leading-snug">Crie sua senha</h1>
                <p className="mt-2 text-sm text-white/50">
                    Para <strong className="text-white/80">{confirmation.email}</strong>. Depois você entra com Google ou com e-mail e senha.
                </p>
                {!confirmation.newAccount && (
                    <p className="mt-2 text-xs text-white/40">Já existia uma conta com este e-mail: a senha anterior deixa de valer.</p>
                )}
            </div>

            {submitError && (
                <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {submitError}
                </div>
            )}

            <label className="block space-y-2">
                <span className="text-sm text-white/70">Senha</span>
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder={`Pelo menos ${MIN_PASSWORD} caracteres`} />
            </label>
            <label className="block space-y-2">
                <span className="text-sm text-white/70">Repita a senha</span>
                <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={inputClass} />
            </label>

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Confirmar e entrar
            </button>
        </form>
    )
}
