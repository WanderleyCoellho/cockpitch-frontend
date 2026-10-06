// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BLOCK_TYPES, createBlock, type ProposalBlock } from '../blocks'
import { PrintDocument, type PrintContext } from '../../interface/components/proposal/print/PrintDocument'
import { THEMES } from '../../interface/components/proposal/ThemeSelector'
import { printUrl } from '../../interface/components/proposal/print/printUrl'
import type { Package } from '../types'

const pkg = {
    id: 'p1', name: 'Completo', priceMode: 'SUM_OF_ITEMS', discountType: 'NONE', discountValue: 0, pricing: { totalCents: 1 },
    items: [
        { id: 'i1', name: 'Horas', kind: 'INCLUDED', quantity: 10, unit: 'h', unitPriceCents: 10000, isCourtesy: false },
        { id: 'i2', name: 'Workshop', kind: 'OPTIONAL', quantity: 1, unitPriceCents: 50000, isCourtesy: false },
    ],
} as unknown as Package

function allBlocks(): ProposalBlock[] {
    const blocks: ProposalBlock[] = []
    for (const type of BLOCK_TYPES) blocks.push(createBlock(type, blocks))
    const gallery = blocks.find((b) => b.type === 'gallery')!
    if (gallery.type === 'gallery') gallery.data.items = [{ url: 'https://x.test/a.jpg', type: 'image', caption: 'Foto' }, { url: 'https://x.test/v.mp4', type: 'video', caption: '' }]
    for (const b of blocks) {
        if (b.type === 'testimonials') b.data.items = [{ quote: 'Ótimo', author: 'Bia', role: 'Recife' }]
        if (b.type === 'faq') b.data.items = [{ question: 'Prazo?', answer: '30 dias' }]
        if (b.type === 'team') b.data.members = [{ name: 'Ana', role: 'Gerente', bio: '' }]
    }
    return blocks
}

const baseCtx: PrintContext = {
    tk: THEMES.editorial,
    clientName: 'Grupo Atlântico',
    packages: [pkg as never],
    placeholders: { cliente: 'Grupo Atlântico', empresa: 'Norte Consultoria' },
    validUntil: new Date('2026-12-01T12:00:00Z'),
    proposalUrl: 'https://deal.test/p/x',
    selection: { packageId: 'p1', optionalIds: ['i2'] },
    removeBranding: false,
}

describe('PDF da proposta', () => {
    it('renderiza todos os tipos de bloco sem elementos interativos', () => {
        const html = renderToStaticMarkup(<PrintDocument blocks={allBlocks()} ctx={baseCtx} />)
        expect(html).not.toMatch(/<(button|input|select|textarea|video|iframe)\b/)
        expect(html).toContain('Prazo?') // FAQ aberto
        expect(html).toContain('30 dias')
        expect(html).toContain('Ótimo') // depoimentos listados
        expect(html).toContain('versão online') // vídeo vira aviso com link
        expect(html).toContain('Proposta para Grupo Atlântico') // placeholder trocado
        expect(html).toContain('Escolhido')
        expect(html).toContain('opcional incluído')
        expect(html.replace(/\u00a0/g, ' ')).toContain('R$ 1.500,00') // 10 × 100 + 500 do opcional
        expect(html).toContain('Feito com Lumen Deal')
    })

    it('comprovante de aceite: público só com nome; painel com e-mail e IP', () => {
        const acceptance = {
            enabled: true, state: 'ACCEPTED' as const, expiresAt: '2026-12-01T00:00:00Z', acceptedAt: '2026-10-07T15:00:00Z', acceptedBy: 'Roberto Lima',
            accepted: { packageId: 'p1', optionalIds: ['i2'], packageName: 'Completo', optionals: ['Workshop'], totalCents: 150000, contentHash: 'a'.repeat(64) },
        }
        const pub = renderToStaticMarkup(<PrintDocument blocks={allBlocks()} ctx={{ ...baseCtx, acceptance }} />)
        expect(pub).toContain('Comprovante de aceite')
        expect(pub).toContain('Roberto Lima')
        expect(pub).toContain('a'.repeat(64))
        expect(pub).not.toContain('Endereço IP')

        const evidence = { id: 'r1', type: 'ACCEPTED' as const, signerName: 'Roberto Lima', signerEmail: 'roberto@x.com', signerDocument: '12.345.678/0001-90', ip: '200.1.2.3', userAgent: 'Chrome', contentHash: 'a'.repeat(64), createdAt: '2026-10-07T15:00:00Z' }
        const panel = renderToStaticMarkup(<PrintDocument blocks={allBlocks()} ctx={{ ...baseCtx, acceptance, acceptedEvidence: evidence, removeBranding: true }} />)
        expect(panel).toContain('roberto@x.com')
        expect(panel).toContain('200.1.2.3')
        expect(panel).toContain('12.345.678/0001-90')
        expect(panel).not.toContain('Feito com Lumen Deal')
    })

    it('monta o link do PDF com a escolha do cliente', () => {
        expect(printUrl('meu slug', { packageId: 'p1', optionalIds: ['a', 'b'] })).toBe('/p/meu%20slug/print?pkg=p1&opt=a%2Cb&auto=1')
        expect(printUrl('x', null, false)).toBe('/p/x/print')
    })
})
