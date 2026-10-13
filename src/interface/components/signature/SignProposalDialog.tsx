import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FileSignature, MailCheck, X } from 'lucide-react'
import { httpGateway } from '../../../infra/gateway/HttpGateway'
import { isValidCpf, maskCpf } from '../../../shared/cpf'
import type { SignatureDrawing } from '../../../shared/types'
import { SignaturePad } from './SignaturePad'

const RESEND_SECONDS = 60

/**
 * A empresa assina a proposta (ao publicar ou depois, pela lista).
 * CPF + assinatura (salvos no perfil para a próxima vez) + código enviado ao e-mail da conta.
 */
export function SignProposalDialog({ proposalId, clientName, onDone, onSkip }: { proposalId: string; clientName: string; onDone: () => void; onSkip: () => void }) {
    const queryClient = useQueryClient()
    const profile = useQuery({ queryKey: ['my-signature'], queryFn: () => httpGateway.getMySignature() })
    const status = useQuery({ queryKey: ['proposal-signatures', proposalId], queryFn: () => httpGateway.getProposalSignatures(proposalId) })
    const currentProvider = status.data?.provider?.current ? status.data.provider : null
    const [cpf, setCpf] = useState('')
    const [title, setTitle] = useState('')
    const [signature, setSignature] = useState<SignatureDrawing | null>(null)
    const [saveToProfile, setSaveToProfile] = useState(true)
    const [sentTo, setSentTo] = useState<string | null>(null)
    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [signed, setSigned] = useState(false)
    const [loadedProfile, setLoadedProfile] = useState(false)

    // Preenche com o que está salvo no perfil (uma vez).
    useEffect(() => {
        if (!profile.data || loadedProfile) return
        setLoadedProfile(true)
        if (profile.data.cpf) setCpf(maskCpf(profile.data.cpf))
        const saved = profile.data.signature
        if (saved?.signerTitle) setTitle(saved.signerTitle)
        if (saved?.method === 'DRAWN' && saved.image) setSignature({ method: 'DRAWN', image: saved.image })
        if (saved?.method === 'TYPED' && saved.typedText) setSignature({ method: 'TYPED', typedText: saved.typedText })
    }, [profile.data, loadedProfile])

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
        return () => window.clearTimeout(timer)
    }, [cooldown])

    const validate = () => {
        if (!isValidCpf(cpf)) return 'Informe um CPF válido.'
        if (!signature) return 'Desenhe ou digite sua assinatura.'
        return null
    }

    const sendCode = async () => {
        const problem = validate()
        if (problem) return setError(problem)
        setBusy(true)
        setError(null)
        try {
            const sent = await httpGateway.requestProviderSignatureCode(proposalId)
            setSentTo(sent.sentTo)
            setCode('')
            setCooldown(RESEND_SECONDS)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível enviar o código.')
        } finally {
            setBusy(false)
        }
    }

    const sign = async () => {
        const problem = validate() ?? (!/^\d{6}$/.test(code) ? 'Digite os 6 números do código.' : null)
        if (problem) return setError(problem)
        setBusy(true)
        setError(null)
        try {
            await httpGateway.signProposal(proposalId, { code, cpf, signerTitle: title.trim() || undefined, signature: signature!, saveToProfile })
            setSigned(true)
            void queryClient.invalidateQueries({ queryKey: ['my-signature'] })
            void queryClient.invalidateQueries({ queryKey: ['proposal-signatures', proposalId] })
            window.setTimeout(onDone, 1200)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível assinar.')
        } finally {
            setBusy(false)
        }
    }

    const input = 'w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/60'

    return (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sign-title">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h3 id="sign-title" className="text-lg font-semibold inline-flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-[#C9A84C]" /> Assinar a proposta
                        </h3>
                        <p className="text-xs text-white/50 mt-1">
                            Para {clientName}. Sua assinatura aparece na proposta e no comprovante; o cliente assina por último, no aceite.
                        </p>
                    </div>
                    <button type="button" onClick={onSkip} aria-label="Fechar" className="p-1.5 rounded-lg text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {signed ? (
                    <div className="py-8 text-center">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
                        <p className="mt-3 font-semibold">Proposta assinada</p>
                        <p className="text-xs text-white/50 mt-1">Se você editar a proposta depois, será preciso assinar de novo.</p>
                    </div>
                ) : profile.isLoading || status.isLoading || (profile.data && !loadedProfile) ? (
                    <p className="text-sm text-white/50 py-6">Carregando…</p>
                ) : currentProvider ? (
                    <div className="py-4 space-y-4">
                        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-sm text-white/80 flex gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <span>
                                Esta versão já está assinada por <strong>{currentProvider.signerName}</strong> em{' '}
                                {new Date(currentProvider.signedAt).toLocaleString('pt-BR')}.
                            </span>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={onDone} className="px-5 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-semibold hover:bg-[#d8b65a]">Fechar</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {status.data?.provider && !status.data.provider.current && (
                            <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-2.5 text-xs text-amber-200/90">
                                A proposta mudou depois da última assinatura ({status.data.provider.signerName}, {new Date(status.data.provider.signedAt).toLocaleDateString('pt-BR')}). Assine de novo para valer a versão atual.
                            </p>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="space-y-1.5">
                                <span className="text-[11px] uppercase tracking-widest text-white/45">CPF</span>
                                <input className={input} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} />
                            </label>
                            <label className="space-y-1.5">
                                <span className="text-[11px] uppercase tracking-widest text-white/45">Cargo (opcional)</span>
                                <input className={input} maxLength={80} placeholder="Ex.: Sócia, Diretor comercial" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </label>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[11px] uppercase tracking-widest text-white/45">Assinatura de {profile.data?.name ?? 'quem assina'}</span>
                            <SignaturePad value={signature} onChange={setSignature} suggestedName={profile.data?.name ?? ''} tone="panel" />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                            <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
                            Guardar assinatura e CPF no meu perfil para as próximas propostas
                        </label>

                        {sentTo && (
                            <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] p-3.5 space-y-2.5">
                                <p className="text-sm flex items-start gap-2 text-white/80">
                                    <MailCheck className="w-4 h-4 mt-0.5 text-[#C9A84C] flex-shrink-0" />
                                    <span>Enviamos um código para <strong>{sentTo}</strong>. Ele vale por 10 minutos.</span>
                                </p>
                                <input
                                    autoFocus
                                    className={`${input} text-center tracking-[0.5em] text-lg font-semibold`}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="000000"
                                    aria-label="Código de 6 dígitos"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                <button type="button" disabled={cooldown > 0 || busy} onClick={sendCode} className="text-xs text-[#C9A84C] underline disabled:no-underline disabled:opacity-60">
                                    {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
                                </button>
                            </div>
                        )}

                        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                            <button type="button" onClick={onSkip} className="px-4 py-2.5 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/5">
                                Assinar depois
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={sentTo ? sign : sendCode}
                                className="px-5 py-2.5 rounded-xl bg-[#C9A84C] text-black text-sm font-semibold hover:bg-[#d8b65a] disabled:opacity-50"
                            >
                                {busy ? 'Aguarde…' : sentTo ? 'Assinar proposta' : `Enviar código para ${profile.data?.email ?? 'seu e-mail'}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
