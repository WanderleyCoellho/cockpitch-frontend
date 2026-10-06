import { isKnownBlock, type ProposalBlock } from '../../../../shared/blocks'
import { PackagesSection } from '../public/PackagesSection'
import {
    AboutBlockView,
    CoverBlockView,
    CtaBlockView,
    ScopeBlockView,
    TeamBlockView,
    TermsBlockView,
    TimelineBlockView,
} from './ContentBlocks'
import { ContactBlockView, FaqBlockView, GalleryBlockView, TestimonialsBlockView } from './InteractiveBlocks'
import { SectionShell, type BlockContext } from './shared'

/** Blocos que o cliente vê: visíveis e de tipo conhecido (tipos novos são ignorados, nunca quebram a página). */
export function visibleBlocks(blocks: unknown): ProposalBlock[] {
    return Array.isArray(blocks) ? blocks.filter(isKnownBlock).filter((b) => b.visible !== false) : []
}

function BlockView({ block, ctx, alt, nextId }: { block: ProposalBlock; ctx: BlockContext; alt: boolean; nextId?: string }) {
    switch (block.type) {
        case 'cover':
            return <CoverBlockView block={block} ctx={ctx} nextId={nextId} />
        case 'about':
            return <AboutBlockView block={block} ctx={ctx} alt={alt} />
        case 'scope':
            return <ScopeBlockView block={block} ctx={ctx} alt={alt} />
        case 'pricing':
            if (ctx.packages.length === 0) {
                return ctx.preview ? (
                    <SectionShell id={block.id} title={block.title || 'Investimento'} alt={alt}>
                        <p className="pp-body text-sm text-center" style={{ color: 'var(--pp-muted)' }}>
                            Os pacotes escolhidos na proposta aparecem aqui, com o total calculado.
                        </p>
                    </SectionShell>
                ) : null
            }
            return (
                <PackagesSection
                    proposal={{ clientName: ctx.clientName }}
                    packages={ctx.packages}
                    provider={ctx.provider ?? undefined}
                    tk={ctx.tk}
                    onPackageExpand={ctx.onPackageExpand}
                    sectionId={block.id}
                    title={block.title}
                    intro={block.data.intro}
                />
            )
        case 'gallery':
            return <GalleryBlockView block={block} ctx={ctx} alt={alt} />
        case 'timeline':
            return <TimelineBlockView block={block} ctx={ctx} alt={alt} />
        case 'testimonials':
            return <TestimonialsBlockView block={block} ctx={ctx} alt={alt} />
        case 'faq':
            return <FaqBlockView block={block} ctx={ctx} alt={alt} />
        case 'team':
            return <TeamBlockView block={block} ctx={ctx} alt={alt} />
        case 'terms':
            return <TermsBlockView block={block} ctx={ctx} alt={alt} />
        case 'contact':
            return <ContactBlockView block={block} ctx={ctx} alt={alt} />
        case 'cta':
            return <CtaBlockView block={block} ctx={ctx} />
        default:
            return null
    }
}

export function BlockRenderer({ blocks, ctx }: { blocks: ProposalBlock[]; ctx: BlockContext }) {
    // Fundo alternado entre seções; a capa e a chamada para ação têm fundo próprio e não contam.
    let index = 0
    return (
        <>
            {blocks.map((block, i) => {
                const alt = block.type === 'cover' || block.type === 'cta' ? false : index++ % 2 === 1
                return <BlockView key={block.id} block={block} ctx={ctx} alt={alt} nextId={blocks[i + 1]?.id} />
            })}
        </>
    )
}
