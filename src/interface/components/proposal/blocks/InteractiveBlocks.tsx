import { useCallback, useEffect, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, Instagram, Mail, MessageCircle, Play, Quote, X } from 'lucide-react'
import {
    blockTitle,
    fillPlaceholders,
    type ContactBlock,
    type FaqBlock,
    type GalleryBlock,
    type TestimonialsBlock,
} from '../../../../shared/blocks'
import { ImageAsset, MediaAsset } from '../public/media'
import { Initial, Reveal, SectionShell, whatsappHref, type BlockContext } from './shared'

// ── Galeria com lightbox ────────────────────────────────────────────────────

function Lightbox({ items, index, onClose, onMove }: {
    items: GalleryBlock['data']['items']
    index: number
    onClose: () => void
    onMove: (delta: number) => void
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') onMove(1)
            if (e.key === 'ArrowLeft') onMove(-1)
        }
        window.addEventListener('keydown', onKey)
        const overflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
        }
    }, [onClose, onMove])

    const item = items[index]
    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Visualizar mídia"
        >
            <button className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10" onClick={onClose} aria-label="Fechar">
                <X className="w-6 h-6" />
            </button>
            {items.length > 1 && (
                <>
                    <button className="absolute left-2 md:left-6 p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); onMove(-1) }} aria-label="Anterior">
                        <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button className="absolute right-2 md:right-6 p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); onMove(1) }} aria-label="Próxima">
                        <ChevronRight className="w-7 h-7" />
                    </button>
                </>
            )}
            <motion.figure
                key={index}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-5xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <MediaAsset item={item} alt={item.caption || 'Mídia'} variant="controlled" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
                {(item.caption || items.length > 1) && (
                    <figcaption className="text-white/80 text-sm mt-3 text-center">
                        {item.caption}
                        {items.length > 1 && <span className="block text-xs text-white/50 mt-1">{index + 1} de {items.length}</span>}
                    </figcaption>
                )}
            </motion.figure>
        </motion.div>
    )
}

export function GalleryBlockView({ block, ctx, alt }: { block: GalleryBlock; ctx: BlockContext; alt: boolean }) {
    const items = block.data.items
    const [open, setOpen] = useState<number | null>(null)
    const close = useCallback(() => setOpen(null), [])
    const move = useCallback((delta: number) => setOpen((i) => (i === null ? i : (i + delta + items.length) % items.length)), [items.length])

    if (items.length === 0) {
        if (!ctx.preview) return null
        return (
            <SectionShell id={block.id} title={blockTitle(block)} alt={alt}>
                <p className="pp-body text-sm text-center" style={{ color: 'var(--pp-muted)' }}>Adicione fotos ou vídeos a esta galeria no editor.</p>
            </SectionShell>
        )
    }

    return (
        <SectionShell id={block.id} eyebrow="Galeria" title={blockTitle(block)} alt={alt} width="max-w-6xl">
            <div className="columns-2 md:columns-3 gap-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
                {items.map((item, i) => (
                    <Reveal key={i} delay={Math.min(i, 9) * 0.04} className="break-inside-avoid">
                        <button
                            type="button"
                            onClick={() => setOpen(i)}
                            className="group relative block w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2"
                            style={{ border: '1px solid var(--pp-border)' }}
                            aria-label={item.caption ? `Ampliar: ${item.caption}` : 'Ampliar mídia'}
                        >
                            {item.type === 'video' ? (
                                <>
                                    <video src={item.url} muted playsInline preload="metadata" className="w-full h-auto object-cover" />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                                        <span className="w-12 h-12 rounded-full flex items-center justify-center bg-white/90">
                                            <Play className="w-5 h-5 text-black ml-0.5" />
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <ImageAsset src={item.url} alt={item.caption || ''} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                            )}
                            {item.caption && (
                                <span className="absolute inset-x-0 bottom-0 px-3 py-2 text-left text-xs text-white bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.caption}
                                </span>
                            )}
                        </button>
                    </Reveal>
                ))}
            </div>
            <AnimatePresence>
                {open !== null && <Lightbox items={items} index={open} onClose={close} onMove={move} />}
            </AnimatePresence>
        </SectionShell>
    )
}

// ── Depoimentos em carrossel ────────────────────────────────────────────────

