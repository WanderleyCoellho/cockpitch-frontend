import type { Proposal, Provider } from './types'

/**
 * Blocos da proposta — espelho do contrato do backend (src/services/blocks.ts).
 * O backend valida estritamente na escrita; aqui o renderer ignora tipos que não conhece.
 */

export type MediaKind = 'image' | 'video'

type Base = { id: string; visible: boolean; title: string }

export type CoverBlock = Base & {
    type: 'cover'
    data: { headline: string; subheadline: string; mediaUrl?: string; mediaType?: MediaKind; showClientName: boolean }
}
export type AboutBlock = Base & { type: 'about'; data: { body: string; mediaUrl?: string; mediaType?: MediaKind } }
export type ScopeBlock = Base & { type: 'scope'; data: { intro: string; items: Array<{ title: string; description: string }> } }
export type PricingBlock = Base & { type: 'pricing'; data: { intro: string } }
export type GalleryBlock = Base & { type: 'gallery'; data: { items: Array<{ url: string; type: MediaKind; caption: string }> } }
export type TimelineBlock = Base & {
    type: 'timeline'
    /** backgroundUrl: imagem de fundo opcional (escurecida para manter a leitura). */
    data: { steps: Array<{ title: string; description: string; duration: string }>; backgroundUrl?: string }
}
export type TestimonialsBlock = Base & {
    type: 'testimonials'
    data: { items: Array<{ quote: string; author: string; role: string; photoUrl?: string }> }
}
export type FaqBlock = Base & { type: 'faq'; data: { items: Array<{ question: string; answer: string }> } }
export type TeamBlock = Base & {
    type: 'team'
    data: { members: Array<{ name: string; role: string; bio: string; photoUrl?: string }> }
}
export type TermsBlock = Base & { type: 'terms'; data: { body: string } }
export type ContactBlock = Base & {
    type: 'contact'
    data: { message: string; showWhatsapp: boolean; showEmail: boolean; showInstagram: boolean }
}
export type CtaBlock = Base & { type: 'cta'; data: { headline: string; buttonLabel: string } }
export type AcceptanceBlock = Base & {
    type: 'acceptance'
    data: { intro: string; allowDecline: boolean; allowChangeRequest: boolean; requireDocument: boolean }
}

export type ProposalBlock =
    | CoverBlock
    | AboutBlock
    | ScopeBlock
    | PricingBlock
    | GalleryBlock
    | TimelineBlock
    | TestimonialsBlock
    | FaqBlock
    | TeamBlock
    | TermsBlock
    | ContactBlock
    | CtaBlock
    | AcceptanceBlock

export type BlockType = ProposalBlock['type']

export const MAX_BLOCKS = 60

type BlockMeta<T extends BlockType> = {
    label: string
    /** Explicação curta mostrada no editor (o que é e quando usar). */
    help: string
    /** Título exibido ao cliente quando o bloco não tem título próprio. */
    defaultTitle: string
    /** Cabe só um na proposta? */
    single?: boolean
    create: () => Extract<ProposalBlock, { type: T }>['data']
}

