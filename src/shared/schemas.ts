import { z } from 'zod'

/**
 * Schemas de validação Zod para Lumen Deal
 */

export const ProviderSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    email: z.string().email('Email inválido'),
    whatsapp: z.string().optional().refine(
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/\D/g, '')),
        'Número de WhatsApp inválido'
    ),
    instagram: z.string().optional().refine(
        (val) => !val || /^[a-zA-Z0-9_.-]{1,30}$/.test(val),
        'Username Instagram inválido'
    ),
    city: z.string().optional(),
    logoUrl: z.string().optional(),
    photoUrl: z.string().optional(),
    aboutTitle: z.string().optional(),
    aboutSubtitle: z.string().optional(),
    aboutText: z.string().optional(),
    shortDescription: z.string().optional(),
    packageLabel: z.string().optional(),
    contactInfo: z.object({
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
    }).optional(),
})

export const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Informe sua senha'),
})

export const RegisterSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128),
    workspaceName: z.string().max(120).optional(),
    segment: z.string().optional(),
})

export const PackageItemSchema = z.object({
    name: z.string().min(1, 'Nome do item obrigatório'),
    isCourtesy: z.boolean().default(false),
    order: z.number().int().nonnegative().default(0),
})

export const PackageSchema = z.object({
    name: z.string().min(3, 'Nome do pacote obrigatório'),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{2})?$/, 'Preço inválido'),
    isHighlighted: z.boolean().default(false),
    highlightLabel: z.string().optional(),
    highlightColor: z.string().optional(),
    mediaUrl: z.string().optional(),
    mediaType: z.string().optional(),
    itemIds: z.array(z.string()).default([]),
})

export const ProposalSchema = z.object({
    clientName: z.string().min(3, 'Nome do cliente obrigatório'),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras, números e hífen'),
    serviceDate: z.string().optional(),
    validityDays: z.number().int().positive().default(30),
    packageIds: z.array(z.string()).default([]),
    heroVideoUrl: z.string().optional(),
    weddingPhotoUrl: z.string().optional(),
    backstageMedia: z.array(z.object({ url: z.string(), type: z.string() })).default([]),
    differentialsMedia: z.array(z.object({ url: z.string(), type: z.string() })).default([]),
    theme: z.string().optional(),
    themeCustom: z.record(z.string(), z.any()).nullable().optional(),
    sections: z.array(z.any()).nullable().optional(),
    videoSoundEnabled: z.boolean().optional(),
    sectionsConfig: z.record(z.string(), z.any()).nullable().optional(),
})

export type ProviderFormData = z.infer<typeof ProviderSchema>
export type LoginFormData = z.infer<typeof LoginSchema>
export type RegisterFormData = z.infer<typeof RegisterSchema>
export type PackageItemFormData = z.infer<typeof PackageItemSchema>
export type PackageFormData = z.infer<typeof PackageSchema>
export type ProposalFormData = z.infer<typeof ProposalSchema>
