import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { RegisterSchema, type RegisterFormData } from '../../shared/schemas'
import { SEGMENTS } from '../../shared/segments'
import { FieldLabel } from '../components/help/HelpTip'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register: registerUser, loading, error: authError } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchParams] = useSearchParams()
    // Cadastro a partir de um convite de equipe: entra direto na empresa de quem convidou.
    const inviteToken = searchParams.get('convite') ?? undefined
    const invitedEmail = searchParams.get('email') ?? ''

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: { email: invitedEmail, segment: 'GENERAL' },
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsSubmitting(true)
        try {
            await registerUser(data.name, data.email, data.password, {
                inviteToken,
                workspaceName: inviteToken ? undefined : data.workspaceName?.trim() || undefined,
                segment: inviteToken ? undefined : data.segment,
            })
            navigate('/dashboard')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta'
            setError('email', { message })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative hidden lg:flex overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.18),transparent_35%),linear-gradient(165deg,#121212_0%,#0B0B0B_70%)]">
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:56px_56px]" />
                <div className="relative z-10 max-w-xl px-14 py-16 flex flex-col justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-[#C9A84C] font-semibold">Lumen Deal</p>
                        <h1 className="mt-6 text-5xl leading-[1.05] font-light tracking-tight text-white">
                            Estruture sua vitrine comercial desde o primeiro acesso.
                        </h1>
                        <p className="mt-6 max-w-md text-white/50 leading-relaxed">
                            Cadastre sua conta, organize sua apresentação e publique propostas com mais direção estética e clareza de oferta.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-[#C9A84C]/20 bg-[#C9A84C]/8 p-6 max-w-lg">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C9A84C]">Primeiro passo</p>
                        <p className="mt-3 text-xl text-white leading-relaxed">
                            Conta criada. Prestador configurado. Propostas prontas para serem apresentadas com padrão profissional.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md p-8 space-y-6 bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/10 text-[#C9A84C]">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white">
                            Criar conta
                        </h1>
                        <p className="text-sm text-white/45 mt-2">
                            {inviteToken
                                ? 'Crie sua conta para entrar na equipe que te convidou.'
                                : 'Comece grátis. Monte propostas que seus clientes navegam, aceitam e baixam em PDF.'}
                        </p>
                    </div>

                    {authError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm inline-flex items-center gap-2 w-full">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5">Nome</label>
                            <input
                                type="text"
                                placeholder="Seu nome"
                                className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-300 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {!inviteToken && (
                            <>
                                <div>
                                    <FieldLabel htmlFor="workspaceName" helpKey="register.workspaceName">Nome da empresa</FieldLabel>
                                    <input
                                        id="workspaceName"
                                        type="text"
                                        placeholder="Ex.: Estúdio Luz (ou seu nome profissional)"
                                        className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                        {...register('workspaceName')}
                                    />
                                </div>

                                <div>
                                    <FieldLabel htmlFor="segment" helpKey="register.segment">Segmento</FieldLabel>
                                    <select
                                        id="segment"
                                        className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white focus:outline-none focus:border-[#C9A84C]/50 transition"
                                        {...register('segment')}
                                    >
                                        {SEGMENTS.map((segment) => (
                                            <option key={segment.id} value={segment.id}>
                                                {segment.label} ({segment.example})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5">Email</label>
                            <input
                                type="email"
                                readOnly={!!inviteToken}
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-300 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-medium tracking-widest uppercase text-white/50 mb-1.5">Senha</label>
                            <input
                                type="password"
                                placeholder="Mínimo de 8 caracteres"
                                className="w-full px-4 py-3 border border-white/15 rounded-xl bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 transition"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-300 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="w-full py-3 px-4 bg-[#C9A84C] text-black rounded-xl font-semibold hover:bg-[#d8b65a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                        >
                            {isSubmitting || loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
                                : <>Cadastrar <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-xs text-white/35">
                        Já possui conta?{' '}
                        <Link to="/login" className="text-[#C9A84C] hover:underline">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
