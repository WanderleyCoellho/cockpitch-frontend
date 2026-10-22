import { describe, expect, it } from 'vitest'
import { extractErrorMessage } from '../../infra/gateway/HttpGateway'

describe('extractErrorMessage', () => {
    it('usa a mensagem da API em erros 4xx', () => {
        expect(extractErrorMessage(409, { message: 'Slug em uso' })).toBe('Slug em uso')
    })

    it('mostra o primeiro problema de validação com o campo', () => {
        const data = { message: 'Invalid payload', issues: [{ path: ['slug'], message: 'String must contain at least 3 character(s)' }] }
        expect(extractErrorMessage(400, data)).toBe('slug: String must contain at least 3 character(s)')
    })

    it('nunca mostra mensagem crua de erro 5xx', () => {
        expect(extractErrorMessage(500, { message: 'Internal server error' })).toBe('Algo deu errado. Tente novamente em instantes.')
    })

    it('tem mensagem amigável para rate limit sem corpo', () => {
        expect(extractErrorMessage(429, null)).toContain('Muitas tentativas')
    })
})
