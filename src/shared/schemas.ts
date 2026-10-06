import { z } from 'zod'
import { LIMITS, parseMoneyToCents } from './pricing'

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

/** "1,5" ou "1.5" → 1.5 */
export function parseDecimalInput(value: string | undefined | null): number | null {
    if (value === undefined || value === null) return null
    const trimmed = String(value).trim().replace(/\s/g, '')
    if (!trimmed) return null
    const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed
    const number = Number(normalized)
    return Number.isFinite(number) ? number : null
}

const optionalMoney = z
    .string()
    .optional()
    .refine((value) => !value?.trim() || parseMoneyToCents(value) !== null, 'Valor inválido. Use, por exemplo, 1.500,00')

export const PackageItemSchema = z.object({
    name: z.string().trim().min(1, 'Nome do item obrigatório').max(200),
    description: z.string().max(500).optional(),
    kind: z.enum(['INCLUDED', 'OPTIONAL', 'COURTESY']).default('INCLUDED'),
    quantity: z
        .string()
        .default('1')
        .refine((value) => {
            const n = parseDecimalInput(value)
            return n !== null && n >= 0.01 && n <= LIMITS.maxQuantity
        }, `Quantidade entre 0,01 e ${LIMITS.maxQuantity.toLocaleString('pt-BR')}`),
    unit: z.string().max(20).optional(),
    unitPrice: optionalMoney,
    order: z.number().int().nonnegative().default(0),
})

export const PackageSchema = z
    .object({
        name: z.string().trim().min(2, 'Nome do pacote obrigatório').max(120),
        description: z.string().max(2000).optional(),
        priceMode: z.enum(['SUM_OF_ITEMS', 'FIXED', 'ON_REQUEST']).default('SUM_OF_ITEMS'),
        fixedPrice: optionalMoney,
        priceLabel: z.string().max(60).optional(),
        discountType: z.enum(['NONE', 'PERCENT', 'AMOUNT']).default('NONE'),
        discountInput: z.string().optional(),
        isHighlighted: z.boolean().default(false),
        highlightLabel: z.string().optional(),
        highlightColor: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.string().optional(),
        itemIds: z.array(z.string()).default([]),
    })
    .superRefine((data, ctx) => {
        if (data.priceMode === 'FIXED' && (!data.fixedPrice?.trim() || parseMoneyToCents(data.fixedPrice) === null)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fixedPrice'], message: 'Informe o valor do pacote (ex.: 3.500,00)' })
        }
        if (data.discountType === 'PERCENT') {
            const n = parseDecimalInput(data.discountInput)
            if (n === null || n < 0 || n > 100) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountInput'], message: 'Percentual entre 0 e 100' })
            }
        }
        if (data.discountType === 'AMOUNT' && (!data.discountInput?.trim() || parseMoneyToCents(data.discountInput) === null)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountInput'], message: 'Valor do desconto inválido' })
        }
    })

/** Converte o formulário (valores em texto, formato brasileiro) para o contrato da API (centavos). */
export function toPackagePayload(data: z.infer<typeof PackageSchema>) {
    const percent = parseDecimalInput(data.discountInput)
    return {
        name: data.name,
        description: data.description,
        priceMode: data.priceMode,
        fixedPriceCents: data.priceMode === 'FIXED' ? parseMoneyToCents(data.fixedPrice ?? '') : null,
        priceLabel: data.priceLabel?.trim() || null,
        discountType: data.discountType,
        discountValue:
            data.discountType === 'PERCENT'
                ? Math.round((percent ?? 0) * 100)
                : data.discountType === 'AMOUNT'
                  ? parseMoneyToCents(data.discountInput ?? '') ?? 0
                  : 0,
        isHighlighted: data.isHighlighted,
        highlightLabel: data.highlightLabel,
        highlightColor: data.highlightColor,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
    }
}

export function toPackageItemPayload(data: z.infer<typeof PackageItemSchema>) {
    return {
        name: data.name,
        description: data.description?.trim() || null,
        kind: data.kind,
        quantity: parseDecimalInput(data.quantity) ?? 1,
        unit: data.unit?.trim() || null,
        unitPriceCents: data.unitPrice?.trim() ? parseMoneyToCents(data.unitPrice) ?? 0 : 0,
        order: data.order,
    }
}

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
