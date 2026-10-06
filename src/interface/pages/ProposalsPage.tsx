import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import ProposalForm from '../components/ProposalForm'
import { RESPONSE_LABEL } from '../components/proposal/ResponsesPanel'
import StatusWorkflow from '../components/StatusWorkflow'
import { usePlan } from '../context/PlanContext'
import type { Proposal } from '../../shared/types'
import { Link2, Pencil, PlusCircle, Clock3, ExternalLink, Check } from 'lucide-react'

const STATUS_SURFACE: Record<NonNullable<Proposal['commercialStatus']>, string> = {
    sem_resposta: 'border-white/10 hover:border-white/20',
    negociando: 'border-amber-500/20 hover:border-amber-400/35',
    aceita: 'border-emerald-500/20 hover:border-emerald-400/35',
    negada: 'border-red-500/20 hover:border-red-400/35',
    personalizado: 'border-[#C9A84C]/20 hover:border-[#C9A84C]/35',
}

export default function ProposalsPage() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const { currentPlan, canCreateProposal, refreshUsage } = usePlan()
    const [showForm, setShowForm] = useState(false)
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

    // Fetch provider do usuário
    const { data: provider } = useQuery({
        queryKey: ['provider-current'],
        queryFn: async () => {
            const providers = await httpGateway.listProviders()
            if (!providers?.length) return null
            return providers.find((p: any) => p.id === user?.providerId) ?? providers[0]
        },
    })

    // Fetch proposals do provider
    const { data: proposals = [], isLoading, refetch } = useQuery({
        queryKey: ['proposals', provider?.id],
        queryFn: () => (provider ? httpGateway.listProposals(provider.id) : Promise.resolve([])),
        enabled: !!provider,
    })

    const handleCreateNew = () => {
        setSelectedProposal(null)
        setShowForm(true)
    }

    const handleEdit = (proposal: Proposal) => {
        setSelectedProposal(proposal)
        setShowForm(true)
    }

    const handleCloseForm = () => {
        setShowForm(false)
        setSelectedProposal(null)
        refetch()
    }

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/p/${slug}`
        navigator.clipboard.writeText(url)
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug(null), 2000)
    }

    const openProposal = (slug: string) => {
        window.open(`${window.location.origin}/p/${slug}`, '_blank')
    }

    const statusMutation = useMutation({
        mutationFn: ({ proposalId, status }: { proposalId: string; status: Proposal['commercialStatus'] }) =>
            httpGateway.updateCommercialStatus(proposalId, status!),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals'] }),
    })

    const handleStatusUpdate = (proposalId: string, status: Proposal['commercialStatus']) => {
        statusMutation.mutate({ proposalId, status })
    }

    const atProposalLimit = !canCreateProposal()

    if (!provider) {
        return (
            <div className="p-8 text-center">
                <p className="text-white/40">Crie um prestador para começar a fazer propostas.</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <p className="text-white/40">Carregando...</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-light text-white">Propostas</h1>
                    <p className="text-white/40 mt-1 text-sm">Gerencie e publique suas propostas comerciais</p>
                </div>
                <div className="flex items-center gap-3">
                    {atProposalLimit && (
                        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                            Limite do plano {currentPlan.name} atingido
                        </p>
                    )}
                    <button
                        onClick={handleCreateNew}
                        disabled={atProposalLimit}
                        className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" /> Nova Proposta
                    </button>
                </div>
            </div>

            {showForm && (
                <ProposalForm
                    proposal={selectedProposal}
                    providerId={provider.id}
                    onClose={handleCloseForm}
                    onSuccess={() => {
                        refetch()
                        refreshUsage()
                    }}
                />
            )}

            {!showForm && (
                <div className="space-y-4">
                    {proposals.length === 0 ? (
                        <div className="text-center py-12 bg-white/2 border border-white/10 rounded-2xl">
                            <p className="text-white/40 mb-4">Nenhuma proposta criada</p>
                            <button
                                onClick={handleCreateNew}
                                className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" /> Criar Primeira Proposta
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {proposals.map((proposal: Proposal) => {
                                const commercialStatus = proposal.commercialStatus ?? 'sem_resposta'
                                const surfaceClass = STATUS_SURFACE[commercialStatus]

                                return (
                                    <div
                                        key={proposal.id}
                                        className={`p-4 bg-white/2 border rounded-2xl space-y-3 transition-colors ${surfaceClass}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-white">{proposal.clientName}</h3>
                                                    {proposal.theme && (
                                                        <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                                                            {proposal.theme.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                    {proposal.lastResponse && (
                                                        <span
                                                            title={`${RESPONSE_LABEL[proposal.lastResponse.type]} por ${proposal.lastResponse.signerName} em ${new Date(proposal.lastResponse.createdAt).toLocaleString('pt-BR')}`}
                                                            className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${proposal.lastResponse.type === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : proposal.lastResponse.type === 'DECLINED' ? 'bg-red-500/10 text-red-300 border-red-500/25' : 'bg-amber-500/10 text-amber-200 border-amber-500/25'}`}
                                                        >
                                                            {RESPONSE_LABEL[proposal.lastResponse.type]} · {proposal.lastResponse.signerName.split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/30 mt-0.5 font-mono">{proposal.slug}</p>
                                                <p className="text-[11px] text-white/20 mt-1">
                                                    Criada em {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openProposal(proposal.slug)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/70 transition"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(proposal.slug)}
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition ${copiedSlug === proposal.slug ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                                                >
                                                    {copiedSlug === proposal.slug
                                                        ? <><Check className="w-3.5 h-3.5" /> Copiado</>
                                                        : <><Link2 className="w-3.5 h-3.5" /> Copiar Link</>
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(proposal)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[#C9A84C]/15 text-[#C9A84C] rounded-lg hover:bg-[#C9A84C]/25 transition"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                                </button>
                                            </div>
                                        </div>

                                        <StatusWorkflow
                                            proposalId={proposal.id}
                                            currentStatus={commercialStatus}
                                            onUpdate={handleStatusUpdate}
                                        />

                                        {proposal.serviceDate && (
                                            <p className="text-xs text-white/40 inline-flex items-center gap-1">
                                                <Clock3 className="w-3.5 h-3.5" />
                                                {new Date(proposal.serviceDate).toLocaleDateString('pt-BR')} - valida por {proposal.validityDays} dias
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
