/**
 * HTTP Gateway
 * Centraliza chamadas REST ao backend dedicado
 */

import type { ProposalResponse, ProposalResponseType, ProposalTemplate, WorkspaceDetails, WorkspaceInviteItem, WorkspaceMemberItem } from '../../shared/types'
import type { ProposalBlock } from '../../shared/blocks'

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

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly code?: string,
        /** Corpo da resposta de erro (ex.: dados do Google para completar o cadastro). */
        public readonly details?: any
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

const FALLBACK_MESSAGES: Record<number, string> = {
    400: 'Dados inválidos. Revise os campos e tente novamente.',
    401: 'Sua sessão expirou. Entre novamente.',
    403: 'Você não tem permissão para esta ação.',
    404: 'Não encontrado.',
    409: 'Já existe um registro com esses dados.',
    413: 'Arquivo ou conteúdo grande demais.',
    429: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
}

/** Extrator central de mensagem de erro da API (formato `{ message, code?, issues? }`). */
export function extractErrorMessage(status: number, data: any): string {
    const issue = Array.isArray(data?.issues) ? data.issues[0] : null
    if (issue?.message && issue.message !== 'Required') {
        const field = Array.isArray(issue.path) && issue.path.length ? `${issue.path.join('.')}: ` : ''
        return `${field}${issue.message}`
    }
    if (typeof data?.message === 'string' && data.message && status < 500) return data.message
    return FALLBACK_MESSAGES[status] ?? 'Algo deu errado. Tente novamente em instantes.'
}

class HttpGateway {
    private token: string | null = null
    private workspaceId: string | null = null

