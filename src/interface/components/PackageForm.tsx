import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, AlertTriangle, Upload, Film, Image, ExternalLink } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { PackageSchema, PackageItemSchema, toPackagePayload, toPackageItemPayload } from '../../shared/schemas'
import { calculatePackagePricing, centsToInput, formatCents, formatQuantity, lineTotalCents, parseMoneyToCents } from '../../shared/pricing'
import { parseDecimalInput } from '../../shared/schemas'
import HelpTip, { FieldLabel } from './help/HelpTip'
import type { PackageFormData, PackageItemFormData } from '../../shared/schemas'
import type { Package, PackageItem } from '../../shared/types'
import { VisualColorPicker } from './shared/VisualColorPicker'
import { Switch } from './shared/Switch'

function inferMediaType(file: File): 'image' | 'video' {
    const mime = (file.type || '').toLowerCase()
    if (mime.startsWith('video/')) return 'video'
    return 'image'
}

interface PackageFormProps {
    providerId: string
    package?: Package | null
    onClose: () => void
}

const KIND_LABEL: Record<PackageItem['kind'], string> = { INCLUDED: 'Incluído', OPTIONAL: 'Opcional', COURTESY: 'Cortesia' }
const KIND_STYLE: Record<PackageItem['kind'], string> = {
    INCLUDED: 'bg-white/10 text-white/70',
    OPTIONAL: 'bg-sky-500/15 text-sky-300',
    COURTESY: 'bg-amber-500/15 text-amber-300',
}

const fieldClass =
    'w-full px-3 py-2 rounded-xl border border-white/15 bg-black/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40'

