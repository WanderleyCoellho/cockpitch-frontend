import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import ProviderForm from '../components/ProviderForm'
import { useState } from 'react'
import { Users, FileText, PlusCircle, MapPin, CheckCircle2, MessageCircle, Pencil } from 'lucide-react'

function ProviderAvatar({ photoUrl, name }: { photoUrl?: string; name: string }) {
    const [failed, setFailed] = useState(false)

    if (!photoUrl || failed) {
        return (
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/20" />
            </div>
        )
    }

    return (
        <img
            src={photoUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
            onError={() => setFailed(true)}
        />
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [selectedProvider, setSelectedProvider] = useState(null)

    // Fetch provider do usuário
    const { data: provider } = useQuery({
        queryKey: ['provider-current'],
        queryFn: async () => {
            const providers = await httpGateway.listProviders()
            if (!providers?.length) return null
            return providers.find((p: any) => p.id === user?.providerId) ?? providers[0]
        },
    })

    // Fetch providers e proposals
    const { data: providers = [], isLoading: providersLoading, refetch } = useQuery({
        queryKey: ['providers'],
        queryFn: () => httpGateway.listProviders(),
    })

    const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
        queryKey: ['proposals-dashboard', provider?.id],
        queryFn: () => (provider ? httpGateway.listProposals(provider.id) : Promise.resolve([])),
        enabled: !!provider,
    })

    const isLoading = providersLoading || proposalsLoading

    const handleCreateNew = () => {
        setSelectedProvider(null)
        setShowForm(true)
    }

    const handleEdit = (prov) => {
        setSelectedProvider(prov)
        setShowForm(true)
    }

    const handleCloseForm = () => {
        setShowForm(false)
        setSelectedProvider(null)
        refetch()
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
                    <h1 className="text-2xl font-light text-white">
                        Olá, <span className="font-semibold">{user?.name?.split(' ')[0] || 'bem-vindo'}</span>
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Gerencie seus prestadores e acompanhe seu pipeline</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Novo Prestador
                </button>
            </div>

            {/* Quick Stats */}
            {(() => {
                const accepted = proposals.filter((p: any) => p.commercialStatus === 'aceita').length
                const negotiating = proposals.filter((p: any) => p.commercialStatus === 'negociando').length
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-5">
                            <Users className="w-4 h-4 text-[#C9A84C] mb-3" />
                            <p className="text-2xl font-light text-white mb-1">{providers.length}</p>
                            <p className="text-xs text-white/40">Prestadores</p>
                        </div>
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-5">
                            <FileText className="w-4 h-4 text-blue-400 mb-3" />
                            <p className="text-2xl font-light text-white mb-1">{proposals.length}</p>
                            <p className="text-xs text-white/40">Propostas</p>
                        </div>
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-3" />
                            <p className="text-2xl font-light text-white mb-1">{accepted}</p>
                            <p className="text-xs text-white/40">Aceitas</p>
                        </div>
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-5">
                            <MessageCircle className="w-4 h-4 text-amber-400 mb-3" />
                            <p className="text-2xl font-light text-white mb-1">{negotiating}</p>
                            <p className="text-xs text-white/40">Negociando</p>
                        </div>
                    </div>
                )
            })()}

            {showForm && (
                <ProviderForm provider={selectedProvider} onClose={handleCloseForm} />
            )}

            {!showForm && (
                <div className="space-y-4">
                    {providers.length === 0 ? (
                        <div className="text-center py-12 bg-white/2 border border-white/10 rounded-2xl">
                            <p className="text-white/35 mb-4">Nenhum prestador cadastrado</p>
                            <button
                                onClick={handleCreateNew}
                                className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" /> Criar Primeiro Prestador
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {providers.map((prov) => (
                                <div
                                    key={prov.id}
                                    className="group p-4 bg-white/2 border border-white/5 rounded-2xl hover:border-[#C9A84C]/40 transition cursor-pointer"
                                    onClick={() => handleEdit(prov)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <ProviderAvatar photoUrl={prov.photoUrl} name={prov.name} />
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-white truncate">{prov.name}</h3>
                                                <p className="text-sm text-white/45 truncate">{prov.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {prov.city && (
                                                        <span className="text-xs text-white/30 inline-flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {prov.city}
                                                        </span>
                                                    )}
                                                    {prov.shortDescription && (
                                                        <span className="text-xs text-white/25 truncate">{prov.shortDescription}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/5 text-white/40 px-3 py-1.5 rounded-lg group-hover:bg-[#C9A84C]/15 group-hover:text-[#C9A84C] transition">
                                                <Pencil className="w-3 h-3" /> Editar
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
