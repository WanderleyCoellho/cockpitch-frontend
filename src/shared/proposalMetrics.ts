import type { Proposal } from './types'

/**
 * Proposta "enviada" = há sinal de que chegou ao cliente: link copiado pelo painel, aberta pelo
 * cliente, ou já com resposta/negociação. Proposta só criada (rascunho) não conta.
 */
export function wasSent(p: Proposal) {
    const status = (p.commercialStatus ?? '').toLowerCase()
    return (
        !!p.sharedAt ||
        (p.views?.length ?? 0) > 0 ||
        !!p.lastResponse ||
        (status !== '' && status !== 'sem_resposta')
    )
}

export function proposalFunnel(proposals: Proposal[]) {
    const sent = proposals.filter(wasSent)
    const status = (p: Proposal) => (p.commercialStatus ?? '').toLowerCase()
    const opened = sent.filter((p) => (p.views?.length ?? 0) > 0).length
    const accepted = proposals.filter((p) => status(p) === 'aceita').length
    const negotiating = proposals.filter((p) => status(p) === 'negociando').length
    const denied = proposals.filter((p) => status(p) === 'negada').length
    const responded = sent.filter((p) => status(p) !== '' && status(p) !== 'sem_resposta').length
    return {
        total: proposals.length,
        drafts: proposals.length - sent.length,
        sent: sent.length,
        opened,
        responded,
        accepted,
        negotiating,
        denied,
        conversionRate: sent.length ? Math.round((accepted / sent.length) * 100) : 0,
        responseRate: sent.length ? Math.round((responded / sent.length) * 100) : 0,
        openRate: sent.length ? Math.round((opened / sent.length) * 100) : 0
    }
}
