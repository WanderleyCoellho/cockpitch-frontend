import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Download, Loader2, ShieldCheck, Trash2, X } from 'lucide-react'
import { httpGateway, type AccountDeletionDecision, type AccountDeletionInfo } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = { OWNER: 'Dono', ADMIN: 'Admin', MEMBER: 'Membro' } as const

function errorText(error: unknown) {
    return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente em instantes.'
}

/** Direitos do titular (LGPD, art. 18) no próprio painel: baixar os dados e excluir a conta. */
export default function AccountDataSection() {
    const [exporting, setExporting] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const download = async () => {
        setExporting(true)
        setExportError(null)
        try {
            const data = await httpGateway.exportMyData()
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `lumen-deal-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            setExportError(errorText(error))
        } finally {
            setExporting(false)
        }
    }

    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
                <h2 className="text-sm font-semibold text-white">Sua conta e seus dados</h2>
            </div>
            <p className="text-xs text-white/40 -mt-2">
                Direitos garantidos pela LGPD. Saiba como tratamos seus dados na{' '}
                <Link to="/privacidade" className="underline underline-offset-2 hover:text-white/70">
                    Política de Privacidade
                </Link>
                .
            </p>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={download}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
                >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Baixar meus dados
                </button>
                <button
                    type="button"
                    onClick={() => setDeleting(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                    <Trash2 className="w-4 h-4" /> Excluir minha conta
                </button>
            </div>
            {exportError && <p role="alert" className="text-xs text-red-300">{exportError}</p>}
            {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
        </section>
    )
}

type Choice = { action: 'TRANSFER' | 'CLOSE'; newOwnerUserId: string }

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const info = useQuery({ queryKey: ['account-deletion'], queryFn: () => httpGateway.getAccountDeletion(), staleTime: 0 })
    const [choices, setChoices] = useState<Record<string, Choice>>({})
    const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
    const [code, setCode] = useState('')
    const [confirmText, setConfirmText] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const withTeam = info.data?.owned.filter((w) => w.members.length > 0) ?? []
    const alone = info.data?.owned.filter((w) => w.members.length === 0) ?? []
    const choiceOf = (workspace: AccountDeletionInfo['owned'][number]): Choice =>
        choices[workspace.id] ?? { action: 'TRANSFER', newOwnerUserId: workspace.members[0]?.userId ?? '' }
    const setChoice = (id: string, patch: Partial<Choice>, workspace: AccountDeletionInfo['owned'][number]) =>
        setChoices((current) => ({ ...current, [id]: { ...choiceOf(workspace), ...patch } }))

    const decisions: AccountDeletionDecision[] = withTeam.map((workspace) => {
        const choice = choiceOf(workspace)
        return choice.action === 'TRANSFER'
            ? { workspaceId: workspace.id, action: 'TRANSFER', newOwnerUserId: choice.newOwnerUserId }
            : { workspaceId: workspace.id, action: 'CLOSE' }
    })
    const ready = /^\d{6}$/.test(code) && confirmText.trim().toUpperCase() === 'EXCLUIR'

    const sendCode = async () => {
        setBusy(true)
        setError(null)
        try {
            const sent = await httpGateway.requestAccountDeletionCode()
            setCodeSentTo(sent.sentTo)
        } catch (err) {
            setError(errorText(err))
        } finally {
            setBusy(false)
        }
    }

    const submit = async () => {
        if (!ready) return
        setBusy(true)
        setError(null)
        try {
            await httpGateway.deleteAccount({ code, confirm: 'EXCLUIR', workspaces: decisions })
            await logout()
            navigate('/login', { replace: true, state: { notice: 'Sua conta foi excluída.' } })
        } catch (err) {
            setError(errorText(err))
            setBusy(false)
        }
    }

    const input = 'w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/60'

    return (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6 text-white shadow-2xl space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 id="delete-account-title" className="text-lg font-semibold inline-flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" /> Excluir minha conta
                        </h3>
                        <p className="text-xs text-white/50 mt-1">Conta {user?.email}. Não dá para desfazer.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {info.isLoading ? (
                    <p className="text-sm text-white/50 py-4">Carregando…</p>
                ) : info.isError ? (
                    <p role="alert" className="text-sm text-red-300">{errorText(info.error)}</p>
                ) : (
                    <>
                        {withTeam.map((workspace) => {
                            const choice = choiceOf(workspace)
                            return (
                                <fieldset key={workspace.id} className="rounded-xl border border-white/10 p-4 space-y-3">
                                    <legend className="px-1 text-sm font-semibold">{workspace.name}</legend>
                                    <p className="text-xs text-white/50">Você é dono desta empresa e há outras pessoas na equipe. O que fazer com ela?</p>
                                    <label className="flex items-start gap-2.5 text-sm">
                                        <input
                                            type="radio"
                                            name={`ws-${workspace.id}`}
                                            className="mt-1 accent-[#C9A84C]"
                                            checked={choice.action === 'TRANSFER'}
                                            onChange={() => setChoice(workspace.id, { action: 'TRANSFER' }, workspace)}
                                        />
                                        <span className="space-y-2 flex-1">
                                            <span className="block">Passar para outra pessoa</span>
                                            {choice.action === 'TRANSFER' && (
                                                <>
                                                    <select
                                                        aria-label={`Novo dono de ${workspace.name}`}
                                                        className={input}
                                                        value={choice.newOwnerUserId}
                                                        onChange={(e) => setChoice(workspace.id, { newOwnerUserId: e.target.value }, workspace)}
                                                    >
                                                        {workspace.members.map((member) => (
                                                            <option key={member.userId} value={member.userId} className="bg-[#111]">
                                                                {member.name} ({ROLE_LABEL[member.role]}) · {member.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="block text-xs text-white/45">
                                                        {workspace.hasSubscription
                                                            ? 'A assinatura continua. Seu cartão é removido; o novo dono usa o período já pago e tem até 7 dias depois dele para cadastrar a forma de pagamento. Ele recebe um e-mail explicando.'
                                                            : 'A pessoa vira dona da empresa e recebe um e-mail avisando.'}
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </label>
                                    <label className="flex items-start gap-2.5 text-sm">
                                        <input
                                            type="radio"
                                            name={`ws-${workspace.id}`}
                                            className="mt-1 accent-[#C9A84C]"
                                            checked={choice.action === 'CLOSE'}
                                            onChange={() => setChoice(workspace.id, { action: 'CLOSE' }, workspace)}
                                        />
                                        <span className="space-y-1">
                                            <span className="block">Encerrar a empresa</span>
                                            {choice.action === 'CLOSE' && (
                                                <span className="block text-xs text-white/45">
                                                    A equipe perde o acesso e, no próximo login, cria uma empresa nova no plano Grátis.
                                                    {workspace.hasSubscription ? ' A assinatura é cancelada na hora.' : ''}
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                </fieldset>
                            )
                        })}

                        <ul className="space-y-2 text-sm text-white/70 list-disc pl-5">
                            {alone.map((workspace) => (
                                <li key={workspace.id}>
                                    A empresa <strong className="text-white">{workspace.name}</strong> é encerrada
                                    {workspace.hasSubscription ? ' e a assinatura é cancelada na hora' : ''}.
                                </li>
                            ))}
                            {info.data?.memberOf.map((workspace) => (
                                <li key={workspace.id}>
                                    Você sai da equipe de <strong className="text-white">{workspace.name}</strong>; a empresa continua.
                                </li>
                            ))}
                            <li>Em empresa encerrada, as propostas aceitas por clientes ficam guardadas por até 5 anos como comprovante. O resto é apagado.</li>
                            <li>Assinaturas que você fez em propostas continuam nelas, como prova do que foi assinado.</li>
                            <li>
                                Quer guardar uma cópia? Use <strong className="text-white">Baixar meus dados</strong> antes.
                            </li>
                        </ul>

                        {!codeSentTo ? (
                            <button
                                type="button"
                                onClick={sendCode}
                                disabled={busy || decisions.some((d) => d.action === 'TRANSFER' && !d.newOwnerUserId)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
                            >
                                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enviar código para {user?.email}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <label className="block space-y-1.5">
                                    <span className="text-[11px] uppercase tracking-widest text-white/45">Código enviado para {codeSentTo}</span>
                                    <input
                                        className={input}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    />
                                </label>
                                <label className="block space-y-1.5">
                                    <span className="text-[11px] uppercase tracking-widest text-white/45">Digite EXCLUIR para confirmar</span>
                                    <input className={input} autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                                </label>
                                <div className="flex items-center justify-between gap-3">
                                    <button type="button" onClick={sendCode} disabled={busy} className="text-xs text-white/50 underline underline-offset-2 hover:text-white disabled:opacity-50">
                                        Enviar outro código
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={!ready || busy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
                                    >
                                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir definitivamente
                                    </button>
                                </div>
                            </div>
                        )}
                        {error && (
                            <p role="alert" className="text-sm text-red-300">
                                {error}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
