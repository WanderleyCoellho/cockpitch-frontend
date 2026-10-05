import { useParams } from 'react-router-dom'
import { sanitizeHtml } from '../../shared/sanitizeHtml'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Mail, Phone, Instagram, Check, Quote, ChevronDown, Play, ImageOff, ExternalLink } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { getThemeTokens, type ThemeTokens } from '../components/proposal/ThemeSelector'
import { normalizeSections } from '../components/proposal/SectionsEditor'
import type { Proposal, Provider, Package, PackageItem, ProposalMediaItem, Testimonial } from '../../shared/types'

function genSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function getFontUrl(fonts: (string | undefined)[]) {
    const all = [...new Set(fonts.filter(Boolean))] as string[]
    return `https://fonts.googleapis.com/css2?${all.map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600`).join('&')}&display=swap`
}

function getEmbedUrl(url: string): string | null {
    if (!url) return null

    try {
        const parsed = new URL(url)
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

        if (host === 'youtube.com' || host === 'm.youtube.com') {
            if (parsed.pathname === '/watch') {
                const id = parsed.searchParams.get('v')
                return id ? `https://www.youtube.com/embed/${id}` : null
            }
            if (parsed.pathname.startsWith('/shorts/')) {
                const id = parsed.pathname.split('/')[2]
                return id ? `https://www.youtube.com/embed/${id}` : null
            }
            if (parsed.pathname.startsWith('/embed/')) {
                return url
            }
        }

        if (host === 'youtu.be') {
            const id = parsed.pathname.replace(/^\//, '').split('/')[0]
            return id ? `https://www.youtube.com/embed/${id}` : null
        }

        if (host === 'vimeo.com' || host === 'player.vimeo.com') {
            const idMatch = parsed.pathname.match(/(\d+)/)
            return idMatch ? `https://player.vimeo.com/video/${idMatch[1]}` : null
        }
    } catch {
        return null
    }

    return null
}

function isLikelyVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i.test(url)
}

function isVideoMedia(item: ProposalMediaItem): boolean {
    return item.type === 'video' || isLikelyVideoUrl(item.url)
}

function MediaFallbackPanel({
    message,
    href,
}: {
    message: string
    href?: string
}) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center"
            style={{
                background: 'linear-gradient(135deg, var(--pp-card-bg) 0%, color-mix(in srgb, var(--pp-card-bg) 85%, var(--pp-bg)) 100%)',
                color: 'var(--pp-muted)',
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--pp-accent) 14%, transparent)' }}>
                <ImageOff className="w-4 h-4" style={{ color: 'var(--pp-accent)' }} />
            </div>
            <p className="pp-body text-xs">{message}</p>
            {href && (
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="pp-body text-[10px] uppercase tracking-widest inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{
                        color: 'var(--pp-accent)',
                        border: '1px solid color-mix(in srgb, var(--pp-accent) 40%, transparent)',
                    }}
                >
                    <ExternalLink className="w-3 h-3" /> Abrir mídia
                </a>
            )}
        </div>
    )
}

function MediaAsset({
    item,
    alt,
    variant,
    className,
}: {
    item: ProposalMediaItem
    alt: string
    variant: 'ambient' | 'controlled'
    className: string
}) {
    const [failed, setFailed] = useState(false)

    if (failed) {
        return (
            <MediaFallbackPanel message="Não foi possível carregar esta mídia." href={item.url} />
        )
    }

    if (isVideoMedia(item)) {
        if (variant === 'ambient') {
            return (
                <video
                    src={item.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={() => setFailed(true)}
                    className={className}
                />
            )
        }

        return (
            <video
                src={item.url}
                controls
                onError={() => setFailed(true)}
                className={className}
            />
        )
    }

    return <img src={item.url} alt={alt} onError={() => setFailed(true)} className={className} />
}

function ImageAsset({
    src,
    alt,
    className,
    fallback,
}: {
    src: string
    alt: string
    className: string
    fallback?: React.ReactNode
}) {
    const [failed, setFailed] = useState(false)

    if (failed) {
        return (
            fallback ?? (
                <MediaFallbackPanel message="Imagem indisponível" />
            )
        )
    }

    return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}

function sectionLabel(id: string) {
    const map: Record<string, string> = {
        about: 'Sobre nós',
        differentials: 'Diferenciais',
        testimonial: 'Depoimento',
        packages: 'Pacotes',
        contact: 'Contato',
    }
    return map[id] ?? id
}

// â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface HeroProps {
    proposal: Proposal
    provider?: Provider
    heroWatched: boolean
    onHeroWatched: (v: boolean) => void
    nextLabel: string | null
    tk: ThemeTokens
}

