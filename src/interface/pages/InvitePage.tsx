import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Loader2, Users } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'

const ROLE_TEXT = { ADMIN: 'como admin', MEMBER: 'como membro' } as const

/** Tela pública do convite: mostra para qual equipe é, e leva a pessoa a aceitar, entrar ou criar a conta. */
export default function InvitePage() {
    const { token = '' } = useParams()
    const navigate = useNavigate()
    const { user, isAuthenticated, loading: authLoading, refreshUser, switchWorkspace, logout } = useAuth()
    const [accepting, setAccepting] = useState(false)
    const [acceptError, setAcceptError] = useState<string | null>(null)

    const { data: invite, isLoading, error } = useQuery({
        queryKey: ['invite', token],
        queryFn: () => httpGateway.getInvite(token),
        retry: false,
    })

    const accept = async () => {
        setAccepting(true)
        setAcceptError(null)
        try {
            const { workspaceId } = await httpGateway.acceptInvite(token)
            await refreshUser()
            switchWorkspace(workspaceId)
            navigate('/dashboard')
        } catch (err) {
            setAcceptError(err instanceof Error ? err.message : 'Não foi possível aceitar o convite.')
        } finally {
            setAccepting(false)
        }
    }

    const emailMatches = !!user && !!invite && user.email.toLowerCase() === invite.email.toLowerCase()
    const registerUrl = invite
        ? `/register?convite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`
        : '/register'

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Users className="w-5 h-5" />
                </div>

                {(isLoading || authLoading) && (
                    <p className="text-white/50 inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando convite...
                    </p>
                )}

                {error && (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-semibold">Convite indisponível</h1>
                        <p className="text-white/50 text-sm">{error instanceof Error ? error.message : 'Convite inválido ou expirado.'}</p>
                        <Link to="/login" className="text-[#C9A84C] text-sm hover:underline">Ir para o login</Link>
                    </div>
                )}

                {invite && !authLoading && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C9A84C]">Lumen Deal</p>
                            <h1 className="mt-3 text-2xl font-semibold leading-snug">
                                Você foi convidado para a equipe <span className="text-[#C9A84C]">{invite.workspace.name}</span>
                            </h1>
                            <p className="mt-2 text-sm text-white/50">
                                Convite para <strong className="text-white/80">{invite.email}</strong>, {ROLE_TEXT[invite.role]}.
                            </p>
                        </div>

                        {acceptError && (
                            <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full text-left">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {acceptError}
                            </div>
                        )}

                        {isAuthenticated && emailMatches && (
                            <button
                                type="button"
                                onClick={accept}
                                disabled={accepting}
                                className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Entrar na equipe
                            </button>
                        )}

                        {isAuthenticated && !emailMatches && (
                            <div className="space-y-3 text-sm text-white/60">
                                <p>
                                    Você está conectado como <strong className="text-white/80">{user?.email}</strong>. Este convite é para outro e-mail.
                                </p>
                                <button type="button" onClick={() => logout()} className="text-[#C9A84C] hover:underline">
                                    Sair e entrar com {invite.email}
                                </button>
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="space-y-3">
                                <Link
                                    to={registerUrl}
                                    className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] inline-flex items-center justify-center gap-2"
                                >
                                    Criar minha conta <ArrowRight className="w-4 h-4" />
                                </Link>
                                <p className="text-xs text-white/40">
                                    Já tem conta com esse e-mail?{' '}
                                    <Link to={`/login?redirect=${encodeURIComponent(`/convite/${token}`)}`} className="text-[#C9A84C] hover:underline">
                                        Entrar e aceitar
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
