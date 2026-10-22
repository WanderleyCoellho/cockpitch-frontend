import { Link } from 'react-router-dom'
import { Check, ChevronRight, PartyPopper, X } from 'lucide-react'
import type { OnboardingStepKey } from '../../../shared/types'
import { useOnboarding } from '../../hooks/useOnboarding'

const STEPS: Record<OnboardingStepKey, { title: string; hint: string; cta?: string; to?: string }> = {
    profile: { title: 'Complete o perfil da empresa', hint: 'WhatsApp ou Instagram e uma descrição curta (ou o logo).', cta: 'Editar perfil' },
    package: { title: 'Crie seu primeiro pacote', hint: 'O que você vende, com itens, opcionais e preço calculado.', cta: 'Criar pacote', to: '/packages' },
    proposal: { title: 'Monte uma proposta', hint: 'Escolha um modelo do seu segmento e ajuste os blocos.', cta: 'Nova proposta', to: '/proposals?nova=1' },
    shared: { title: 'Envie o link para um cliente', hint: 'Copie o link ou mande pelo WhatsApp direto da lista de propostas.', cta: 'Ver propostas', to: '/proposals' },
    viewed: { title: 'Receba a primeira visualização', hint: 'Avisamos por e-mail quando o cliente abrir a proposta.' },
}

/** Checklist de primeiros passos no Dashboard, com o progresso calculado no servidor. */
export default function OnboardingChecklist({ onEditProfile }: { onEditProfile?: () => void }) {
    const { status, update } = useOnboarding()
    if (!status || status.dismissed) return null
    const allDone = status.completed === status.total
    const nextKey = status.steps.find((s) => !s.done)?.key

    return (
        <section data-tour="checklist" className="rounded-2xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.05] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        {allDone ? <><PartyPopper className="w-4 h-4 text-[#C9A84C]" /> Tudo pronto!</> : 'Primeiros passos'}
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                        {allDone ? 'Você já usou o essencial do Lumen Deal. Pode ocultar esta lista.' : `${status.completed} de ${status.total} concluídos. Os itens se marcam sozinhos.`}
                    </p>
                </div>
                <button type="button" onClick={() => update({ dismissedChecklist: true })} className="text-white/35 hover:text-white p-1" aria-label="Ocultar primeiros passos" title="Ocultar">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={status.completed} aria-valuemin={0} aria-valuemax={status.total}>
                <div className="h-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${(status.completed / status.total) * 100}%` }} />
            </div>
            <ol className="mt-4 space-y-1.5">
                {status.steps.map(({ key, done }) => {
                    const meta = STEPS[key]
                    const isNext = key === nextKey
                    const action = !done && meta.cta && (key === 'profile' && onEditProfile
                        ? <button type="button" onClick={onEditProfile} className="action">{meta.cta}</button>
                        : meta.to ? <Link to={meta.to} className="action">{meta.cta}</Link> : null)
                    return (
                        <li key={key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isNext ? 'bg-white/[0.04] border border-white/10' : ''}`}>
                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${done ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/20 text-white/30'}`}>
                                {done ? <Check className="w-3.5 h-3.5" /> : null}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm ${done ? 'text-white/40 line-through' : 'text-white/90'}`}>{meta.title}</p>
                                {!done && isNext && <p className="text-xs text-white/45">{meta.hint}</p>}
                            </div>
                            {action && (
                                <span className="[&_.action]:inline-flex [&_.action]:items-center [&_.action]:gap-1 [&_.action]:text-xs [&_.action]:font-semibold [&_.action]:text-[#C9A84C] [&_.action:hover]:underline">
                                    {action}
                                </span>
                            )}
                            {action && <ChevronRight className="w-3.5 h-3.5 text-[#C9A84C]/60 -ml-2" aria-hidden />}
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}
