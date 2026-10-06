import { useState } from 'react'
import { ExternalLink, ImageOff } from 'lucide-react'
import type { ProposalMediaItem } from '../../../../shared/types'

/** Mídias da página pública (usa as variáveis de tema --pp-*). */

export function getEmbedUrl(url: string): string | null {
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

export function isLikelyVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i.test(url)
}

export function isVideoMedia(item: ProposalMediaItem): boolean {
    return item.type === 'video' || isLikelyVideoUrl(item.url)
}

export function MediaFallbackPanel({
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

export function MediaAsset({
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

export function ImageAsset({
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
