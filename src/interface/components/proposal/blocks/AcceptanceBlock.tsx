import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, CalendarX2, CheckCircle2, FileSignature, MailCheck, MessageSquareText, Printer, ThumbsDown } from 'lucide-react'
import { httpGateway, ApiError } from '../../../../infra/gateway/HttpGateway'
import { blockTitle, fillPlaceholders, type AcceptanceBlock } from '../../../../shared/blocks'
import { calculatePackagePricing, formatCents } from '../../../../shared/pricing'
import type { AcceptanceState, Package, PackageItem, ProposalResponseType, ProposalSignatureView, ProposalSignatures, SignatureDrawing } from '../../../../shared/types'
import { isValidCpf, maskCpf } from '../../../../shared/cpf'
import { SignaturePad } from '../../signature/SignaturePad'
import { SignatureMark } from '../../signature/SignatureMark'
import { useProposalSelection } from './selection'
import { printUrl } from '../print/printUrl'
import { Reveal, SectionShell, whatsappHref, type BlockContext } from './shared'

type Pkg = Package & { items?: PackageItem[] }

function pricingFor(pkg: Pkg, optionalIds: string[]) {
    return calculatePackagePricing(
        {
            priceMode: pkg.priceMode,
            fixedPriceCents: pkg.fixedPriceCents,
            discountType: pkg.discountType,
            discountValue: pkg.discountValue,
            items: (pkg.items ?? []).map((item) => ({
                id: item.id,
                kind: item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED'),
                quantity: item.quantity ?? 1,
                unitPriceCents: item.unitPriceCents ?? 0,
            })),
        },
        optionalIds
    )
}

function formatDate(iso?: string) {
    return iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
}

const fieldClass = 'w-full px-4 py-3 rounded-xl pp-body text-sm focus:outline-none transition-colors'
const fieldStyle = { background: 'var(--pp-bg)', border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }

const MODES: Array<{ type: ProposalResponseType; label: string; Icon: typeof FileSignature }> = [
    { type: 'ACCEPTED', label: 'Aceitar', Icon: FileSignature },
    { type: 'CHANGE_REQUESTED', label: 'Pedir ajuste', Icon: MessageSquareText },
    { type: 'DECLINED', label: 'Recusar', Icon: ThumbsDown },
]

type Result = { type: ProposalResponseType; total?: number | null; packageName?: string; optionals?: string[]; hash: string; at: string; name: string; signature?: ProposalSignatureView }

/** As duas assinaturas lado a lado, como no pé de um contrato. */
export function SignaturesPair({ signatures, company }: { signatures?: ProposalSignatures | null; company: string }) {
    const provider = signatures?.provider?.current ? signatures.provider : null
    return (
        <div className="grid sm:grid-cols-2 gap-3">
            <SignatureMark signature={provider} roleLabel={`Pela ${company}`} pendingText="Assinatura da empresa pendente" />
            <SignatureMark signature={signatures?.client ?? null} roleLabel="Cliente" pendingText="Assina no aceite" />
        </div>
    )
}

const RESEND_SECONDS = 60