export function TestimonialsBlockView({ block, ctx, alt }: { block: TestimonialsBlock; ctx: BlockContext; alt: boolean }) {
    const items = block.data.items.filter((t) => t.quote.trim())
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (items.length < 2 || paused) return
        const timer = window.setInterval(() => setActive((i) => (i + 1) % items.length), 7000)
        return () => window.clearInterval(timer)
    }, [items.length, paused])

    if (items.length === 0) return null
    const current = items[Math.min(active, items.length - 1)]

    return (
        <SectionShell id={block.id} title={blockTitle(block)} alt={alt} width="max-w-3xl">
            <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="text-center">
                <Quote className="w-8 h-8 mx-auto mb-6 opacity-40" style={{ color: 'var(--pp-accent)' }} />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.35 }}
                    >
                        <blockquote className="pp-heading text-xl md:text-2xl font-light italic leading-relaxed mb-8" style={{ color: 'var(--pp-text)' }}>
                            “{fillPlaceholders(current.quote, ctx.placeholders)}”
                        </blockquote>
                        <div className="flex items-center justify-center gap-3">
                            {current.photoUrl ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '2px solid var(--pp-accent)' }}>
                                    <ImageAsset src={current.photoUrl} alt={current.author} className="w-full h-full object-cover" fallback={<Initial name={current.author || '?'} className="w-full h-full" />} />
                                </div>
                            ) : (
                                current.author && <Initial name={current.author} className="w-12 h-12" />
                            )}
                            <div className="text-left">
                                {current.author && <p className="pp-body text-sm font-semibold" style={{ color: 'var(--pp-text)' }}>{current.author}</p>}
                                {current.role && <p className="pp-body text-xs" style={{ color: 'var(--pp-muted)' }}>{current.role}</p>}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
                {items.length > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <button onClick={() => setActive((i) => (i - 1 + items.length) % items.length)} className="p-2 rounded-full hover:opacity-70" style={{ color: 'var(--pp-muted)' }} aria-label="Depoimento anterior">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex gap-2">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActive(i)}
                                    aria-label={`Depoimento ${i + 1}`}
                                    aria-current={i === active}
                                    className="h-1.5 rounded-full transition-all"
                                    style={{ width: i === active ? 22 : 8, background: i === active ? 'var(--pp-accent)' : 'var(--pp-border)' }}
                                />
                            ))}
                        </div>
                        <button onClick={() => setActive((i) => (i + 1) % items.length)} className="p-2 rounded-full hover:opacity-70" style={{ color: 'var(--pp-muted)' }} aria-label="Próximo depoimento">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </SectionShell>
    )
}

// ── FAQ em acordeão ─────────────────────────────────────────────────────────

export function FaqBlockView({ block, ctx, alt }: { block: FaqBlock; ctx: BlockContext; alt: boolean }) {
    const items = block.data.items.filter((item) => item.question.trim())
    if (items.length === 0) return null
    return (
        <SectionShell id={block.id} eyebrow="Dúvidas" title={blockTitle(block)} alt={alt} width="max-w-3xl">
            <Accordion.Root type="single" collapsible className="space-y-3">
                {items.map((item, i) => (
                    <Reveal key={i} delay={Math.min(i, 8) * 0.04}>
                        <Accordion.Item value={String(i)} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--pp-border)', background: alt ? 'var(--pp-bg)' : 'var(--pp-card-bg)' }}>
                            <Accordion.Header>
                                <Accordion.Trigger className="group w-full flex items-center justify-between gap-4 px-5 py-4 text-left pp-body text-sm md:text-base font-medium" style={{ color: 'var(--pp-text)' }}>
                                    {fillPlaceholders(item.question, ctx.placeholders)}
                                    <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" style={{ color: 'var(--pp-accent)' }} />
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-5 pb-4 pp-body text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--pp-muted)' }}>
                                {fillPlaceholders(item.answer, ctx.placeholders)}
                            </Accordion.Content>
                        </Accordion.Item>
                    </Reveal>
                ))}
            </Accordion.Root>
        </SectionShell>
    )
}

// ── Contato ─────────────────────────────────────────────────────────────────

export function ContactBlockView({ block, ctx, alt }: { block: ContactBlock; ctx: BlockContext; alt: boolean }) {
    const { data } = block
    const provider = ctx.provider
    const wa = data.showWhatsapp ? whatsappHref(provider, `Olá! Vi a proposta para ${ctx.clientName} e quero conversar.`) : null
    const email = data.showEmail && provider?.email ? provider.email : null
    const instagram = data.showInstagram && provider?.instagram ? provider.instagram.replace('@', '') : null

    return (
        <SectionShell id={block.id} eyebrow="Fale com a gente" title={blockTitle(block)} alt={alt} width="max-w-3xl">
            <Reveal className="text-center">
                {data.message && (
                    <p className="pp-body text-base leading-relaxed mb-10 whitespace-pre-line" style={{ color: 'var(--pp-muted)' }}>
                        {fillPlaceholders(data.message, ctx.placeholders)}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                    {wa && (
                        <a href={wa} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl pp-body text-sm font-semibold transition-transform hover:scale-[1.03]"
                            style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}>
                            <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                        </a>
                    )}
                    {email && (
                        <a href={`mailto:${email}?subject=${encodeURIComponent(`Proposta — ${ctx.clientName}`)}`}
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl pp-body text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }}>
                            <Mail className="w-4 h-4" style={{ color: 'var(--pp-accent)' }} /> {email}
                        </a>
                    )}
                    {instagram && (
                        <a href={`https://instagram.com/${encodeURIComponent(instagram)}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl pp-body text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }}>
                            <Instagram className="w-4 h-4" style={{ color: 'var(--pp-accent)' }} /> @{instagram}
                        </a>
                    )}
                </div>
                {!wa && !email && !instagram && ctx.preview && (
                    <p className="pp-body text-xs mt-4" style={{ color: 'var(--pp-muted)' }}>
                        Preencha WhatsApp, e-mail ou Instagram no perfil da empresa para os botões aparecerem.
                    </p>
                )}
                {provider?.city && <p className="pp-body text-xs mt-8" style={{ color: 'var(--pp-muted)' }}>{provider.city}</p>}
            </Reveal>
        </SectionShell>
    )
}
