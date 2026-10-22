import { useMemo, useEffect, type CSSProperties } from 'react'
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
    /** Estilo visual (opcional; sem ele o tema fica como os clássicos: título serifado, fino e itálico). */
    style?: ThemeStyle
}

/** Como os títulos são desenhados. */
export type HeadingStyle = 'elegant' | 'roman' | 'thin_upper' | 'bold' | 'bold_upper' | 'condensed'
/** Destaque da última palavra dos títulos. */
export type AccentStyle = 'none' | 'color' | 'highlight' | 'italic' | 'underline'
export type ThemeDecor = 'glow' | 'outline' | 'shapes' | 'arc' | 'glass' | 'fine_lines'

export type ThemeStyle = {
    heading?: HeadingStyle
    accent?: AccentStyle
    /** Seções alternadas com outra cor de fundo (ex.: faixas escuras num tema claro). */
    alt_bg?: string
    alt_text?: string
    /** Destaque dentro das seções alternadas, quando o do tema some nelas. */
    alt_accent?: string
    alt_on_accent?: string
    /** Cor do texto sobre a cor de destaque (botões, faixa de preços). */
    on_accent?: string
    /** Seção de preços numa faixa da cor de destaque. */
    band?: boolean
    decor?: ThemeDecor[]
    radius?: 'soft' | 'round' | 'square'
    /** Capa com o título alinhado à esquerda (estilo pôster). */
    cover?: 'center' | 'left'
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
    neon_lime: {
        label: 'Neon Lima',
        description: 'Preto com verde-limão, títulos fortes',
        bg: '#0B0B0B',
        card_bg: '#161616',
        text: '#F4F4EF',
        accent: '#C6F432',
        heading_font: 'Outfit',
        body_font: 'Inter',
        style: { heading: 'bold', accent: 'color', on_accent: '#0B0B0B', band: true, decor: ['glow', 'outline'], radius: 'round', cover: 'left' },
    },
    corporate_green: {
        label: 'Corporativo',
        description: 'Claro e confiável, faixas verde-petróleo',
        bg: '#F2F6F3',
        card_bg: '#FFFFFF',
        text: '#0E3B43',
        accent: '#5FA83A',
        heading_font: 'Montserrat',
        body_font: 'Inter',
        style: { heading: 'bold', accent: 'color', alt_bg: '#0E3B43', alt_text: '#EEF5F0', on_accent: '#FFFFFF', radius: 'round', cover: 'left' },
    },
    impact: {
        label: 'Impacto',
        description: 'Títulos condensados em caixa alta',
        bg: '#121212',
        card_bg: '#1C1C1C',
        text: '#F1EEE6',
        accent: '#C2EE3A',
        heading_font: 'Anton',
        body_font: 'Inter',
        style: {
            heading: 'condensed',
            accent: 'highlight',
            alt_bg: '#F1EEE6',
            alt_text: '#121212',
            alt_accent: '#121212',
            alt_on_accent: '#C2EE3A',
            on_accent: '#121212',
            radius: 'square',
            cover: 'left',
        },
    },
    geometric: {
        label: 'Geométrico',
        description: 'Cinza e laranja, formas e cantos retos',
        bg: '#EDEDEA',
        card_bg: '#FFFFFF',
        text: '#2A2A2A',
        accent: '#E8692A',
        heading_font: 'Montserrat',
        body_font: 'Inter',
        style: { heading: 'bold_upper', accent: 'color', alt_bg: '#353535', alt_text: '#EDEDEA', on_accent: '#FFFFFF', decor: ['shapes'], radius: 'square', cover: 'left' },
    },
    spotlight: {
        label: 'Holofote',
        description: 'Preto com laranja vibrante e brilho',
        bg: '#0B0B0B',
        card_bg: '#171717',
        text: '#F5F5F5',
        accent: '#FF6A13',
        heading_font: 'Sora',
        body_font: 'Inter',
        style: { heading: 'bold', accent: 'highlight', on_accent: '#FFFFFF', decor: ['glow'], radius: 'soft', cover: 'left' },
    },
    nude_editorial: {
        label: 'Nude Editorial',
        description: 'Moca e creme, serifa de revista',
        bg: '#2B221D',
        card_bg: '#372B24',
        text: '#F3E9DF',
        accent: '#D8B58E',
        heading_font: 'Bodoni Moda',
        body_font: 'Montserrat',
        style: { heading: 'roman', accent: 'italic', on_accent: '#2B221D', decor: ['arc'], radius: 'round' },
    },
    bronze_glass: {
        label: 'Vidro Bronze',
        description: 'Escuro e acolhedor, capa em vidro',
        bg: '#1E1712',
        card_bg: '#2A211B',
        text: '#F6EEE6',
        accent: '#C9A27E',
        heading_font: 'Cormorant Garamond',
        body_font: 'Montserrat',
        style: { heading: 'elegant', accent: 'color', on_accent: '#1E1712', decor: ['glass'], radius: 'round' },
    },
    champagne: {
        label: 'Champanhe',
        description: 'Bege nude, títulos finos e grandes',
        bg: '#EFE6DC',
        card_bg: '#F8F3EE',
        text: '#4A3A2E',
        accent: '#A9825A',
        heading_font: 'Cormorant Garamond',
        body_font: 'Montserrat',
        style: { heading: 'thin_upper', accent: 'italic', on_accent: '#FFFFFF', decor: ['arc', 'fine_lines'], radius: 'round' },
    },
    sand_portfolio: {
        label: 'Areia',
        description: 'Portfólio claro com faixas taupe',
        bg: '#F7F4EF',
        card_bg: '#FFFFFF',
        text: '#4B4239',
        accent: '#9C8B73',
        heading_font: 'Cormorant Garamond',
        body_font: 'Montserrat',
        style: { heading: 'roman', accent: 'italic', alt_bg: '#A39580', alt_text: '#FFFFFF', alt_accent: '#F4ECDD', on_accent: '#FFFFFF', radius: 'square', cover: 'left' },
    },
    golden_arch: {
        label: 'Dourado Arquitetura',
        description: 'Branco quente com dourado e linhas finas',
        bg: '#FAF8F4',
        card_bg: '#FFFFFF',
        text: '#2E2E2E',
        accent: '#B8913F',
        heading_font: 'Montserrat',
        body_font: 'Inter',
        style: { heading: 'bold_upper', accent: 'color', on_accent: '#FFFFFF', decor: ['fine_lines'], radius: 'round' },
    },
}

