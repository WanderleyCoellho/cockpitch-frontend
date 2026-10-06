import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import { legacyProposalToBlocks } from '../../shared/blocks'
import type { Package, PackageItem, Proposal, Provider } from '../../shared/types'
import { useAuth } from '../context/AuthContext'
import { visibleBlocks } from '../components/proposal/blocks/BlockRenderer'
import { PrintDocument } from '../components/proposal/print/PrintDocument'
import { getThemeTokens } from '../components/proposal/ThemeSelector'
import { ProposalThemeStyle } from '../components/proposal/public/theme'

const MEDIA_TIMEOUT_MS = 5000

/** Espera imagens e fontes (no máximo 5 s): mídia que falha não bloqueia a impressão. */
async function waitForMedia(root: HTMLElement) {
    const images = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete)
    const loads = images.map((img) => new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
    }))
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve()
    await Promise.race([Promise.all([...loads, fonts]), new Promise((resolve) => setTimeout(resolve, MEDIA_TIMEOUT_MS))])
}

export default function ProposalPrintPage() {
    const { slug = '' } = useParams()
    const [params] = useSearchParams()
    const { isAuthenticated } = useAuth()
    const docRef = useRef<HTMLDivElement>(null)
    const printed = useRef(false)

    const { data: proposal, isLoading, error } = useQuery<Proposal | undefined>({
        queryKey: ['proposal-public', slug],
        queryFn: () => httpGateway.getPublicProposalBySlug(slug),
    })
    const accepted = proposal?.acceptance?.state === 'ACCEPTED'

    // Equipe logada imprime o comprovante completo (e-mail, documento, IP). Para os demais, só o resumo público.
    const { data: evidence, isFetched: evidenceFetched } = useQuery({
        queryKey: ['proposal-responses', proposal?.id, 'print'],
        queryFn: async () => {
            try {
                const responses = await httpGateway.listProposalResponses(proposal!.id)
                return [...responses].reverse().find((r) => r.type === 'ACCEPTED') ?? null
            } catch {
                return null
            }
        },
        enabled: !!proposal && accepted && isAuthenticated,
    })

    const provider = proposal?.provider as Provider | undefined
    const packages = (proposal?.packages ?? []) as Array<Package & { items?: PackageItem[] }>

    const blocks = useMemo(() => {
        if (!proposal) return []
        if (Array.isArray(proposal.blocks)) return visibleBlocks(proposal.blocks)
        // Proposta no layout antigo: imprime a versão em blocos equivalente (sem aceite, que ela não tem).
        return legacyProposalToBlocks(proposal, provider).filter((b) => b.type !== 'acceptance')
    }, [proposal, provider])

    const selection = useMemo(() => {
        const acceptedSel = proposal?.acceptance?.accepted
        if (accepted && acceptedSel) return { packageId: acceptedSel.packageId, optionalIds: acceptedSel.optionalIds }
        const pkg = packages.find((p) => p.id === params.get('pkg')) ?? (packages.length === 1 ? packages[0] : undefined)
        const allowed = new Set((pkg?.items ?? []).filter((i) => i.kind === 'OPTIONAL').map((i) => i.id))
        const optionalIds = (params.get('opt') ?? '').split(',').filter((id) => allowed.has(id))
        return { packageId: pkg?.id ?? null, optionalIds }
    }, [accepted, proposal, packages, params])

    const empresa = provider?.name ?? 'Empresa'
    const ready = !!proposal && (!accepted || !isAuthenticated || evidenceFetched)

    useEffect(() => {
        if (!proposal) return
        document.title = `Proposta - ${proposal.clientName} - ${empresa}`
    }, [proposal, empresa])

    useEffect(() => {
        if (!ready || printed.current || params.get('auto') !== '1' || !docRef.current) return
        printed.current = true
        waitForMedia(docRef.current).then(() => window.print())
    }, [ready, params])

    if (isLoading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white/50 text-sm">Preparando o PDF…</div>
    if (error || !proposal) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white/50 text-sm">Proposta não encontrada.</div>

    const tk = getThemeTokens(proposal.theme, proposal.themeCustom)
    const expires = proposal.acceptance?.expiresAt ? new Date(proposal.acceptance.expiresAt) : null
    const created = new Date(proposal.createdAt)
    const validUntil = expires ?? (Number.isNaN(created.getTime()) ? null : new Date(created.getTime() + (proposal.validityDays ?? 30) * 86_400_000))

    return (
        <div className="min-h-screen bg-[#2a2a2a] py-0 print:bg-transparent">
            <ProposalThemeStyle tk={tk} />
            <div className="pp-no-print sticky top-0 z-10 bg-[#111] border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
                <Link to={`/p/${encodeURIComponent(slug)}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
                    <ArrowLeft className="w-4 h-4" /> Voltar à proposta
                </Link>
                <p className="text-xs text-white/45 hidden sm:block">Na janela de impressão, escolha <strong className="text-white/70">Salvar como PDF</strong> em "Destino".</p>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] text-black text-sm font-semibold hover:bg-[#d8b65a]">
                    <Printer className="w-4 h-4" /> Salvar PDF
                </button>
            </div>
            <div ref={docRef} className="py-8 print:py-0">
                <PrintDocument
                    blocks={blocks}
                    ctx={{
                        tk,
                        clientName: proposal.clientName,
                        provider,
                        packages,
                        placeholders: { cliente: proposal.clientName, empresa },
                        validUntil,
                        proposalUrl: `${window.location.origin}/p/${encodeURIComponent(slug)}`,
                        selection,
                        acceptance: proposal.acceptance,
                        acceptedEvidence: evidence ?? null,
                        removeBranding: proposal.branding?.removeBranding ?? false,
                    }}
                />
            </div>
        </div>
    )
}
