import { useEffect, useMemo, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { FileDown, MessageCircle } from 'lucide-react'
import { blockTitle, type ProposalBlock } from '../../../../shared/blocks'
import { ImageAsset } from '../public/media'
import { ProposalThemeStyle, themeCssVars } from '../public/theme'
import { BlockRenderer } from './BlockRenderer'
import { useSelectionState } from './selection'
import { printUrl } from '../print/printUrl'
import { whatsappHref, type BlockContext } from './shared'

const NAV_SKIP = new Set<ProposalBlock['type']>(['cover', 'cta'])

/** Seção visível no momento (para destacar no menu lateral). */
function useActiveSection(ids: string[]) {
    const [active, setActive] = useState<string | null>(null)
    useEffect(() => {
        if (ids.length === 0 || typeof IntersectionObserver === 'undefined') return
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
                if (visible) setActive(visible.target.id)
            },
            { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
        )
        ids.forEach((id) => {
            const el = document.getElementById(id)
            if (el) observer.observe(el)
        })
        return () => observer.disconnect()
    }, [ids])
    return active
}

/** Página pública de uma proposta em blocos: cabeçalho, progresso de leitura, menu de seções e contato flutuante. */
export function BlockProposalPage({ blocks, ctx: initialCtx }: { blocks: ProposalBlock[]; ctx: BlockContext }) {
    // O estado do aceite muda quando o cliente responde nesta mesma visita.
    const [acceptance, setAcceptance] = useState(initialCtx.acceptance)
    const ctx: BlockContext = { ...initialCtx, acceptance, onAcceptanceChange: setAcceptance }
    // Escolha do cliente compartilhada entre os blocos e o botão de PDF.
    const selection = useSelectionState(ctx.packages)
    const pdfHref = ctx.slug
        ? printUrl(ctx.slug, selection.selectedPackageId ? { packageId: selection.selectedPackageId, optionalIds: selection.optionals[selection.selectedPackageId] ?? [] } : null)
        : null
    const provider = ctx.provider
    const navItems = useMemo(() => blocks.filter((b) => !NAV_SKIP.has(b.type)).map((b) => ({ id: b.id, label: blockTitle(b) })), [blocks])
    const navIds = useMemo(() => navItems.map((n) => n.id), [navItems])
    const active = useActiveSection(navIds)
    const { scrollYProgress } = useScroll()
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
    const contactBlock = blocks.find((b) => b.type === 'contact')
    const acceptanceBlock = ctx.acceptance?.state === 'OPEN' ? blocks.find((b) => b.type === 'acceptance') : undefined
    const floatingWa = whatsappHref(provider, `Olá! Estou vendo a proposta para ${ctx.clientName} e tenho uma dúvida.`)

    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className="pp-scope min-h-screen" style={{ background: 'var(--pp-bg)', color: 'var(--pp-text)', ...themeCssVars(ctx.tk) }}>
            <ProposalThemeStyle tk={ctx.tk} smoothScroll />

            <motion.div className="pp-no-print fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left" style={{ scaleX: progress, background: 'var(--pp-accent)' }} aria-hidden />

            <header
                className="pp-no-print fixed top-0 left-0 right-0 z-50 px-6 py-3.5 flex items-center justify-between transition-colors duration-300"
                style={{
                    background: scrolled ? `color-mix(in srgb, ${ctx.tk.bg} 92%, transparent)` : 'transparent',
                    borderBottom: scrolled ? '1px solid var(--pp-border)' : '1px solid transparent',
                    backdropFilter: scrolled ? 'blur(18px)' : undefined,
                }}
            >
                <div className="min-w-0">
                    {provider?.logoUrl ? (
                        <ImageAsset
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="h-9 object-contain"
                            fallback={<span className="pp-heading text-lg font-semibold">{provider.name}</span>}
                        />
                    ) : (
                        <span className="pp-heading text-lg font-semibold truncate" style={{ color: scrolled ? 'var(--pp-text)' : undefined }}>
                            {provider?.name}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                {pdfHref && (
                    <a
                        href={pdfHref}
                        target="_blank"
                        rel="noreferrer"
                        title="Baixar PDF"
                        aria-label="Baixar proposta em PDF"
                        className="pp-body inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-opacity hover:opacity-80"
                        style={{ border: '1px solid var(--pp-border)', color: scrolled ? 'var(--pp-text)' : undefined, background: scrolled ? undefined : 'color-mix(in srgb, var(--pp-bg) 50%, transparent)' }}
                    >
                        <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
                    </a>
                )}
                {acceptanceBlock ? (
                    <a
                        href={`#${acceptanceBlock.id}`}
                        className="pp-body text-xs font-semibold tracking-wide px-4 py-2 rounded-full transition-opacity hover:opacity-90"
                        style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}
                    >
                        Aceitar proposta
                    </a>
                ) : contactBlock && (
                    <a
                        href={`#${contactBlock.id}`}
                        className="pp-body text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                        style={{ border: '1px solid color-mix(in srgb, var(--pp-accent) 50%, transparent)', color: 'var(--pp-accent)' }}
                    >
                        Contato
                    </a>
                )}
                </div>
            </header>

            {navItems.length > 2 && (
                <nav className="pp-no-print hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3" aria-label="Seções da proposta">
                    {navItems.map((item) => {
                        const isActive = active === item.id
                        return (
                            <a key={item.id} href={`#${item.id}`} className="group flex items-center justify-end gap-3" aria-current={isActive ? 'true' : undefined}>
                                <span
                                    className="pp-body text-[11px] px-2 py-1 rounded-md opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all whitespace-nowrap"
                                    style={{ background: 'var(--pp-card-bg)', color: 'var(--pp-text)', border: '1px solid var(--pp-border)' }}
                                >
                                    {item.label}
                                </span>
                                <span
                                    className="block rounded-full transition-all"
                                    style={{
                                        width: isActive ? 10 : 6,
                                        height: isActive ? 10 : 6,
                                        background: isActive ? 'var(--pp-accent)' : 'var(--pp-muted)',
                                        opacity: isActive ? 1 : 0.5,
                                    }}
                                />
                            </a>
                        )
                    })}
                </nav>
            )}

            <main>
                <BlockRenderer blocks={blocks} ctx={ctx} selection={selection} />
            </main>

            {!ctx.removeBranding && (
                <footer className="px-6 py-10 text-center" style={{ borderTop: '1px solid var(--pp-border)' }}>
                    <a href="https://deal.lumendevstudios.com" target="_blank" rel="noreferrer" className="pp-body text-[11px] tracking-wide hover:opacity-80" style={{ color: 'var(--pp-muted)', opacity: 0.6 }}>
                        Proposta feita com Lumen Deal
                    </a>
                </footer>
            )}

            {floatingWa && scrolled && active !== contactBlock?.id && (
                <motion.a
                    href={floatingWa}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, scale: 0.8, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="pp-no-print fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-xl pp-body text-sm font-semibold"
                    style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' }}
                    aria-label="Tirar dúvida pelo WhatsApp"
                >
                    <MessageCircle className="w-5 h-5" /> <span className="hidden sm:inline">Tirar dúvida</span>
                </motion.a>
            )}
        </div>
    )
}
