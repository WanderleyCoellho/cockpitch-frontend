/**
 * Definição dos planos do Cockpitch
 * Usada em PlanContext, PlanSelector e verificações de limite
 */

export type PlanId = 'free' | 'basic' | 'pro' | 'courtesy'

export type Plan = {
    id: PlanId
    name: string
    price: number          // BRL/mês
    stripePriceId: string  // Substituir pela chave real do Stripe
    limits: {
        proposalsPerMonth: number  // -1 = ilimitado
        providersMax: number
        customDomain: boolean
        analytics: boolean
        prioritySupport: boolean
    }
    features: string[]
    highlighted: boolean
}

const proLimits = {
    proposalsPerMonth: 100,
    providersMax: 10,
    customDomain: true,
    analytics: true,
    prioritySupport: false,
} as const

const proFeatures = [
    'Até 100 propostas/mês',
    '10 prestadores',
    'Analytics avançado',
    'Domínio customizado',
    'Suporte prioritário',
]

export const PLANS: Record<PlanId, Plan> = {
    free: {
        id: 'free',
        name: 'Grátis',
        price: 0,
        stripePriceId: '',
        limits: {
            proposalsPerMonth: 3,
            providersMax: 1,
            customDomain: false,
            analytics: false,
            prioritySupport: false,
        },
        features: ['Até 3 propostas/mês', '1 prestador', 'Página pública básica'],
        highlighted: false,
    },
    basic: {
        id: 'basic',
        name: 'Básico',
        price: 49,
        stripePriceId: 'price_starter_placeholder',
        limits: {
            proposalsPerMonth: 20,
            providersMax: 3,
            customDomain: false,
            analytics: true,
            prioritySupport: false,
        },
        features: ['Até 20 propostas/mês', '3 prestadores', 'Analytics básico', 'Suporte por email'],
        highlighted: false,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 99,
        stripePriceId: 'price_pro_placeholder',
        limits: proLimits,
        features: proFeatures,
        highlighted: true,
    },
    courtesy: {
        id: 'courtesy',
        name: 'Cortesia',
        price: 0,
        stripePriceId: '',
        limits: proLimits,
        features: [...proFeatures, 'Concedido via painel administrativo'],
        highlighted: false,
    },
}

export const PUBLIC_PLAN_IDS: PlanId[] = ['free', 'basic', 'pro']
