import { useState } from 'react'
import { AlertTriangle, ArrowRight, Building2, Loader2 } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { SEGMENTS, type WorkspaceSegment } from '../../shared/segments'
import { useAuth } from '../context/AuthContext'

/**
 * Conta sem nenhuma empresa (saiu da equipe, ou conta antiga ligada ao Google).
 * Sem empresa nada do painel funciona, então a pessoa cria a sua antes de seguir.
 */
export default function CreateWorkspacePage() {
    const { user, refreshUser, switchWorkspace, logout } = useAuth()
    const [name, setName] = useState('')
    const [segment, setSegment] = useState<WorkspaceSegment>('GENERAL')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (name.trim().length < 2) return setError('Informe o nome da empresa (ou seu nome profissional).')
        setSubmitting(true)
        try {
            const { workspaceId } = await httpGateway.createWorkspace(name.trim(), segment)
            await refreshUser()
            switchWorkspace(workspaceId)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível criar a empresa.')
        } finally {
            setSubmitting(false)
        }
    }

    const inputClass =
        'w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/60'

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4 py-10">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-md p-8 space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
            >
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-[#C9A84C]">Lumen Deal</p>
                    <h1 className="mt-3 text-2xl font-semibold leading-snug">Crie sua empresa</h1>
                    <p className="mt-2 text-sm text-white/50">
                        Sua conta{user?.email ? <> <strong className="text-white/80">{user.email}</strong></> : ''} ainda não faz parte de nenhuma empresa.
                        Crie a sua para montar propostas e escolher um plano. Se você foi convidado para uma equipe, use o link do convite.
                    </p>
                </div>

                {error && (
                    <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                <label className="block space-y-2">
                    <span className="text-sm text-white/70">Nome da empresa</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputClass} placeholder="Ex.: Estúdio Luz" autoFocus />
                </label>
                <label className="block space-y-2">
                    <span className="text-sm text-white/70">Segmento</span>
                    <select value={segment} onChange={(e) => setSegment(e.target.value as WorkspaceSegment)} className={inputClass}>
                        {SEGMENTS.map((item) => (
                            <option key={item.id} value={item.id} className="bg-[#0F0F0F]">
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Criar empresa
                </button>
                <button type="button" onClick={() => logout()} className="w-full text-center text-xs text-white/40 hover:text-white/70">
                    Sair e entrar com outra conta
                </button>
            </form>
        </div>
    )
}
