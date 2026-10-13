/** CPF: confere os dígitos verificadores (o servidor confere de novo). */
export function isValidCpf(value: string) {
    const cpf = value.replace(/\D/g, '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    const digit = (length: number) => {
        let sum = 0
        for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i)
        const rest = (sum * 10) % 11
        return rest === 10 ? 0 : rest
    }
    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

/** Máscara enquanto digita: 123.456.789-09 */
export function maskCpf(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}
