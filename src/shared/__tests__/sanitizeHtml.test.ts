// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../sanitizeHtml'

describe('sanitizeHtml', () => {
    it('mantém formatação básica', () => {
        expect(sanitizeHtml('<p>Olá <strong>mundo</strong></p>')).toBe('<p>Olá <strong>mundo</strong></p>')
    })

    it('remove scripts e handlers de evento', () => {
        const out = sanitizeHtml('<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)>')
        expect(out).toBe('<p>a</p>')
    })

    it('bloqueia javascript: em links e força nova aba segura', () => {
        expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
        const out = sanitizeHtml('<a href="https://exemplo.com">site</a>')
        expect(out).toContain('target="_blank"')
        expect(out).toContain('rel="noopener noreferrer nofollow"')
    })

    it('trata vazio/nulo', () => {
        expect(sanitizeHtml(null)).toBe('')
        expect(sanitizeHtml(undefined)).toBe('')
    })
})
