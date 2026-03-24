import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { X, Image, Loader2, AlertTriangle, Camera, Trash2 } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { ProviderSchema, type ProviderFormData } from '../../shared/schemas'

const fieldClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/60 transition text-sm'
const labelClass = 'block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5'
const errorClass = 'text-xs text-red-400 mt-1.5 flex items-center gap-1'

export default function ProviderForm({ provider, onClose }) {
    const [logoPreview, setLogoPreview] = useState<string | null>(provider?.logoUrl ?? null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(provider?.photoUrl ?? null)
    const [logoFailed, setLogoFailed] = useState(false)
    const [photoFailed, setPhotoFailed] = useState(false)
    const [uploading, setUploading] = useState<'logo' | 'photo' | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<ProviderFormData>({
        resolver: zodResolver(ProviderSchema),
        defaultValues: provider || {},
    })

    const createMutation = useMutation({
        mutationFn: (data: ProviderFormData) => httpGateway.createProvider(data),
        onSuccess: () => onClose(),
    })

    const updateMutation = useMutation({
        mutationFn: (data: ProviderFormData) => httpGateway.updateProvider(provider.id, data),
        onSuccess: () => onClose(),
    })

    const deleteMutation = useMutation({
        mutationFn: () => httpGateway.deleteProvider(provider.id),
        onSuccess: () => onClose(),
    })

    const handleFileUpload = async (file: File, type: 'logo' | 'photo') => {
        setUploading(type)
        setUploadError(null)
        try {
            const { file_url } = await httpGateway.uploadFile(file)
            if (type === 'logo') {
                setLogoPreview(file_url)
                setLogoFailed(false)
                setValue('logoUrl', file_url)
            } else {
                setPhotoPreview(file_url)
                setPhotoFailed(false)
                setValue('photoUrl', file_url)
            }
        } catch {
            setUploadError('Erro ao enviar arquivo. Tente novamente.')
        } finally {
            setUploading(null)
        }
    }

    const onSubmit = async (data: ProviderFormData) => {
        if (provider) await updateMutation.mutateAsync(data)
        else await createMutation.mutateAsync(data)
    }

    const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

    return (
        <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.65)] max-h-[90vh] overflow-y-auto text-white">

                <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {provider ? 'Editar Prestador' : 'Novo Prestador'}
                        </h2>
                        {provider && <p className="text-xs text-white/35 mt-0.5">{provider.email}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">

                    {uploadError && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {uploadError}
                        </div>
                    )}

                    <section className="space-y-3">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">Identidade Visual</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className={labelClass}>Logo</span>
                                <label className={`flex aspect-video rounded-xl border-2 border-dashed cursor-pointer transition overflow-hidden ${logoPreview ? 'border-white/20' : 'border-white/10 hover:border-[#C9A84C]/40'}`}>
                                    {logoPreview ? (
                                        <div className="relative w-full h-full group">
                                            {logoFailed ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-3 text-center bg-white/5">
                                                    <p className="text-[11px] text-white/55">Falha ao carregar logo</p>
                                                    <a href={logoPreview} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-wider text-[#C9A84C]">
                                                        Abrir imagem
                                                    </a>
                                                </div>
                                            ) : (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain p-3"
                                                    onError={() => setLogoFailed(true)}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="text-xs text-white font-medium">Trocar</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full gap-2 p-4">
                                            {uploading === 'logo'
                                                ? <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                                                : <><Image className="w-6 h-6 text-white/20" /><span className="text-xs text-white/30 text-center leading-snug">Clique para enviar logo</span></>
                                            }
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} disabled={!!uploading} />
                                </label>
                            </div>
                            <div>
                                <span className={labelClass}>Foto de Perfil</span>
                                <label className={`flex aspect-video rounded-xl border-2 border-dashed cursor-pointer transition overflow-hidden ${photoPreview ? 'border-white/20' : 'border-white/10 hover:border-[#C9A84C]/40'}`}>
                                    {photoPreview ? (
                                        <div className="relative w-full h-full group">
                                            {photoFailed ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-3 text-center bg-white/5">
                                                    <p className="text-[11px] text-white/55">Falha ao carregar foto</p>
                                                    <a href={photoPreview} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-wider text-[#C9A84C]">
                                                        Abrir imagem
                                                    </a>
                                                </div>
                                            ) : (
                                                <img
                                                    src={photoPreview}
                                                    alt="Foto"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setPhotoFailed(true)}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="text-xs text-white font-medium">Trocar</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full gap-2 p-4">
                                            {uploading === 'photo'
                                                ? <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                                                : <><Camera className="w-6 h-6 text-white/20" /><span className="text-xs text-white/30 text-center leading-snug">Clique para enviar foto</span></>
                                            }
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')} disabled={!!uploading} />
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">Informações Básicas</p>
                        <div>
                            <label className={labelClass}>Nome Completo *</label>
                            <input type="text" placeholder="Studio de Fotografia ABC" className={fieldClass} {...register('name')} />
                            {errors.name && <p className={errorClass}><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input type="email" placeholder="contato@studio.com" className={fieldClass} {...register('email')} />
                                {errors.email && <p className={errorClass}><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Cidade</label>
                                <input type="text" placeholder="São Paulo, SP" className={fieldClass} {...register('city')} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Rótulo para Pacotes</label>
                            <input type="text" placeholder="Ex: Serviços, Opções, Planos" className={fieldClass} {...register('packageLabel')} />
                            <p className="text-[11px] text-white/30 mt-1">Como os pacotes serão chamados na proposta. Padrão: "Pacotes".</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>WhatsApp</label>
                                <input type="tel" placeholder="+55 11 99999-9999" className={fieldClass} {...register('whatsapp')} />
                                {errors.whatsapp && <p className={errorClass}><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{errors.whatsapp.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Instagram</label>
                                <input type="text" placeholder="@seu_usuario" className={fieldClass} {...register('instagram')} />
                                {errors.instagram && <p className={errorClass}><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{errors.instagram.message}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">Redes Sociais</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Facebook</label>
                                <input type="text" placeholder="URL do seu perfil no Facebook" className={fieldClass} {...register('contactInfo.facebook')} />
                            </div>
                            <div>
                                <label className={labelClass}>Twitter</label>
                                <input type="text" placeholder="URL do seu perfil no Twitter" className={fieldClass} {...register('contactInfo.twitter')} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>LinkedIn</label>
                            <input type="text" placeholder="URL do seu perfil no LinkedIn" className={fieldClass} {...register('contactInfo.linkedin')} />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#C9A84C]">Sobre o Estúdio</p>
                        <div>
                            <label className={labelClass}>Descrição Curta</label>
                            <input type="text" placeholder="Fotografia e vídeo para casamentos" className={fieldClass} {...register('shortDescription')} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Título (seção Sobre)</label>
                                <input type="text" placeholder="Nossa História" className={fieldClass} {...register('aboutTitle')} />
                            </div>
                            <div>
                                <label className={labelClass}>Subtítulo</label>
                                <input type="text" placeholder="Mais de 10 anos capturando momentos" className={fieldClass} {...register('aboutSubtitle')} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Texto Completo</label>
                            <textarea placeholder="Descreva sua história, experiência e diferenciais..." rows={5} className={`${fieldClass} resize-none`} {...register('aboutText')} />
                        </div>
                    </section>

                    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6">
                        <div>
                            {provider && !confirmDelete && (
                                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition">
                                    <Trash2 className="w-4 h-4" /> Deletar
                                </button>
                            )}
                            {confirmDelete && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-red-400">Confirmar exclusão?</span>
                                    <button type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition">
                                        {deleteMutation.isPending ? 'Deletando...' : 'Sim, deletar'}
                                    </button>
                                    <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs bg-white/10 text-white/70 rounded-lg hover:bg-white/15 transition">
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-white/5 text-white/70 rounded-xl font-medium hover:bg-white/10 transition">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 transition">
                                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
