/** Link para o PDF (rota de impressão) com a escolha atual do cliente (pacote e opcionais). */
export function printUrl(slug: string, selection?: { packageId: string | null; optionalIds: string[] } | null, auto = true) {
    const params = new URLSearchParams()
    if (selection?.packageId) params.set('pkg', selection.packageId)
    if (selection?.packageId && selection.optionalIds.length) params.set('opt', selection.optionalIds.join(','))
    if (auto) params.set('auto', '1')
    const query = params.toString()
    return `/p/${encodeURIComponent(slug)}/print${query ? `?${query}` : ''}`
}
