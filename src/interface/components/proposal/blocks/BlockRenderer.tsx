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
import { AcceptanceBlockView } from './AcceptanceBlock'
import { SelectionContext, useSelectionState, type ProposalSelection } from './selection'

/** Blocos que o cliente vê: visíveis e de tipo conhecido (tipos novos são ignorados, nunca quebram a página). */
export function visibleBlocks(blocks: unknown): ProposalBlock[] {
    return Array.isArray(blocks) ? blocks.filter(isKnownBlock).filter((b) => b.visible !== false) : []
}

function BlockView({ block, ctx, alt, nextId, selection }: { block: ProposalBlock; ctx: BlockContext; alt: boolean; nextId?: string; selection: ProposalSelection }) {
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
                    selection={selection}
                    acceptanceId={ctx.acceptance?.state === 'OPEN' || ctx.preview ? ctx.acceptanceId : undefined}
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
        case 'acceptance':
            return <AcceptanceBlockView block={block} ctx={ctx} alt={alt} />
        default:
            return null
    }
}

export function BlockRenderer({ blocks, ctx, selection: external }: { blocks: ProposalBlock[]; ctx: BlockContext; selection?: ProposalSelection }) {
    // A página pública passa a seleção de fora (o botão de PDF no cabeçalho precisa dela).
    const own = useSelectionState(ctx.packages)
    const selection = external ?? own
    const fullCtx: BlockContext = {
        ...ctx,
        acceptanceId: blocks.find((b) => b.type === 'acceptance')?.id,
        pricingId: blocks.find((b) => b.type === 'pricing')?.id,
        termsId: blocks.find((b) => b.type === 'terms')?.id,
    }
    // Fundo alternado entre seções; a capa e a chamada para ação têm fundo próprio e não contam.
    let index = 0
    return (
        <SelectionContext.Provider value={selection}>
            {blocks.map((block, i) => {
                const alt = block.type === 'cover' || block.type === 'cta' ? false : index++ % 2 === 1
                return <BlockView key={block.id} block={block} ctx={fullCtx} alt={alt} nextId={blocks[i + 1]?.id} selection={selection} />
            })}
        </SelectionContext.Provider>
    )
}
