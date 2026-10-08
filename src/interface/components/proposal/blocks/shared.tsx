import { createContext, useContext, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlaceholderContext } from '../../../../shared/blocks'
import type { AcceptanceState, Package, PackageItem, Provider } from '../../../../shared/types'
import type { ThemeTokens } from '../ThemeSelector'

export type BlockContext = {
    clientName: string
    provider?: Provider | null
    packages: Array<Package & { items?: PackageItem[] }>
    tk: ThemeTokens
    placeholders: PlaceholderContext
    /** Data limite da proposta (criação + validade), quando conhecida. */
    validUntil?: Date | null
    /** Pré-visualização no editor: capa mais baixa, sem efeitos de rolagem da janela. */
    preview?: boolean
    onPackageExpand?: (packageId: string) => void
    /** Link público (para enviar a resposta do cliente). */
    slug?: string
    acceptance?: AcceptanceState
    /** Avisa a página quando o cliente responde (cabeçalho e botões mudam na hora). */
    onAcceptanceChange?: (state: AcceptanceState) => void
    /** Plano sem a marca "Feito com Lumen Deal". */
    removeBranding?: boolean
    /** Âncoras de outros blocos, preenchidas pelo renderer. */
    acceptanceId?: string
    pricingId?: string
    termsId?: string
}

/** Entrada suave ao rolar (respeita "reduzir movimento" do sistema). */
export function Reveal({ children, delay = 0, className, as = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' }) {
    const reduce = useReducedMotion()
    if (reduce) return as === 'li' ? <li className={className}>{children}</li> : <div className={className}>{children}</div>
    const Tag = as === 'li' ? motion.li : motion.div
    return (
        <Tag
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </Tag>
    )
}

/**
 * Pré-visualização do editor: o rótulo do tipo de bloco ("Escopo", "Etapas"...) aparece só ali,
 * para orientar a revisão. Na proposta enviada, o cliente vê apenas o título escolhido.
 */
export const BlockPreviewContext = createContext(false)

export function BlockTypeLabel({ children }: { children: ReactNode }) {
    const preview = useContext(BlockPreviewContext)
    if (!preview || !children) return null
    return (
        <p
            className="pp-body mx-auto mb-3 inline-block rounded-full border border-dashed px-2.5 py-0.5 text-[10px] tracking-widest uppercase font-medium"
            style={{ color: 'var(--pp-accent)', borderColor: 'color-mix(in srgb, var(--pp-accent) 45%, transparent)' }}
            title="Rótulo do tipo de bloco: aparece só na revisão, não para o cliente."
        >
            {children} · só na revisão
        </p>
    )
}

/**
 * Título com a última palavra marcada (.pp-hl): cada tema decide se ela ganha cor, itálico,
 * caixa de destaque ou nada.
 */
export function Headline({ text }: { text: string }) {
    const trimmed = text.trim()
    const cut = trimmed.lastIndexOf(' ')
    if (cut <= 0) return <span className="pp-hl">{trimmed}</span>
    return (
        <>
            {trimmed.slice(0, cut)} <span className="pp-hl">{trimmed.slice(cut + 1)}</span>
        </>
    )
}

export function SectionShell({
    id,
    eyebrow,
    title,
    children,
    alt = false,
    width = 'max-w-5xl',
    backgroundUrl,
}: {
    id: string
    eyebrow?: string
    title?: string
    children: ReactNode
    /** Alterna o fundo entre seções para dar ritmo à página. */
    alt?: boolean
    width?: string
    /** Imagem de fundo opcional, coberta por um véu da cor do tema (o texto continua legível). */
    backgroundUrl?: string
}) {
    const base = alt ? 'var(--pp-alt-bg)' : 'var(--pp-bg)'
    return (
        <section
            id={id}
            data-section={id}
            className={`relative isolate overflow-hidden px-6 py-20 md:py-28 scroll-mt-20 ${alt ? 'pp-alt' : ''}`}
            style={{ background: base }}
        >
            {backgroundUrl && (
                <>
                    <img src={backgroundUrl} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
                    <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `color-mix(in srgb, ${base} 72%, transparent)` }} />
                </>
            )}
            <div className={`${width} mx-auto`}>
                {(eyebrow || title) && (
                    <Reveal className="text-center mb-12 md:mb-16">
                        <BlockTypeLabel>{eyebrow}</BlockTypeLabel>
                        {title && (
                            <h2 className="pp-heading pp-title text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>
                                <Headline text={title} />
                            </h2>
                        )}
                        <div className="pp-divider" />
                    </Reveal>
                )}
                {children}
            </div>
        </section>
    )
}

export function Initial({ name, className = 'w-14 h-14 text-lg' }: { name: string; className?: string }) {
    return (
        <div
            className={`${className} rounded-full flex items-center justify-center font-semibold pp-body flex-shrink-0`}
            style={{ background: 'color-mix(in srgb, var(--pp-accent) 16%, transparent)', color: 'var(--pp-accent)' }}
            aria-hidden
        >
            {name.trim()[0]?.toUpperCase() ?? '•'}
        </div>
    )
}

export function whatsappHref(provider: Provider | null | undefined, text: string) {
    const digits = provider?.whatsapp?.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null
}