export const BLOCK_META: { [T in BlockType]: BlockMeta<T> } = {
    cover: {
        label: 'Capa',
        help: 'Primeira coisa que o cliente vê: título, subtítulo e uma imagem ou vídeo de fundo.',
        defaultTitle: '',
        single: true,
        create: () => ({ headline: 'Proposta para {cliente}', subheadline: '', showClientName: true }),
    },
    about: {
        label: 'Sobre nós',
        help: 'Apresente sua empresa: quem é, o que faz e por que é a escolha certa.',
        defaultTitle: 'Quem somos',
        create: () => ({ body: '<p>Somos a <strong>{empresa}</strong>…</p>' }),
    },
    scope: {
        label: 'Escopo',
        help: 'Lista do que está incluso (entregáveis). O cliente vê cada item como um checklist.',
        defaultTitle: 'O que está incluso',
        create: () => ({ intro: '', items: [{ title: 'Entregável', description: '' }] }),
    },
    pricing: {
        label: 'Preços e pacotes',
        help: 'Mostra os pacotes escolhidos na proposta. O cliente liga/desliga opcionais e vê o total na hora.',
        defaultTitle: 'Investimento',
        single: true,
        create: () => ({ intro: '' }),
    },
    gallery: {
        label: 'Galeria',
        help: 'Fotos e vídeos do seu trabalho. O cliente clica para ampliar.',
        defaultTitle: 'Portfólio',
        create: () => ({ items: [] }),
    },
    timeline: {
        label: 'Etapas',
        help: 'Cronograma ou passo a passo do trabalho, com prazo de cada etapa.',
        defaultTitle: 'Como vamos trabalhar',
        create: () => ({ steps: [{ title: 'Etapa 1', description: '', duration: '' }] }),
    },
    testimonials: {
        label: 'Depoimentos',
        help: 'Falas de clientes satisfeitos. Aumentam muito a confiança de quem está decidindo.',
        defaultTitle: 'O que dizem nossos clientes',
        create: () => ({ items: [{ quote: '', author: '', role: '' }] }),
    },
    faq: {
        label: 'Perguntas frequentes',
        help: 'Responda às dúvidas comuns antes que o cliente precise perguntar.',
        defaultTitle: 'Perguntas frequentes',
        create: () => ({ items: [{ question: '', answer: '' }] }),
    },
    team: {
        label: 'Equipe',
        help: 'Pessoas que vão atender o cliente, com foto e função.',
        defaultTitle: 'Quem vai cuidar de você',
        create: () => ({ members: [{ name: '', role: '', bio: '' }] }),
    },
    terms: {
        label: 'Condições',
        help: 'Validade, forma de pagamento e regras importantes.',
        defaultTitle: 'Condições',
        create: () => ({ body: '<p><strong>Pagamento:</strong> …</p>' }),
    },
    contact: {
        label: 'Contato',
        help: 'Botões de WhatsApp, e-mail e Instagram (vêm do perfil da empresa).',
        defaultTitle: 'Vamos conversar?',
        single: true,
        create: () => ({ message: '', showWhatsapp: true, showEmail: true, showInstagram: true }),
    },
    acceptance: {
        label: 'Aceite online',
        help: 'O cliente escolhe o pacote, confere o total e aceita ali mesmo. Também pode pedir ajuste ou recusar. Você acompanha tudo na aba Respostas.',
        defaultTitle: 'Aceitar proposta',
        single: true,
        create: () => ({ intro: '', allowDecline: true, allowChangeRequest: true, requireDocument: false }),
    },
    cta: {
        label: 'Chamada para ação',
        help: 'Faixa de destaque com um botão que leva o cliente ao contato.',
        defaultTitle: '',
        create: () => ({ headline: 'Vamos começar?', buttonLabel: 'Quero fechar' }),
    },
}

export const BLOCK_TYPES = Object.keys(BLOCK_META) as BlockType[]

export function isKnownBlock(block: unknown): block is ProposalBlock {
    return (
        !!block &&
        typeof block === 'object' &&
        typeof (block as { id?: unknown }).id === 'string' &&
        typeof (block as { type?: unknown }).type === 'string' &&
        (block as { type: string }).type in BLOCK_META &&
        typeof (block as { data?: unknown }).data === 'object' &&
        (block as { data?: unknown }).data !== null
    )
}

export function blockTitle(block: ProposalBlock): string {
    return block.title?.trim() || BLOCK_META[block.type].defaultTitle || BLOCK_META[block.type].label
}

export function newBlockId(type: BlockType, existing: Array<{ id: string }>): string {
    const ids = new Set(existing.map((b) => b.id))
    if (!ids.has(type)) return type
    let n = 2
    while (ids.has(`${type}-${n}`)) n += 1
    return `${type}-${n}`
}

export function createBlock(type: BlockType, existing: Array<{ id: string }>): ProposalBlock {
    return {
        id: newBlockId(type, existing),
        type,
        visible: true,
        title: BLOCK_META[type].defaultTitle,
        data: BLOCK_META[type].create(),
    } as ProposalBlock
}

