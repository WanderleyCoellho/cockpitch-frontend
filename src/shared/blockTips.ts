import { BLOCK_META, createBlock, type BlockType, type ProposalBlock } from './blocks'

/**
 * Dicas de ordem dos blocos no editor. São sugestões, nunca bloqueiam: o usuário decide.
 * Base (dados de mercado, ver specs/proposal-templates.md no backend):
 * - o início é a parte mais lida (34–38% do tempo de leitura) → abrir pelo momento do cliente;
 * - valor antes do preço; o preço fica com ~27% da leitura;
 * - mídia e provas sociais aumentam o fechamento (até +32%);
 * - propostas ganhas têm em média 7 seções;
 * - contato/aceite depois dos pacotes é prática comum (não há estudo que meça).
 */

export type TipFix =
    | { kind: 'move'; blockId: string; to: 'start' | 'after-cover' | 'before-pricing' | 'after-pricing' | 'end' }
    | { kind: 'add'; type: BlockType; where: 'before-pricing' | 'end' }

export type BlockTip = {
    id: string
    text: string
    /** Ação de um clique (opcional). */
    fix?: TipFix
    fixLabel?: string
}

/** Blocos que mostram valor (devem vir antes do preço). */
const VALUE_TYPES: BlockType[] = ['about', 'scope', 'timeline', 'gallery', 'testimonials', 'team']
/** Blocos que costumam vir depois do preço. */
const AFTER_PRICE: Array<{ type: BlockType; text: string }> = [
    { type: 'faq', text: 'Perguntas frequentes rendem mais depois do Investimento, quando surgem as dúvidas sobre o valor.' },
    { type: 'contact', text: 'O contato costuma vir depois dos pacotes: o cliente já viu o valor e sabe o que perguntar. É prática comum de mercado, não regra.' },
    { type: 'cta', text: 'A chamada para fechar funciona melhor depois do Investimento.' },
    { type: 'terms', text: 'Condições depois do preço: o cliente lê o valor antes das regras.' },
    { type: 'acceptance', text: 'O aceite online fica melhor depois do Investimento, perto do fim.' },
]
const MANY_SECTIONS = 12
const MAX_TIPS = 4

export function blockOrderTips(blocks: ProposalBlock[]): BlockTip[] {
    const visible = blocks.filter((b) => b.visible !== false)
    const pos = (b: ProposalBlock) => visible.indexOf(b)
    const first = (type: BlockType) => visible.find((b) => b.type === type)
    const tips: BlockTip[] = []

    const cover = first('cover')
    if (cover && pos(cover) !== 0) {
        tips.push({ id: 'cover-first', text: 'A capa funciona melhor como primeiro bloco.', fix: { kind: 'move', blockId: cover.id, to: 'start' }, fixLabel: 'Mover para o início' })
    }

    const pricing = first('pricing')
    if (!pricing) {
        tips.push({ id: 'no-pricing', text: 'Sem o bloco de preços, os pacotes escolhidos não aparecem para o cliente.', fix: { kind: 'add', type: 'pricing', where: 'end' }, fixLabel: 'Adicionar preços' })
    }

    const about = first('about')
    const opening = visible[cover ? 1 : 0]
    if (about && opening && opening !== about && !VALUE_TYPES.includes(opening.type)) {
        tips.push({ id: 'open-with-client', text: 'O começo é a parte mais lida da proposta. Abra falando do momento e do problema do cliente.', fix: { kind: 'move', blockId: about.id, to: 'after-cover' }, fixLabel: 'Trazer para o começo' })
    }

    if (pricing) {
        const late = visible.filter((b) => VALUE_TYPES.includes(b.type) && pos(b) > pos(pricing))
        for (const block of late) {
            tips.push({
                id: `value-${block.id}`,
                text: `Mostre valor antes do preço: "${BLOCK_META[block.type].label}" rende mais antes do Investimento.`,
                fix: { kind: 'move', blockId: block.id, to: 'before-pricing' },
                fixLabel: 'Mover para antes do preço',
            })
        }
        for (const rule of AFTER_PRICE) {
            const block = first(rule.type)
            if (block && pos(block) < pos(pricing)) {
                tips.push({ id: `after-${block.id}`, text: rule.text, fix: { kind: 'move', blockId: block.id, to: rule.type === 'acceptance' ? 'end' : 'after-pricing' }, fixLabel: 'Mover para depois do preço' })
            }
        }
        if (!first('testimonials') && !first('gallery')) {
            tips.push({ id: 'proof', text: 'Inclua provas antes do preço, como depoimentos ou portfólio. Propostas com mídia e prova social fecham até 32% mais.', fix: { kind: 'add', type: 'testimonials', where: 'before-pricing' }, fixLabel: 'Adicionar depoimentos' })
        }
    }

    if (visible.length > MANY_SECTIONS) {
        tips.push({ id: 'too-long', text: `São ${visible.length} seções. As propostas que fecham têm em média 7: oculte o que o cliente não precisa ler.` })
    }

    return tips.slice(0, MAX_TIPS)
}

/** Aplica a ação de uma dica e devolve a nova lista (a original não muda). */
export function applyTipFix(blocks: ProposalBlock[], fix: TipFix): ProposalBlock[] {
    if (fix.kind === 'add') {
        const block = createBlock(fix.type, blocks)
        const next = [...blocks]
        const pricingAt = next.findIndex((b) => b.type === 'pricing')
        next.splice(fix.where === 'before-pricing' && pricingAt >= 0 ? pricingAt : next.length, 0, block)
        return next
    }
    const moving = blocks.find((b) => b.id === fix.blockId)
    if (!moving) return blocks
    const next = blocks.filter((b) => b !== moving)
    const pricingAt = next.findIndex((b) => b.type === 'pricing')
    const coverAt = next.findIndex((b) => b.type === 'cover')
    const target =
        fix.to === 'start' ? 0
            : fix.to === 'after-cover' ? coverAt + 1
                : fix.to === 'before-pricing' ? (pricingAt >= 0 ? pricingAt : next.length)
                    : fix.to === 'after-pricing' ? (pricingAt >= 0 ? pricingAt + 1 : next.length)
                        : next.length
    next.splice(target, 0, moving)
    return next
}
