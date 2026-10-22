import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Package } from '../../../../shared/types'

/** Pacote e opcionais que o cliente escolheu: compartilhado entre o bloco de preços e o de aceite. */
export type ProposalSelection = {
    selectedPackageId: string | null
    optionals: Record<string, string[]>
    choosePackage: (packageId: string) => void
    toggleOptional: (packageId: string, itemId: string) => void
}

export const SelectionContext = createContext<ProposalSelection | null>(null)

export function useProposalSelection() {
    return useContext(SelectionContext)
}

export function useSelectionState(packages: Pick<Package, 'id'>[]): ProposalSelection {
    // Com um único pacote, ele já vem escolhido.
    const [chosen, setChosen] = useState<string | null>(null)
    const [optionals, setOptionals] = useState<Record<string, string[]>>({})
    const selectedPackageId = chosen && packages.some((p) => p.id === chosen) ? chosen : packages.length === 1 ? packages[0].id : null

    const choosePackage = useCallback((packageId: string) => setChosen(packageId), [])
    const toggleOptional = useCallback((packageId: string, itemId: string) => {
        setOptionals((current) => {
            const list = current[packageId] ?? []
            return { ...current, [packageId]: list.includes(itemId) ? list.filter((id) => id !== itemId) : [...list, itemId] }
        })
        // Marcar um opcional é um sinal claro de interesse naquele pacote.
        setChosen(packageId)
    }, [])

    return useMemo(
        () => ({ selectedPackageId, optionals, choosePackage, toggleOptional }),
        [selectedPackageId, optionals, choosePackage, toggleOptional]
    )
}
