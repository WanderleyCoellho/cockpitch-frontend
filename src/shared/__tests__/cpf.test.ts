import { describe, expect, it } from 'vitest'
import { isValidCpf, maskCpf } from '../cpf'

describe('CPF', () => {
    it('confere os dígitos verificadores', () => {
        expect(isValidCpf('529.982.247-25')).toBe(true)
        expect(isValidCpf('52998224725')).toBe(true)
        expect(isValidCpf('529.982.247-24')).toBe(false)
        expect(isValidCpf('000.000.000-00')).toBe(false)
        expect(isValidCpf('5299')).toBe(false)
    })

    it('aplica a máscara enquanto digita', () => {
        expect(maskCpf('529')).toBe('529')
        expect(maskCpf('5299822')).toBe('529.982.2')
        expect(maskCpf('52998224725')).toBe('529.982.247-25')
        expect(maskCpf('529.982.247-25999')).toBe('529.982.247-25')
    })
})
