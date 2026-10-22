import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle2, Eye, FileText, Instagram, Mail, MapPin, MessageCircle, Pencil, Phone, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import ProviderForm from '../components/ProviderForm'
import OnboardingChecklist from '../components/help/OnboardingChecklist'
import GuidedTour, { type TourStep } from '../components/help/GuidedTour'
import { useOnboarding } from '../hooks/useOnboarding'
import type { Proposal, Provider } from '../../shared/types'

const TOUR: TourStep[] = [
    { target: 'checklist', title: 'Primeiros passos', body: 'Siga esta lista para chegar à primeira proposta aberta pelo cliente. Os itens se marcam sozinhos conforme você usa o sistema.' },
    { target: 'stats', title: 'Seu funil', body: 'Quantas propostas você tem, quantas foram aceitas, quantas estão em negociação e quantas vezes os clientes abriram os links.' },
    { target: 'profile', title: 'Perfil da empresa', body: 'Nome, contatos e logo que aparecem para o cliente na proposta, nos e-mails e no PDF.' },
    { target: 'nav-proposals', title: 'Propostas', body: 'Aqui você cria, envia e acompanha as propostas. Em Pacotes, monta o que vende.' },
    { target: 'help-button', title: 'Ajuda sempre à mão', body: 'Reveja este tour ou abra a central de ajuda com o passo a passo de cada tarefa. Os ícones "?" ao lado dos campos também explicam cada um.' },
]

function CompanyAvatar({ src, name }: { src?: string; name: string }) {
    const [failed, setFailed] = useState(false)
    if (!src || failed) {
        return (
            <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex-shrink-0 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#C9A84C]" />
            </div>
        )
    }
    return <img src={src} alt={name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 ring-1 ring-white/10" onError={() => setFailed(true)} />
}

export default function DashboardPage() {
    const { user, activeWorkspace } = useAuth()
    const { refresh: refreshOnboarding } = useOnboarding()
    const [editing, setEditing] = useState(false)
    const canEditProfile = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN'

    // Perfil público da empresa ativa.
    const { data: provider, isLoading: providerLoading, refetch: refetchProvider } = useQuery<Provider | null>({
        queryKey: ['provider-current', activeWorkspace?.id],
        queryFn: async () => {
            const providers = await httpGateway.listProviders()
            if (!providers?.length) return null
            return providers.find((p: Provider) => p.id === activeWorkspace?.providerId) ?? providers[0]
        },
        enabled: !!activeWorkspace,
    })

    const { data: proposals = [] } = useQuery<Proposal[]>({
        queryKey: ['proposals-dashboard', provider?.id],
        queryFn: () => (provider ? httpGateway.listProposals(provider.id) : Promise.resolve([])),
        enabled: !!provider,
    })

    const accepted = proposals.filter((p) => p.commercialStatus === 'aceita').length
    const negotiating = proposals.filter((p) => p.commercialStatus === 'negociando').length
    const opens = proposals.reduce((sum, p) => sum + (((p as unknown as { views?: unknown[] }).views?.length) ?? 0), 0)

    const closeEditor = () => {
        setEditing(false)
        refetchProvider()
        refreshOnboarding()
    }

    const stats = [
        { label: 'Propostas', value: proposals.length, icon: FileText, color: 'text-blue-400' },
        { label: 'Aceitas', value: accepted, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'Negociando', value: negotiating, icon: MessageCircle, color: 'text-amber-400' },
        { label: 'Aberturas do link', value: opens, icon: Eye, color: 'text-[#C9A84C]' },
    ]

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-light text-white">
                        Olá, <span className="font-semibold">{user?.name?.split(' ')[0] || 'bem-vindo'}</span>
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Acompanhe suas propostas e o que falta para fechar negócio.</p>
                </div>
                <Link
                    to="/proposals?nova=1"
                    className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d8b65a] transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Nova proposta
                </Link>
            </div>

            <OnboardingChecklist onEditProfile={canEditProfile && provider ? () => setEditing(true) : undefined} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="stats">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                        <Icon className={`w-4 h-4 ${color} mb-3`} />
                        <p className="text-2xl font-light text-white mb-1">{value}</p>
                        <p className="text-xs text-white/40">{label}</p>
                    </div>
                ))}
            </div>

            <section data-tour="profile" className="p-5 bg-white/[0.02] border border-white/8 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[11px] uppercase tracking-widest text-white/40">Perfil da empresa</h2>
                    {canEditProfile && provider && (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 text-xs bg-white/5 text-white/60 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/15 hover:text-[#C9A84C] transition"
                        >
                            <Pencil className="w-3 h-3" /> Editar perfil
                        </button>
                    )}
                </div>
                {providerLoading ? (
                    <p className="text-sm text-white/40">Carregando…</p>
                ) : provider ? (
                    <div className="flex items-start gap-4">
                        <CompanyAvatar src={provider.logoUrl || provider.photoUrl} name={provider.name} />
                        <div className="min-w-0 space-y-1.5">
                            <p className="text-white font-medium">{provider.name}</p>
                            {provider.shortDescription && <p className="text-sm text-white/50">{provider.shortDescription}</p>}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                                {provider.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {provider.email}</span>}
                                {provider.whatsapp ? (
                                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {provider.whatsapp}</span>
                                ) : (
                                    canEditProfile && <span className="inline-flex items-center gap-1 text-amber-300/80"><Phone className="w-3 h-3" /> Adicione o WhatsApp para o botão de contato</span>
                                )}
                                {provider.instagram && <span className="inline-flex items-center gap-1"><Instagram className="w-3 h-3" /> {provider.instagram}</span>}
                                {provider.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.city}</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-white/45">O perfil da empresa ainda não foi criado.</p>
                )}
                {!canEditProfile && <p className="mt-3 text-xs text-white/35">Só donos e administradores alteram o perfil.</p>}
            </section>

            {editing && provider && <ProviderForm provider={provider} onClose={closeEditor} />}

            <GuidedTour id="dashboard" steps={TOUR} />
        </div>
    )
}
