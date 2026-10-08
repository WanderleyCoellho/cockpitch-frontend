/**
 * Vitrine dos planos do Lumen Deal (nomes, preços e textos).
 * Os LIMITES reais vêm do servidor (`entitlements` do workspace); os números aqui são só para exibição.
 */
import type { PlanTier } from './types'

export type PlanId = 'free' | 'basic' | 'pro' | 'team' | 'courtesy'

export type Plan = {
    id: PlanId
    name: string
    price: number // BRL/mês
    tier: PlanTier
    /** Plano assinável pelo checkout (o preço do Stripe é resolvido no servidor via STRIPE_PRICE_*). */
    checkoutTier: 'STARTER' | 'PRO' | 'AGENCY' | null
    tagline: string
    limits: {
        proposalsPerMonth: number // -1 = ilimitado
        members: number
        storageGb: number
        analytics: boolean
    }
    features: string[]
    highlighted: boolean
}

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Grátis',
        price: 0,
        tier: 'FREE',
        checkoutTier: null,
        tagline: 'Para experimentar',
        limits: { proposalsPerMonth: 3, members: 1, storageGb: 0.5, analytics: false },
        features: ['3 propostas por mês', '1 usuário', '500 MB de arquivos', 'Aceite online, PDF e avisos por e-mail', 'Marca "Feito com Lumen Deal"'],
        highlighted: false,
    },
    basic: {
        id: 'basic',
        name: 'Essencial',
        price: 49,
        tier: 'STARTER',
        checkoutTier: 'STARTER',
        tagline: 'Para profissionais autônomos',
        limits: { proposalsPerMonth: 30, members: 1, storageGb: 5, analytics: true },
        features: ['30 propostas por mês', '1 usuário', '5 GB de arquivos', 'Sem a marca Lumen Deal', 'Analytics de visualização', 'Tudo do Grátis'],
        highlighted: false,
    },
    pro: {
        id: 'pro',
        name: 'Profissional',
        price: 99,
        tier: 'PRO',
        checkoutTier: 'PRO',
        tagline: 'Para pequenas empresas',
        limits: { proposalsPerMonth: -1, members: 3, storageGb: 20, analytics: true },
        features: ['Propostas ilimitadas', 'Até 3 pessoas na equipe', '20 GB de arquivos', 'Link personalizado (/p/seu-link)', 'Modelos próprios', 'Tudo do Essencial'],
        highlighted: true,
    },
    team: {
        id: 'team',
        name: 'Equipe',
        price: 249,
        tier: 'AGENCY',
        checkoutTier: 'AGENCY',
        tagline: 'Para times comerciais',
        limits: { proposalsPerMonth: -1, members: 10, storageGb: 100, analytics: true },
        features: ['Propostas ilimitadas', 'Até 10 pessoas na equipe', '100 GB de arquivos', 'Papéis e permissões', 'Suporte prioritário', 'Tudo do Profissional'],
        highlighted: false,
    },
    courtesy: {
        id: 'courtesy',
        name: 'Cortesia',
        price: 0,
        tier: 'PRO',
        checkoutTier: null,
        tagline: 'Concedido pela Lumen Dev Studios',
        limits: { proposalsPerMonth: -1, members: 3, storageGb: 20, analytics: true },
        features: ['Recursos do Profissional', 'Concedido via painel administrativo'],
        highlighted: false,
    },
}

export const PUBLIC_PLAN_IDS: PlanId[] = ['free', 'basic', 'pro', 'team']

export function planIdForTier(tier: PlanTier | undefined | null): PlanId {
    switch (tier) {
        case 'STARTER':
            return 'basic'
        case 'PRO':
            return 'pro'
        case 'AGENCY':
            return 'team'
        default:
            return 'free'
    }
}
