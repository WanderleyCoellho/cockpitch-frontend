/**
 * Tipos base do projeto Cockpitch
 */

export type ProposalMediaItem = {
    url: string
    type: 'image' | 'video'
}

export type PackageItem = {
    id: string
    packageId: string
    name: string
    isCourtesy: boolean
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
    price: string
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
    createdAt: string
    updatedAt: string
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
}
