import { motion, useReducedMotion } from 'framer-motion'
import { CalendarClock, Check, ChevronDown, Mail, MessageCircle } from 'lucide-react'
import {
    blockTitle,
    fillPlaceholders,
    fillPlaceholdersHtml,
    type AboutBlock,
    type CoverBlock,
    type CtaBlock,
    type ScopeBlock,
    type TeamBlock,
    type TermsBlock,
    type TimelineBlock,
} from '../../../../shared/blocks'
import { sanitizeHtml } from '../../../../shared/sanitizeHtml'
import { ImageAsset, MediaAsset } from '../public/media'
import { Initial, Reveal, SectionShell, whatsappHref, type BlockContext } from './shared'

function RichText({ html, ctx }: { html: string; ctx: BlockContext }) {
    return (
        <div
            className="pp-rich pp-body text-base leading-relaxed"
            style={{ color: 'var(--pp-muted)' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(fillPlaceholdersHtml(html, ctx.placeholders)) }}
        />
    )
}

export function CoverBlockView({ block, ctx, nextId }: { block: CoverBlock; ctx: BlockContext; nextId?: string }) {
    const reduce = useReducedMotion()
    const { data } = block
    const hasMedia = !!data.mediaUrl
    const validUntil = ctx.validUntil ? ctx.validUntil.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null

    const fade = (delay: number) =>
        reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } }

    return (
        <section
            id={block.id}
            data-section={block.id}
            className={`relative flex items-center justify-center overflow-hidden px-6 ${ctx.preview ? 'min-h-[560px] py-24' : 'min-h-[100svh] py-32'}`}
            style={{ background: 'var(--pp-bg)' }}
        >
            {hasMedia && (
                <>
                    <MediaAsset
                        item={{ url: data.mediaUrl!, type: data.mediaType ?? 'image' }}
                        alt=""
                        variant="ambient"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, var(--pp-bg) 100%)' }} />
                </>
            )}
            <div className="relative z-10 max-w-3xl text-center">
                {data.showClientName && ctx.clientName && (
                    <motion.p {...fade(0)} className="pp-body text-xs tracking-[0.25em] uppercase mb-6 font-medium" style={{ color: 'var(--pp-accent)' }}>
                        Preparada para {ctx.clientName}
                    </motion.p>
                )}
                <motion.h1
                    {...fade(0.1)}
                    className="pp-heading text-4xl md:text-6xl font-light italic leading-tight mb-6"
                    style={{ color: hasMedia ? '#fff' : 'var(--pp-text)' }}
                >
                    {fillPlaceholders(data.headline, ctx.placeholders)}
                </motion.h1>
                {data.subheadline && (
                    <motion.p
                        {...fade(0.2)}
                        className="pp-body text-base md:text-lg leading-relaxed max-w-xl mx-auto"
                        style={{ color: hasMedia ? 'rgba(255,255,255,0.85)' : 'var(--pp-muted)' }}
                    >
                        {fillPlaceholders(data.subheadline, ctx.placeholders)}
                    </motion.p>
                )}
                {validUntil && (
                    <motion.p
                        {...fade(0.3)}
                        className="pp-body inline-flex items-center gap-2 text-xs mt-8 px-4 py-2 rounded-full"
                        style={{
                            color: hasMedia ? '#fff' : 'var(--pp-text)',
                            border: '1px solid color-mix(in srgb, var(--pp-accent) 45%, transparent)',
                            background: 'color-mix(in srgb, var(--pp-bg) 40%, transparent)',
                        }}
                    >
                        <CalendarClock className="w-3.5 h-3.5" style={{ color: 'var(--pp-accent)' }} /> Válida até {validUntil}
                    </motion.p>
                )}
            </div>
            {nextId && !ctx.preview && (
                <a
                    href={`#${nextId}`}
                    aria-label="Ir para a próxima seção"
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
                    style={{ color: hasMedia ? '#fff' : 'var(--pp-muted)' }}
                >
                    <ChevronDown className="w-6 h-6" />
                </a>
            )}
        </section>
    )
}