function HeroSection({ proposal, provider, heroWatched, onHeroWatched, nextLabel, tk }: HeroProps) {
    const heroVideoUrl = proposal.heroVideoUrl ?? provider?.heroVideoUrl ?? ''
    const embed = getEmbedUrl(heroVideoUrl)
    const isDirectVideo = !!heroVideoUrl && !embed
    const hasVideo = !!heroVideoUrl && (isDirectVideo || !!embed)
    const [videoPlaybackError, setVideoPlaybackError] = useState(false)
    const [heroBgFailed, setHeroBgFailed] = useState(false)

    useEffect(() => {
        setVideoPlaybackError(false)
    }, [heroVideoUrl])

    const TextOverlay = () => (
        <div className="text-center">
            {proposal.serviceDate && (
                <p className="pp-body text-xs tracking-widest uppercase mb-4 font-medium" style={{ color: 'var(--pp-accent)' }}>
                    {new Date(proposal.serviceDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                    })}
                </p>
            )}
            <h1 className="pp-heading text-4xl md:text-6xl lg:text-7xl font-light italic leading-tight mb-4" style={{ color: 'var(--pp-text)' }}>
                {proposal.clientName}
            </h1>
            {provider?.shortDescription && (
                <p className="pp-body text-sm max-w-md leading-relaxed mx-auto" style={{ color: 'var(--pp-muted)' }}>
                    {provider.shortDescription}
                </p>
            )}
        </div>
    )

    return (
        <section id="hero" data-section="hero" className="relative min-h-screen flex flex-col" style={{ paddingTop: '72px' }}>
            {proposal.weddingPhotoUrl && !heroBgFailed ? (
                <div className="absolute inset-0">
                    <img src={proposal.weddingPhotoUrl} alt="" className="w-full h-full object-cover" onError={() => setHeroBgFailed(true)} />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${tk.bg}99 0%, ${tk.bg}CC 50%, ${tk.bg} 100%)` }} />
                </div>
            ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${tk.bg} 0%, ${tk.card_bg} 100%)` }} />
            )}

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20">
                {hasVideo && (
                    <div className="w-full max-w-4xl mb-10 relative">
                        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid var(--pp-border)' }}>
                            {isDirectVideo ? (
                                <video
                                    src={heroVideoUrl}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    onError={() => setVideoPlaybackError(true)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <iframe src={embed!} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" />
                            )}
                        </div>
                        {!heroWatched && !isDirectVideo && (
                            <button
                                onClick={() => onHeroWatched(true)}
                                className="mt-3 text-xs opacity-40 hover:opacity-80 transition-opacity flex items-center gap-1.5 mx-auto"
                                style={{ color: 'var(--pp-muted)' }}
                            >
                                <Play className="w-3 h-3" /> Assistiu ao vídeo?
                            </button>
                        )}
                    </div>
                )}
                {!!heroVideoUrl && isDirectVideo && videoPlaybackError && (
                    <div className="w-full max-w-2xl mb-10 rounded-2xl px-6 py-5 text-center"
                        style={{ border: '1px solid var(--pp-border)', background: 'var(--pp-card-bg)' }}>
                        <p className="pp-body text-sm mb-2" style={{ color: 'var(--pp-text)' }}>
                            Este vídeo não é compatível com reprodução direta neste navegador.
                        </p>
                        <p className="pp-body text-xs mb-4" style={{ color: 'var(--pp-muted)' }}>
                            Recomendação: reenviar o arquivo em MP4 ou WebM.
                        </p>
                        <a href={heroVideoUrl} target="_blank" rel="noreferrer"
                            className="pp-body text-xs font-medium uppercase tracking-widest"
                            style={{ color: 'var(--pp-accent)' }}>
                            Abrir vídeo em nova guia
                        </a>
                    </div>
                )}
                <TextOverlay />

                {nextLabel && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                        <p className="pp-body text-[10px] tracking-widest uppercase" style={{ color: 'var(--pp-muted)' }}>
                            {nextLabel.toUpperCase()}
                        </p>
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--pp-muted)' }} />
                    </div>
                )}
            </div>
        </section>
    )
}