export default function PackageForm({ providerId, package: initialPackage, onClose }: PackageFormProps) {
    const queryClient = useQueryClient()
    // Depois de criar, o formulário continua aberto no pacote recém-criado para adicionar os itens.
    const [pkg, setPkg] = useState<Package | null>(initialPackage ?? null)
    const [justCreated, setJustCreated] = useState(false)
    const isEditing = !!pkg

    const [showItemForm, setShowItemForm] = useState(false)
    const [editingItem, setEditingItem] = useState<PackageItem | null>(null)
    const [confirmDeletePackage, setConfirmDeletePackage] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [mediaPreviewFailed, setMediaPreviewFailed] = useState(false)

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<PackageFormData>({
        resolver: zodResolver(PackageSchema),
        defaultValues: initialPackage
            ? {
                name: initialPackage.name,
                description: initialPackage.description,
                priceMode: initialPackage.priceMode ?? 'FIXED',
                fixedPrice: centsToInput(initialPackage.fixedPriceCents),
                priceLabel: initialPackage.priceLabel ?? '',
                discountType: initialPackage.discountType ?? 'NONE',
                discountInput:
                    initialPackage.discountType === 'PERCENT'
                        ? String((initialPackage.discountValue ?? 0) / 100).replace('.', ',')
                        : initialPackage.discountType === 'AMOUNT'
                          ? centsToInput(initialPackage.discountValue)
                          : '',
                isHighlighted: initialPackage.isHighlighted,
                highlightLabel: initialPackage.highlightLabel,
                highlightColor: initialPackage.highlightColor,
                mediaUrl: initialPackage.mediaUrl,
                mediaType: initialPackage.mediaType,
                itemIds: initialPackage.itemIds,
            }
            : { isHighlighted: false, itemIds: [], priceMode: 'SUM_OF_ITEMS', discountType: 'NONE' },
    })

    const isHighlighted = watch('isHighlighted')
    const mediaUrl = watch('mediaUrl')
    const mediaType = watch('mediaType')
    const priceMode = watch('priceMode')
    const fixedPrice = watch('fixedPrice')
    const discountType = watch('discountType')
    const discountInput = watch('discountInput')

    const { data: items = [], refetch: refetchItems } = useQuery<PackageItem[]>({
        queryKey: ['packageItems', pkg?.id],
        queryFn: () => httpGateway.listPackageItems(pkg!.id),
        enabled: !!pkg?.id,
    })

    // Resumo ao vivo, com os valores que estão no formulário (antes de salvar).
    const preview = calculatePackagePricing({
        priceMode: priceMode ?? 'SUM_OF_ITEMS',
        fixedPriceCents: parseMoneyToCents(fixedPrice ?? '') ?? 0,
        discountType: discountType ?? 'NONE',
        discountValue:
            discountType === 'PERCENT'
                ? Math.round((parseDecimalInput(discountInput) ?? 0) * 100)
                : discountType === 'AMOUNT'
                  ? parseMoneyToCents(discountInput ?? '') ?? 0
                  : 0,
        items,
    })

    const saveMutation = useMutation({
        mutationFn: (data: PackageFormData) =>
            isEditing
                ? httpGateway.updatePackage(pkg!.id, { ...toPackagePayload(data), providerId })
                : httpGateway.createPackage({ ...toPackagePayload(data), providerId }),
        onSuccess: (saved: Package) => {
            queryClient.invalidateQueries({ queryKey: ['packages', providerId] })
            if (isEditing) {
                onClose()
                return
            }
            setPkg(saved)
            setJustCreated(true)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => httpGateway.deletePackage(pkg!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packages', providerId] })
            onClose()
        },
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            setUploadError(null)
            const { file_url } = await httpGateway.uploadFile(file)
            const type = inferMediaType(file)
            setValue('mediaUrl', file_url)
            setValue('mediaType', type)
            setMediaPreviewFailed(false)
        } catch (error) {
            console.error('Upload error:', error)
            const message = error instanceof Error ? error.message : 'Erro ao fazer upload. Tente novamente.'
            setUploadError(message)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const onSubmit = (data: PackageFormData) => {
        setInvalidMessage(null)
        saveMutation.mutate(data)
    }
    // Nunca falhar em silêncio: aponta o campo com problema ou o erro da API.
    const [invalidMessage, setInvalidMessage] = useState<string | null>(null)
    const onInvalid = (formErrors: Record<string, unknown>) => {
        const names: Record<string, string> = { name: 'nome', fixedPrice: 'valor', discountInput: 'desconto' }
        setInvalidMessage(`Revise: ${Object.keys(formErrors).map((field) => names[field] ?? field).join(', ')}.`)
    }
    const saveError = invalidMessage ?? (saveMutation.error instanceof Error ? saveMutation.error.message : saveMutation.isError ? 'Não foi possível salvar. Tente de novo.' : null)

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center z-50 py-8 overflow-y-auto">
            <div className="bg-[#0F0F0F] rounded-2xl border border-white/10 w-full max-w-xl mx-4 text-white">
                <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {isEditing ? 'Editar Pacote' : 'Novo Pacote'}
                        </h2>
                        <p className="text-xs text-white/35 mt-1">
                            Estruture nome, investimento e itens inclusos.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-4">
                    {/* Mídia */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Mídia de Capa (opcional)</label>
                        {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}
                        <label className={`group flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading
                            ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5'
                            : 'border-white/12 hover:border-[#C9A84C]/35 hover:bg-white/3'
                            }`}>
                            <Upload className={`w-6 h-6 transition-colors ${uploading ? 'text-[#C9A84C]/70 animate-pulse' : 'text-white/20 group-hover:text-[#C9A84C]/50'
                                }`} />
                            <div className="text-center">
                                <p className="text-sm text-white/55 group-hover:text-white/75 transition-colors">
                                    {uploading ? 'Enviando mídia...' : 'Clique para selecionar imagem ou vídeo'}
                                </p>
                                <p className="text-xs text-white/30 mt-0.5">Um arquivo de imagem ou vídeo</p>
                            </div>
                            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                        </label>
                        <p className="text-[11px] text-white/30 mt-1 text-center">Para melhor resultado, use imagens no formato 16:9, por exemplo, 1920x1080 pixels.</p>
                        {mediaUrl && (
                            <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-3">
                                {mediaPreviewFailed ? (
                                    <div className="h-40 w-full rounded-lg border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 px-3 text-center">
                                        <p className="text-xs text-white/55">Falha ao carregar a mídia.</p>
                                        <a href={mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#C9A84C] border border-[#C9A84C]/30 rounded-full px-2.5 py-1 hover:bg-[#C9A84C]/10 transition">
                                            <ExternalLink className="w-3 h-3" /> Abrir mídia
                                        </a>
                                    </div>
                                ) : mediaType === 'video' ? (
                                    <video src={mediaUrl} controls preload="metadata" onError={() => setMediaPreviewFailed(true)} className="w-full h-40 rounded-lg bg-black object-cover" />
                                ) : (
                                    <img src={mediaUrl} alt="Capa do pacote" onError={() => setMediaPreviewFailed(true)} className="w-full h-40 rounded-lg object-cover" />
                                )}
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="truncate text-xs text-white/40">{mediaUrl}</p>
                                    <button
                                        type="button"
                                        onClick={() => { setValue('mediaUrl', ''); setValue('mediaType', undefined); setMediaPreviewFailed(false) }}
                                        className="shrink-0 text-xs text-red-300 hover:text-red-200"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-1">
                            Nome do pacote *
                        </label>
                        <input
                            {...register('name')}
                            className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                            placeholder="Ex: Pacote Completo"
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Descrição</label>
                        <textarea
                            {...register('description')}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 resize-none"
                            placeholder="Descreva o que está incluído..."
                        />
                    </div>

                    {/* Preço */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">Preço</span>
                            <HelpTip helpKey="package.priceMode" />
                        </div>
                        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Como o preço é calculado">
                            {([
                                ['SUM_OF_ITEMS', 'Soma dos itens'],
                                ['FIXED', 'Valor fixo'],
                                ['ON_REQUEST', 'Sob consulta'],
                            ] as const).map(([mode, label]) => (
                                <button
                                    key={mode}
                                    type="button"
                                    role="radio"
                                    aria-checked={priceMode === mode}
                                    onClick={() => setValue('priceMode', mode, { shouldValidate: true })}
                                    className={`rounded-xl border px-2 py-2 text-xs font-medium transition ${priceMode === mode
                                        ? 'border-[#C9A84C]/60 bg-[#C9A84C]/10 text-[#C9A84C]'
                                        : 'border-white/10 text-white/60 hover:border-white/20'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {priceMode === 'FIXED' && (
                            <div>
                                <FieldLabel htmlFor="fixedPrice">Valor do pacote</FieldLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 text-sm">R$</span>
                                    <input id="fixedPrice" inputMode="decimal" {...register('fixedPrice')} className={`${fieldClass} pl-9`} placeholder="3.500,00" />
                                </div>
                                {errors.fixedPrice && <p className="text-xs text-red-400 mt-1">{errors.fixedPrice.message}</p>}
                            </div>
                        )}

                        <div>
                            <FieldLabel htmlFor="priceLabel" helpKey="package.priceLabel">
                                {priceMode === 'ON_REQUEST' ? 'Texto no lugar do preço' : 'Texto junto ao preço (opcional)'}
                            </FieldLabel>
                            <input
                                id="priceLabel"
                                {...register('priceLabel')}
                                className={fieldClass}
                                placeholder={priceMode === 'ON_REQUEST' ? 'Ex.: Sob consulta' : 'Ex.: a partir de, por pessoa'}
                            />
                        </div>

                        {priceMode !== 'ON_REQUEST' && (
                            <div className="grid grid-cols-[150px_1fr] gap-2 items-end">
                                <div>
                                    <FieldLabel htmlFor="discountType" helpKey="package.discount">Desconto</FieldLabel>
                                    <select id="discountType" {...register('discountType')} className={fieldClass}>
                                        <option value="NONE">Sem desconto</option>
                                        <option value="PERCENT">Em %</option>
                                        <option value="AMOUNT">Em R$</option>
                                    </select>
                                </div>
                                {discountType !== 'NONE' && (
                                    <div>
                                        <input
                                            aria-label="Valor do desconto"
                                            inputMode="decimal"
                                            {...register('discountInput')}
                                            className={fieldClass}
                                            placeholder={discountType === 'PERCENT' ? '10' : '200,00'}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.discountInput && <p className="text-xs text-red-400">{errors.discountInput.message}</p>}
                    </div>

                    {/* Destaque */}
                    <div className="border-t border-white/10 pt-4 space-y-4">
                        <Controller
                            name="isHighlighted"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onChange={field.onChange}
                                    label="Marcar como pacote em destaque"
                                />
                            )}
                        />

                        {isHighlighted && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-14">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-1">Label do destaque</label>
                                    <input
                                        {...register('highlightLabel')}
                                        className="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                                        placeholder="Ex: Mais popular"
                                    />
                                </div>
                                <Controller
                                    name="highlightColor"
                                    control={control}
                                    render={({ field }) => (
                                        <VisualColorPicker
                                            label="Cor do destaque"
                                            color={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>


                    {/* Itens do pacote — só exibe ao editar */}
                    {isEditing && (
                        <div className="pt-2 border-t border-white/10">
                            {justCreated && (
                                <p role="status" className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                                    Pacote criado! Agora adicione os itens. Quando terminar, clique em Salvar.
                                </p>
                            )}
                            <div className="flex items-center justify-between my-3">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">Itens do pacote <HelpTip helpKey="item.kind" /></h3>
                                <button
                                    type="button"
                                    onClick={() => { setEditingItem(null); setShowItemForm(true) }}
                                    className="text-xs px-3 py-1 rounded bg-[#C9A84C] text-black hover:bg-[#d8b65a] transition"
                                >
                                    + Adicionar item
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <p className="text-xs text-white/40 italic">
                                    Nenhum item ainda. Adicione o que está incluso, opcionais que o cliente pode escolher e cortesias.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {items.map((item) => {
                                        const line = lineTotalCents(item)
                                        return (
                                            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm text-white truncate">{item.name}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_STYLE[item.kind]}`}>{KIND_LABEL[item.kind]}</span>
                                                    </div>
                                                    {item.unitPriceCents > 0 && (
                                                        <p className="text-[11px] text-white/40 mt-0.5">
                                                            {formatQuantity(item.quantity)}{item.unit ? ` ${item.unit}` : ''} × {formatCents(item.unitPriceCents)} ={' '}
                                                            <span className={item.kind === 'COURTESY' ? 'line-through' : 'text-white/70'}>{formatCents(line)}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingItem(item); setShowItemForm(true) }}
                                                    className="shrink-0 text-xs text-white/50 hover:text-white transition"
                                                >
                                                    Editar
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}

                            {/* Resumo do preço com os valores atuais do formulário */}
                            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm space-y-1" aria-live="polite">
                                {preview.onRequest ? (
                                    <p className="text-white/70">Este pacote aparece como <strong>sob consulta</strong> para o cliente.</p>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-white/60">
                                            <span>{priceMode === 'FIXED' ? 'Valor fixo' : 'Soma dos itens incluídos'}</span>
                                            <span>{formatCents(preview.baseCents)}</span>
                                        </div>
                                        {preview.discountCents > 0 && (
                                            <div className="flex justify-between text-emerald-300">
                                                <span>Desconto</span>
                                                <span>− {formatCents(preview.discountCents)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-semibold text-white pt-1 border-t border-white/10">
                                            <span>Total para o cliente</span>
                                            <span className="text-[#C9A84C]">{formatCents(preview.totalCents)}</span>
                                        </div>
                                        {items.some((item) => item.kind === 'OPTIONAL') && (
                                            <p className="text-[11px] text-white/40">Opcionais somam quando o cliente marcar na proposta.</p>
                                        )}
                                        {preview.courtesyValueCents > 0 && (
                                            <p className="text-[11px] text-amber-300/80">Cortesias: o cliente ganha {formatCents(preview.courtesyValueCents)}.</p>
                                        )}
                                    </>
                                )}
                            </div>

                            {showItemForm && (
                                <PackageItemInlineForm
                                    packageId={pkg!.id}
                                    item={editingItem}
                                    onSaved={() => {
                                        setShowItemForm(false)
                                        refetchItems()
                                        queryClient.invalidateQueries({ queryKey: ['packages', providerId] })
                                    }}
                                    onCancel={() => setShowItemForm(false)}
                                />
                            )}
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            {isEditing && !confirmDeletePackage && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeletePackage(true)}
                                    className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" /> Deletar
                                </button>
                            )}
                            {isEditing && confirmDeletePackage && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Confirmar exclusão?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate()}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? 'Deletando...' : 'Sim, deletar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeletePackage(false)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/15 transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                        {saveError && (
                            <p role="alert" className="text-xs text-red-400 sm:mr-auto">
                                {saveError}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg border border-white/15 text-white/70 hover:bg-white/10 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saveMutation.isPending || uploading}
                                className="px-4 py-2 text-sm rounded-lg bg-[#C9A84C] text-black hover:bg-[#d8b65a] transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {saveMutation.isPending || uploading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : isEditing ? 'Salvar' : 'Criar pacote'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Sub-formulário inline para criar/editar itens
interface PackageItemInlineFormProps {
    packageId: string
    item: PackageItem | null
    onSaved: () => void
    onCancel: () => void
}

function PackageItemInlineForm({ packageId, item, onSaved, onCancel }: PackageItemInlineFormProps) {
    const [confirmDeleteItem, setConfirmDeleteItem] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm<PackageItemFormData>({
        resolver: zodResolver(PackageItemSchema),
        defaultValues: item
            ? {
                name: item.name,
                description: item.description ?? '',
                kind: item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED'),
                quantity: formatQuantity(item.quantity ?? 1),
                unit: item.unit ?? '',
                unitPrice: item.unitPriceCents ? centsToInput(item.unitPriceCents) : '',
                order: item.order,
            }
            : { kind: 'INCLUDED', quantity: '1', order: 0 },
    })

    const deleteMutation = useMutation({
        mutationFn: () => httpGateway.deletePackageItem(item!.id),
        onSuccess: onSaved,
    })

    const saveMutation = useMutation({
        mutationFn: (data: PackageItemFormData) =>
            item
                ? httpGateway.updatePackageItem(item.id, toPackageItemPayload(data))
                : httpGateway.createPackageItem({ ...toPackageItemPayload(data), packageId }),
        onSuccess: () => { reset(); onSaved() },
    })

    return (
        <div className="mt-3 p-3 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 space-y-3">
            <p className="text-xs font-medium text-white">{item ? 'Editar item' : 'Novo item'}</p>

            <div>
                <FieldLabel htmlFor="item-name">Nome do item</FieldLabel>
                <input id="item-name" {...register('name')} className={fieldClass} placeholder="Ex.: Horas de consultoria, Diária de filmagem" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <FieldLabel htmlFor="item-kind" helpKey="item.kind">Tipo</FieldLabel>
                <select id="item-kind" {...register('kind')} className={fieldClass}>
                    <option value="INCLUDED">Incluído no pacote</option>
                    <option value="OPTIONAL">Opcional (cliente escolhe)</option>
                    <option value="COURTESY">Cortesia (presente)</option>
                </select>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                <div>
                    <FieldLabel htmlFor="item-qty" helpKey="item.quantity">Qtd.</FieldLabel>
                    <input id="item-qty" inputMode="decimal" {...register('quantity')} className={fieldClass} placeholder="1" />
                </div>
                <div>
                    <FieldLabel htmlFor="item-unit">Unidade</FieldLabel>
                    <input id="item-unit" {...register('unit')} className={fieldClass} placeholder="h, un, diária" />
                </div>
                <div>
                    <FieldLabel htmlFor="item-price" helpKey="item.unitPrice">Valor unitário</FieldLabel>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 text-xs">R$</span>
                        <input id="item-price" inputMode="decimal" {...register('unitPrice')} className={`${fieldClass} pl-8`} placeholder="0,00" />
                    </div>
                </div>
            </div>
            {(errors.quantity || errors.unitPrice) && (
                <p className="text-xs text-red-400">{errors.quantity?.message ?? errors.unitPrice?.message}</p>
            )}

            <div>
                <FieldLabel htmlFor="item-description">Descrição (opcional)</FieldLabel>
                <input id="item-description" {...register('description')} className={fieldClass} placeholder="Detalhe que aparece para o cliente" />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    {item && !confirmDeleteItem && (
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteItem(true)}
                            className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                    )}
                    {item && confirmDeleteItem && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-red-400">Remover este item?</span>
                            <button
                                type="button"
                                onClick={() => deleteMutation.mutate()}
                                className="px-2.5 py-1 text-[11px] rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Removendo...' : 'Sim'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteItem(false)}
                                className="px-2.5 py-1 text-[11px] rounded bg-white/10 text-white/70 hover:bg-white/15"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs px-3 py-1.5 rounded border border-white/15 text-white/70 hover:bg-white/10 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit((data) => saveMutation.mutate(data))}
                        disabled={saveMutation.isPending}
                        className="text-xs px-3 py-1.5 rounded bg-[#C9A84C] text-black hover:bg-[#d8b65a] transition disabled:opacity-50"
                    >
                        {saveMutation.isPending ? 'Salvando...' : 'Salvar item'}
                    </button>
                </div>
            </div>
        </div>
    )
}