export function AboutBlockView({ block, ctx, alt }: { block: AboutBlock; ctx: BlockContext; alt: boolean }) {
    const { data } = block
    return (
        <SectionShell id={block.id} title={blockTitle(block)} alt={alt}>
            <div className={`grid gap-10 items-center ${data.mediaUrl ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
                {data.mediaUrl && (
                    <Reveal className="rounded-3xl overflow-hidden aspect-[4/5] md:aspect-square" >
                        <MediaAsset item={{ url: data.mediaUrl, type: data.mediaType ?? 'image' }} alt={ctx.placeholders.empresa} variant="ambient" className="w-full h-full object-cover" />
                    </Reveal>
                )}
                <Reveal delay={0.1}>
                    <RichText html={data.body} ctx={ctx} />
                </Reveal>
            </div>
        </SectionShell>
    )
}

export function ScopeBlockView({ block, ctx, alt }: { block: ScopeBlock; ctx: BlockContext; alt: boolean }) {
    const { data } = block
    return (
        <SectionShell id={block.id} eyebrow="Escopo" title={blockTitle(block)} alt={alt}>
            {data.intro && (
                <Reveal className="max-w-2xl mx-auto text-center mb-10">
                    <p className="pp-body text-base leading-relaxed whitespace-pre-line" style={{ color: 'var(--pp-muted)' }}>
                        {fillPlaceholders(data.intro, ctx.placeholders)}
                    </p>
                </Reveal>
            )}
            <div className="grid gap-4 md:grid-cols-2">
                {data.items.map((item, i) => (
                    <Reveal key={i} delay={Math.min(i, 8) * 0.05}>
                        <div className="h-full flex gap-4 rounded-2xl p-5" style={{ border: '1px solid var(--pp-border)', background: alt ? 'var(--pp-bg)' : 'var(--pp-card-bg)' }}>
                            <span
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'color-mix(in srgb, var(--pp-accent) 16%, transparent)' }}
                            >
                                <Check className="w-4 h-4" style={{ color: 'var(--pp-accent)' }} />
                            </span>
                            <div>
                                <p className="pp-body font-semibold text-sm md:text-base" style={{ color: 'var(--pp-text)' }}>
                                    {fillPlaceholders(item.title, ctx.placeholders)}
                                </p>
                                {item.description && (
                                    <p className="pp-body text-sm leading-relaxed mt-1" style={{ color: 'var(--pp-muted)' }}>
                                        {fillPlaceholders(item.description, ctx.placeholders)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </SectionShell>
    )
}

export function TimelineBlockView({ block, ctx, alt }: { block: TimelineBlock; ctx: BlockContext; alt: boolean }) {
    return (
        <SectionShell id={block.id} eyebrow="Etapas" title={blockTitle(block)} alt={alt} width="max-w-3xl" backgroundUrl={block.data.backgroundUrl}>
            <ol className="relative">
                <span className="absolute left-[15px] top-2 bottom-2 w-px" style={{ background: 'var(--pp-border)' }} aria-hidden />
                {block.data.steps.map((step, i) => (
                    <Reveal key={i} as="li" delay={Math.min(i, 8) * 0.06} className="relative pl-12 pb-8 last:pb-0">
                            <span
                                className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center pp-body text-xs font-semibold"
                                style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}
                            >
                                {i + 1}
                            </span>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h3 className="pp-body font-semibold text-base" style={{ color: 'var(--pp-text)' }}>
                                    {fillPlaceholders(step.title, ctx.placeholders)}
                                </h3>
                                {step.duration && (
                                    <span className="pp-body text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ border: '1px solid var(--pp-border)', color: 'var(--pp-accent)' }}>
                                        {step.duration}
                                    </span>
                                )}
                            </div>
                            {step.description && (
                                <p className="pp-body text-sm leading-relaxed mt-1.5" style={{ color: 'var(--pp-muted)' }}>
                                    {fillPlaceholders(step.description, ctx.placeholders)}
                                </p>
                            )}
                    </Reveal>
                ))}
            </ol>
        </SectionShell>
    )
}

export function TeamBlockView({ block, ctx, alt }: { block: TeamBlock; ctx: BlockContext; alt: boolean }) {
    const members = block.data.members.filter((m) => m.name.trim())
    if (members.length === 0 && !ctx.preview) return null
    return (
        <SectionShell id={block.id} eyebrow="Equipe" title={blockTitle(block)} alt={alt}>
            <div className={`grid gap-6 ${members.length <= 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {members.map((member, i) => (
                    <Reveal key={i} delay={Math.min(i, 8) * 0.06}>
                        <div className="h-full rounded-3xl p-6 text-center" style={{ border: '1px solid var(--pp-border)', background: alt ? 'var(--pp-bg)' : 'var(--pp-card-bg)' }}>
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden" style={{ border: '2px solid var(--pp-accent)' }}>
                                {member.photoUrl ? (
                                    <ImageAsset src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" fallback={<Initial name={member.name} className="w-full h-full text-2xl" />} />
                                ) : (
                                    <Initial name={member.name} className="w-full h-full text-2xl" />
                                )}
                            </div>
                            <p className="pp-heading text-lg" style={{ color: 'var(--pp-text)' }}>{member.name}</p>
                            {member.role && <p className="pp-body text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--pp-accent)' }}>{member.role}</p>}
                            {member.bio && <p className="pp-body text-sm leading-relaxed mt-3" style={{ color: 'var(--pp-muted)' }}>{member.bio}</p>}
                        </div>
                    </Reveal>
                ))}
            </div>
        </SectionShell>
    )
}

export function TermsBlockView({ block, ctx, alt }: { block: TermsBlock; ctx: BlockContext; alt: boolean }) {
    return (
        <SectionShell id={block.id} title={blockTitle(block)} alt={alt} width="max-w-3xl">
            <Reveal>
                <div className="rounded-3xl p-6 md:p-8" style={{ border: '1px solid var(--pp-border)', background: alt ? 'var(--pp-bg)' : 'var(--pp-card-bg)' }}>
                    <RichText html={block.data.body} ctx={ctx} />
                </div>
            </Reveal>
        </SectionShell>
    )
}

export function CtaBlockView({ block, ctx }: { block: CtaBlock; ctx: BlockContext }) {
    const headline = fillPlaceholders(block.data.headline, ctx.placeholders)
    const label = block.data.buttonLabel?.trim() || 'Quero fechar'
    const toAcceptance = !!ctx.acceptanceId && (ctx.preview || ctx.acceptance?.state === 'OPEN')
    const wa = toAcceptance ? null : whatsappHref(ctx.provider, `Olá! Vi a proposta para ${ctx.clientName} e quero seguir.`)
    const href = toAcceptance
        ? `#${ctx.acceptanceId}`
        : wa ?? (ctx.provider?.email ? `mailto:${ctx.provider.email}?subject=${encodeURIComponent(`Proposta — ${ctx.clientName}`)}` : '#contact')

    return (
        <section id={block.id} data-section={block.id} className="px-6 py-20 md:py-24" style={{ background: 'var(--pp-bg)' }}>
            <Reveal className="max-w-4xl mx-auto">
                <div
                    className="rounded-[2rem] px-8 py-12 md:px-14 md:py-16 text-center"
                    style={{
                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--pp-accent) 22%, var(--pp-card-bg)) 0%, var(--pp-card-bg) 80%)',
                        border: '1px solid color-mix(in srgb, var(--pp-accent) 35%, transparent)',
                    }}
                >
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-8" style={{ color: 'var(--pp-text)' }}>{headline}</h2>
                    <a
                        href={href}
                        target={wa ? '_blank' : undefined}
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl pp-body text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98]"
                        style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}
                    >
                        {toAcceptance ? <Check className="w-4 h-4" /> : wa ? <MessageCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />} {label}
                    </a>
                </div>
            </Reveal>
        </section>
    )
}
