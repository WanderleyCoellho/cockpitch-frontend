import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'
import HelpTip from './help/HelpTip'

type Prefs = { notifyOnOpen: boolean; notifyOnResponse: boolean }

const OPTIONS: Array<{ key: keyof Prefs; label: string; hint: string }> = [
    { key: 'notifyOnOpen', label: 'Cliente abriu a proposta', hint: 'Uma vez por proposta, na primeira abertura do link.' },
    { key: 'notifyOnResponse', label: 'Cliente respondeu', hint: 'Aceite, pedido de ajuste ou recusa, com os detalhes da escolha.' },
]

/** Avisos por e-mail da pessoa logada, na empresa ativa. */
export default function NotificationPreferences() {
    const { user, activeWorkspace } = useAuth()
    const queryClient = useQueryClient()
    const queryKey = ['notification-preferences', activeWorkspace?.id]
    const { data } = useQuery({ queryKey, queryFn: () => httpGateway.getNotificationPreferences(), enabled: !!activeWorkspace })
    const update = useMutation({
        mutationFn: (patch: Partial<Prefs>) => httpGateway.updateNotificationPreferences(patch),
        onMutate: async (patch) => {
            const previous = queryClient.getQueryData<Prefs>(queryKey)
            if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch })
            return { previous }
        },
        onError: (_err, _patch, context) => context?.previous && queryClient.setQueryData(queryKey, context.previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    })

    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#C9A84C]" />
                <h2 className="text-sm font-semibold text-white">Seus avisos por e-mail</h2>
                <HelpTip helpKey="team.notifications" />
            </div>
            <p className="text-xs text-white/40 -mt-2">Enviados para {user?.email}. Cada pessoa da equipe escolhe os seus.</p>
            <ul className="space-y-3">
                {OPTIONS.map((option) => (
                    <li key={option.key} className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-white/85">{option.label}</p>
                            <p className="text-xs text-white/40">{option.hint}</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data?.[option.key] ?? true}
                            aria-label={option.label}
                            disabled={!data || update.isPending}
                            onClick={() => data && update.mutate({ [option.key]: !data[option.key] })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${(data?.[option.key] ?? true) ? 'bg-[#C9A84C]' : 'bg-white/15'}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${(data?.[option.key] ?? true) ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
