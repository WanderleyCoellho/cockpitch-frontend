import { ChevronRight, Clock, MessageCircle, CheckCircle2, XCircle, Sparkles } from "lucide-react"
import type { Proposal } from "../../shared/types"

type CommercialStatus = NonNullable<Proposal["commercialStatus"]>

type StatusConfig = {
    label: string
    color: string
    bg: string
    border: string
    icon: React.ComponentType<{ className?: string }>
    next: CommercialStatus[]
}

const STATUS_CONFIG: Record<CommercialStatus, StatusConfig> = {
    sem_resposta: { label: "Sem resposta", color: "text-white/60", bg: "bg-white/5", border: "border-white/15", icon: Clock, next: ["negociando", "negada"] },
    negociando: { label: "Negociando", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/25", icon: MessageCircle, next: ["aceita", "negada"] },
    aceita: { label: "Aceita", color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/25", icon: CheckCircle2, next: [] },
    negada: { label: "Negada", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/25", icon: XCircle, next: ["negociando"] },
    personalizado: { label: "Personalizado", color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/25", icon: Sparkles, next: ["negociando", "aceita", "negada"] },
}

type Props = { proposalId: string; currentStatus: CommercialStatus; onUpdate: (proposalId: string, status: CommercialStatus) => void }

export default function StatusWorkflow({ proposalId, currentStatus, onUpdate }: Props) {
    const config = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG["sem_resposta"]
    const nextStatuses = config.next
    const Icon = config.icon
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.color} ${config.border}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
            {nextStatuses.length > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
            )}
            {nextStatuses.map((status) => {
                const next = STATUS_CONFIG[status]
                const NextIcon = next.icon
                return (
                    <button key={status} onClick={() => onUpdate(proposalId, status)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed opacity-50 hover:opacity-100 hover:border-solid transition-all ${next.bg} ${next.color} ${next.border}`}>
                        <NextIcon className="w-3.5 h-3.5" />
                        {next.label}
                    </button>
                )
            })}
        </div>
    )
}
