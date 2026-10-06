// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { BLOCK_META, BLOCK_TYPES, createBlock, duplicateBlock, fillPlaceholders, fillPlaceholdersHtml, isKnownBlock, legacyProposalToBlocks, newBlockId } from '../blocks'
import { visibleBlocks } from '../../interface/components/proposal/blocks/BlockRenderer'
import type { Proposal, Provider } from '../types'

describe('blocos da proposta', () => {
    it('troca placeholders em texto e escapa o valor dentro de HTML', () => {
        const ctx = { cliente: 'Ana <script>', empresa: 'Lumen' }
        expect(fillPlaceholders('Olá {cliente}, aqui é a {empresa}', ctx)).toBe('Olá Ana <script>, aqui é a Lumen')
        expect(fillPlaceholdersHtml('<p>{cliente}</p>', ctx)).toBe('<p>Ana &lt;script&gt;</p>')
        expect(fillPlaceholders('{outro}', ctx)).toBe('{outro}')
    })

    it('gera ids únicos e válidos para o backend', () => {
        const existing = [{ id: 'faq' }, { id: 'faq-2' }]
        expect(newBlockId('faq', existing)).toBe('faq-3')
        expect(newBlockId('scope', existing)).toBe('scope')
        const copy = duplicateBlock(createBlock('faq', []), existing)
        expect(copy.id).toBe('faq-3')
        for (const type of BLOCK_TYPES) expect(createBlock(type, []).id).toMatch(/^[a-zA-Z0-9_-]{1,40}$/)
    })

    it('todo tipo tem rótulo e ajuda (para o editor)', () => {
        for (const type of BLOCK_TYPES) {
            expect(BLOCK_META[type].label.length).toBeGreaterThan(2)
            expect(BLOCK_META[type].help.length).toBeGreaterThan(10)
        }
    })

    it('renderer ignora tipos desconhecidos e blocos ocultos', () => {
        const blocks = [
            { id: 'a', type: 'cover', visible: true, title: '', data: { headline: 'x' } },
            { id: 'b', type: 'carrossel-3d', visible: true, data: {} },
            { id: 'c', type: 'faq', visible: false, title: '', data: { items: [] } },
            null,
        ]
        expect(isKnownBlock(blocks[1])).toBe(false)
        expect(visibleBlocks(blocks).map((b) => b.id)).toEqual(['a'])
        expect(visibleBlocks(null)).toEqual([])
    })

    it('converte proposta legada usando só mídias da própria plataforma', () => {
        const provider = {
            name: 'Estúdio',
            aboutText: 'Primeiro parágrafo.\n\nSegundo <b>parágrafo</b>.',
            testimonials: [{ quote: 'Incrível', author: 'Bia', city: 'Recife' }],
            deliveryTimes: 'Fotos em 30 dias',
        } as unknown as Provider
        const proposal = {
            clientName: 'Ana',
            heroVideoUrl: 'https://youtube.com/watch?v=abc',
            weddingPhotoUrl: 'https://api.exemplo.com/media/public/media/2026/10/capa.jpg',
            backstageMedia: [
                { url: 'https://api.exemplo.com/media/public/media/2026/10/a.mp4', type: 'video' },
                { url: 'https://instagram.com/p/x', type: 'image' },
            ],
        } as unknown as Proposal

        const blocks = legacyProposalToBlocks(proposal, provider)
        expect(blocks.map((b) => b.type)).toEqual(['cover', 'about', 'gallery', 'pricing', 'testimonials', 'terms', 'acceptance', 'contact'])
        const cover = blocks[0] as Extract<typeof blocks[number], { type: 'cover' }>
        expect(cover.data.mediaUrl).toContain('/media/public/')
        const gallery = blocks[2] as Extract<typeof blocks[number], { type: 'gallery' }>
        expect(gallery.data.items).toEqual([{ url: 'https://api.exemplo.com/media/public/media/2026/10/a.mp4', type: 'video', caption: '' }])
        const about = blocks[1] as Extract<typeof blocks[number], { type: 'about' }>
        expect(about.data.body).toBe('<p>Primeiro parágrafo.</p><p>Segundo &lt;b&gt;parágrafo&lt;/b&gt;.</p>')
        expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length)
    })
})
