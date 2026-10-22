import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import type { OnboardingStatus } from '../../shared/types'
import { useAuth } from '../context/AuthContext'

type Patch = { linkShared?: true; dismissedChecklist?: boolean; tourSeen?: string; toursDisabled?: boolean; resetTours?: true }

/** Primeiros passos e tours da pessoa logada na empresa ativa. Falha ao salvar não trava nada (fica no estado local). */
export function useOnboarding() {
    const { activeWorkspace, isAuthenticated } = useAuth()
    const queryClient = useQueryClient()
    const queryKey = ['onboarding', activeWorkspace?.id]

    const query = useQuery({
        queryKey,
        queryFn: () => httpGateway.getOnboarding(),
        enabled: isAuthenticated && !!activeWorkspace,
        staleTime: 30_000,
    })

    const mutation = useMutation({
        mutationFn: (patch: Patch) => httpGateway.updateOnboarding(patch),
        onMutate: (patch) => {
            const previous = queryClient.getQueryData<OnboardingStatus>(queryKey)
            if (previous) {
                const toursSeen = patch.resetTours ? [] : previous.toursSeen
                queryClient.setQueryData<OnboardingStatus>(queryKey, {
                    ...previous,
                    dismissed: patch.dismissedChecklist ?? previous.dismissed,
                    toursDisabled: patch.toursDisabled ?? previous.toursDisabled,
                    toursSeen: patch.tourSeen && !toursSeen.includes(patch.tourSeen) ? [...toursSeen, patch.tourSeen] : toursSeen,
                    steps: patch.linkShared ? previous.steps.map((s) => (s.key === 'shared' ? { ...s, done: true } : s)) : previous.steps,
                })
            }
        },
        onSettled: (_data, _error, patch) => {
            // Mudanças que afetam os passos são confirmadas no servidor; as de tour ficam no estado local.
            if (patch.linkShared || patch.dismissedChecklist !== undefined) queryClient.invalidateQueries({ queryKey })
        },
    })

    return {
        status: query.data,
        isLoading: query.isLoading,
        update: (patch: Patch) => mutation.mutate(patch),
        refresh: () => queryClient.invalidateQueries({ queryKey }),
    }
}
