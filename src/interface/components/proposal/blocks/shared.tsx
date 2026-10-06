import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { PlaceholderContext } from '../../../../shared/blocks'
import type { Package, PackageItem, Provider } from '../../../../shared/types'
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

export function SectionShell({
    id,
    eyebrow,
    title,
    children,
    alt = false,
    width = 'max-w-5xl',
}: {
    id: string
    eyebrow?: string
    title?: string
    children: ReactNode
    /** Alterna o fundo entre seções para dar ritmo à página. */
    alt?: boolean
    width?: string
}) {
    return (
        <section
            id={id}
            data-section={id}
            className="px-6 py-20 md:py-28 scroll-mt-20"
            style={{ background: alt ? 'var(--pp-card-bg)' : 'var(--pp-bg)' }}
        >
            <div className={`${width} mx-auto`}>
                {(eyebrow || title) && (
                    <Reveal className="text-center mb-12 md:mb-16">
                        {eyebrow && (
                            <p className="pp-body text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: 'var(--pp-accent)' }}>
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>
                                {title}
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