    /** Empresa ativa: enviada em toda chamada autenticada (o backend valida a associação). */
    setWorkspace(workspaceId: string | null) {
        this.workspaceId = workspaceId
    }

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
            if (this.workspaceId) headers['X-Workspace-Id'] = this.workspaceId
        }

        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        })

        // Respostas sem corpo (204) ou não-JSON (ex.: página de erro do proxy) não podem quebrar o parse.
        const text = await response.text()
        let data: any = null
        if (text) {
            try {
                data = JSON.parse(text)
            } catch {
                data = null
            }
        }

        if (!response.ok) {
            if (response.status === 401 && requireAuth && this.token) {
                // Sessão expirada/inválida: tratamento central (AuthContext escuta este evento).
                window.dispatchEvent(new CustomEvent('auth:unauthorized'))
            }
            throw new ApiError(response.status, extractErrorMessage(response.status, data), data?.code, data)
        }

        return data as T
    }

    async register(
        email: string,
        password: string,
        name: string,
        extra: { workspaceName?: string; segment?: string; inviteToken?: string } = {}
    ) {
        const result = await this.request<any>('POST', '/auth/register', { email, password, name, ...extra }, false)
        if (result.token) this.setToken(result.token)
        return result
    }

    async login(email: string, password: string) {
        const result = await this.request<any>('POST', '/auth/login', { email, password }, false)
        if (result.token) this.setToken(result.token)
        return result
    }

    async getGoogleConfig(): Promise<{ enabled: boolean; clientId: string | null }> {
        return this.request('GET', '/auth/google/config', undefined, false)
    }

    /** Entrar/cadastrar com Google. Gmail sem conta → ApiError GOOGLE_ACCOUNT_NOT_FOUND (details.google). */
    async loginWithGoogle(body: { credential: string; workspaceName?: string; segment?: string; inviteToken?: string }) {
        const result = await this.request<any>('POST', '/auth/google', body, false)
        if (result.token) this.setToken(result.token)
        return result
    }

    async getNotificationPreferences(): Promise<{ notifyOnOpen: boolean; notifyOnResponse: boolean }> {
        const result = await this.request<any>('GET', '/workspaces/current/notifications')
        return result.preferences
    }

    async updateNotificationPreferences(patch: { notifyOnOpen?: boolean; notifyOnResponse?: boolean }) {
        const result = await this.request<any>('PATCH', '/workspaces/current/notifications', patch)
        return result.preferences as { notifyOnOpen: boolean; notifyOnResponse: boolean }
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
        // Conta o arquivo na cota da empresa ativa (e não na mais antiga do usuário).
        if (this.workspaceId) headers['X-Workspace-Id'] = this.workspaceId
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
        return { ...normalizeProposal(result.proposal), acceptance: result.acceptance, branding: result.branding }
    }

    async createProposal(data: any) {
        const result = await this.request<any>('POST', '/proposals', data)
        return normalizeProposal(result.proposal)
    }

    async updateProposal(proposalId: string, data: any) {
        const result = await this.request<any>('PATCH', `/proposals/${proposalId}`, data)
        return normalizeProposal(result.proposal)
    }

    // ── Aceite online ──
    async submitProposalResponse(
        slug: string,
        body: {
            type: ProposalResponseType
            signerName: string
            signerEmail: string
            signerDocument?: string
            message?: string
            packageId?: string
            optionalItemIds?: string[]
            agreeTerms?: boolean
        }
    ): Promise<Pick<ProposalResponse, 'id' | 'type' | 'createdAt' | 'totalCents' | 'selection' | 'contentHash'>> {
        const result = await this.request<{ response: ProposalResponse }>('POST', `/public/proposals/${encodeURIComponent(slug)}/responses`, body, false)
        return result.response
    }

    async listProposalResponses(proposalId: string): Promise<ProposalResponse[]> {
        const result = await this.request<{ responses: ProposalResponse[] }>('GET', `/proposals/${proposalId}/responses`)
        return result.responses
    }

    async reopenProposal(proposalId: string) {
        return this.request<{ proposal: { id: string; status: string; commercialStatus: string } }>('POST', `/proposals/${proposalId}/reopen`)
    }

    // ── Modelos de proposta ──
    async listTemplates(): Promise<{ system: ProposalTemplate[]; workspace: ProposalTemplate[] }> {
        return this.request('GET', '/templates')
    }

    async createTemplate(data: {
        name: string
        description?: string
        segment?: string
        blocks: ProposalBlock[]
        theme?: string
        themeCustom?: Record<string, unknown> | null
    }): Promise<ProposalTemplate> {
        const result = await this.request<{ template: ProposalTemplate }>('POST', '/templates', data)
        return result.template
    }

    async deleteTemplate(templateId: string) {
        return this.request<void>('DELETE', `/templates/${templateId}`)
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
            // Com sessão aberta, o servidor reconhece a própria equipe e não conta a abertura.
            true
        )
        return result?.view ?? null
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

    // ---------- Workspaces e equipe ----------
    async getCurrentWorkspace(): Promise<WorkspaceDetails> {
        const result = await this.request<{ workspace: WorkspaceDetails }>('GET', '/workspaces/current')
        return result.workspace
    }

    async updateWorkspace(data: { name?: string; segment?: string; brandColor?: string | null; logoUrl?: string | null }) {
        const result = await this.request<any>('PATCH', '/workspaces/current', data)
        return result.workspace
    }

    async listMembers(): Promise<{ members: WorkspaceMemberItem[]; invites: WorkspaceInviteItem[] }> {
        return this.request('GET', '/workspaces/current/members')
    }

    async createInvite(email: string, role: 'ADMIN' | 'MEMBER'): Promise<{ invite: WorkspaceInviteItem; inviteUrl: string }> {
        return this.request('POST', '/workspaces/current/invites', { email, role })
    }

    async revokeInvite(inviteId: string) {
        return this.request<void>('DELETE', `/workspaces/current/invites/${inviteId}`)
    }

    async updateMemberRole(memberId: string, role: 'ADMIN' | 'MEMBER') {
        return this.request<any>('PATCH', `/workspaces/current/members/${memberId}`, { role })
    }

    async removeMember(memberId: string) {
        return this.request<void>('DELETE', `/workspaces/current/members/${memberId}`)
    }

    async getInvite(token: string): Promise<{
        email: string
        role: 'ADMIN' | 'MEMBER'
        expiresAt: string
        workspace: { name: string; logoUrl?: string | null }
    }> {
        const result = await this.request<any>('GET', `/invites/${encodeURIComponent(token)}`, undefined, false)
        return result.invite
    }

    async acceptInvite(token: string): Promise<{ workspaceId: string }> {
        return this.request('POST', `/invites/${encodeURIComponent(token)}/accept`)
    }

    async createStripeCheckout(planTier: 'STARTER' | 'PRO' | 'AGENCY'): Promise<{ sessionId: string; url: string | null }> {
        return this.request<{ sessionId: string; url: string | null }>('POST', '/stripe/create-checkout', { planTier }, true)
    }
}

export const httpGateway = new HttpGateway()
