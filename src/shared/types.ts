/**
 * Tipos base do projeto Lumen Deal
 */

export type ProposalMediaItem = {
    url: string
    type: 'image' | 'video'
}

export type PackageItemKind = 'INCLUDED' | 'OPTIONAL' | 'COURTESY'

export type PackageItem = {
    id: string
    packageId: string
    name: string
    description?: string | null
    isCourtesy: boolean
    kind: PackageItemKind
    quantity: number
    unit?: string | null
    unitPriceCents: number
    order: number
}

export type Testimonial = {
    quote: string
    author?: string
    city?: string
    venue?: string
    photoUrl?: string
    refPhotoUrl?: string
    refVideoUrl?: string
}

export type Partner = {
    name: string
    link?: string
    photoUrl?: string
}

export type ProposalSection = {
    id: string
    label: string
    enabled: boolean
    order: number
    pinned?: boolean
}

export type ThemeCustom = {
    bg?: string
    card_bg?: string
    text?: string
    accent?: string
    heading_font?: string
    body_font?: string
}

export type Provider = {
    id: string
    name: string
    email: string
    whatsapp?: string
    instagram?: string
    city?: string
    logoUrl?: string
    photoUrl?: string
    shortDescription?: string
    aboutTitle?: string
    aboutSubtitle?: string
    aboutText?: string
    styleText?: string
    heroVideoUrl?: string
    deliveryTimes?: string
    differentialsTitle?: string
    differentialsText?: string
    chips?: string[]
    testimonials?: Testimonial[]
    differentialsMedia?: ProposalMediaItem[]
    aboutPortfolioMedia?: ProposalMediaItem[]
    partners?: Partner[]
    packageLabel?: string
    createdAt: string
    updatedAt: string
}

export type Package = {
    id: string
    providerId: string
    name: string
    description?: string
    /** Legado: total calculado em texto ("3500.00") ou o rótulo quando é sob consulta. */
    price: string
    priceMode: 'SUM_OF_ITEMS' | 'FIXED' | 'ON_REQUEST'
    fixedPriceCents?: number | null
    discountType: 'NONE' | 'PERCENT' | 'AMOUNT'
    discountValue: number
    priceLabel?: string | null
    pricing?: import('./pricing').PackagePricing
    items?: PackageItem[]
    isHighlighted: boolean
    highlightLabel?: string
    highlightColor?: string
    ctaText?: string
    mediaUrl?: string
    mediaType?: string
    itemIds: string[]
    courtesyIds: string[]
    order: number
    createdAt: string
    updatedAt: string
}

export type Proposal = {
    id: string
    providerId: string
    clientName: string
    slug: string
    serviceDate?: string
    validityDays: number
    status: 'aberta' | 'fechada' | 'expirada' | 'arquivada'
    commercialStatus?: 'sem_resposta' | 'negociando' | 'aceita' | 'negada' | 'personalizado'
    packageIds: string[]
    provider?: Provider
    heroVideoUrl?: string
    weddingPhotoUrl?: string
    backstageMedia?: ProposalMediaItem[]
    differentialsMedia?: ProposalMediaItem[]
    theme?: string
    themeCustom?: ThemeCustom | null
    sections?: ProposalSection[] | null
    sectionsConfig?: Record<string, any> | null
    videoSoundEnabled?: boolean
    packages?: Array<Package & { items?: PackageItem[] }>
    /** Estado do aceite online (só na página pública). */
    acceptance?: AcceptanceState
    /** Página pública: false = mostra "Feito com Lumen Deal" (plano Grátis). */
    branding?: { removeBranding: boolean }
    /** Painel: total de respostas do cliente e a mais recente. */
    responsesCount?: number
    lastResponse?: { type: ProposalResponseType; signerName: string; createdAt: string } | null
    /** Proposta em blocos; null = layout legado. */
    blocks?: import('./blocks').ProposalBlock[] | null
    templateId?: string | null
    createdAt: string
    updatedAt: string
}

export type ProposalResponseType = 'ACCEPTED' | 'DECLINED' | 'CHANGE_REQUESTED'

export type AcceptanceState = {
    enabled: boolean
    state: 'OPEN' | 'ACCEPTED' | 'EXPIRED' | 'CLOSED'
    expiresAt: string
    acceptedAt?: string
    acceptedBy?: string
    /** O que foi aceito (sem dados pessoais além do nome). */
    accepted?: {
        packageId: string | null
        optionalIds: string[]
        packageName: string | null
        optionals: string[]
        totalCents: number | null
        contentHash: string
    }
}

export type ResponseSelection = {
    packageId: string
    packageName: string
    optionals: Array<{ id: string; name: string; cents: number }>
    pricing: { onRequest: boolean; baseCents: number; optionalsCents: number; discountCents: number; totalCents: number }
}

export type ProposalResponse = {
    id: string
    type: ProposalResponseType
    signerName: string
    signerEmail: string
    signerDocument?: string | null
    message?: string | null
    selection?: ResponseSelection | null
    totalCents?: number | null
    contentHash: string
    ip?: string | null
    userAgent?: string | null
    createdAt: string
}

export type ProposalTemplate = {
    id: string
    /** true = modelo pronto do Lumen Deal (ids sys-*); false = modelo salvo pela empresa. */
    system: boolean
    name: string
    description?: string | null
    segment: string
    theme?: string | null
    themeCustom?: ThemeCustom | null
    blocks: import('./blocks').ProposalBlock[]
    createdAt?: string
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'AGENCY'

export type Entitlements = {
    tier: PlanTier
    effectiveTier: PlanTier
    isCourtesy: boolean
    proposalsPerMonth: number
    members: number
    storageGb: number
    removeBranding: boolean
    customTemplates: boolean
    emailNotifications: boolean
    analytics: boolean
}

export type WorkspaceSummary = {
    id: string
    name: string
    slug: string
    segment: string
    logoUrl?: string | null
    brandColor?: string | null
    role: WorkspaceRole
    planTier: PlanTier
    billingStatus: 'INACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    licensePolicy: 'STANDARD' | 'COURTESY'
    licensePolicyNote?: string | null
    providerId: string | null
    entitlements: Entitlements
}

export type WorkspaceDetails = WorkspaceSummary & {
    locale: string
    currency: string
    usage: { proposalsThisMonth: number; members: number; pendingInvites: number }
}

export type WorkspaceMemberItem = {
    id: string
    role: WorkspaceRole
    createdAt: string
    user: { id: string; name: string; email: string }
}

export type WorkspaceInviteItem = {
    id: string
    email: string
    role: WorkspaceRole
    expiresAt: string
    createdAt: string
}

export type AuthUser = {
    id: string
    email: string
    name: string
    role: 'PROVIDER' | 'CUSTOMER' | 'ADMIN'
    providerId?: string | null
    planTier?: 'FREE' | 'STARTER' | 'PRO' | 'AGENCY'
    billingStatus?: 'INACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    licensePolicy?: 'STANDARD' | 'COURTESY'
    licensePolicyNote?: string | null
    activeWorkspaceId?: string | null
    workspaces?: WorkspaceSummary[]
}
