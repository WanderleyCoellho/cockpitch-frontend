/**
 * HTTP Gateway
 * Centraliza chamadas REST ao backend dedicado
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function normalizePackage(pkg: any) {
    const items = Array.isArray(pkg?.items) ? pkg.items : []
    return {
        ...pkg,
        itemIds: items.map((item: any) => item.id),
        courtesyIds: items.filter((item: any) => item.isCourtesy).map((item: any) => item.id),
        items,
    }
}

function fromBackendCommercialStatus(status?: string | null) {
    if (!status) return 'sem_resposta'
    const map: Record<string, 'sem_resposta' | 'negociando' | 'aceita' | 'negada' | 'personalizado'> = {
        SEM_RESPOSTA: 'sem_resposta',
        NEGOCIANDO: 'negociando',
        ACEITA: 'aceita',
        NEGADA: 'negada',
        PERSONALIZADO: 'personalizado',
    }
    return map[status] ?? 'sem_resposta'
}

function toBackendCommercialStatus(status: 'sem_resposta' | 'negociando' | 'aceita' | 'negada' | 'personalizado') {
    const map: Record<typeof status, 'SEM_RESPOSTA' | 'NEGOCIANDO' | 'ACEITA' | 'NEGADA' | 'PERSONALIZADO'> = {
        sem_resposta: 'SEM_RESPOSTA',
        negociando: 'NEGOCIANDO',
        aceita: 'ACEITA',
        negada: 'NEGADA',
        personalizado: 'PERSONALIZADO',
    }
    return map[status]
}

function normalizeProposal(proposal: any) {
    const packages = Array.isArray(proposal?.packageIds) ? proposal.packageIds.map(normalizePackage) : []
    return {
        ...proposal,
        commercialStatus: fromBackendCommercialStatus(proposal?.commercialStatus),
        packageIds: packages.map((pkg: any) => pkg.id),
        packages,
    }
}

class HttpGateway {
    private token: string | null = null

    setToken(token: string) {
        this.token = token
    }

    clearToken() {
        this.token = null
    }

    private async request<T>(
        method: string,
        path: string,
        body?: any,
        requireAuth = true
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        if (requireAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`
        }

        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Request failed')
        }

        return response.json()
    }

    async register(email: string, password: string, name: string) {
        const result = await this.request<any>('POST', '/auth/register', { email, password, name }, false)
        if (result.token) this.setToken(result.token)
        return result
    }

    async login(email: string, password: string) {
        const result = await this.request<any>('POST', '/auth/login', { email, password }, false)
        if (result.token) this.setToken(result.token)
        return result
    }

    async getMe() {
        return this.request<any>('GET', '/auth/me')
    }

    async getProvider(providerId: string) {
        const result = await this.request<any>('GET', '/providers/' + providerId)
        return result.provider
    }

    async listProviders() {
        const result = await this.request<any>('GET', '/providers/me')
        return result.providers || []
    }

    async createProvider(data: any) {
        const result = await this.request<any>('POST', '/providers', data)
        return result.provider
    }

    async updateProvider(providerId: string, data: any) {
        const result = await this.request<any>('PATCH', '/providers/' + providerId, data)
        return result.provider
    }

    async deleteProvider(providerId: string) {
        return this.request<void>('DELETE', '/providers/' + providerId)
    }

    async uploadFile(file: File): Promise<{ file_url: string }> {
        const formData = new FormData()
        formData.append('file', file)
        const headers: Record<string, string> = {}
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`
        const response = await fetch(`${API_URL}/upload`, { method: 'POST', headers, body: formData })
        if (!response.ok) {
            let message = 'Upload failed'
            try {
                const payload = await response.json()
                if (payload?.message) {
                    message = payload.message
                }
            } catch {
                // fallback para manter erro padrão
            }
            throw new Error(message)
        }
        return response.json()
    }

    async listPackages(providerId: string) {
        const result = await this.request<any>('GET', `/packages/provider/${providerId}`)
        return (result.packages || []).map(normalizePackage)
    }

    async getPackage(packageId: string) {
        const result = await this.request<any>('GET', `/packages/${packageId}`)
        return normalizePackage(result.package)
    }

    async createPackage(data: any) {
        const result = await this.request<any>('POST', '/packages', data)
        return normalizePackage(result.package)
    }

    async updatePackage(packageId: string, data: any) {
        const result = await this.request<any>('PATCH', `/packages/${packageId}`, data)
        return normalizePackage(result.package)
    }

    async deletePackage(packageId: string) {
        return this.request<void>('DELETE', `/packages/${packageId}`)
    }

    async listPackageItems(packageId: string) {
        const result = await this.request<any>('GET', `/package-items/package/${packageId}`)
        return result.items || []
    }

    async getPackageItem(itemId: string) {
        const result = await this.request<any>('GET', `/package-items/${itemId}`)
        return result.item
    }

    async createPackageItem(data: any) {
        const result = await this.request<any>('POST', '/package-items', data)
        return result.item
    }

    async updatePackageItem(itemId: string, data: any) {
        const result = await this.request<any>('PATCH', `/package-items/${itemId}`, data)
        return result.item
    }

    async deletePackageItem(itemId: string) {
        return this.request<void>('DELETE', `/package-items/${itemId}`)
    }

    async listProposals(providerId: string) {
        const result = await this.request<any>('GET', `/proposals/provider/${providerId}`)
        return (result.proposals || []).map(normalizeProposal)
    }

    async getProposal(proposalId: string) {
        const result = await this.request<any>('GET', `/proposals/${proposalId}`)
        return normalizeProposal(result.proposal)
    }

    async getPublicProposalBySlug(slug: string) {
        const result = await this.request<any>('GET', `/public/proposals/${slug}`, undefined, false)
        return normalizeProposal(result.proposal)
    }

    async createProposal(data: any) {
        const result = await this.request<any>('POST', '/proposals', data)
        return normalizeProposal(result.proposal)
    }

    async updateProposal(proposalId: string, data: any) {
        const result = await this.request<any>('PATCH', `/proposals/${proposalId}`, data)
        return normalizeProposal(result.proposal)
    }

    async deleteProposal(proposalId: string) {
        return this.request<void>('DELETE', `/proposals/${proposalId}`)
    }

    async recordProposalView(data: { proposalId: string; proposalSlug?: string; sessionId?: string }) {
        const result = await this.request<any>(
            'POST',
            '/proposal-views',
            {
                proposalId: data.proposalId,
                proposalSlug: data.proposalSlug ?? '',
                sessionId: data.sessionId ?? `session-${Date.now()}`,
                viewedAt: new Date().toISOString(),
            },
            false
        )
        return result.view
    }

    async updateCommercialStatus(
        proposalId: string,
        commercialStatus: 'sem_resposta' | 'negociando' | 'aceita' | 'negada' | 'personalizado'
    ) {
        const result = await this.request<any>('PATCH', `/proposals/${proposalId}`, {
            commercialStatus: toBackendCommercialStatus(commercialStatus),
        })
        return normalizeProposal(result.proposal)
    }

    async createStripeCheckout(priceId: string): Promise<{ sessionId: string }> {
        return this.request<{ sessionId: string }>('POST', '/stripe/create-checkout', { priceId }, true)
    }
}

export const httpGateway = new HttpGateway()
