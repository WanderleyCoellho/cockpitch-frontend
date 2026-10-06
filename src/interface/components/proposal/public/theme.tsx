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
        '--pp-on-accent': dark ? '#000' : '#fff',
    } as CSSProperties
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
