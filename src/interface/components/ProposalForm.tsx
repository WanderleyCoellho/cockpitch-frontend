import { useState } from 'react'
import { packagePriceText } from '../../shared/pricing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { ProposalSchema, type ProposalFormData } from '../../shared/schemas'
import { slugify } from '../../shared/utils'
import type { Proposal, Package, Provider, ProposalMediaItem, ProposalSection, ProposalTemplate, ThemeCustom } from '../../shared/types'
import ThemeSelector from './proposal/ThemeSelector'
import SectionsEditor, { normalizeSections } from './proposal/SectionsEditor'
import ContentEditor from './proposal/ContentEditor'
import { BlocksEditor, type SaveTemplateState } from './proposal/editor/BlocksEditor'
import { ResponsesPanel } from './proposal/ResponsesPanel'
import { TemplatePicker, blankTemplateBlocks } from './proposal/editor/TemplatePicker'
import { getThemeTokens } from './proposal/ThemeSelector'
import HelpTip from './help/HelpTip'
import { legacyProposalToBlocks, type ProposalBlock } from '../../shared/blocks'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { Upload, X, Film, Image, Info, Package as PackageIcon, Layers, Palette, AlertTriangle, ExternalLink, Star, Trash2, Check, Pencil, LayoutPanelTop, Wand2, ArrowLeft, Inbox } from 'lucide-react'

type ProposalFormProps = {
    proposal?: Proposal | null
    providerId: string
    onClose: () => void
    onSuccess?: () => void
}

type Tab = 'info' | 'packages' | 'page' | 'media' | 'visual' | 'content' | 'responses'

function isLikelyVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i.test(url)
}

function inferMediaType(file: File, fileUrl: string): ProposalMediaItem['type'] {
    const mime = (file.type || '').toLowerCase()
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('image/')) return 'image'

    const source = `${file.name} ${fileUrl}`.toLowerCase()
    if (/\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/.test(source)) return 'video'
    return 'image'
}

function isVideoMedia(item: ProposalMediaItem): boolean {
    return item.type === 'video' || isLikelyVideoUrl(item.url)
}

