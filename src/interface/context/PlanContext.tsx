import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PLANS, planIdForTier, type Plan } from '../../shared/plans'
import type { Entitlements, WorkspaceDetails } from '../../shared/types'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from './AuthContext'

type PlanContextValue = {
    currentPlan: Plan
    /** Limites reais calculados pelo servidor para a empresa ativa. */
    entitlements: Entitlements | null
    usage: WorkspaceDetails['usage'] | null
    /** Só o dono assina ou troca de plano. */
    canManageBilling: boolean
    /** Situação da cobrança no Stripe (ACTIVE, PAST_DUE…). */
    billingStatus: 'INACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    /** Tem (ou teve) assinatura paga: o portal do Stripe está disponível. */
    hasSubscription: boolean
    canCreateProposal: () => boolean
    refreshUsage: () => void
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
    const { activeWorkspace, isAuthenticated } = useAuth()

    // Uso do mês (propostas, pessoas) da empresa ativa; o cache é descartado ao trocar de empresa.
    const { data: details, refetch } = useQuery({
        queryKey: ['workspace-current', activeWorkspace?.id],
        queryFn: () => httpGateway.getCurrentWorkspace(),
        enabled: isAuthenticated && !!activeWorkspace,
        staleTime: 30_000,
    })

    const entitlements = details?.entitlements ?? activeWorkspace?.entitlements ?? null
    const currentPlan = entitlements?.isCourtesy ? PLANS.courtesy : PLANS[planIdForTier(entitlements?.effectiveTier)]
    const usage = details?.usage ?? null
    const billingStatus = details?.billingStatus ?? activeWorkspace?.billingStatus ?? 'INACTIVE'
    const hasSubscription = !entitlements?.isCourtesy && (billingStatus === 'ACTIVE' || billingStatus === 'PAST_DUE')

    const canCreateProposal = () => {
        const limit = entitlements?.proposalsPerMonth ?? currentPlan.limits.proposalsPerMonth
        if (limit < 0) return true
        return (usage?.proposalsThisMonth ?? 0) < limit
    }

    return (
        <PlanContext.Provider
            value={{
                currentPlan,
                entitlements,
                usage,
                canManageBilling: activeWorkspace?.role === 'OWNER',
                billingStatus,
                hasSubscription,
                canCreateProposal,
                refreshUsage: () => void refetch(),
            }}
        >
            {children}
        </PlanContext.Provider>
    )
}

export function usePlan() {
    const ctx = useContext(PlanContext)
    if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
    return ctx
}