export function AcceptanceBlockView({ block, ctx, alt }: { block: AcceptanceBlock; ctx: BlockContext; alt: boolean }) {
    const selection = useProposalSelection()
    const [mode, setMode] = useState<ProposalResponseType>('ACCEPTED')
    const [form, setForm] = useState({ name: '', email: '', document: '', message: '', agree: false })
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [state, setState] = useState<AcceptanceState | undefined>(ctx.acceptance)
    const [result, setResult] = useState<Result | null>(null)
    // Assinatura: desenho ou nome digitado + código enviado ao e-mail.
    const [signature, setSignature] = useState<SignatureDrawing | null>(null)
    const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(0)

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
        return () => window.clearTimeout(timer)
    }, [cooldown])

    const { data } = block
    const packages = ctx.packages
    const selectedPkg = packages.find((p) => p.id === selection?.selectedPackageId) ?? null
    const optionalIds = selectedPkg ? selection?.optionals[selectedPkg.id] ?? [] : []
    const pricing = selectedPkg ? pricingFor(selectedPkg, optionalIds) : null
    const optionalItems = selectedPkg?.items?.filter((item) => optionalIds.includes(item.id)) ?? []
    const modes = MODES.filter((m) => (m.type === 'DECLINED' ? data.allowDecline : m.type === 'CHANGE_REQUESTED' ? data.allowChangeRequest : true))
    const company = ctx.placeholders.empresa
    const contact = whatsappHref(ctx.provider, `Olá! Sobre a proposta para ${ctx.clientName}…`)
    const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

    const emailNow = form.email.trim().toLowerCase()
    const codeReady = !!codeSentTo && codeSentTo === emailNow

    const sendCode = async () => {
        if (!ctx.slug) return
        setSending(true)
        setError(null)
        try {
            const sent = await httpGateway.requestClientSignatureCode(ctx.slug, { signerName: form.name.trim(), signerEmail: emailNow })
            setCodeSentTo(sent.sentTo)
            setCode('')
            setCooldown(RESEND_SECONDS)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível enviar o código. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault()
        if (ctx.preview || !ctx.slug) return
        setError(null)
        if (mode === 'ACCEPTED') {
            if (packages.length > 1 && !selectedPkg) return setError('Escolha um dos pacotes acima para aceitar.')
            if (!isValidCpf(form.document)) return setError('Informe um CPF válido de quem está assinando.')
            if (!signature) return setError('Desenhe ou digite sua assinatura.')
            if (!form.agree) return setError('Marque que leu e concorda com as condições.')
            // 1º clique: envia o código ao e-mail. 2º: assina com o código.
            if (!codeReady) return sendCode()
            if (!/^\d{6}$/.test(code.trim())) return setError('Digite os 6 números do código enviado para o seu e-mail.')
        }
        setSending(true)
        try {
            const response = await httpGateway.submitProposalResponse(ctx.slug, {
                type: mode,
                signerName: form.name,
                signerEmail: form.email,
                signerDocument: mode === 'ACCEPTED' ? form.document.trim() : undefined,
                message: form.message.trim() || undefined,
                ...(mode !== 'DECLINED' && selectedPkg ? { packageId: selectedPkg.id, optionalItemIds: optionalIds } : {}),
                ...(mode === 'ACCEPTED' && signature ? { agreeTerms: true, signature, code: code.trim() } : {}),
            })
            setResult({
                type: mode,
                total: response.totalCents,
                packageName: response.selection?.packageName,
                optionals: response.selection?.optionals.map((o) => o.name),
                hash: response.contentHash,
                at: response.createdAt,
                name: form.name,
                signature:
                    mode === 'ACCEPTED' && signature
                        ? {
                              id: response.id,
                              role: 'CLIENT',
                              signerName: form.name.trim(),
                              signerTitle: null,
                              document: `***.${form.document.replace(/\D/g, '').slice(3, 6)}.${form.document.replace(/\D/g, '').slice(6, 9)}-**`,
                              method: signature.method,
                              image: signature.method === 'DRAWN' ? signature.image : null,
                              typedText: signature.method === 'TYPED' ? signature.typedText : null,
                              contentHash: response.contentHash,
                              signedAt: response.createdAt,
                              emailVerifiedAt: response.createdAt,
                              current: true,
                          }
                        : undefined,
            })
            if (mode === 'ACCEPTED') {
                if (state) {
                    const next: AcceptanceState = { ...state, state: 'ACCEPTED', acceptedAt: response.createdAt, acceptedBy: form.name }
                    setState(next)
                    ctx.onAcceptanceChange?.(next)
                }
                import('canvas-confetti').then(({ default: confetti }) => confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } })).catch(() => {})
            }
        } catch (err) {
            if (err instanceof ApiError && (err.code === 'ALREADY_ACCEPTED' || err.code === 'EXPIRED' || err.code === 'CLOSED')) {
                if (state) {
                    const next: AcceptanceState = { ...state, state: err.code === 'EXPIRED' ? 'EXPIRED' : err.code === 'CLOSED' ? 'CLOSED' : 'ACCEPTED' }
                    setState(next)
                    ctx.onAcceptanceChange?.(next)
                }
            }
            setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    const card = { background: alt ? 'var(--pp-bg)' : 'var(--pp-card-bg)', border: '1px solid var(--pp-border)' }

    // ── Depois de responder ──
    if (result) {
        const accepted = result.type === 'ACCEPTED'
        return (
            <SectionShell id={block.id} title={blockTitle(block)} alt={alt} width="max-w-3xl">
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl p-8 text-center" style={card}>
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--pp-accent)' }} />
                    <h3 className="pp-heading text-2xl md:text-3xl mb-3" style={{ color: 'var(--pp-text)' }}>
                        {accepted ? 'Proposta aceita!' : result.type === 'CHANGE_REQUESTED' ? 'Pedido de ajuste enviado' : 'Resposta registrada'}
                    </h3>
                    <p className="pp-body text-sm leading-relaxed mb-6" style={{ color: 'var(--pp-muted)' }}>
                        {accepted
                            ? `Obrigado, ${result.name.split(' ')[0]}! A ${company} já pode seguir com os próximos passos.`
                            : result.type === 'CHANGE_REQUESTED'
                              ? `A ${company} vai analisar seu pedido e responder em breve.`
                              : `Obrigado por responder. Se mudar de ideia, fale com a ${company}.`}
                    </p>
                    {accepted && (
                        <div className="text-left rounded-2xl p-5 pp-body text-sm space-y-1.5 mb-6" style={{ border: '1px solid var(--pp-border)', color: 'var(--pp-muted)' }}>
                            {result.packageName && <p><span style={{ color: 'var(--pp-text)' }}>Pacote:</span> {result.packageName}</p>}
                            {!!result.optionals?.length && <p><span style={{ color: 'var(--pp-text)' }}>Opcionais:</span> {result.optionals.join(', ')}</p>}
                            {result.total != null && <p><span style={{ color: 'var(--pp-text)' }}>Total:</span> <strong style={{ color: 'var(--pp-accent)' }}>{formatCents(result.total)}</strong></p>}
                            <p><span style={{ color: 'var(--pp-text)' }}>Aceito por:</span> {result.name} em {new Date(result.at).toLocaleString('pt-BR')}</p>
                            <p className="text-xs pt-1 break-all">Código de verificação: {result.hash.slice(0, 16)}</p>
                        </div>
                    )}
                    {accepted && (
                        <div className="mb-6">
                            <SignaturesPair signatures={{ provider: ctx.signatures?.provider ?? null, client: result.signature ?? null }} company={company} />
                        </div>
                    )}
                    {accepted && ctx.slug && (
                        <a href={printUrl(ctx.slug)} target="_blank" rel="noreferrer" className="pp-no-print inline-flex items-center gap-2 px-5 py-2.5 rounded-xl pp-body text-sm" style={{ border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }}>
                            <Printer className="w-4 h-4" /> Baixar PDF com o comprovante
                        </a>
                    )}
                </motion.div>
            </SectionShell>
        )
    }

    // ── Proposta fechada ──
    if (state && state.state !== 'OPEN' && !ctx.preview) {
        const expired = state.state === 'EXPIRED'
        return (
            <SectionShell id={block.id} title={blockTitle(block)} alt={alt} width="max-w-2xl">
                <Reveal className="text-center">
                    <div style={card} className="rounded-3xl p-8">
                        {expired ? <CalendarX2 className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--pp-muted)' }} /> : <CheckCircle2 className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--pp-accent)' }} />}
                        <p className="pp-heading text-xl md:text-2xl mb-2" style={{ color: 'var(--pp-text)' }}>
                            {state.state === 'ACCEPTED' ? 'Proposta aceita' : expired ? 'O prazo desta proposta terminou' : 'Proposta encerrada'}
                        </p>
                        <p className="pp-body text-sm" style={{ color: 'var(--pp-muted)' }}>
                            {state.state === 'ACCEPTED'
                                ? `Aceita por ${state.acceptedBy} em ${formatDate(state.acceptedAt)}.`
                                : expired
                                  ? `Ela era válida até ${formatDate(state.expiresAt)}. Fale com a ${company} para receber uma versão atualizada.`
                                  : `Fale com a ${company} se precisar de algo.`}
                        </p>
                        {state.state === 'ACCEPTED' && ctx.signatures && (
                            <div className="mt-6 text-left">
                                <SignaturesPair signatures={ctx.signatures} company={company} />
                            </div>
                        )}
                        {state.state !== 'ACCEPTED' && contact && (
                            <a href={contact} target="_blank" rel="noreferrer" className="inline-block mt-5 px-6 py-3 rounded-2xl pp-body text-sm font-semibold" style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}>
                                Falar com a {company}
                            </a>
                        )}
                    </div>
                </Reveal>
            </SectionShell>
        )
    }

    return (
        <SectionShell id={block.id} eyebrow="Próximo passo" title={blockTitle(block)} alt={alt} width="max-w-2xl">
            <Reveal>
                {data.intro && (
                    <p className="pp-body text-base leading-relaxed text-center mb-8 whitespace-pre-line" style={{ color: 'var(--pp-muted)' }}>
                        {fillPlaceholders(data.intro, ctx.placeholders)}
                    </p>
                )}

                <div className="rounded-3xl p-5 md:p-7 space-y-6" style={card}>
                    {/* Escolha do pacote e resumo do valor */}
                    {packages.length > 0 && mode !== 'DECLINED' && (
                        <div className="space-y-2.5">
                            <p className="pp-body text-xs uppercase tracking-widest" style={{ color: 'var(--pp-muted)' }}>
                                {packages.length > 1 ? 'Pacote escolhido' : 'Resumo'}
                            </p>
                            {packages.map((pkg) => {
                                const active = selectedPkg?.id === pkg.id
                                if (packages.length > 1 || active) {
                                    const p = pricingFor(pkg, selection?.optionals[pkg.id] ?? [])
                                    return (
                                        <label key={pkg.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition-colors"
                                            style={{ border: `1px solid ${active ? 'var(--pp-accent)' : 'var(--pp-border)'}`, background: active ? 'color-mix(in srgb, var(--pp-accent) 8%, transparent)' : 'transparent' }}>
                                            {packages.length > 1 && (
                                                <input type="radio" name={`${block.id}-pkg`} checked={active} onChange={() => selection?.choosePackage(pkg.id)} style={{ accentColor: 'var(--pp-accent)' }} />
                                            )}
                                            <span className="flex-1 pp-body text-sm" style={{ color: 'var(--pp-text)' }}>{pkg.name}</span>
                                            <span className="pp-body text-sm font-semibold" style={{ color: 'var(--pp-accent)' }}>
                                                {p.onRequest ? pkg.priceLabel?.trim() || 'Sob consulta' : formatCents(p.totalCents)}
                                            </span>
                                        </label>
                                    )
                                }
                                return null
                            })}
                            {optionalItems.length > 0 && (
                                <p className="pp-body text-xs" style={{ color: 'var(--pp-muted)' }}>
                                    Com opcionais: {optionalItems.map((i) => i.name).join(', ')}
                                    {pricing && !pricing.onRequest && pricing.optionalsCents > 0 && ` (+ ${formatCents(pricing.optionalsCents)})`}
                                </p>
                            )}
                            {ctx.pricingId && (
                                <a href={`#${ctx.pricingId}`} className="pp-body text-xs underline" style={{ color: 'var(--pp-accent)' }}>
                                    Ver detalhes ou mudar opcionais
                                </a>
                            )}
                        </div>
                    )}

                    {/* Tipo de resposta */}
                    {modes.length > 1 && (
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }} role="tablist">
                            {modes.map(({ type, label, Icon }) => (
                                <button
                                    key={type}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === type}
                                    onClick={() => { setMode(type); setError(null) }}
                                    className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl pp-body text-xs md:text-sm font-medium transition-colors"
                                    style={mode === type
                                        ? { background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }
                                        : { border: '1px solid var(--pp-border)', color: 'var(--pp-muted)' }}
                                >
                                    <Icon className="w-4 h-4" /> {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input required minLength={3} maxLength={120} autoComplete="name" placeholder="Nome completo" aria-label="Nome completo" className={fieldClass} style={fieldStyle}
                                    value={form.name} onChange={(e) => set({ name: e.target.value })} disabled={ctx.preview} />
                                <input required type="email" maxLength={200} autoComplete="email" placeholder="E-mail" aria-label="E-mail" className={fieldClass} style={fieldStyle}
                                    value={form.email} onChange={(e) => set({ email: e.target.value })} disabled={ctx.preview} />
                            </div>
                            {mode === 'ACCEPTED' && (
                                <>
                                    <input required inputMode="numeric" maxLength={14} placeholder="CPF de quem assina" aria-label="CPF de quem assina"
                                        className={fieldClass} style={fieldStyle} value={form.document} onChange={(e) => set({ document: maskCpf(e.target.value) })} disabled={ctx.preview} />
                                    <div className="space-y-1.5">
                                        <p className="pp-body text-xs uppercase tracking-widest" style={{ color: 'var(--pp-muted)' }}>Sua assinatura</p>
                                        <SignaturePad value={signature} onChange={setSignature} suggestedName={form.name} disabled={ctx.preview} />
                                    </div>
                                </>
                            )}
                            <textarea
                                required={mode === 'CHANGE_REQUESTED'}
                                minLength={mode === 'CHANGE_REQUESTED' ? 5 : undefined}
                                maxLength={2000}
                                rows={mode === 'ACCEPTED' ? 2 : 4}
                                placeholder={mode === 'CHANGE_REQUESTED' ? 'O que você gostaria de ajustar?' : mode === 'DECLINED' ? 'Quer contar o motivo? (opcional)' : 'Observações (opcional)'}
                                aria-label="Mensagem"
                                className={`${fieldClass} resize-y`}
                                style={fieldStyle}
                                value={form.message}
                                onChange={(e) => set({ message: e.target.value })}
                                disabled={ctx.preview}
                            />
                            {mode === 'ACCEPTED' && (
                                <label className="flex items-start gap-2.5 pp-body text-sm cursor-pointer" style={{ color: 'var(--pp-muted)' }}>
                                    <input type="checkbox" className="mt-0.5 w-4 h-4" style={{ accentColor: 'var(--pp-accent)' }} checked={form.agree} onChange={(e) => set({ agree: e.target.checked })} disabled={ctx.preview} />
                                    <span>
                                        Li e concordo com as{' '}
                                        {ctx.termsId ? <a href={`#${ctx.termsId}`} className="underline" style={{ color: 'var(--pp-accent)' }}>condições desta proposta</a> : 'condições desta proposta'}.
                                    </span>
                                </label>
                            )}
                            {mode === 'ACCEPTED' && codeReady && (
                                <div className="rounded-2xl p-4 space-y-2.5" style={{ border: '1px solid color-mix(in srgb, var(--pp-accent) 45%, transparent)', background: 'color-mix(in srgb, var(--pp-accent) 6%, transparent)' }}>
                                    <p className="pp-body text-sm flex items-start gap-2" style={{ color: 'var(--pp-text)' }}>
                                        <MailCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} />
                                        <span>Enviamos um código de 6 dígitos para <strong>{codeSentTo}</strong>. Ele vale por 10 minutos.</span>
                                    </p>
                                    <input
                                        autoFocus
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        placeholder="000000"
                                        aria-label="Código de 6 dígitos"
                                        className={`${fieldClass} text-center tracking-[0.5em] text-lg font-semibold`}
                                        style={fieldStyle}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                    <button type="button" disabled={cooldown > 0 || sending} onClick={sendCode} className="pp-body text-xs underline disabled:no-underline disabled:opacity-60" style={{ color: 'var(--pp-accent)' }}>
                                        {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
                                    </button>
                                </div>
                            )}
                            {error && <p role="alert" className="pp-body text-sm" style={{ color: '#ef4444' }}>{error}</p>}
                            <button
                                type="submit"
                                disabled={sending || ctx.preview}
                                className="w-full py-3.5 rounded-2xl pp-body text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
                                style={mode === 'DECLINED'
                                    ? { border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }
                                    : { background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}
                            >
                                {sending
                                    ? 'Enviando…'
                                    : mode === 'ACCEPTED'
                                      ? !codeReady
                                          ? 'Enviar código para assinar'
                                          : pricing && !pricing.onRequest ? `Assinar e aceitar · ${formatCents(pricing.totalCents)}` : 'Assinar e aceitar'
                                      : mode === 'CHANGE_REQUESTED' ? 'Enviar pedido de ajuste' : 'Recusar proposta'}
                            </button>
                            {ctx.preview && (
                                <p className="pp-body text-xs text-center" style={{ color: 'var(--pp-muted)' }}>Pré-visualização: no link enviado, o cliente responde por aqui.</p>
                            )}
                            {mode === 'ACCEPTED' && !ctx.preview && (
                                <p className="pp-body text-[11px] text-center" style={{ color: 'var(--pp-muted)' }}>
                                    Ao assinar, registramos seu CPF, o e-mail confirmado por código, data, hora e o conteúdo desta proposta como comprovante.
                                </p>
                            )}
                        </motion.form>
                    </AnimatePresence>
                </div>
            </Reveal>
        </SectionShell>
    )
}