/** Estilo do título para miniaturas fora da proposta (seletor de temas, cartões de modelo). */
export function headingPreviewStyle(tk: ThemeTokens): CSSProperties {
    switch (tk.style?.heading ?? 'elegant') {
        case 'roman':
            return { fontStyle: 'normal', fontWeight: 400 }
        case 'thin_upper':
            return { fontStyle: 'normal', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.06em' }
        case 'bold':
            return { fontStyle: 'normal', fontWeight: 700, letterSpacing: '-0.02em' }
        case 'bold_upper':
            return { fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase' }
        case 'condensed':
            return { fontStyle: 'normal', fontWeight: 400, textTransform: 'uppercase' }
        default:
            return { fontStyle: 'italic', fontWeight: 300 }
    }
}

export function getThemeTokens(theme?: string | null, themeCustom?: ThemeCustom | null): ThemeTokens {
    const base = THEMES[theme ?? 'dark_luxury'] ?? THEMES.dark_luxury
    if (!themeCustom) return base
    return {
        ...base,
        ...Object.fromEntries(Object.entries(themeCustom).filter(([, v]) => v)) as Partial<ThemeTokens>,
    }
}

const HEADING_FONTS = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond', 'Libre Baskerville', 'Bodoni Moda', 'Inter', 'DM Sans', 'Montserrat', 'Outfit', 'Sora', 'Anton']
const BODY_FONTS = ['Inter', 'DM Sans', 'Lato', 'Nunito', 'Open Sans', 'Montserrat']
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
                                    style={{ color: t.text, fontFamily: `"${t.heading_font}", serif`, ...headingPreviewStyle(t), letterSpacing: undefined }}
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
                            className="text-2xl mb-2"
                            style={{ color: tk.text, fontFamily: `"${tk.heading_font}", serif`, ...headingPreviewStyle(tk) }}
                        >
                            João &amp; <span style={tk.style?.accent === 'highlight' ? { background: tk.accent, color: tk.style.on_accent, padding: '0 0.15em' } : tk.style?.accent && tk.style.accent !== 'none' ? { color: tk.accent, fontStyle: tk.style.accent === 'italic' ? 'italic' : undefined } : undefined}>Maria</span>
                        </h2>
                        <p
                            className="text-xs mb-5 max-w-xs mx-auto"
                            style={{ color: tk.text + 'AA', fontFamily: `"${tk.body_font}", sans-serif` }}
                        >
                            Fotografia para eternizar o melhor da vida
                        </p>
                        <span
                            className="inline-block px-5 py-1.5 rounded-full text-xs font-medium"
                            style={{ background: tk.accent, color: tk.style?.on_accent ?? tk.bg, fontFamily: `"${tk.body_font}", sans-serif` }}
                        >
                            Ver proposta
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
