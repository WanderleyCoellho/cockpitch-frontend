import type { CSSProperties } from 'react'
import type { ThemeTokens } from '../ThemeSelector'

function getFontUrl(fonts: (string | undefined)[]) {
    const all = [...new Set(fonts.filter(Boolean))] as string[]
    return `https://fonts.googleapis.com/css2?${all.map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600`).join('&')}&display=swap`
}

export function isDarkTheme(tk: ThemeTokens) {
    return parseInt(tk.bg.replace('#', '').slice(0, 6), 16) < 0x888888
}

/** Variáveis --pp-* usadas por todos os blocos e seções da página pública. */
export function themeCssVars(tk: ThemeTokens): CSSProperties {
    const dark = isDarkTheme(tk)
    return {
        '--pp-bg': tk.bg,
        '--pp-card-bg': tk.card_bg,
        '--pp-text': tk.text,
        '--pp-accent': tk.accent,
        '--pp-muted': dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)',
        '--pp-border': dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        '--pp-on-accent': tk.style?.on_accent ?? (dark ? '#000' : '#fff'),
        // Seções alternadas: sem cor própria no tema, usam a cor dos cards (como sempre foi).
        '--pp-alt-bg': tk.style?.alt_bg ?? tk.card_bg,
    } as CSSProperties
}

const HEADING_CSS: Record<string, string> = {
    elegant: '',
    roman: 'font-style: normal; font-weight: 400; letter-spacing: -0.01em;',
    thin_upper: 'font-style: normal; font-weight: 300; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.05;',
    bold: 'font-style: normal; font-weight: 700; letter-spacing: -0.025em; line-height: 1.08;',
    bold_upper: 'font-style: normal; font-weight: 800; text-transform: uppercase; letter-spacing: -0.005em; line-height: 1.04;',
    condensed: 'font-style: normal; font-weight: 400; text-transform: uppercase; letter-spacing: 0.005em; line-height: 1.12;',
}

const ACCENT_CSS: Record<string, string> = {
    none: '',
    color: 'color: var(--pp-accent);',
    italic: 'font-style: italic; color: var(--pp-accent);',
    underline:
        'background-image: linear-gradient(var(--pp-accent), var(--pp-accent)); background-size: 100% 0.1em; background-position: 0 94%; background-repeat: no-repeat;',
    highlight:
        'display: inline-block; line-height: 1.04; background: var(--pp-accent); color: var(--pp-on-accent); padding: 0.02em 0.16em; border-radius: 0.1em;',
}

/** CSS do estilo visual do tema (títulos, destaque, seções alternadas, faixa de preços, formas e cantos). */
export function themeStyleCss(tk: ThemeTokens): string {
    const st = tk.style
    if (!st) return ''
    const decor = new Set(st.decor ?? [])
    const heading = st.heading ?? 'elegant'
    const rules: string[] = []
    if (HEADING_CSS[heading]) rules.push(`.pp-scope .pp-title { ${HEADING_CSS[heading]} }`)
    if (heading !== 'elegant') {
        // Títulos de impacto pedem uma capa maior.
        rules.push(`.pp-scope .pp-cover .pp-title { font-size: 2.9rem; } @media (min-width: 768px) { .pp-scope .pp-cover .pp-title { font-size: ${heading === 'condensed' ? '6rem' : '5rem'}; } }`)
    }
    if (st.accent && ACCENT_CSS[st.accent]) rules.push(`.pp-scope .pp-hl { ${ACCENT_CSS[st.accent]} }`)
    if (st.alt_bg) {
        const text = st.alt_text ?? tk.text
        rules.push(`.pp-scope .pp-alt {
            --pp-text: ${text};
            --pp-muted: color-mix(in srgb, ${text} 72%, transparent);
            --pp-border: color-mix(in srgb, ${text} 16%, transparent);
            --pp-bg: color-mix(in srgb, ${text} 7%, ${st.alt_bg});
            --pp-card-bg: color-mix(in srgb, ${text} 7%, ${st.alt_bg});
            ${st.alt_accent ? `--pp-accent: ${st.alt_accent};` : ''}
            ${st.alt_on_accent ? `--pp-on-accent: ${st.alt_on_accent};` : ''}
        }`)
    }
    if (st.cover === 'left') {
        rules.push(`.pp-scope .pp-cover-content { max-width: 72rem; width: 100%; text-align: left; }
            .pp-scope .pp-cover-content > * { margin-left: 0; }
            .pp-scope .pp-cover-content .pp-title { max-width: 15ch; }`)
    }
    if (st.band) {
        rules.push(`.pp-scope .pp-pricing { background: var(--pp-accent) !important; }
            .pp-scope .pp-pricing-head { --pp-text: var(--pp-on-accent); --pp-muted: color-mix(in srgb, var(--pp-on-accent) 70%, transparent); --pp-accent: var(--pp-on-accent); }
            .pp-scope .pp-pricing-head .pp-hl { background: none; color: inherit; padding: 0; }`)
    }
    if (st.radius === 'square') {
        rules.push(`.pp-scope .rounded-2xl, .pp-scope .rounded-3xl, .pp-scope .rounded-\\[2rem\\] { border-radius: 3px; }`)
    } else if (st.radius === 'round') {
        rules.push(`.pp-scope .rounded-2xl { border-radius: 1.4rem; } .pp-scope .rounded-3xl, .pp-scope .rounded-\\[2rem\\] { border-radius: 2.2rem; }`)
    }
    if (decor.has('glow')) {
        rules.push(`.pp-scope .pp-decor-glow { display: block; position: absolute; left: 50%; top: 42%; width: min(900px, 120%); aspect-ratio: 1; transform: translate(-50%, -50%);
            background: radial-gradient(circle, color-mix(in srgb, var(--pp-accent) 30%, transparent) 0%, transparent 62%); pointer-events: none; }
            .pp-scope .pp-pricing .pp-decor-glow { top: 60%; }`)
    }
    if (decor.has('outline')) {
        rules.push(`.pp-scope .pp-outline-word { display: block; position: absolute; left: 50%; top: 32%; transform: translate(-50%, -50%); z-index: -1; white-space: nowrap;
            font-size: clamp(3.5rem, 12vw, 9.5rem); line-height: 1; font-weight: 800; text-transform: uppercase; color: transparent; font-style: normal;
            -webkit-text-stroke: 1.5px color-mix(in srgb, var(--pp-text) 22%, transparent); pointer-events: none; }`)
    }
    if (decor.has('shapes')) {
        rules.push(`.pp-scope .pp-decor-shape1 { display: block; position: absolute; right: -6%; top: 10%; width: 34%; max-width: 460px; aspect-ratio: 1; border-radius: 50%; background: var(--pp-accent); opacity: 0.92; }
            .pp-scope .pp-decor-shape2 { display: block; position: absolute; right: 18%; bottom: -14%; width: 22%; max-width: 300px; aspect-ratio: 1; border-radius: 50% 50% 0 0; background: var(--pp-text); opacity: 0.85; }
            @media (max-width: 767px) { .pp-scope .pp-decor-shape1, .pp-scope .pp-decor-shape2 { opacity: 0.25; } }`)
    }
    if (decor.has('arc')) {
        rules.push(`.pp-scope .pp-decor-arc { display: block; position: absolute; right: -18%; top: -22%; width: 78%; max-width: 980px; aspect-ratio: 1; border-radius: 50%;
            border: 2px solid color-mix(in srgb, var(--pp-accent) 55%, transparent); pointer-events: none; }`)
    }
    if (decor.has('glass')) {
        rules.push(`.pp-scope .pp-cover[data-media] .pp-cover-content { background: rgba(255,255,255,0.07); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
            border: 1px solid rgba(255,255,255,0.22); border-radius: 1.75rem; padding: 3rem 2.25rem; }`)
    }
    if (decor.has('fine_lines')) {
        rules.push(`.pp-scope .pp-divider { width: 140px; background: linear-gradient(90deg, transparent, var(--pp-accent), transparent); opacity: 1; }`)
    }
    return rules.join('\n')
}

/**
 * Fontes e estilos base da proposta, limitados a `.pp-scope` para não vazar para o painel
 * (a mesma página é usada como pré-visualização dentro do editor).
 */
export function ProposalThemeStyle({ tk, smoothScroll = false }: { tk: ThemeTokens; smoothScroll?: boolean }) {
    return (
        <style>{`
            @import url('${getFontUrl([tk.heading_font, tk.body_font])}');
            .pp-scope .pp-heading { font-family: '${tk.heading_font}', Georgia, serif; }
            .pp-scope .pp-body, .pp-scope { font-family: '${tk.body_font}', Inter, sans-serif; }
            .pp-scope * { box-sizing: border-box; }
            .pp-scope .pp-divider { width: 40px; height: 1px; background: var(--pp-accent); margin: 0 auto; opacity: 0.6; }
            .pp-scope .pp-rich p { margin: 0 0 0.9em; }
            .pp-scope .pp-rich p:last-child { margin-bottom: 0; }
            .pp-scope .pp-rich ul { list-style: disc; padding-left: 1.4em; margin: 0 0 0.9em; }
            .pp-scope .pp-rich ol { list-style: decimal; padding-left: 1.4em; margin: 0 0 0.9em; }
            .pp-scope .pp-rich li { margin: 0.25em 0; }
            .pp-scope .pp-rich h2, .pp-scope .pp-rich h3, .pp-scope .pp-rich h4 { color: var(--pp-text); font-weight: 600; margin: 1.2em 0 0.5em; }
            .pp-scope .pp-rich strong, .pp-scope .pp-rich b { color: var(--pp-text); font-weight: 600; }
            .pp-scope .pp-rich a { color: var(--pp-accent); text-decoration: underline; }
            .pp-scope .pp-rich blockquote { border-left: 2px solid var(--pp-accent); padding-left: 1em; font-style: italic; }
            .pp-scope .pp-decor-glow, .pp-scope .pp-decor-shape1, .pp-scope .pp-decor-shape2, .pp-scope .pp-decor-arc, .pp-scope .pp-outline-word { display: none; }
            ${themeStyleCss(tk)}
            ${smoothScroll ? 'html { scroll-behavior: smooth; }' : ''}
            @media print {
                .pp-no-print { display: none !important; }
                .pp-scope section { break-inside: avoid-page; min-height: 0 !important; padding-top: 2rem !important; padding-bottom: 2rem !important; }
                .pp-scope * { animation: none !important; transition: none !important; }
                /* Seções que ainda não "entraram" na tela (animação de rolagem) também saem na impressão. */
                .pp-scope [style*="opacity: 0"] { opacity: 1 !important; transform: none !important; }
                .pp-scope { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `}</style>
    )
}