export function duplicateBlock(block: ProposalBlock, existing: Array<{ id: string }>): ProposalBlock {
    return { ...structuredClone(block), id: newBlockId(block.type, existing) }
}

export type PlaceholderContext = { cliente: string; empresa: string }

/** Troca {cliente} e {empresa} em texto puro. */
export function fillPlaceholders(text: string | undefined | null, ctx: PlaceholderContext): string {
    if (!text) return ''
    return text.replace(/\{(cliente|empresa)\}/g, (_, key: keyof PlaceholderContext) => ctx[key] ?? '')
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Troca placeholders em HTML escapando os valores (o nome do cliente é texto, nunca marcação). */
export function fillPlaceholdersHtml(html: string | undefined | null, ctx: PlaceholderContext): string {
    if (!html) return ''
    return html.replace(/\{(cliente|empresa)\}/g, (_, key: keyof PlaceholderContext) => escapeHtml(ctx[key] ?? ''))
}

function textToHtml(text: string) {
    return text
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('')
}

function isApiMedia(url: string | undefined | null): url is string {
    return !!url && (url.includes('/media/public/') || (url.includes('/uploads/') && !url.includes('/uploads/receipts/')))
}

function mediaKind(url: string, declared?: string): MediaKind {
    return declared === 'video' || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) ? 'video' : 'image'
}

/**
 * Converte uma proposta no layout antigo (casamento) em blocos, para o editor.
 * Só usa mídias enviadas pela própria plataforma (o backend recusa links externos nos blocos).
 */
export function legacyProposalToBlocks(proposal: Proposal, provider?: Provider | null): ProposalBlock[] {
    const blocks: ProposalBlock[] = []
    const push = (type: BlockType, title: string, data: ProposalBlock['data']) =>
        blocks.push({ id: newBlockId(type, blocks), type, visible: true, title, data } as ProposalBlock)

    const coverMedia = [proposal.heroVideoUrl, provider?.heroVideoUrl, proposal.weddingPhotoUrl].find(isApiMedia)
    push('cover', '', {
        headline: 'Proposta para {cliente}',
        subheadline: provider?.shortDescription ?? '',
        showClientName: true,
        ...(coverMedia ? { mediaUrl: coverMedia, mediaType: mediaKind(coverMedia) } : {}),
    })

    if (provider?.aboutText?.trim()) {
        push('about', provider.aboutTitle?.trim() || 'Quem somos', { body: textToHtml(provider.aboutText) })
    }

    const galleryItems = [...(proposal.backstageMedia ?? []), ...(proposal.differentialsMedia ?? []), ...(provider?.differentialsMedia ?? [])]
        .filter((item) => isApiMedia(item.url))
        .slice(0, 60)
        .map((item) => ({ url: item.url, type: mediaKind(item.url, item.type), caption: '' }))
    if (galleryItems.length > 0) {
        push('gallery', provider?.differentialsTitle?.trim() || 'Nosso trabalho', { items: galleryItems })
    }

    push('pricing', provider?.packageLabel?.trim() || 'Investimento', { intro: '' })

    const testimonials = (provider?.testimonials ?? [])
        .filter((t) => t.quote?.trim())
        .slice(0, 30)
        .map((t) => ({
            quote: t.quote,
            author: t.author ?? '',
            role: [t.city, t.venue].filter(Boolean).join(' · '),
            ...(isApiMedia(t.photoUrl) ? { photoUrl: t.photoUrl } : {}),
        }))
    if (testimonials.length > 0) push('testimonials', 'O que dizem nossos clientes', { items: testimonials })

    if (provider?.deliveryTimes?.trim()) {
        push('terms', 'Prazos de entrega', { body: textToHtml(provider.deliveryTimes) })
    }

    push('acceptance', 'Aceitar proposta', { intro: '', allowDecline: true, allowChangeRequest: true, requireDocument: false })
    push('contact', 'Contato', { message: '', showWhatsapp: true, showEmail: true, showInstagram: true })
    return blocks
}
