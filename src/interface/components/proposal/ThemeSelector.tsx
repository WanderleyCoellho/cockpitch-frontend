import { useMemo, useEffect } from 'react'
import { Check } from 'lucide-react'
import type { ThemeCustom } from '../../../shared/types'

export type ThemeTokens = {
    label: string
    description: string
    bg: string
    card_bg: string
    text: string
    accent: string
    heading_font: string
    body_font: string
}

export const THEMES: Record<string, ThemeTokens> = {
    dark_luxury: {
        label: 'Dark Luxury',
        description: 'Fundo escuro, acentos dourados',
        bg: '#0C0C0C',
        card_bg: '#161616',
        text: '#F0EDE8',
        accent: '#C9A84C',
        heading_font: 'Playfair Display',
        body_font: 'Inter',
    },
    editorial: {
        label: 'Editorial',
        description: 'Off-white elegante, minimalista',
        bg: '#F8F5F0',
        card_bg: '#FFFFFF',
        text: '#1A1A1A',
        accent: '#B8943C',
        heading_font: 'Playfair Display',
        body_font: 'Inter',
    },
    clean_pastel: {
        label: 'Clean Pastel',
        description: 'Tons pastel suaves e naturais',
        bg: '#F4F1EC',
        card_bg: '#FBF9F6',
        text: '#3D3530',
        accent: '#A67C52',
        heading_font: 'Cormorant Garamond',
        body_font: 'Inter',
    },
    rose_blush: {
        label: 'Rose Blush',
        description: 'Rosa suave para eventos românticos',
        bg: '#FDF5F7',
        card_bg: '#FFFFFF',
        text: '#2C1B20',
        accent: '#C4607A',
        heading_font: 'Cormorant Garamond',
        body_font: 'Nunito',
    },
    midnight_navy: {
        label: 'Midnight Navy',
        description: 'Azul noturno sofisticado',
        bg: '#0A0C14',
        card_bg: '#111521',
        text: '#E8EAF4',
        accent: '#7C9EFF',
        heading_font: 'Libre Baskerville',
        body_font: 'DM Sans',
    },
}

export function getThemeTokens(theme?: string | null, themeCustom?: ThemeCustom | null): ThemeTokens {
    const base = THEMES[theme ?? 'dark_luxury'] ?? THEMES.dark_luxury
    if (!themeCustom) return base
    return {
        ...base,
        ...Object.fromEntries(Object.entries(themeCustom).filter(([, v]) => v)) as Partial<ThemeTokens>,
    }
}

