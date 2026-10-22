import { useState } from 'react'
import { packagePriceText } from '../../shared/pricing'
import { useQuery } from '@tanstack/react-query'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { useAuth } from '../context/AuthContext'
import type { Package } from '../../shared/types'
import PackageForm from '../components/PackageForm'
import GuidedTour, { type TourStep } from '../components/help/GuidedTour'
import EmptyState from '../components/help/EmptyState'

const TOUR: TourStep[] = [
    { target: 'new-package', title: 'Seus pacotes', body: 'Um pacote é uma oferta que o cliente pode escolher na proposta, como "Essencial" ou "Completo". Crie quantos quiser.' },
    { target: 'package-list', title: 'Preço calculado', body: 'Dentro do pacote, cada item tem quantidade e valor. Itens opcionais o cliente liga e desliga na página; cortesias aparecem com o valor riscado.' },
    { target: 'nav-proposals', title: 'Depois, a proposta', body: 'Com os pacotes prontos, monte uma proposta e marque quais pacotes o cliente pode escolher.' },
]
import { Package as PackageIcon, PlusCircle, Star, Layers3, Pencil, Video } from 'lucide-react'

export default function PackagesPage() {
    const { user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [editingPackage, setEditingPackage] = useState<Package | null>(null)

    const { data: provider } = useQuery({
        queryKey: ['provider-current'],
        queryFn: async () => {
            const providers = await httpGateway.listProviders()
            if (!providers?.length) return null
            // This logic might need adjustment if a user can have multiple providers
            return providers.find((p: any) => p.id === user?.providerId) ?? providers[0]
        },
    })

    const providerId = provider?.id as string
    const packageLabel = provider?.packageLabel || 'Pacotes'
    const packageLabelSingular = provider?.packageLabel?.replace(/s$/, '') || 'Pacote'


    const { data: packages = [], isLoading } = useQuery<Package[]>({
        queryKey: ['packages', providerId],
        queryFn: () => httpGateway.listPackages(providerId),
        enabled: !!providerId,
    })

    const handleNew = () => {
        setEditingPackage(null)
        setShowForm(true)
    }

    const handleEdit = (pkg: Package) => {
        setEditingPackage(pkg)
        setShowForm(true)
    }

    const handleClose = () => {
        setShowForm(false)
        setEditingPackage(null)
    }

    const highlightedPackages = packages.filter((pkg) => pkg.isHighlighted).length
    const totalItems = packages.reduce((sum, pkg) => sum + (pkg.itemIds?.length ?? 0), 0)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-light text-white">{packageLabel}</h1>
                    <p className="text-sm text-white/40 mt-1">
                        Gerencie seus pacotes de serviço para incluir nas propostas
                    </p>
                </div>
                <button
                    data-tour="new-package"
                    onClick={handleNew}
                    className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Novo {packageLabelSingular}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <PackageIcon className="w-4 h-4 text-[#C9A84C] mb-3" />
                    <p className="text-2xl font-light text-white">{packages.length}</p>
                    <p className="text-xs text-white/40 mt-1">{packageLabel} ativos</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <Star className="w-4 h-4 text-amber-400 mb-3" />
                    <p className="text-2xl font-light text-white">{highlightedPackages}</p>
                    <p className="text-xs text-white/40 mt-1">Em destaque</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <Layers3 className="w-4 h-4 text-blue-400 mb-3" />
                    <p className="text-2xl font-light text-white">{totalItems}</p>
                    <p className="text-xs text-white/40 mt-1">Itens somados</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <Pencil className="w-4 h-4 text-emerald-400 mb-3" />
                    <p className="text-2xl font-light text-white">{packages.length ? Math.round(totalItems / packages.length) : 0}</p>
                    <p className="text-xs text-white/40 mt-1">Média por {packageLabelSingular.toLowerCase()}</p>
                </div>
            </div>

            <GuidedTour id="packages" steps={TOUR} />

            {/* Lista de pacotes */}
            {isLoading ? (
                <div className="text-center py-16 text-white/40">Carregando {packageLabel.toLowerCase()}...</div>
            ) : packages.length === 0 ? (
                <div data-tour="package-list">
                    <EmptyState
                        icon={PackageIcon}
                        title={`Nenhum ${packageLabelSingular.toLowerCase()} criado`}
                        description="Monte o que você vende: itens com quantidade e valor (o total é calculado sozinho), opcionais que o cliente pode adicionar e cortesias. Depois é só marcar os pacotes na proposta."
                        article="pacotes-e-precos"
                        action={
                            <button
                                onClick={handleNew}
                                className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" /> Criar primeiro {packageLabelSingular.toLowerCase()}
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2" data-tour="package-list">
                    {packages.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} onEdit={() => handleEdit(pkg)} />
                    ))}
                </div>
            )}

            {showForm && (
                <PackageForm
                    providerId={providerId}
                    package={editingPackage}
                    onClose={handleClose}
                />
            )}
        </div>
    )
}

interface PackageCardProps {
    pkg: Package
    onEdit: () => void
}

function PackageCard({ pkg, onEdit }: PackageCardProps) {
    const hasMedia = pkg.mediaUrl && pkg.mediaUrl.length > 0;

    return (
        <div
            className={`relative rounded-3xl border p-6 cursor-pointer transition-all group overflow-hidden flex flex-col justify-between min-h-[180px] ${pkg.isHighlighted ? 'border-amber-400/60 bg-amber-500/5 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]' : 'border-white/5 bg-white/2 hover:border-[#C9A84C]/40'}`}
            onClick={onEdit}
        >
            {/* Media Background */}
            {hasMedia && pkg.mediaType === 'video' ? (
                <video
                    src={pkg.mediaUrl}
                    autoPlay
                    loop
                    muted
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : hasMedia && pkg.mediaType === 'image' ? (
                <img
                    src={pkg.mediaUrl}
                    alt={pkg.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : null}

            {/* Overlay */}
            <div className={`absolute inset-0 transition-colors ${hasMedia ? 'bg-black/60 group-hover:bg-black/70' : 'bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.12),transparent_35%)] opacity-0 group-hover:opacity-100'}`} />


            {pkg.isHighlighted && pkg.highlightLabel && (
                <span
                    className="absolute -top-2.5 left-4 text-xs font-semibold px-2.5 py-0.5 rounded-full text-white z-10"
                    style={{ backgroundColor: pkg.highlightColor || '#F59E0B' }}
                >
                    {pkg.highlightLabel}
                </span>
            )}

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 gap-3">
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-[#C9A84C] transition">{pkg.name}</h3>
                        {pkg.description && (
                            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{pkg.description}</p>
                        )}
                    </div>
                    <span className="text-lg font-semibold text-[#C9A84C] shrink-0 ml-3">
                        {packagePriceText(pkg)}
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <Layers3 className="w-3.5 h-3.5" />
                    {pkg.itemIds?.length ?? 0} {(pkg.itemIds?.length ?? 0) === 1 ? 'item' : 'itens'}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                    {hasMedia && pkg.mediaType === 'video' && <Video className="w-3.5 h-3.5" />}
                    <span className="text-xs text-[#C9A84C] font-medium opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1.5">
                        <Pencil className="w-3 h-3" /> Editar
                    </span>
                </div>
            </div>
        </div>
    )
}
