import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LoginSchema, type LoginFormData } from '../../shared/schemas'
import GoogleButton from '../components/auth/GoogleButton'
import { ApiError } from '../../infra/gateway/HttpGateway'
import { storePendingGoogle } from '../components/auth/pendingGoogle'

export default function LoginPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    // Só caminhos internos (evita redirecionamento aberto para sites externos).
    const redirectParam = searchParams.get('redirect')
    const redirectTo = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/dashboard'
    const { login, loginWithGoogle, loading, error: authError } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [googleError, setGoogleError] = useState<string | null>(null)

    const onGoogle = async (credential: string) => {
        setGoogleError(null)
        try {
            await loginWithGoogle(credential)
            navigate(redirectTo)
        } catch (err) {
            if (err instanceof ApiError && err.code === 'GOOGLE_ACCOUNT_NOT_FOUND') {
                // Gmail sem conta: leva ao cadastro já conectado ao Google (só falta a empresa).
                storePendingGoogle({ credential, email: err.details?.google?.email ?? '', name: err.details?.google?.name ?? '' })
                navigate('/register?google=1')
                return
            }
            setGoogleError(err instanceof Error ? err.message : 'Não foi possível entrar com Google.')
        }
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(LoginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true)
        try {
            await login(data.email, data.password)
            navigate(redirectTo)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login'
            setError('email', { message })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative hidden lg:flex overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_35%),linear-gradient(160deg,#131313_0%,#0B0B0B_70%)]">
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:56px_56px]" />
                <div className="relative z-10 max-w-xl px-14 py-16 flex flex-col justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-[#C9A84C] font-semibold">Lumen Deal</p>
                        <h1 className="mt-6 text-5xl leading-[1.05] font-light tracking-tight text-white">
                            Propostas que vendem com mais clareza e presença.
                        </h1>
                        <p className="mt-6 max-w-md text-white/50 leading-relaxed">
                            Organize prestadores, monte pacotes elegantes e publique propostas com acabamento comercial real.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-lg">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Fluxo</p>
                            <p className="mt-2 text-xl text-white">Prestadores, pacotes e proposta em um só painel.</p>
                        </div>
                        <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/8 p-5">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9A84C]">Entrega</p>
                            <p className="mt-2 text-xl text-white">Visual premium sem depender de improviso manual.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md p-8 space-y-6 bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white">
                            Entrar no painel
                        </h1>
                        <p className="text-sm text-white/45 mt-2">Acesse sua operação comercial e continue de onde parou.</p>
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {authError}
                        </div>
                    )}

                    {googleError && (
                        <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {googleError}
                        </div>
                    )}

                    <GoogleButton text="signin_with" onCredential={onGoogle} />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5">Email</label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-300 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5">Senha</label>
                            <input
                                type="password"
                                placeholder="******"
                                className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-300 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                        >
                            {isSubmitting || loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                                : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-xs text-white/35">
                        Desenvolvido para prestadores de serviço
                    </p>
                    <p className="text-center text-xs text-white/40">
                        Ainda não tem conta?{' '}
                        <Link to="/register" className="text-[#C9A84C] hover:underline">
                            Cadastrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
