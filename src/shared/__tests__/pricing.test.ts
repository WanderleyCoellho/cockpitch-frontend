import { describe, expect, it } from 'vitest'
import { calculatePackagePricing, formatCents, packagePriceText, parseMoneyToCents } from '../pricing'
import { parseDecimalInput, toPackageItemPayload, toPackagePayload } from '../schemas'

describe('pricing (cópia do backend)', () => {
    it('opcional marcado entra no total na hora', () => {
        const pkg = {
            priceMode: 'SUM_OF_ITEMS' as const,
            discountType: 'NONE' as const,
            discountValue: 0,
            items: [
                { id: 'a', kind: 'INCLUDED' as const, quantity: 2, unitPriceCents: 10000 },
                { id: 'b', kind: 'OPTIONAL' as const, quantity: 1, unitPriceCents: 5000 },
            ],
        }
        expect(calculatePackagePricing(pkg).totalCents).toBe(20000)
        expect(calculatePackagePricing(pkg, ['b']).totalCents).toBe(25000)
    })

    it('formata em reais e lê valores digitados no formato brasileiro', () => {
        expect(formatCents(350000).replace(/\s/g, ' ')).toBe('R$ 3.500,00')
        expect(parseMoneyToCents('1.234,56')).toBe(123456)
        expect(parseDecimalInput('1,5')).toBe(1.5)
        expect(parseDecimalInput('')).toBeNull()
    })

    it('texto de preço: rótulo, sob consulta e legado', () => {
        const pricing = calculatePackagePricing({ priceMode: 'FIXED', fixedPriceCents: 100000, discountType: 'NONE', discountValue: 0, items: [] })
        expect(packagePriceText({ pricing, priceLabel: 'a partir de' }).replace(/\s/g, ' ')).toBe('a partir de R$ 1.000,00')
        const onRequest = calculatePackagePricing({ priceMode: 'ON_REQUEST', discountType: 'NONE', discountValue: 0, items: [] })
        expect(packagePriceText({ pricing: onRequest, priceLabel: '' })).toBe('Sob consulta')
        expect(packagePriceText({ price: '3500.00' }).replace(/\s/g, ' ')).toBe('R$ 3.500,00')
    })
})

describe('conversão do formulário para a API', () => {
    it('pacote: valores em texto viram centavos e pontos-base', () => {
        const base = { name: 'Pacote', isHighlighted: false, itemIds: [] as string[] }
        expect(toPackagePayload({ ...base, priceMode: 'FIXED', fixedPrice: '3.500,00', discountType: 'PERCENT', discountInput: '12,5' })).toMatchObject({
            fixedPriceCents: 350000,
            discountType: 'PERCENT',
            discountValue: 1250,
        })
        expect(toPackagePayload({ ...base, priceMode: 'SUM_OF_ITEMS', discountType: 'AMOUNT', discountInput: '200,00' })).toMatchObject({
            fixedPriceCents: null,
            discountValue: 20000,
        })
    })

    it('item: quantidade decimal e valor em branco', () => {
        expect(toPackageItemPayload({ name: 'Horas', kind: 'INCLUDED', quantity: '1,5', unit: ' h ', unitPrice: '250,00', order: 0 })).toMatchObject({
            quantity: 1.5,
            unit: 'h',
            unitPriceCents: 25000,
        })
        expect(toPackageItemPayload({ name: 'Brinde', kind: 'COURTESY', quantity: '1', unitPrice: '', order: 0 }).unitPriceCents).toBe(0)
    })
})
