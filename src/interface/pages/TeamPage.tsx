import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, Mail, ShieldCheck, Trash2, UserPlus, Users, AlertTriangle } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import HelpTip, { FieldLabel } from '../components/help/HelpTip'
import PlanSelector from '../components/PlanSelector'
import type { WorkspaceRole } from '../../shared/types'

const ROLE_LABEL: Record<WorkspaceRole, string> = { OWNER: 'Dono', ADMIN: 'Admin', MEMBER: 'Membro' }

const inputClass =
    'w-full px-4 py-2.5 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition text-sm'

export default function TeamPage() {
    const { user, activeWorkspace } = useAuth()
    const { entitlements, usage, refreshUsage, canManageBilling } = usePlan()
    const queryClient = useQueryClient()
    const myRole = activeWorkspace?.role ?? 'MEMBER'
    const canManage = myRole === 'OWNER' || myRole === 'ADMIN'

    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [limitReached, setLimitReached] = useState(false)
    const [showPlans, setShowPlans] = useState(false)

    const { data, isLoading, isError } = useQuery({
        queryKey: ['team', activeWorkspace?.id],
        queryFn: () => httpGateway.listMembers(),
        enabled: !!activeWorkspace,
    })

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['team'] })
        refreshUsage()
    }

    const inviteMutation = useMutation({
        mutationFn: () => httpGateway.createInvite(email.trim(), role),
        onSuccess: (result) => {
            setInviteLink(result.inviteUrl)
            setCopied(false)
            setEmail('')
            setError(null)
            setLimitReached(false)
            refresh()
        },
        onError: (err: any) => {
            setError(err?.message ?? 'Não foi possível criar o convite.')
            setLimitReached(err?.code === 'PLAN_LIMIT')
        },
    })

    const revokeMutation = useMutation({ mutationFn: (id: string) => httpGateway.revokeInvite(id), onSuccess: refresh })
    const removeMutation = useMutation({ mutationFn: (id: string) => httpGateway.removeMember(id), onSuccess: refresh })
    const roleMutation = useMutation({
        mutationFn: ({ id, nextRole }: { id: string; nextRole: 'ADMIN' | 'MEMBER' }) => httpGateway.updateMemberRole(id, nextRole),
        onSuccess: refresh,
    })

    const copyLink = async () => {
        if (!inviteLink) return
        try {
            await navigator.clipboard.writeText(inviteLink)
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    const whatsappLink = inviteLink
        ? `https://wa.me/?text=${encodeURIComponent(`Oi! Te convidei para a equipe ${activeWorkspace?.name ?? ''} no Lumen Deal. Crie sua conta por este link: ${inviteLink}`)}`
        : null

    const memberLimit = entitlements?.members ?? 1
    const used = (usage?.members ?? data?.members.length ?? 1) + (usage?.pendingInvites ?? data?.invites.length ?? 0)

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-light text-white flex items-center gap-2">
                        Equipe <HelpTip helpKey="team.role" side="right" />
                    </h1>
                    <p className="text-white/40 mt-1 text-sm">
                        Quem trabalha com você em <span className="text-white/70">{activeWorkspace?.name}</span>. Todos usam os mesmos pacotes e o mesmo perfil da empresa.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1 justify-end">
                        Vagas do plano <HelpTip helpKey="team.pending" side="left" />
                    </p>
                    <p className="text-lg font-semibold text-white">
                        {used} <span className="text-white/40 text-sm font-normal">/ {memberLimit}</span>
                    </p>
                </div>
            </div>

            {canManage && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#C9A84C]" />
                        <h2 className="text-sm font-semibold text-white">Convidar pessoa</h2>
                        <HelpTip helpKey="team.invite" />
                    </div>

                    <form
                        className="grid gap-3 sm:grid-cols-[1fr_160px_auto] items-end"
                        onSubmit={(event) => {
                            event.preventDefault()
                            if (email.trim()) inviteMutation.mutate()
                        }}
                    >
                        <div>
                            <FieldLabel htmlFor="invite-email">E-mail</FieldLabel>
                            <input
                                id="invite-email"
                                type="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="pessoa@empresa.com"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <FieldLabel htmlFor="invite-role" helpKey="team.role">Papel</FieldLabel>
                            <select
                                id="invite-role"
                                value={role}
                                onChange={(event) => setRole(event.target.value as 'ADMIN' | 'MEMBER')}
                                className={inputClass}
                            >
                                <option value="MEMBER">Membro</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={inviteMutation.isPending || !email.trim()}
                            className="h-[42px] inline-flex items-center justify-center gap-2 bg-[#C9A84C] text-black px-5 rounded-xl text-sm font-semibold hover:bg-[#d8b65a] disabled:opacity-50 transition-colors"
                        >
                            {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Gerar convite
                        </button>
                    </form>

                    {error && (
                        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                            <span className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                            </span>
                            {limitReached && canManageBilling && (
                                <button type="button" onClick={() => setShowPlans(true)} className="shrink-0 underline underline-offset-2">
                                    Ver planos
                                </button>
                            )}
                        </div>
                    )}

                    {inviteLink && (
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 space-y-3">
                            <p className="text-sm text-emerald-200">
                                Convite criado! Envie este link para a pessoa. Ele vale por 7 dias e só funciona com o e-mail convidado.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <code className="flex-1 min-w-0 truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-white/80">{inviteLink}</code>
                                <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15">
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copiado' : 'Copiar'}
                                </button>
                                {whatsappLink && (
                                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/30">
                                        Enviar no WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C9A84C]" /> Pessoas
                </h2>

                {isLoading && <p className="text-sm text-white/40">Carregando equipe...</p>}
                {isError && <p className="text-sm text-red-300">Não foi possível carregar a equipe. Recarregue a página.</p>}

                <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
                    {data?.members.map((member) => {
                        const isSelf = member.user.id === user?.id
                        const canRemove =
                            member.role !== 'OWNER' && (isSelf || myRole === 'OWNER' || (myRole === 'ADMIN' && member.role === 'MEMBER'))
                        return (
                            <li key={member.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-sm font-semibold text-[#C9A84C]">
                                    {member.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">
                                        {member.user.name} {isSelf && <span className="text-white/40">(você)</span>}
                                    </p>
                                    <p className="text-xs text-white/40 truncate">{member.user.email}</p>
                                </div>

                                {myRole === 'OWNER' && member.role !== 'OWNER' ? (
                                    <select
                                        aria-label={`Papel de ${member.user.name}`}
                                        value={member.role}
                                        onChange={(event) => roleMutation.mutate({ id: member.id, nextRole: event.target.value as 'ADMIN' | 'MEMBER' })}
                                        className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white"
                                    >
                                        <option value="MEMBER">Membro</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70">
                                        {member.role === 'OWNER' && <ShieldCheck className="w-3 h-3 text-[#C9A84C]" />}
                                        {ROLE_LABEL[member.role]}
                                    </span>
                                )}

                                {canRemove && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const question = isSelf
                                                ? `Sair da equipe ${activeWorkspace?.name}?`
                                                : `Remover ${member.user.name} da equipe?`
                                            if (window.confirm(question)) removeMutation.mutate(member.id)
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/40 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> {isSelf ? 'Sair' : 'Remover'}
                                    </button>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </section>

            {canManage && !!data?.invites.length && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        Convites pendentes <HelpTip helpKey="team.pending" />
                    </h2>
                    <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
                        {data.invites.map((invite) => (
                            <li key={invite.id} className="flex items-center gap-4 px-5 py-3 flex-wrap">
                                <Mail className="w-4 h-4 text-white/30" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/80 truncate">{invite.email}</p>
                                    <p className="text-xs text-white/35">
                                        {ROLE_LABEL[invite.role]} · expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => revokeMutation.mutate(invite.id)}
                                    className="rounded-lg px-2.5 py-1.5 text-xs text-white/40 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    Cancelar convite
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {showPlans && <PlanSelector onClose={() => setShowPlans(false)} />}
        </div>
    )
}
