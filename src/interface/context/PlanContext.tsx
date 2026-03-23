import { createContext, useContext, useState, type ReactNode } from 'react'
import { PLANS, type PlanId, type Plan } from '../../shared/plans'
import { useAuth } from './AuthContext'

type PlanContextValue = {
    currentPlan: Plan
    setPlan: (planId: PlanId) => void
    canCreateProposal: (currentCount: number) => boolean
    canAddProvider: (currentCount: number) => boolean
    isAtLimit: (resource: 'proposals' | 'providers', currentCount: number) => boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

function normalizeStoredPlanId(savedPlanId: string | null): PlanId {
    switch (savedPlanId) {
        case 'starter':
        case 'basic':
            return 'basic'
        case 'pro':
        case 'agency':
            return 'pro'
        case 'courtesy':
            return 'courtesy'
        case 'free':
        default:
            return 'free'
    }
}

export function PlanProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()

    // Em produção virá do backend/Stripe webhook
    // Para MVP, usa localStorage como fallback
    const [planId, setPlanId] = useState<PlanId>(() => {
        return normalizeStoredPlanId(localStorage.getItem('cockpitch_plan'))
    })

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

    const currentPlan = PLANS[backendPlanId ?? planId]

    const setPlan = (id: PlanId) => {
        setPlanId(id)
        localStorage.setItem('cockpitch_plan', id)
    }

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
        <PlanContext.Provider value={{ currentPlan, setPlan, canCreateProposal, canAddProvider, isAtLimit }}>
            {children}
        </PlanContext.Provider>
    )
}

export function usePlan() {
    const ctx = useContext(PlanContext)
    if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
    return ctx
}
