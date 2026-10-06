import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, MessageSquareText, RotateCcw, ThumbsDown } from 'lucide-react'
import { httpGateway } from '../../../infra/gateway/HttpGateway'
import { formatCents } from '../../../shared/pricing'
import type { ProposalResponse, ProposalResponseType } from '../../../shared/types'
import HelpTip from '../help/HelpTip'

const TYPE_META: Record<ProposalResponseType, { label: string; Icon: typeof CheckCircle2; className: string }> = {
    ACCEPTED: { label: 'Aceitou', Icon: CheckCircle2, className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' },
    CHANGE_REQUESTED: { label: 'Pediu ajuste', Icon: MessageSquareText, className: 'text-amber-200 bg-amber-500/10 border-amber-500/25' },
    DECLINED: { label: 'Recusou', Icon: ThumbsDown, className: 'text-red-300 bg-red-500/10 border-red-500/25' },
}

export const RESPONSE_LABEL: Record<ProposalResponseType, string> = {
    ACCEPTED: 'Aceita',
    CHANGE_REQUESTED: 'Pediu ajuste',
    DECLINED: 'Recusada',
}

function ResponseCard({ response }: { response: ProposalResponse }) {
    const meta = TYPE_META[response.type]
    const selection = response.selection
    return (
        <li className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${meta.className}`}>
                    <meta.Icon className="w-3.5 h-3.5" /> {meta.label}
                </span>
                <span className="text-xs text-white/40">{new Date(response.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <div className="text-sm text-white/85">
                {response.signerName} · <a href={`mailto:${response.signerEmail}`} className="text-[#C9A84C] hover:underline">{response.signerEmail}</a>
                {response.signerDocument && <span className="text-white/50"> · {response.signerDocument}</span>}
            </div>
            {response.message && <p className="text-sm text-white/65 whitespace-pre-line border-l-2 border-white/10 pl-3">{response.message}</p>}
            {selection && (
                <p className="text-xs text-white/55">
                    {selection.packageName}
                    {selection.optionals.length > 0 && ` + ${selection.optionals.map((o) => o.name).join(', ')}`}
                    {response.totalCents != null && <> · <strong className="text-white/85">{formatCents(response.totalCents)}</strong></>}
                </p>
            )}
            <p className="text-[11px] text-white/30 break-all">
                IP {response.ip ?? '—'} · comprovante {response.contentHash.slice(0, 16)}
            </p>
        </li>
    )
}

/** Aba "Respostas" da proposta: histórico do aceite online e opção de reabrir. */
export function ResponsesPanel({ proposalId, isClosed, onChanged }: { proposalId: string; isClosed: boolean; onChanged?: () => void }) {
    const { data: responses = [], isLoading, error, refetch } = useQuery({
        queryKey: ['proposal-responses', proposalId],
        queryFn: () => httpGateway.listProposalResponses(proposalId),
    })
    const reopen = useMutation({
        mutationFn: () => httpGateway.reopenProposal(proposalId),
        onSuccess: () => {
            refetch()
            onChanged?.()
        },
    })
    const closed = isClosed && !reopen.isSuccess

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-semibold text-white">Respostas do cliente</h3>
                        <HelpTip helpKey="proposal.responses" />
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">Aceites, pedidos de ajuste e recusas enviados pelo link, do mais antigo ao mais recente.</p>
                </div>
                {closed && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => window.confirm('Reabrir a proposta para novas respostas? O histórico continua guardado.') && reopen.mutate()}
                            disabled={reopen.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/12 text-xs text-white/75 hover:text-white hover:bg-white/5 disabled:opacity-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reabrir proposta
                        </button>
                        <HelpTip helpKey="proposal.reopen" />
                    </div>
                )}
            </div>
            {reopen.isSuccess && <p className="text-xs text-emerald-300">Proposta reaberta: o cliente já pode responder de novo pelo mesmo link.</p>}
            {reopen.error && <p className="text-xs text-red-400">{(reopen.error as Error).message}</p>}

            {isLoading && <p className="text-sm text-white/40">Carregando…</p>}
            {error && <p className="text-sm text-red-400">Não foi possível carregar as respostas.</p>}
            {!isLoading && !error && responses.length === 0 && (
                <div className="text-center py-10 rounded-2xl border border-dashed border-white/10">
                    <p className="text-sm text-white/50">Nenhuma resposta ainda.</p>
                    <p className="text-xs text-white/30 mt-1">Para o cliente aceitar pelo link, a página precisa ter o bloco "Aceite online".</p>
                </div>
            )}
            <ul className="space-y-3">
                {responses.map((response) => <ResponseCard key={response.id} response={response} />)}
            </ul>
        </div>
    )
}
