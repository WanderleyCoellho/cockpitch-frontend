import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { THEMES, getThemeTokens } from '../../interface/components/proposal/ThemeSelector'
import { themeCssVars, themeStyleCss } from '../../interface/components/proposal/public/theme'
import { Headline } from '../../interface/components/proposal/blocks/shared'

const CLASSIC = ['dark_luxury', 'editorial', 'clean_pastel', 'rose_blush', 'midnight_navy']

describe('temas', () => {
    it('os temas clássicos continuam sem estilo extra (aparência igual à de antes)', () => {
        for (const key of CLASSIC) {
            expect(themeStyleCss(THEMES[key])).toBe('')
            expect(themeCssVars(THEMES[key])['--pp-alt-bg' as never]).toBe(THEMES[key].card_bg)
        }
    })

    it('cada tema novo gera o CSS do seu estilo', () => {
        const neon = themeStyleCss(THEMES.neon_lime)
        expect(neon).toContain('.pp-pricing {')
        expect(neon).toContain('.pp-outline-word')
        expect(neon).toContain('.pp-decor-glow')
        expect(themeStyleCss(THEMES.corporate_green)).toContain('.pp-alt {')
        expect(themeStyleCss(THEMES.geometric)).toContain('border-radius: 3px')
        expect(themeStyleCss(THEMES.champagne)).toContain('text-transform: uppercase')
    })

    it('cores personalizadas não apagam o estilo do tema', () => {
        const tk = getThemeTokens('impact', { accent: '#FF0000' })
        expect(tk.accent).toBe('#FF0000')
        expect(tk.style?.heading).toBe('condensed')
    })

    it('todo tema tem cores em hexadecimal (o seletor de cor exige)', () => {
        for (const t of Object.values(THEMES)) {
            for (const c of [t.bg, t.card_bg, t.text, t.accent]) expect(c).toMatch(/^#[0-9A-F]{6}$/i)
        }
    })
})

describe('Headline', () => {
    it('marca só a última palavra', () => {
        expect(renderToStaticMarkup(<Headline text="Vamos começar o projeto" />)).toBe('Vamos começar o <span class="pp-hl">projeto</span>')
        expect(renderToStaticMarkup(<Headline text="  Investimento " />)).toBe('<span class="pp-hl">Investimento</span>')
    })
})
