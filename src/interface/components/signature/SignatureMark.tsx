import type { ProposalSignatureView } from '../../../shared/types'
import { SIGNATURE_FONT, useSignatureFont } from './SignaturePad'

export function formatSignedAt(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Só o traço da assinatura (imagem desenhada ou nome em fonte manuscrita), sobre fundo de papel. */
export function SignatureGlyph({ signature, height = 72 }: { signature: Pick<ProposalSignatureView, 'method' | 'image' | 'typedText' | 'signerName'>; height?: number }) {
    useSignatureFont()
    return (
        <div className="flex items-end justify-center overflow-hidden" style={{ height }}>
            {signature.method === 'DRAWN' && signature.image ? (
                <img src={signature.image} alt={`Assinatura de ${signature.signerName}`} style={{ maxHeight: height, maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
                <span style={{ fontFamily: `'${SIGNATURE_FONT}', cursive`, fontSize: Math.round(height * 0.58), lineHeight: 1.1, color: '#16181d', whiteSpace: 'nowrap' }}>
                    {signature.typedText || signature.signerName}
                </span>
            )}
        </div>
    )
}

/**
 * Bloco de assinatura (traço + linha + nome, CPF e data), como no pé de um contrato.
 * Sem assinatura: mostra a linha vazia com o aviso de pendência.
 */
export function SignatureMark({
    signature,
    roleLabel,
    pendingText,
}: {
    signature: ProposalSignatureView | null
    roleLabel: string
    pendingText: string
}) {
    return (
        <div className="rounded-2xl px-5 pt-4 pb-4 text-center" style={{ background: '#fbfaf7', color: '#16181d', border: '1px solid rgba(0,0,0,0.08)' }}>
            {signature ? <SignatureGlyph signature={signature} /> : <div style={{ height: 72 }} className="flex items-end justify-center pb-2 text-xs italic" aria-label="Assinatura pendente"><span style={{ color: 'rgba(0,0,0,0.4)' }}>{pendingText}</span></div>}
            <div className="mx-auto mb-2 h-px w-4/5" style={{ background: 'rgba(0,0,0,0.25)' }} />
            <p className="text-sm font-semibold leading-tight">{signature?.signerName ?? '—'}</p>
            <p className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(0,0,0,0.5)' }}>
                {roleLabel}
                {signature?.signerTitle ? ` · ${signature.signerTitle}` : ''}
            </p>
            {signature && (
                <p className="text-[11px] mt-1.5 leading-snug" style={{ color: 'rgba(0,0,0,0.55)' }}>
                    CPF {signature.document} · {formatSignedAt(signature.signedAt)}
                    <br />
                    E-mail confirmado por código
                </p>
            )}
        </div>
    )
}