// â”€â”€ ABOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AboutSection({ provider, tk }: { provider?: Provider; tk: ThemeTokens }) {
    if (!provider?.aboutText && !provider?.aboutTitle && !provider?.photoUrl) return null

    const portfolioMedia: ProposalMediaItem[] = provider?.aboutPortfolioMedia?.length
        ? provider.aboutPortfolioMedia.slice(0, 2)
        : provider?.photoUrl
            ? [{ url: provider.photoUrl, type: 'image' }]
            : []

    return (
        <section id="about" data-section="about" className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-card-bg)' }}>
            <div className="max-w-2xl mx-auto">
                {provider?.aboutTitle && (
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-3 text-center" style={{ color: 'var(--pp-text)' }}>
                        {provider.aboutTitle}
                    </h2>
                )}
                {provider?.aboutSubtitle && (
                    <p className="pp-body text-sm tracking-wide mb-6 text-center" style={{ color: 'var(--pp-accent)' }}>
                        {provider.aboutSubtitle}
                    </p>
                )}
                <div className="pp-divider mb-8" />

                {provider?.aboutText && (
                    <div
                        className="pp-body text-sm leading-relaxed mb-8"
                        style={{ color: 'var(--pp-muted)' }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(provider.aboutText) }}
                    />
                )}

                {portfolioMedia.length > 0 && (
                    <div className="flex justify-center items-start mb-10">
                        {portfolioMedia.map((item, i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-2xl shadow-2xl flex-shrink-0"
                                style={{
                                    width: portfolioMedia.length === 1 ? '220px' : '180px',
                                    aspectRatio: '9/16',
                                    border: `2px solid var(--pp-accent)`,
                                    marginLeft: i === 1 ? '-24px' : '0',
                                    marginTop: i === 1 ? '40px' : '0',
                                    zIndex: i === 0 ? 2 : 1,
                                    position: 'relative',
                                }}
                            >
                                <MediaAsset
                                    item={item}
                                    alt={i === 0 ? 'Portfólio' : 'Prestador'}
                                    variant="ambient"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {provider?.chips && provider.chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {provider.chips.map((c, i) => (
                            <span key={i} className="pp-body px-4 py-1.5 rounded-full text-xs font-medium"
                                style={{ border: `1px solid var(--pp-accent)`, color: 'var(--pp-accent)', opacity: 0.8 }}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}

                {provider?.styleText && (
                    <div className="mt-2">
                        <h3 className="pp-heading text-xl font-light italic mb-3" style={{ color: 'var(--pp-text)' }}>Nosso estilo</h3>
                        <p className="pp-body text-sm leading-relaxed" style={{ color: 'var(--pp-muted)' }}>{provider.styleText}</p>
                    </div>
                )}
            </div>
        </section>
    )
}

// â”€â”€ DIFFERENTIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DifferentialsSection({ proposal, provider, tk }: { proposal: Proposal; provider?: Provider; tk: ThemeTokens }) {
    const title = provider?.differentialsTitle ?? 'Nossa equipe e perspectiva única'
    const text = provider?.differentialsText
    const media: ProposalMediaItem[] = proposal.differentialsMedia?.length
        ? proposal.differentialsMedia
        : provider?.differentialsMedia ?? []

    if (!text && media.length === 0 && !provider?.differentialsTitle) return null

    return (
        <section id="differentials" data-section="differentials" className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-bg)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>{title}</h2>
                    <div className="pp-divider mb-6" />
                    {text && (
                        <p className="pp-body text-sm leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--pp-muted)' }}>{text}</p>
                    )}
                </div>
                {media.length > 0 && (
                    <div className={`grid gap-4 max-w-4xl mx-auto ${media.length === 1 ? 'grid-cols-1' : media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                        {media.map((item, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--pp-border)' }}>
                                <MediaAsset
                                    item={item}
                                    alt="Mídia de diferenciais"
                                    variant="controlled"
                                    className="w-full aspect-video object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

// â”€â”€ TESTIMONIAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TestimonialSection({ provider, tk }: { provider?: Provider; tk: ThemeTokens }) {
    const [active, setActive] = useState(0)
    const testimonials: Testimonial[] = provider?.testimonials ?? []

    if (!testimonials.length) return null

    const t = testimonials[active] ?? testimonials[0]
    const embedUrl = t.refVideoUrl ? getEmbedUrl(t.refVideoUrl) : null

    return (
        <section id="testimonial" data-section="testimonial" className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-card-bg)' }}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <Quote className="w-8 h-8 mx-auto mb-8 opacity-30" style={{ color: 'var(--pp-accent)' }} />
                    <blockquote className="pp-heading text-xl md:text-2xl font-light italic leading-relaxed mb-8 max-w-2xl mx-auto" style={{ color: 'var(--pp-text)' }}>
                        "{t.quote}"
                    </blockquote>
                    <div className="pp-divider mb-6" />
                    <div className="flex items-center justify-center gap-3 mb-2">
                        {t.photoUrl && (
                            <div className="w-10 h-10 rounded-full overflow-hidden"
                                style={{ border: '2px solid var(--pp-accent)', opacity: 0.85 }}>
                                <ImageAsset
                                    src={t.photoUrl}
                                    alt={t.author ?? 'Depoimento'}
                                    className="w-full h-full object-cover"
                                    fallback={
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: 'var(--pp-card-bg)', color: 'var(--pp-accent)' }}>
                                            <Quote className="w-3.5 h-3.5" />
                                        </div>
                                    }
                                />
                            </div>
                        )}
                        <div className="text-left">
                            {t.author && <p className="pp-body text-sm font-semibold" style={{ color: 'var(--pp-text)' }}>{t.author}</p>}
                            {(t.city ?? t.venue) && (
                                <p className="pp-body text-xs" style={{ color: 'var(--pp-muted)' }}>
                                    {[t.city, t.venue].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {(t.refPhotoUrl ?? embedUrl) && (
                    <div className="max-w-2xl mx-auto mb-10">
                        {embedUrl ? (
                            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl" style={{ border: '1px solid var(--pp-border)' }}>
                                <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" />
                            </div>
                        ) : t.refPhotoUrl ? (
                            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: '1px solid var(--pp-border)' }}>
                                <ImageAsset
                                    src={t.refPhotoUrl}
                                    alt="Referência"
                                    className="w-full object-cover max-h-80"
                                    fallback={
                                        <div className="w-full h-52">
                                            <MediaFallbackPanel message="Referência indisponível" href={t.refPhotoUrl} />
                                        </div>
                                    }
                                />
                            </div>
                        ) : null}
                    </div>
                )}

                {testimonials.length > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className="rounded-full transition-all"
                                style={{
                                    width: i === active ? '20px' : '6px',
                                    height: '6px',
                                    background: i === active ? 'var(--pp-accent)' : 'var(--pp-muted)',
                                    opacity: i === active ? 1 : 0.3,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

// â”€â”€ PACKAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PackagesSectionProps {
    proposal: Proposal
    packages: Array<Package & { items?: PackageItem[] }>
    provider?: Provider
    tk: ThemeTokens
    onPackageExpand?: (pkgId: string) => void
}

function PackagesSection({ proposal, packages, provider, tk, onPackageExpand }: PackagesSectionProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const packageLabel = provider?.packageLabel || 'Pacotes'
    const packageLabelSingular = provider?.packageLabel?.replace(/s$/, '') || 'pacote'

    const toggle = (pkgId: string) => {
        setExpanded((prev) => {
            if (!prev[pkgId] && onPackageExpand) onPackageExpand(pkgId)
            return { ...prev, [pkgId]: !prev[pkgId] }
        })
    }

    if (!packages || packages.length === 0) return null

    return (
        <section id="packages" data-section="packages" className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-bg)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <p className="pp-body text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: 'var(--pp-accent)' }}>Investimento</p>
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>{packageLabel}</h2>
                    <div className="pp-divider mb-4" />
                    <p className="pp-body text-sm" style={{ color: 'var(--pp-muted)' }}>Toque em um {packageLabelSingular.toLowerCase()} para ver os detalhes</p>
                </div>
                <div className={`grid gap-6 ${packages.length === 1 ? 'max-w-sm mx-auto' : packages.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
                    {packages.map((pkg) => {
                        const isOpen = !!expanded[pkg.id]
                        const hasMedia = pkg.mediaUrl && pkg.mediaUrl.length > 0;

                        return (
                            <div
                                key={pkg.id}
                                className="relative flex flex-col rounded-3xl overflow-hidden transition-all cursor-pointer"
                                onClick={() => toggle(pkg.id)}
                                style={{
                                    background: pkg.isHighlighted
                                        ? `linear-gradient(135deg, ${pkg.highlightColor ?? tk.accent}15 0%, ${tk.card_bg} 70%)`
                                        : tk.card_bg,
                                    border: `1px solid ${pkg.isHighlighted ? (pkg.highlightColor ?? tk.accent) + '55' : 'var(--pp-border)'}`,
                                    boxShadow: pkg.isHighlighted ? `0 0 40px ${(pkg.highlightColor ?? tk.accent)}18` : 'none',
                                }}
                            >
                                {/* Media Background */}
                                {hasMedia && pkg.mediaType === 'video' ? (
                                    <video src={pkg.mediaUrl} autoPlay loop muted className="absolute inset-0 w-full h-full object-contain" />
                                ) : hasMedia && pkg.mediaType === 'image' ? (
                                    <img src={pkg.mediaUrl} alt={pkg.name} className="absolute inset-0 w-full h-full object-contain" />
                                ) : null}

                                {/* Overlay */}
                                {hasMedia && <div className="absolute inset-0 bg-black/60" />}
                                
                                {pkg.isHighlighted && pkg.highlightLabel && (
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold z-10"
                                        style={{ background: pkg.highlightColor ?? tk.accent, color: tk.bg }}>
                                        {pkg.highlightLabel}
                                    </div>
                                )}

                                <div className="relative z-10 p-7 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="pp-heading text-2xl font-light mb-1" style={{ color: 'var(--pp-accent)' }}>{pkg.price}</p>
                                                <h3 className="pp-heading text-xl font-semibold mb-2" style={{ color: 'var(--pp-text)' }}>{pkg.name}</h3>
                                                {pkg.description && (
                                                    <p className="pp-body text-sm leading-relaxed" style={{ color: 'var(--pp-muted)' }}>{pkg.description}</p>
                                                )}
                                            </div>
                                            <ChevronDown
                                                className="w-5 h-5 flex-shrink-0 mt-1 transition-transform duration-300"
                                                style={{ color: 'var(--pp-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="relative z-10 px-7 pb-7 pt-4 border-t" style={{ borderColor: 'var(--pp-border)', background: 'color-mix(in srgb, var(--pp-card-bg) 70%, transparent)' }}
                                        onClick={(e) => e.stopPropagation()}>
                                        {pkg.items && pkg.items.length > 0 && (
                                            <ul className="space-y-2.5 my-4">
                                                {pkg.items.map((item) => {
                                                    const isCourtesy = pkg.courtesyIds?.includes(item.id) ?? item.isCourtesy
                                                    return (
                                                        <li key={item.id} className="flex items-center gap-2.5 pp-body text-sm"
                                                            style={{ color: isCourtesy ? 'var(--pp-accent)' : 'var(--pp-muted)' }}>
                                                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} />
                                                            <span>{item.name}</span>
                                                            {isCourtesy && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-medium"
                                                                    style={{ background: 'var(--pp-accent)', color: '#000', opacity: 0.85 }}>
                                                                    Cortesia
                                                                </span>
                                                            )}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                        {provider?.whatsapp && (
                                            <a
                                                href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=Olá! Tenho interesse no ${encodeURIComponent(pkg.name)} para ${encodeURIComponent(proposal.clientName)}.`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-2 block text-center py-3 px-6 rounded-2xl text-sm font-semibold pp-body transition-all hover:opacity-90"
                                                style={pkg.isHighlighted
                                                    ? { background: pkg.highlightColor ?? tk.accent, color: tk.bg }
                                                    : { border: `1px solid var(--pp-border)`, color: 'var(--pp-text)' }}
                                            >
                                                {pkg.ctaText ?? 'Quero este pacote'}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// â”€â”€ CONTACT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ContactSection({ proposal, provider, tk }: { proposal: Proposal; provider?: Provider; tk: ThemeTokens }) {
    return (
        <section id="contact" data-section="contact" className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-card-bg)' }}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <p className="pp-body text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: 'var(--pp-accent)' }}>Fale conosco</p>
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>Contato</h2>
                    <div className="pp-divider" />
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="space-y-4">
                        <h3 className="pp-heading text-lg font-light mb-5" style={{ color: 'var(--pp-text)' }}>Informações</h3>
                        {provider?.email && (
                            <a href={`mailto:${provider.email}`}
                                className="flex items-center gap-3 pp-body text-sm hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--pp-muted)' }}>
                                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} /> {provider.email}
                            </a>
                        )}
                        {provider?.whatsapp && (
                            <a href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 pp-body text-sm hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--pp-muted)' }}>
                                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} /> WhatsApp
                            </a>
                        )}
                        {provider?.instagram && (
                            <a href={`https://instagram.com/${provider.instagram.replace('@', '')}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 pp-body text-sm hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--pp-muted)' }}>
                                <Instagram className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} /> {provider.instagram}
                            </a>
                        )}
                        {provider?.city && (
                            <p className="pp-body text-sm" style={{ color: 'var(--pp-muted)' }}>{provider.city}</p>
                        )}
                        {provider?.whatsapp && (
                            <a href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=Olá! Vi a proposta e quero conversar.`}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-2xl pp-body text-sm font-semibold transition-all hover:opacity-90"
                                style={{ background: 'var(--pp-accent)', color: '#000' }}>
                                <Phone className="w-4 h-4" /> Falar no WhatsApp
                            </a>
                        )}
                    </div>

                    {provider?.deliveryTimes && (
                        <div>
                            <h3 className="pp-heading text-lg font-light mb-5" style={{ color: 'var(--pp-text)' }}>Prazos de entrega</h3>
                            <p className="pp-body text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--pp-muted)' }}>
                                {provider.deliveryTimes}
                            </p>
                        </div>
                    )}
                </div>

                {provider?.partners && provider.partners.length > 0 && (
                    <div className="mb-12">
                        <h3 className="pp-heading text-lg font-light mb-6 text-center" style={{ color: 'var(--pp-text)' }}>Parceiros</h3>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {provider.partners.map((partner, i) => (
                                <a key={i} href={partner.link ?? '#'} target="_blank" rel="noreferrer"
                                    className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center"
                                        style={{ borderColor: 'var(--pp-border)', background: 'var(--pp-card-bg)' }}>
                                        {partner.photoUrl ? (
                                            <ImageAsset
                                                src={partner.photoUrl}
                                                alt={partner.name}
                                                className="w-full h-full object-cover"
                                                fallback={
                                                    <span className="pp-body text-lg font-bold" style={{ color: 'var(--pp-accent)' }}>
                                                        {partner.name?.[0] ?? '?'}
                                                    </span>
                                                }
                                            />
                                        ) : (
                                            <span className="pp-body text-lg font-bold" style={{ color: 'var(--pp-accent)' }}>
                                                {partner.name?.[0] ?? '?'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="pp-body text-xs" style={{ color: 'var(--pp-muted)' }}>{partner.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-center pt-8 border-t" style={{ borderColor: 'var(--pp-border)' }}>
                    <p className="pp-body text-xs" style={{ color: 'var(--pp-muted)', opacity: 0.4 }}>
                        Proposta gerada com LumenDev Pitch
                    </p>
                </div>
            </div>
        </section>
    )
}

// â”€â”€ MAIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ProposalPublicPage() {
    const { slug } = useParams<{ slug: string }>()

    const { data: proposal, isLoading, error } = useQuery<Proposal | undefined>({
        queryKey: ['proposal-public', slug],
        queryFn: async () => (slug ? httpGateway.getPublicProposalBySlug(slug) : undefined),
    })

    const provider = proposal?.provider as Provider | undefined

    const [heroWatched, setHeroWatched] = useState(false)
    const sessionId = useRef(genSessionId())
    const packageExpansionsRef = useRef<string[]>([])

    useEffect(() => {
        if (!proposal) return
        const recordView = async () => {
            try {
                await httpGateway.recordProposalView({
                    proposalId: proposal.id,
                    proposalSlug: slug ?? '',
                    sessionId: sessionId.current,
                })
            } catch {
                // analytics nao critico
            }
        }
        recordView()
    }, [proposal, slug])

    const handlePackageExpand = useCallback((pkgId: string) => {
        if (!packageExpansionsRef.current.includes(pkgId)) {
            packageExpansionsRef.current = [...packageExpansionsRef.current, pkgId]
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !proposal || !provider) {
        return (
            <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center text-white/30 text-sm">
                Proposta não encontrada.
            </div>
        )
    }

    const tk = getThemeTokens(proposal.theme, proposal.themeCustom)
    const sections = normalizeSections(proposal.sections ?? undefined).filter((s) => s.enabled)
    const isDark = parseInt(tk.bg.replace('#', ''), 16) < 0x888888
    const fontUrl = getFontUrl([tk.heading_font, tk.body_font])

    const cssVars = {
        '--pp-bg': tk.bg,
        '--pp-card-bg': tk.card_bg,
        '--pp-text': tk.text,
        '--pp-accent': tk.accent,
        '--pp-muted': isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
        '--pp-border': isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    } as React.CSSProperties

    const packages = (proposal.packages ?? []) as Array<Package & { items?: PackageItem[] }>
    const nextSectionLabel = sections[1]?.id ? sectionLabel(sections[1].id) : null

    return (
        <div className="min-h-screen" style={{ background: 'var(--pp-bg)', color: 'var(--pp-text)', ...cssVars }}>
            <style>{`
                @import url('${fontUrl}');
                .pp-heading { font-family: '${tk.heading_font}', Georgia, serif; }
                .pp-body { font-family: '${tk.body_font}', Inter, sans-serif; }
                * { font-family: '${tk.body_font}', Inter, sans-serif; box-sizing: border-box; }
                .pp-divider { width: 40px; height: 1px; background: var(--pp-accent); margin: 0 auto; opacity: 0.6; }
                html { scroll-behavior: smooth; }
            `}</style>

            {/* Fixed header */}
            <header
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
                style={{ background: tk.bg + 'EE', borderBottom: '1px solid var(--pp-border)', backdropFilter: 'blur(20px)' }}
            >
                <div>
                    {provider.logoUrl ? (
                        <ImageAsset
                            src={provider.logoUrl}
                            alt="Logo"
                            className="h-10 object-contain"
                            fallback={
                                <span className="pp-heading text-lg font-semibold" style={{ color: 'var(--pp-text)' }}>
                                    {provider.name}
                                </span>
                            }
                        />
                    ) : (
                        <span className="pp-heading text-lg font-semibold" style={{ color: 'var(--pp-text)' }}>
                            {provider.name}
                        </span>
                    )}
                </div>
                <a href="#contact" className="pp-body text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-70"
                    style={{ color: 'var(--pp-accent)' }}>
                    Contato
                </a>
            </header>

            {/* Render active sections in order */}
            {sections.map((section) => {
                if (section.id === 'hero') return (
                    <HeroSection key="hero" proposal={proposal} provider={provider}
                        heroWatched={heroWatched} onHeroWatched={setHeroWatched}
                        nextLabel={nextSectionLabel} tk={tk} />
                )
                if (section.id === 'about') return (
                    <AboutSection key="about" provider={provider} tk={tk} />
                )
                if (section.id === 'differentials') return (
                    <DifferentialsSection key="differentials" proposal={proposal} provider={provider} tk={tk} />
                )
                if (section.id === 'testimonial') return (
                    <TestimonialSection key="testimonial" provider={provider} tk={tk} />
                )
                if (section.id === 'packages') return (
                    <PackagesSection key="packages" proposal={proposal} packages={packages}
                        provider={provider} tk={tk} onPackageExpand={handlePackageExpand} />
                )
                if (section.id === 'contact') return (
                    <ContactSection key="contact" proposal={proposal} provider={provider} tk={tk} />
                )
                return null
            })}
        </div>
    )
}
