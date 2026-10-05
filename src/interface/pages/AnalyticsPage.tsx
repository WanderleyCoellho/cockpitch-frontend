import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import DashboardMetrics from '../components/DashboardMetrics'
import PlanSelector from '../components/PlanSelector'
import { usePlan } from '../context/PlanContext'
import { ChartSpline, Lock, Sparkles, BarChart3, ArrowRight } from 'lucide-react'

export default function AnalyticsPage() {
    const { user, refreshUser } = useAuth()
    const { currentPlan } = usePlan()
    const [showPlanSelector, setShowPlanSelector] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const checkoutResult = searchParams.get('checkout')

    // Volta do Stripe: o webhook pode chegar alguns segundos depois, então recarrega o plano algumas vezes.
    useEffect(() => {
        if (checkoutResult !== 'success') return
        let attempts = 0
        refreshUser()
        const timer = window.setInterval(() => {
            attempts += 1
            refreshUser()
            if (attempts >= 5) window.clearInterval(timer)
        }, 3000)
        return () => window.clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkoutResult])

    const dismissCheckoutNotice = () => {
        searchParams.delete('checkout')
        setSearchParams(searchParams, { replace: true })
    }
    const canUpgradePlan = currentPlan.id === 'free' || currentPlan.id === 'basic'
    const isCourtesy = currentPlan.id === 'courtesy'

    const { data: provider } = useQuery({
        queryKey: ['provider-current'],
        queryFn: async () => {
            const providers = await httpGateway.listProviders()
            if (!providers?.length) return null
            return providers.find((p: any) => p.id === user?.providerId) ?? providers[0]
        },
    })

    const { data: proposals = [] } = useQuery({
        queryKey: ['proposals-analytics', provider?.id],
        queryFn: () => (provider ? httpGateway.listProposals(provider.id) : Promise.resolve([])),
        enabled: !!provider,
    })

    const { data: providers = [] } = useQuery({
        queryKey: ['providers'],
        queryFn: () => httpGateway.listProviders(),
    })

    const canViewAnalytics = currentPlan.limits.analytics
    const accepted = proposals.filter((proposal: any) => proposal.commercialStatus === 'aceita').length
    const negotiating = proposals.filter((proposal: any) => proposal.commercialStatus === 'negociando').length
    const conversionRate = proposals.length ? Math.round((accepted / proposals.length) * 100) : 0

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
            {checkoutResult && (
                <div
                    role="status"
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
                        checkoutResult === 'success'
                            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-white/70'
                    }`}
                >
                    <span>
                        {checkoutResult === 'success'
                            ? 'Pagamento confirmado! Seu plano é atualizado em alguns segundos.'
                            : 'Checkout cancelado. Nenhuma cobrança foi feita.'}
                    </span>
                    <button type="button" onClick={dismissCheckoutNotice} className="text-xs underline underline-offset-2">
                        Fechar
                    </button>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] font-semibold tracking-[0.24em] uppercase mb-3">
                        <ChartSpline className="w-3.5 h-3.5" /> Intelligence
                    </div>
                    <h1 className="text-2xl md:text-3xl font-light text-white">Analytics</h1>
                    <p className="text-white/40 mt-1">Acompanhe sua taxa de conversão e suas métricas comerciais.</p>
                </div>
                <button
                    onClick={() => setShowPlanSelector(true)}
                    className="px-4 py-2.5 bg-white/5 text-white/80 rounded-xl font-medium hover:bg-white/10 transition"
                >
                    Plano: {currentPlan.name}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <BarChart3 className="w-4 h-4 text-[#C9A84C] mb-3" />
                    <p className="text-2xl font-light text-white">{proposals.length}</p>
                    <p className="text-xs text-white/40 mt-1">Propostas mapeadas</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <Sparkles className="w-4 h-4 text-emerald-400 mb-3" />
                    <p className="text-2xl font-light text-white">{accepted}</p>
                    <p className="text-xs text-white/40 mt-1">Aceitas</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <ChartSpline className="w-4 h-4 text-amber-400 mb-3" />
                    <p className="text-2xl font-light text-white">{negotiating}</p>
                    <p className="text-xs text-white/40 mt-1">Negociando</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <BarChart3 className="w-4 h-4 text-blue-400 mb-3" />
                    <p className="text-2xl font-light text-white">{conversionRate}%</p>
                    <p className="text-xs text-white/40 mt-1">Conversão atual</p>
                </div>
            </div>

            {showPlanSelector && <PlanSelector onClose={() => setShowPlanSelector(false)} />}

            {/* Analytics bloqueado para Free */}
            {!canViewAnalytics ? (
                <div className="relative overflow-hidden text-center py-16 bg-white/2 border border-white/10 rounded-3xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.14),transparent_45%)]" />
                    <div className="relative z-10 max-w-xl mx-auto px-6">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Analytics disponível a partir do Básico</h2>
                        <p className="text-white/40 mb-6 max-w-md mx-auto">
                            Faça upgrade para visualizar taxa de conversão, funil comercial e métricas de performance das propostas.
                        </p>
                        <button
                            onClick={() => setShowPlanSelector(true)}
                            className="px-6 py-3 bg-[#C9A84C] text-black rounded-full font-semibold hover:bg-[#d8b65a] transition-colors inline-flex items-center gap-2"
                        >
                            Ver planos <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <DashboardMetrics proposals={proposals} providersCount={providers.length} />
            )}

            {/* Planos disponíveis */}
            <div className="space-y-4 border-t border-white/10 pt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Seu Plano</h2>
                    <button
                        onClick={() => setShowPlanSelector(true)}
                        className="text-sm text-[#C9A84C] hover:text-[#d8b65a] inline-flex items-center gap-1.5"
                    >
                        Ver todos os planos <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="p-6 bg-white/2 border border-[#C9A84C]/30 rounded-2xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{currentPlan.name}</h3>
                            <p className="text-2xl font-semibold text-[#C9A84C] mt-1">
                                {isCourtesy
                                    ? 'Concedido via administração'
                                    : currentPlan.price === 0
                                        ? 'Grátis'
                                        : `R$ ${currentPlan.price}/mês`}
                            </p>
                            {isCourtesy && user?.licensePolicyNote && (
                                <p className="mt-2 text-sm text-white/45">{user.licensePolicyNote}</p>
                            )}
                        </div>
                        {canUpgradePlan && (
                            <button
                                onClick={() => setShowPlanSelector(true)}
                                className="px-4 py-2 bg-[#C9A84C] text-black rounded-full font-semibold text-sm hover:bg-[#d8b65a] transition-colors"
                            >
                                Fazer Upgrade
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                        <div>
                            <p className="text-xs text-white/45">Propostas/mês</p>
                            <p className="font-semibold text-white mt-0.5">
                                {currentPlan.limits.proposalsPerMonth === -1
                                    ? 'Ilimitado'
                                    : `${proposals.length} / ${currentPlan.limits.proposalsPerMonth}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-white/45">Prestadores</p>
                            <p className="font-semibold text-white mt-0.5">
                                {currentPlan.limits.providersMax === -1
                                    ? 'Ilimitado'
                                    : `${providers.length} / ${currentPlan.limits.providersMax}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-white/45">Analytics</p>
                            <p className="font-semibold text-white mt-0.5">
                                {currentPlan.limits.analytics ? 'Ativo' : 'Indisponível'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