const HEADING_FONTS = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond', 'Libre Baskerville', 'Inter', 'DM Sans']
const BODY_FONTS = ['Inter', 'DM Sans', 'Lato', 'Nunito', 'Open Sans']
const ALL_PREVIEW_FONTS = [...new Set([...HEADING_FONTS, ...BODY_FONTS])]
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${ALL_PREVIEW_FONTS.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600`).join('&')}&display=swap`

interface Props {
    theme?: string
    themeCustom?: ThemeCustom | null
    onThemeChange: (theme: string) => void
    onCustomChange: (key: keyof ThemeCustom, value: string) => void
}

export default function ThemeSelector({ theme, themeCustom, onThemeChange, onCustomChange }: Props) {
    const selectedKey = theme ?? 'dark_luxury'
    const tk = useMemo(() => getThemeTokens(theme, themeCustom), [theme, themeCustom])
    const currentHeadingFont = themeCustom?.heading_font ?? THEMES[selectedKey]?.heading_font ?? 'Playfair Display'
    const currentBodyFont = themeCustom?.body_font ?? THEMES[selectedKey]?.body_font ?? 'Inter'

    useEffect(() => {
        if (document.querySelector('link[data-lumen-deal-fonts]')) return
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = GOOGLE_FONTS_URL
        link.setAttribute('data-lumen-deal-fonts', 'true')
        document.head.appendChild(link)
    }, [])

    return (
        <div className="space-y-7">
            {/* ── Preset themes ── */}
            <div>
                <p className="text-xs font-medium tracking-widest uppercase text-white/55 mb-3">Tema predefinido</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(THEMES).map(([key, t]) => {
                        const isSelected = selectedKey === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onThemeChange(key)}
                                className="relative p-4 rounded-2xl border text-left transition-all overflow-hidden"
                                style={{
                                    background: t.bg,
                                    borderColor: isSelected ? t.accent : 'rgba(255,255,255,0.09)',
                                    boxShadow: isSelected ? `0 0 0 1px ${t.accent}50` : undefined,
                                }}
                            >
                                <div className="h-0.5 w-8 rounded-full mb-3" style={{ background: t.accent }} />
                                <p
                                    className="text-sm font-medium leading-tight mb-0.5 truncate"
                                    style={{ color: t.text, fontFamily: `"${t.heading_font}", serif` }}
                                >
                                    {t.label}
                                </p>
                                <p
                                    className="text-[10px] mb-3 leading-snug"
                                    style={{ color: t.text + '80', fontFamily: `"${t.body_font}", sans-serif` }}
                                >
                                    {t.description}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ background: t.bg, border: `1px solid ${t.text}30` }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: t.card_bg, border: `1px solid ${t.text}30` }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: t.text }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
                                </div>
                                {isSelected && (
                                    <div
                                        className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: t.accent }}
                                    >
                                        <Check className="w-2.5 h-2.5" style={{ color: t.bg }} />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Font pickers ── */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <p className="text-xs font-medium tracking-widest uppercase text-white/55 mb-3">Fonte dos títulos</p>
                    <div className="flex flex-wrap gap-2">
                        {HEADING_FONTS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => onCustomChange('heading_font', f)}
                                className="px-3 py-2 rounded-xl border text-sm transition-all"
                                style={{
                                    fontFamily: `"${f}", serif`,
                                    borderColor: currentHeadingFont === f ? '#C9A84C80' : 'rgba(255,255,255,0.12)',
                                    background: currentHeadingFont === f ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                                    color: currentHeadingFont === f ? '#C9A84C' : 'rgba(255,255,255,0.70)',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium tracking-widest uppercase text-white/55 mb-3">Fonte do texto</p>
                    <div className="flex flex-wrap gap-2">
                        {BODY_FONTS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => onCustomChange('body_font', f)}
                                className="px-3 py-2 rounded-xl border text-sm transition-all"
                                style={{
                                    fontFamily: `"${f}", sans-serif`,
                                    borderColor: currentBodyFont === f ? '#C9A84C80' : 'rgba(255,255,255,0.12)',
                                    background: currentBodyFont === f ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                                    color: currentBodyFont === f ? '#C9A84C' : 'rgba(255,255,255,0.70)',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Color overrides ── */}
            <div>
                <p className="text-xs font-medium tracking-widest uppercase text-white/55 mb-3">
                    Cores{' '}
                    <span className="normal-case font-normal text-white/30 tracking-normal">(opcional)</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {([
                        { key: 'bg' as const, label: 'Fundo' },
                        { key: 'card_bg' as const, label: 'Cards' },
                        { key: 'text' as const, label: 'Texto' },
                        { key: 'accent' as const, label: 'Destaque' },
                    ]).map(({ key, label }) => (
                        <div key={key} className="p-3 rounded-xl border border-white/8 bg-white/3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/55 mb-2">{label}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={themeCustom?.[key] ?? tk[key] ?? '#000000'}
                                    onChange={(e) => onCustomChange(key, e.target.value)}
                                    className="w-8 h-8 rounded-lg cursor-pointer flex-shrink-0 border-0"
                                    style={{ padding: '2px', background: 'transparent' }}
                                />
                                <input
                                    className="flex-1 min-w-0 bg-transparent text-xs text-white/75 focus:outline-none font-mono placeholder-white/25 border-b border-white/12 pb-0.5"
                                    value={themeCustom?.[key] ?? tk[key] ?? ''}
                                    onChange={(e) => onCustomChange(key, e.target.value)}
                                    placeholder={tk[key]}
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Live Preview ── */}
            <div>
                <p className="text-xs font-medium tracking-widest uppercase text-white/55 mb-3">Pré-visualização</p>
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: tk.bg, border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div className="px-8 py-10 text-center">
                        <p
                            className="text-[10px] tracking-widest uppercase mb-3"
                            style={{ color: tk.accent, fontFamily: `"${tk.body_font}", sans-serif` }}
                        >
                            12 de outubro · 2025
                        </p>
                        <h2
                            className="text-2xl font-light italic mb-2"
                            style={{ color: tk.text, fontFamily: `"${tk.heading_font}", serif` }}
                        >
                            João &amp; Maria
                        </h2>
                        <p
                            className="text-xs mb-5 max-w-xs mx-auto"
                            style={{ color: tk.text + 'AA', fontFamily: `"${tk.body_font}", sans-serif` }}
                        >
                            Fotografia para eternizar o melhor da vida
                        </p>
                        <span
                            className="inline-block px-5 py-1.5 rounded-full text-xs font-medium"
                            style={{ background: tk.accent, color: tk.bg, fontFamily: `"${tk.body_font}", sans-serif` }}
                        >
                            Ver proposta
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
