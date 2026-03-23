import { z } from 'zod'

/**
 * Schemas de validação Zod para Cockpitch
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
})

export const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const RegisterSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
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
})

export type ProviderFormData = z.infer<typeof ProviderSchema>
export type LoginFormData = z.infer<typeof LoginSchema>
export type RegisterFormData = z.infer<typeof RegisterSchema>
export type PackageItemFormData = z.infer<typeof PackageItemSchema>
export type PackageFormData = z.infer<typeof PackageSchema>
export type ProposalFormData = z.infer<typeof ProposalSchema>
