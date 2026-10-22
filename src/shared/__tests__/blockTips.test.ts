import { describe, expect, it } from 'vitest'
import { applyTipFix, blockOrderTips } from '../blockTips'
import { createBlock, type BlockType, type ProposalBlock } from '../blocks'

function page(...types: BlockType[]): ProposalBlock[] {
    const blocks: ProposalBlock[] = []
    for (const type of types) blocks.push(createBlock(type, blocks))
    return blocks
}
const order = (blocks: ProposalBlock[]) => blocks.map((b) => b.type)

describe('dicas de ordem dos blocos', () => {
    it('uma proposta na ordem recomendada não recebe dicas', () => {
        expect(blockOrderTips(page('cover', 'about', 'scope', 'testimonials', 'pricing', 'faq', 'contact', 'terms', 'acceptance'))).toEqual([])
    })

    it('sugere mostrar valor antes do preço e mover o bloco com um clique', () => {
        const blocks = page('cover', 'about', 'pricing', 'testimonials', 'contact')
        const tip = blockOrderTips(blocks).find((t) => t.id.startsWith('value-'))!
        expect(tip.text).toContain('Depoimentos')
        expect(order(applyTipFix(blocks, tip.fix!))).toEqual(['cover', 'about', 'testimonials', 'pricing', 'contact'])
    })

    it('contato e condições antes do preço viram dica para depois', () => {
        const blocks = page('cover', 'about', 'testimonials', 'contact', 'pricing', 'acceptance')
        const tip = blockOrderTips(blocks).find((t) => t.id.startsWith('after-contact'))!
        expect(tip.text).toMatch(/prática comum/)
        expect(order(applyTipFix(blocks, tip.fix!))).toEqual(['cover', 'about', 'testimonials', 'pricing', 'contact', 'acceptance'])
    })

    it('capa fora do início e falta de provas', () => {
        const blocks = page('about', 'cover', 'pricing')
        const ids = blockOrderTips(blocks).map((t) => t.id)
        expect(ids).toContain('cover-first')
        expect(ids).toContain('proof')
        const added = applyTipFix(blocks, blockOrderTips(blocks).find((t) => t.id === 'proof')!.fix!)
        expect(order(added)).toEqual(['about', 'cover', 'testimonials', 'pricing'])
    })

    it('blocos ocultos não contam e nunca há mais de 4 dicas', () => {
        const blocks = page('cover', 'about', 'pricing', 'testimonials')
        blocks[3] = { ...blocks[3], visible: false }
        expect(blockOrderTips(blocks).some((t) => t.id.startsWith('value-'))).toBe(false)
        const messy = page('acceptance', 'terms', 'faq', 'contact', 'cta', 'pricing', 'about', 'scope', 'team', 'cover')
        expect(blockOrderTips(messy).length).toBeLessThanOrEqual(4)
    })
})
