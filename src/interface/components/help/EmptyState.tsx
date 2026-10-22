import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

/** Lista vazia que ensina o próximo passo (spec in-app-guidance). */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    article,
}: {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
    /** Slug do artigo da central de ajuda. */
    article?: string
}) {
    return (
        <div className="text-center py-12 px-6 bg-white/[0.02] border border-dashed border-white/12 rounded-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-white/45 max-w-md mx-auto leading-relaxed">{description}</p>
            {action && <div className="mt-5">{action}</div>}
            {article && (
                <Link to={`/ajuda/${article}`} className="mt-3 inline-block text-xs text-white/40 hover:text-[#C9A84C]">
                    Como funciona? Ver passo a passo →
                </Link>
            )}
        </div>
    )
}
