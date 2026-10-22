import { describe, expect, it } from 'vitest'
import { proposalFunnel, wasSent } from '../proposalMetrics'
import type { Proposal } from '../types'

const p = (extra: Partial<Proposal>): Proposal => ({ id: Math.random().toString(), providerId: 'x', clientName: 'C', slug: 's', ...extra }) as Proposal

describe('propostas enviadas', () => {
    it('rascunho não conta; link copiado, aberta ou respondida conta', () => {
        expect(wasSent(p({}))).toBe(false)
        expect(wasSent(p({ commercialStatus: 'sem_resposta' }))).toBe(false)
        expect(wasSent(p({ sharedAt: '2026-10-08T00:00:00Z' }))).toBe(true)
        expect(wasSent(p({ views: [{ id: 'v' }] }))).toBe(true)
        expect(wasSent(p({ commercialStatus: 'negociando' }))).toBe(true)
    })

    it('conversão e resposta são calculadas sobre as enviadas', () => {
        const m = proposalFunnel([
            p({}),
            p({}),
            p({ sharedAt: 'x' }),
            p({ views: [{ id: '1' }], commercialStatus: 'aceita' }),
        ])
        expect(m).toMatchObject({ total: 4, drafts: 2, sent: 2, opened: 1, accepted: 1, responded: 1, conversionRate: 50, responseRate: 50, openRate: 50 })
    })
})
