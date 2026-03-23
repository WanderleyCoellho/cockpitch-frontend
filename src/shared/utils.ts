/**
 * Utilitários gerais do projeto
 */

export const cn = (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ')
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(num)
}

export const slugify = (text: string) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w-]+/g, '-')
        .replace(/--+/g, '-')
        .trim()
}
