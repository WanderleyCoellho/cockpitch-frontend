import type { Proposal } from '../../shared/types'
import { proposalFunnel } from '../../shared/proposalMetrics'
import { BarChart3, CircleCheckBig, Eye, MessageSquareText, Send, Gauge } from 'lucide-react'

type Props = {
    proposals: Proposal[]
    providersCount: number
}

type MetricCard = {
    label: string
    value: string | number
    subtext?: string
    icon: React.ComponentType<{ className?: string }>
    variant: 'default' | 'success' | 'warning' | 'info'
}

const VARIANT_STYLES: Record<MetricCard['variant'], string> = {
    default: 'border-white/10 bg-white/2',
    success: 'border-emerald-500/30 bg-emerald-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
}

export default function DashboardMetrics({ proposals, providersCount }: Props) {
    const m = proposalFunnel(proposals)
    void providersCount

    const cards: MetricCard[] = [
        {
            label: 'Propostas enviadas',
            value: m.sent,
            // Só conta quando há sinal de envio: link copiado, aberta pelo cliente ou já respondida.
            subtext: m.drafts ? `${m.drafts} ainda sem envio` : 'Link copiado ou aberto pelo cliente',
            icon: Send,
            variant: 'default',
        },
        {
            label: 'Abertas pelo cliente',
            value: m.opened,
            subtext: m.sent ? `${m.openRate}% das enviadas` : 'Nenhuma enviada ainda',
            icon: Eye,
            variant: m.openRate >= 50 ? 'info' : 'default',
        },
        {
            label: 'Taxa de conversão',
            value: `${m.conversionRate}%`,
            subtext: `${m.accepted} aceitas de ${m.sent} enviadas`,
            icon: Gauge,
            variant: m.conversionRate >= 30 ? 'success' : m.conversionRate >= 10 ? 'warning' : 'default',
        },
        {
            label: 'Em negociação',
            value: m.negotiating,
            subtext: 'Aguardando decisão',
            icon: MessageSquareText,
            variant: m.negotiating > 0 ? 'warning' : 'default',
        },
        {
            label: 'Taxa de resposta',
            value: `${m.responseRate}%`,
            subtext: `${m.sent - m.responded} enviadas sem resposta`,
            icon: BarChart3,
            variant: m.responseRate >= 50 ? 'info' : 'default',
        },
        {
            label: 'Propostas aceitas',
            value: m.accepted,
            subtext: 'Convertidas com sucesso',
            icon: CircleCheckBig,
            variant: 'success',
        },
    ]

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Métricas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className={`p-5 border rounded-2xl ${VARIANT_STYLES[card.variant]}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/45 truncate">{card.label}</p>
                                <p className="text-2xl font-semibold text-white mt-1">{card.value}</p>
                                {card.subtext && (
                                    <p className="text-xs text-white/40 mt-0.5">{card.subtext}</p>
                                )}
                            </div>
                            <div className="ml-3 rounded-xl border border-white/10 bg-black/10 p-2">
                                <card.icon className="w-4 h-4 text-white/70" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mini funil de conversão */}
            {m.sent > 0 && (
                <div className="p-5 bg-white/2 border border-white/10 rounded-2xl">
                    <h3 className="text-sm font-medium text-white mb-3">Funil Comercial</h3>
                    <div className="space-y-2">
                        {[
                            { label: 'Enviadas', count: m.sent, color: 'bg-white/40' },
                            { label: 'Abertas', count: m.opened, color: 'bg-[#C9A84C]' },
                            { label: 'Com resposta', count: m.responded, color: 'bg-blue-400' },
                            { label: 'Negociando', count: m.negotiating, color: 'bg-amber-400' },
                            { label: 'Aceitas', count: m.accepted, color: 'bg-emerald-500' },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center gap-3">
                                <span className="text-xs text-white/45 w-28 shrink-0">{label}</span>
                                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${color} transition-all`}
                                        style={{ width: m.sent > 0 ? `${(count / m.sent) * 100}%` : '0%' }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-white/75 w-6 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