export default function ProposalForm({ proposal, providerId, onClose, onSuccess }: ProposalFormProps) {
    const [tab, setTab] = useState<Tab>('info')
    const [uploadingType, setUploadingType] = useState<'heroVideo' | 'weddingPhoto' | 'backstage' | 'differentials' | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [backstageMedia, setBackstageMedia] = useState<ProposalMediaItem[]>(
        proposal?.backstageMedia ?? []
    )
    const [differentialsMedia, setDifferentialsMedia] = useState<ProposalMediaItem[]>(
        proposal?.differentialsMedia ?? []
    )
    const [weddingPhotoFailed, setWeddingPhotoFailed] = useState(false)
    const [backstageFailed, setBackstageFailed] = useState<Record<string, boolean>>({})
    const [differentialsFailed, setDifferentialsFailed] = useState<Record<string, boolean>>({})
    const [theme, setTheme] = useState<string>(proposal?.theme ?? 'dark_luxury')
    const [themeCustom, setThemeCustom] = useState<ThemeCustom>(
        (proposal?.themeCustom as ThemeCustom) ?? {}
    )
    const [sections, setSections] = useState<ProposalSection[]>(
        normalizeSections(proposal?.sections ?? undefined)
    )
    const [sectionsConfig, setSectionsConfig] = useState<Record<string, any>>(
        proposal?.sectionsConfig ?? {}
    );
    const [confirmDelete, setConfirmDelete] = useState(false)
    // Proposta em blocos (null = layout legado). Proposta nova começa escolhendo um modelo.
    const [blocks, setBlocks] = useState<ProposalBlock[] | null>(Array.isArray(proposal?.blocks) ? proposal!.blocks : null)
    const [templateId, setTemplateId] = useState<string | undefined>(undefined)
    const [step, setStep] = useState<'template' | 'form'>(proposal ? 'form' : 'template')
    const blocksMode = blocks !== null
    const { activeWorkspace } = useAuth()
    const { entitlements } = usePlan()

    const { data: provider } = useQuery<Provider | null>({
        queryKey: ['provider', providerId],
        queryFn: () => httpGateway.getProvider(providerId),
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<ProposalFormData>({
        resolver: zodResolver(ProposalSchema),
        defaultValues: proposal
            ? {
                clientName: proposal.clientName,
                slug: proposal.slug,
                serviceDate: proposal.serviceDate,
                validityDays: proposal.validityDays,
                packageIds: proposal.packageIds,
                heroVideoUrl: proposal.heroVideoUrl,
                weddingPhotoUrl: proposal.weddingPhotoUrl,
                backstageMedia: proposal.backstageMedia ?? [],
                differentialsMedia: proposal.differentialsMedia ?? [],
                sectionsConfig: proposal.sectionsConfig ?? undefined,
            }
            : { validityDays: 30, packageIds: [] },
    })

    const heroVideoUrl = watch('heroVideoUrl')
    const weddingPhotoUrl = watch('weddingPhotoUrl')

    // Auto-generate slug no blur
    const handleClientNameChange = (e: React.FocusEvent<HTMLInputElement>) => {
        const name = e.target.value
        if (name) {
            setValue('slug', slugify(`${name}-${Date.now()}`))
        }
    }

    // Fetch packages do provider
    const { data: packages = [] } = useQuery<Package[]>({
        queryKey: ['packages', providerId],
        queryFn: () => httpGateway.listPackages(providerId),
    })

    const createMutation = useMutation({
        mutationFn: (data: ProposalFormData) =>
            httpGateway.createProposal({
                ...data,
                providerId,
                backstageMedia,
                differentialsMedia,
                theme,
                themeCustom: Object.keys(themeCustom).length ? themeCustom : null,
                sections,
                sectionsConfig,
                ...(blocks ? { blocks, templateId } : {}),
            }),
        onSuccess: () => {
            onSuccess?.()
            onClose()
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: ProposalFormData) =>
            httpGateway.updateProposal(proposal!.id, {
                ...data,
                backstageMedia,
                differentialsMedia,
                theme,
                themeCustom: Object.keys(themeCustom).length ? themeCustom : null,
                sections,
                sectionsConfig,
                ...(blocks ? { blocks } : {}),
            }),
        onSuccess: () => {
            onSuccess?.()
            onClose()
        },
    })

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'heroVideo' | 'weddingPhoto' | 'backstage' | 'differentials'
    ) => {
        const files = Array.from(e.target.files ?? [])
        if (files.length === 0) return

        try {
            setUploadingType(type)
            setUploadError(null)
            if (type === 'heroVideo') {
                const heroType = inferMediaType(files[0], files[0].name)
                if (heroType !== 'video') {
                    throw new Error('Selecione um arquivo de vídeo válido para o hero da proposta.')
                }
                const { file_url } = await httpGateway.uploadFile(files[0])
                setValue('heroVideoUrl', file_url)
            } else if (type === 'weddingPhoto') {
                const { file_url } = await httpGateway.uploadFile(files[0])
                setValue('weddingPhotoUrl', file_url)
                setWeddingPhotoFailed(false)
            } else if (type === 'backstage') {
                const uploaded = await Promise.all(
                    files.map(async (file) => {
                        const { file_url } = await httpGateway.uploadFile(file)
                        const mediaType = inferMediaType(file, file_url)
                        return { url: file_url, type: mediaType }
                    })
                )
                const updated = [...backstageMedia, ...uploaded]
                setBackstageMedia(updated)
                setValue('backstageMedia', updated)
            } else if (type === 'differentials') {
                const uploaded = await Promise.all(
                    files.map(async (file) => {
                        const { file_url } = await httpGateway.uploadFile(file)
                        const mediaType = inferMediaType(file, file_url)
                        return { url: file_url, type: mediaType }
                    })
                )
                const updated = [...differentialsMedia, ...uploaded]
                setDifferentialsMedia(updated)
                setValue('differentialsMedia', updated)
            }
        } catch (error) {
            console.error('Upload error:', error)
            const message = error instanceof Error ? error.message : 'Erro ao fazer upload. Tente novamente.'
            setUploadError(message)
        } finally {
            setUploadingType(null)
            e.target.value = ''
        }
    }

    // Erro de validação num campo de outra aba: leva o usuário até ele em vez de "não acontecer nada".
    const [invalidMessage, setInvalidMessage] = useState<string | null>(null)
    const FIELD_NAMES: Record<string, string> = { clientName: 'nome do cliente', slug: 'link público', validityDays: 'validade', serviceDate: 'data do serviço' }
    const onInvalid = (formErrors: Record<string, unknown>) => {
        const fields = Object.keys(formErrors)
        if (fields.some((field) => field in FIELD_NAMES)) setTab('info')
        setInvalidMessage(`Revise: ${fields.map((field) => FIELD_NAMES[field] ?? field).join(', ')}.`)
    }

    const onSubmit = async (data: ProposalFormData) => {
        setInvalidMessage(null)
        try {
            if (proposal) {
                await updateMutation.mutateAsync(data)
            } else {
                await createMutation.mutateAsync(data)
            }
        } catch (error) {
            console.error('Form submission error:', error)
        }
    }

    const TAB_CONFIG = blocksMode
        ? [
            { id: 'info' as Tab, label: 'Informações', Icon: Info },
            { id: 'packages' as Tab, label: 'Pacotes', Icon: PackageIcon },
            { id: 'page' as Tab, label: 'Página', Icon: LayoutPanelTop },
            { id: 'visual' as Tab, label: 'Visual', Icon: Palette },
        ]
        : [
            { id: 'info' as Tab, label: 'Informações', Icon: Info },
            { id: 'packages' as Tab, label: 'Pacotes', Icon: PackageIcon },
            { id: 'media' as Tab, label: 'Mídias', Icon: Layers },
            { id: 'content' as Tab, label: 'Conteúdo', Icon: Pencil },
            { id: 'visual' as Tab, label: 'Visual', Icon: Palette },
        ]

    if (proposal) TAB_CONFIG.push({ id: 'responses' as Tab, label: proposal.responsesCount ? `Respostas (${proposal.responsesCount})` : 'Respostas', Icon: Inbox })
    const isClosed = String(proposal?.status ?? '').toUpperCase() === 'FECHADA'
    const acceptedResponse = proposal?.lastResponse?.type === 'ACCEPTED' ? proposal.lastResponse : null

    const pickTemplate = (template: ProposalTemplate | null) => {
        setBlocks(template ? structuredClone(template.blocks) : blankTemplateBlocks())
        setTemplateId(template?.id)
        if (template?.theme) setTheme(template.theme)
        if (template?.themeCustom) setThemeCustom(template.themeCustom)
        setStep('form')
        setTab('info')
    }

    const convertLegacy = () => {
        if (!proposal) return
        setBlocks(legacyProposalToBlocks(proposal, provider))
        setTab('page')
    }

    const selectedPackageIds = watch('packageIds') ?? []
    const clientNameValue = watch('clientName') || 'Nome do cliente'
    const previewCtx = {
        clientName: clientNameValue,
        provider,
        packages: packages.filter((pkg) => selectedPackageIds.includes(pkg.id)),
        tk: getThemeTokens(theme, themeCustom),
        placeholders: { cliente: clientNameValue, empresa: provider?.name ?? activeWorkspace?.name ?? 'Sua empresa' },
        validUntil: new Date(Date.now() + (Number(watch('validityDays')) || 30) * 24 * 60 * 60 * 1000),
    }

    const canSaveTemplate = !!entitlements?.customTemplates && activeWorkspace?.role !== 'MEMBER'
    const saveTemplate: SaveTemplateState = {
        allowed: canSaveTemplate,
        reason: !entitlements?.customTemplates
            ? 'Modelos próprios estão disponíveis a partir do plano Profissional.'
            : 'Só donos e administradores da empresa podem salvar modelos.',
        onSave: async (name) => {
            await httpGateway.createTemplate({
                name,
                blocks: blocks ?? [],
                theme,
                themeCustom: Object.keys(themeCustom).length ? themeCustom : null,
            })
        },
    }

    const mutationError = (createMutation.error ?? updateMutation.error) as Error | null

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`w-full ${tab === 'page' && step === 'form' ? 'max-w-7xl' : step === 'template' ? 'max-w-5xl' : 'max-w-4xl'} bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_32px_96px_rgba(0,0,0,0.7)] max-h-[90vh] overflow-y-auto text-white`}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/8 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {proposal ? 'Editar Proposta' : 'Nova Proposta'}
                        </h2>
                        {proposal && (
                            <p className="text-xs text-white/35 mt-0.5">
                                /{proposal.slug}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/12 text-white/50 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {step === 'template' && (
                    <div className="p-6">
                        <TemplatePicker segment={activeWorkspace?.segment} canManage={activeWorkspace?.role !== 'MEMBER'} onPick={pickTemplate} />
                    </div>
                )}

                {step === 'form' && (<>
                {/* Tabs */}
                <div className="flex border-b border-white/8 px-6 gap-1 overflow-x-auto">
                    {TAB_CONFIG.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${tab === id
                                ? 'border-[#C9A84C] text-[#C9A84C]'
                                : 'border-transparent text-white/35 hover:text-white/65'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-6">
                    <input type="hidden" {...register('heroVideoUrl')} />
                    <input type="hidden" {...register('weddingPhotoUrl')} />

                    {!proposal && blocksMode && tab === 'info' && (
                        <button type="button" onClick={() => setStep('template')} className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white">
                            <ArrowLeft className="w-3.5 h-3.5" /> Trocar modelo
                        </button>
                    )}

                    {proposal && !blocksMode && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06]">
                            <Wand2 className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-white">Novo editor em blocos</p>
                                    <HelpTip helpKey="blocks.convert" />
                                </div>
                                <p className="text-xs text-white/50 mt-0.5">Monte a página com capa, escopo, FAQ, galeria e mais, com pré-visualização ao vivo.</p>
                            </div>
                            <button type="button" onClick={convertLegacy} className="px-4 py-2 rounded-xl bg-[#C9A84C] text-black text-xs font-semibold hover:bg-[#d8b65a]">
                                Converter esta proposta
                            </button>
                        </div>
                    )}

                    {isClosed && acceptedResponse && tab !== 'responses' && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06]">
                            <Check className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-white/75">
                                <strong className="text-white">{acceptedResponse.signerName}</strong> aceitou esta proposta em {new Date(acceptedResponse.createdAt).toLocaleDateString('pt-BR')}.
                                {' '}Mudanças feitas agora não alteram o que foi aceito: o comprovante guarda a versão anterior. Para o cliente aceitar uma nova versão, reabra a proposta na aba{' '}
                                <button type="button" onClick={() => setTab('responses')} className="text-[#C9A84C] underline">Respostas</button>.
                            </p>
                        </div>
                    )}

                    {/* ── TAB: RESPOSTAS ── */}
                    {tab === 'responses' && proposal && (
                        <ResponsesPanel proposalId={proposal.id} isClosed={isClosed} onChanged={onSuccess} />
                    )}

                    {/* ── TAB: PÁGINA (blocos) ── */}
                    {tab === 'page' && blocks && (
                        <BlocksEditor blocks={blocks} onChange={setBlocks} previewCtx={previewCtx} saveTemplate={saveTemplate} />
                    )}

                    {/* ── TAB: INFORMAÇÕES ── */}
                    {tab === 'info' && (
                        <div className="space-y-5">
                            {/* Nome + Slug */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium tracking-widest uppercase text-white/55 mb-2">Nome do Cliente *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex.: Mariana Costa ou Empresa X"
                                        className="w-full px-4 py-3 border border-white/12 rounded-xl bg-white/4 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 focus:bg-white/6 transition-all"
                                        {...register('clientName')}
                                        onBlur={handleClientNameChange}
                                    />
                                    {errors.clientName && (
                                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {errors.clientName.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium tracking-widest uppercase text-white/55 mb-2">Link público (slug)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full px-4 py-3 border border-white/8 rounded-xl bg-white/3 text-white/40 focus:outline-none font-mono text-sm pr-10"
                                            {...register('slug')}
                                        />
                                        {watch('slug') && (
                                            <a
                                                href={`/p/${watch('slug')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-[#C9A84C]/70 transition-colors"
                                                title="Abrir proposta"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-white/25 mt-1">Gerado automaticamente ao digitar o nome</p>
                                    {errors.slug && (
                                        <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Data + Validade */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium tracking-widest uppercase text-white/55 mb-2">Data do serviço (opcional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 border border-white/12 rounded-xl bg-white/4 text-white focus:outline-none focus:border-[#C9A84C]/50 transition-all"
                                        style={{ colorScheme: 'dark' }}
                                        {...register('serviceDate')}
                                    />
                                    <p className="text-[11px] text-white/25 mt-1">Aparece no topo da proposta para o cliente</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium tracking-widest uppercase text-white/55 mb-2">Validade da proposta</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="30"
                                            className="w-full px-4 py-3 border border-white/12 rounded-xl bg-white/4 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-all pr-14"
                                            {...register('validityDays', { valueAsNumber: true })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">dias</span>
                                    </div>
                                    <p className="text-[11px] text-white/25 mt-1">Prazo para o cliente aceitar a proposta</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: PACOTES ── */}
                    {tab === 'packages' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white/80">Selecione os pacotes desta proposta</p>
                                    <p className="text-xs text-white/35 mt-0.5">O cliente verá apenas os pacotes selecionados</p>
                                </div>
                                {packages.length > 0 && (
                                    <span className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-full">
                                        {watch('packageIds')?.length ?? 0} / {packages.length} selecionados
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {packages.map((pkg: Package) => {
                                    const isChecked = watch('packageIds')?.includes(pkg.id)
                                    return (
                                        <label
                                            key={pkg.id}
                                            className={`relative flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${isChecked
                                                ? 'border-[#C9A84C]/50 bg-[#C9A84C]/6'
                                                : 'border-white/8 bg-white/3 hover:border-white/18 hover:bg-white/5'
                                                }`}
                                        >
                                            {/* Checkbox escondido */}
                                            <input
                                                type="checkbox"
                                                value={pkg.id}
                                                className="sr-only"
                                                {...register('packageIds')}
                                            />
                                            {/* Badge de destaque */}
                                            {pkg.isHighlighted && (
                                                <div
                                                    className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                                    style={{
                                                        background: pkg.highlightColor ?? '#C9A84C' + '25',
                                                        color: pkg.highlightColor ?? '#C9A84C',
                                                    }}
                                                >
                                                    <Star className="w-2.5 h-2.5" />
                                                    {pkg.highlightLabel ?? 'Destaque'}
                                                </div>
                                            )}
                                            {/* Conteúdo */}
                                            <div className="flex items-start justify-between gap-4 pr-16">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-white/20 bg-transparent'
                                                        }`}>
                                                        {isChecked && <Check className="w-3 h-3 text-black" />}
                                                    </div>
                                                    <p className={`text-sm font-medium transition-colors ${isChecked ? 'text-white' : 'text-white/70'
                                                        }`}>
                                                        {pkg.name}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Preço */}
                                            <p className={`text-xl font-light mt-3 ml-8 transition-colors ${isChecked ? 'text-[#C9A84C]' : 'text-white/45'
                                                }`}>
                                                {packagePriceText(pkg)}
                                            </p>
                                        </label>
                                    )
                                })}
                            </div>
                            {packages.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-12 text-center">
                                    <PackageIcon className="w-8 h-8 text-white/15" />
                                    <p className="text-sm text-white/40">Nenhum pacote cadastrado ainda</p>
                                    <p className="text-xs text-white/25">Crie pacotes na seção "Pacotes" antes de montar uma proposta</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: MÍDIAS ── */}
                    {tab === 'media' && (
                        <div className="space-y-5">
                            {uploadError && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {uploadError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-white/72 mb-2">Vídeo Hero</label>
                                <label className={`group flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingType === 'heroVideo'
                                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5'
                                    : 'border-white/12 hover:border-[#C9A84C]/35 hover:bg-white/3'
                                    }`}>
                                    <Film className={`w-6 h-6 transition-colors ${uploadingType === 'heroVideo' ? 'text-[#C9A84C]/70 animate-pulse' : 'text-white/20 group-hover:text-[#C9A84C]/50'
                                        }`} />
                                    <div className="text-center">
                                        <p className="text-sm text-white/55 group-hover:text-white/75 transition-colors">
                                            {uploadingType === 'heroVideo' ? 'Enviando vídeo...' : 'Clique para selecionar vídeo'}
                                        </p>
                                        <p className="text-xs text-white/30 mt-0.5">MP4, MOV, WebM e outros formatos</p>
                                    </div>
                                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'heroVideo')} disabled={uploadingType !== null} />
                                </label>
                                {heroVideoUrl && (
                                                                            <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-3">
                                                                            <video src={heroVideoUrl} controls preload="metadata" className="w-full rounded-lg bg-black" />
                                                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                                                <p className="truncate text-xs text-white/40">{heroVideoUrl}</p>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <label htmlFor="videoSound" className="text-xs text-white/50">Som do vídeo</label>
                                                                                        <input type="checkbox" id="videoSound" {...register('videoSoundEnabled')} className="toggle-switch" />
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setValue('heroVideoUrl', '')}
                                                                                        className="shrink-0 text-xs text-red-300 hover:text-red-200"
                                                                                    >
                                                                                        Remover
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>                            <div>
                                <label className="block text-sm font-medium text-white/72 mb-2">Foto do Evento <span className="text-white/35 font-normal">(background do hero)</span></label>
                                <label className={`group flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingType === 'weddingPhoto'
                                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5'
                                    : 'border-white/12 hover:border-[#C9A84C]/35 hover:bg-white/3'
                                    }`}>
                                    <Image className={`w-6 h-6 transition-colors ${uploadingType === 'weddingPhoto' ? 'text-[#C9A84C]/70 animate-pulse' : 'text-white/20 group-hover:text-[#C9A84C]/50'
                                        }`} />
                                    <div className="text-center">
                                        <p className="text-sm text-white/55 group-hover:text-white/75 transition-colors">
                                            {uploadingType === 'weddingPhoto' ? 'Enviando imagem...' : 'Clique para selecionar imagem'}
                                        </p>
                                        <p className="text-xs text-white/30 mt-0.5">JPG, PNG, WebP</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'weddingPhoto')} disabled={uploadingType !== null} />
                                </label>
                                {weddingPhotoUrl && (
                                    <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-3">
                                        {weddingPhotoFailed ? (
                                            <div className="max-h-64 min-h-40 w-full rounded-lg border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 px-3 text-center">
                                                <p className="text-xs text-white/55">Falha ao carregar a imagem de fundo.</p>
                                                <a
                                                    href={weddingPhotoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#C9A84C] border border-[#C9A84C]/30 rounded-full px-2.5 py-1 hover:bg-[#C9A84C]/10 transition"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Abrir imagem
                                                </a>
                                            </div>
                                        ) : (
                                            <img
                                                src={weddingPhotoUrl}
                                                alt="Background da proposta"
                                                onError={() => setWeddingPhotoFailed(true)}
                                                className="max-h-64 w-full rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <p className="truncate text-xs text-white/40">{weddingPhotoUrl}</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setValue('weddingPhotoUrl', '')
                                                    setWeddingPhotoFailed(false)
                                                }}
                                                className="shrink-0 text-xs text-red-300 hover:text-red-200"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/72 mb-2">
                                    Fotos/Vídeos Backstage{' '}
                                    {backstageMedia.length > 0 && <span className="text-[#C9A84C]/70 font-normal text-xs">{backstageMedia.length} {backstageMedia.length === 1 ? 'item' : 'itens'}</span>}
                                </label>
                                <label className={`group flex flex-col items-center gap-2 py-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingType === 'backstage'
                                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5'
                                    : 'border-white/12 hover:border-[#C9A84C]/35 hover:bg-white/3'
                                    }`}>
                                    <Upload className={`w-5 h-5 transition-colors ${uploadingType === 'backstage' ? 'text-[#C9A84C]/70 animate-pulse' : 'text-white/20 group-hover:text-[#C9A84C]/50'
                                        }`} />
                                    <p className="text-sm text-white/55 group-hover:text-white/75 transition-colors">
                                        {uploadingType === 'backstage' ? 'Enviando mídias...' : 'Clique ou arraste arquivos'}
                                    </p>
                                    <p className="text-xs text-white/30">Múltiplas fotos e vídeos</p>
                                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'backstage')} disabled={uploadingType !== null} />
                                </label>
                                {backstageMedia.length > 0 && (
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                                        {backstageMedia.map((m, i) => (
                                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10">
                                                {backstageFailed[m.url] ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center bg-white/6">
                                                        <p className="text-[10px] text-white/55">Falha ao carregar</p>
                                                        <a
                                                            href={m.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] text-[#C9A84C] uppercase tracking-wide border border-[#C9A84C]/30 rounded-full px-2 py-0.5 hover:bg-[#C9A84C]/10 transition"
                                                        >
                                                            <ExternalLink className="w-3 h-3" /> Abrir mídia
                                                        </a>
                                                    </div>
                                                ) : isVideoMedia(m)
                                                    ? <video src={m.url} onError={() => setBackstageFailed((prev) => ({ ...prev, [m.url]: true }))} className="w-full h-full object-cover" />
                                                    : <img src={m.url} alt="" onError={() => setBackstageFailed((prev) => ({ ...prev, [m.url]: true }))} className="w-full h-full object-cover" />}
                                                {isVideoMedia(m) && !backstageFailed[m.url] && (
                                                    <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5">
                                                        <span className="text-[9px] text-white/80 font-medium">VID</span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                                    onClick={() => {
                                                        const updated = backstageMedia.filter((_, j) => j !== i)
                                                        setBackstageMedia(updated)
                                                        setValue('backstageMedia', updated)
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/72 mb-2">
                                    Fotos/Vídeos de Diferenciais{' '}
                                    {differentialsMedia.length > 0 && <span className="text-[#C9A84C]/70 font-normal text-xs">{differentialsMedia.length} {differentialsMedia.length === 1 ? 'item' : 'itens'}</span>}
                                </label>
                                <label className={`group flex flex-col items-center gap-2 py-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingType === 'differentials'
                                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5'
                                    : 'border-white/12 hover:border-[#C9A84C]/35 hover:bg-white/3'
                                    }`}>
                                    <Upload className={`w-5 h-5 transition-colors ${uploadingType === 'differentials' ? 'text-[#C9A84C]/70 animate-pulse' : 'text-white/20 group-hover:text-[#C9A84C]/50'
                                        }`} />
                                    <p className="text-sm text-white/55 group-hover:text-white/75 transition-colors">
                                        {uploadingType === 'differentials' ? 'Enviando mídias...' : 'Clique ou arraste arquivos'}
                                    </p>
                                    <p className="text-xs text-white/30">Múltiplas fotos e vídeos</p>
                                    <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'differentials')} disabled={uploadingType !== null} />
                                </label>
                                {differentialsMedia.length > 0 && (
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                                        {differentialsMedia.map((m, i) => (
                                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10">
                                                {differentialsFailed[m.url] ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center bg-white/6">
                                                        <p className="text-[10px] text-white/55">Falha ao carregar</p>
                                                        <a
                                                            href={m.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] text-[#C9A84C] uppercase tracking-wide border border-[#C9A84C]/30 rounded-full px-2 py-0.5 hover:bg-[#C9A84C]/10 transition"
                                                        >
                                                            <ExternalLink className="w-3 h-3" /> Abrir mídia
                                                        </a>
                                                    </div>
                                                ) : isVideoMedia(m)
                                                    ? <video src={m.url} onError={() => setDifferentialsFailed((prev) => ({ ...prev, [m.url]: true }))} className="w-full h-full object-cover" />
                                                    : <img src={m.url} alt="" onError={() => setDifferentialsFailed((prev) => ({ ...prev, [m.url]: true }))} className="w-full h-full object-cover" />}
                                                {isVideoMedia(m) && !differentialsFailed[m.url] && (
                                                    <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5">
                                                        <span className="text-[9px] text-white/80 font-medium">VID</span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                                    onClick={() => {
                                                        const updated = differentialsMedia.filter((_, j) => j !== i)
                                                        setDifferentialsMedia(updated)
                                                        setValue('differentialsMedia', updated)
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: CONTEÚDO ── */}
                    {tab === 'content' && (
                        <ContentEditor 
                            provider={provider}
                            sectionsConfig={sectionsConfig}
                            onConfigChange={setSectionsConfig}
                        />
                    )}

                    {/* ── TAB: VISUAL ── */}
                    {tab === 'visual' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-base font-semibold text-white mb-1">Tema da Proposta</h3>
                                <p className="text-xs text-white/40 mb-4">Escolha o visual que vai aparecer para o cliente ao abrir o link</p>
                                <ThemeSelector
                                    theme={theme}
                                    themeCustom={themeCustom}
                                    onThemeChange={(t) => setTheme(t)}
                                    onCustomChange={(key, value) => setThemeCustom((prev) => ({ ...prev, [key]: value }))}
                                />
                            </div>
                            {!blocksMode && <div className="border-t border-white/10 pt-6">
                                <h3 className="text-base font-semibold text-white mb-1">Seções da Proposta</h3>
                                <p className="text-xs text-white/40 mb-4">Controle quais seções aparecem e em que ordem</p>
                                <SectionsEditor
                                    sections={sections}
                                    onChange={setSections}
                                    sectionsConfig={watch('sectionsConfig')}
                                />
                            </div>}
                        </div>
                    )}

                    {/* ── AÇÕES ── */}
                    <div className="border-t border-white/8 pt-5">
                        {invalidMessage && (
                            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-amber-500/25 bg-amber-500/8 text-sm text-amber-200">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {invalidMessage}
                            </div>
                        )}
                        {mutationError && (
                            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-red-500/25 bg-red-500/8 text-sm text-red-300">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {mutationError.message}
                            </div>
                        )}
                        {/* Confirm delete inline */}
                        {confirmDelete && (
                            <div className="mb-4 flex items-center gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/8">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="flex-1 text-sm text-red-300">Tem certeza? Esta ação não pode ser desfeita.</p>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium"
                                    onClick={() => {
                                        httpGateway.deleteProposal(proposal!.id).then(() => onClose())
                                    }}
                                >
                                    Sim, deletar
                                </button>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 text-xs bg-white/5 text-white/50 rounded-lg hover:bg-white/10"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-2">
                                {proposal && !confirmDelete && (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(true)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Deletar
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl text-sm text-white/55 hover:text-white/80 hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || createMutation.isPending || updateMutation.isPending || !!uploadingType}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#C9A84C] text-black rounded-xl text-sm font-semibold hover:bg-[#d8b65a] disabled:opacity-50 transition-all"
                                >
                                    {uploadingType
                                        ? (<><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />Enviando...</>)
                                        : isSubmitting || createMutation.isPending || updateMutation.isPending
                                            ? 'Salvando...'
                                            : 'Salvar e Publicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                </>)}
            </div>
        </div>
    )
}
