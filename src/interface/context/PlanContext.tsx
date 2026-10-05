import { createContext, useContext, type ReactNode } from 'react'
import { PLANS, type PlanId, type Plan } from '../../shared/plans'
import { useAuth } from './AuthContext'

type PlanContextValue = {
    currentPlan: Plan
    canCreateProposal: (currentCount: number) => boolean
    canAddProvider: (currentCount: number) => boolean
    isAtLimit: (resource: 'proposals' | 'providers', currentCount: number) => boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()

    // O plano vem SEMPRE do servidor (Stripe webhook / painel Ops). Nada de estado local editável.
    const backendPlanId: PlanId | null = (() => {
        if (user?.licensePolicy === 'COURTESY') return 'courtesy'
        if (!user?.planTier) return null
        if (user.billingStatus && !['ACTIVE', 'PAST_DUE'].includes(user.billingStatus)) return 'free'

        switch (user.planTier) {
            case 'STARTER':
                return 'basic'
            case 'PRO':
                return 'pro'
            case 'AGENCY':
                return 'pro'
            case 'FREE':
            default:
                return 'free'
        }
    })()

    const currentPlan = PLANS[backendPlanId ?? 'free']

    const canCreateProposal = (currentCount: number) => {
        const limit = currentPlan.limits.proposalsPerMonth
        return limit === -1 || currentCount < limit
    }

    const canAddProvider = (currentCount: number) => {
        const limit = currentPlan.limits.providersMax
        return limit === -1 || currentCount < limit
    }

    const isAtLimit = (resource: 'proposals' | 'providers', currentCount: number) => {
        if (resource === 'proposals') return !canCreateProposal(currentCount)
        if (resource === 'providers') return !canAddProvider(currentCount)
        return false
    }

    return (
        <PlanContext.Provider value={{ currentPlan, canCreateProposal, canAddProvider, isAtLimit }}>
            {children}
        </PlanContext.Provider>
    )
}

export function usePlan() {
    const ctx = useContext(PlanContext)
    if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
    return ctx
}
