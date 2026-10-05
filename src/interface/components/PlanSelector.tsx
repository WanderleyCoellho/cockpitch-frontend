import { useState } from 'react'
import { X, AlertTriangle, Loader2, Check } from 'lucide-react'
import { PLANS, PUBLIC_PLAN_IDS, type PlanId } from '../../shared/plans'
import { usePlan } from '../context/PlanContext'
import { httpGateway } from '../../infra/gateway/HttpGateway'

export default function PlanSelector({ onClose }: { onClose: () => void }) {
    const { currentPlan } = usePlan()
    const [loading, setLoading] = useState<PlanId | null>(null)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const isCourtesy = currentPlan.id === 'courtesy'

    const handleSelectPlan = async (planId: PlanId) => {
        const plan = PLANS[planId]

        // Plano grátis/cortesia não passa pelo checkout. (Cancelamento/downgrade: portal do Stripe — próxima fase.)
        if (!plan.checkoutTier) {
            onClose()
            return
        }

        setLoading(planId)
        setCheckoutError(null)
        try {
            const { url } = await httpGateway.createStripeCheckout(plan.checkoutTier)
            if (!url) throw new Error('Não foi possível abrir o checkout. Tente novamente.')
            window.location.assign(url)
        } catch (err) {
            console.error('Stripe error:', err)
            const message = err instanceof Error ? err.message : null
            setCheckoutError(message || 'Erro ao iniciar checkout. Tente novamente.')
            setLoading(null)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-5xl bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-y-auto text-white">
                {/* Header */}
                <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Escolha seu Plano</h2>
                        <p className="text-white/40 text-sm mt-1">
                            Plano atual: <span className="font-medium text-white">{currentPlan.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isCourtesy && (
                        <div className="mb-5 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 px-4 py-3 text-sm text-[#f3ddb0]">
                            Sua conta está com acesso de cortesia liberado pelo painel administrativo e recebe todos os recursos do Pro.
                        </div>
                    )}

                    {checkoutError && (
                        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {checkoutError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {PUBLIC_PLAN_IDS.map((planId) => {
                            const plan = PLANS[planId]
                            const isCurrentPlan = plan.id === currentPlan.id || (isCourtesy && plan.id === 'pro')
                            const isLoading = loading === plan.id

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 border rounded-2xl flex flex-col gap-4 ${plan.highlighted
                                        ? 'border-[#C9A84C] shadow-[0_0_0_1px_rgba(201,168,76,0.2)]'
                                        : 'border-white/10'
                                        } ${isCurrentPlan ? 'bg-[#C9A84C]/10' : 'bg-white/2'}`}
                                >
                                    {plan.highlighted && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#C9A84C] text-black text-xs font-semibold rounded-full">
                                            Mais Popular
                                        </div>
                                    )}

                                    {isCurrentPlan && (
                                        <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-3 py-0.5 bg-white/10 text-white text-xs font-semibold rounded-full">
                                            <Check className="w-3 h-3" /> Atual
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                        <div className="mt-2">
                                            {plan.price === 0 ? (
                                                <span className="text-3xl font-bold text-white">Grátis</span>
                                            ) : (
                                                <div>
                                                    <span className="text-3xl font-semibold text-[#C9A84C]">
                                                        R$ {plan.price}
                                                    </span>
                                                    <span className="text-white/45 text-sm">/mês</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-2 flex-1">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                                                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isCurrentPlan || isLoading}
                                        className={`w-full py-2.5 rounded-full font-semibold text-sm transition ${isCurrentPlan
                                            ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                            : plan.highlighted
                                                ? 'bg-[#C9A84C] text-black hover:bg-[#d8b65a]'
                                                : 'bg-white/10 text-white hover:bg-white/15'
                                            } disabled:opacity-60`}
                                    >
                                        {isLoading
                                            ? 'Aguarde...'
                                            : isCurrentPlan
                                                ? isCourtesy && plan.id === 'pro'
                                                    ? 'Incluso na Cortesia'
                                                    : 'Plano Atual'
                                                : plan.price === 0
                                                    ? 'Usar Gratuitamente'
                                                    : 'Assinar Agora'}
                                    </button>
                                    {isLoading && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-white/40 -mt-1">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecionando para checkout
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <p className="text-xs text-white/40 text-center mt-6">
                        Cancele a qualquer momento. Sem taxa de cancelamento.
                    </p>
                </div>
            </div>
        </div>
    )
}
