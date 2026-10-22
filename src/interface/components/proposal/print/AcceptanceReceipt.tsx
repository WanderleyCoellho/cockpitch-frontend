import type { ReactNode } from 'react'
import { calculatePackagePricing, formatCents, formatQuantity, lineTotalCents } from '../../../../shared/pricing'
import { maskCpf as formatCpf } from '../../../../shared/cpf'
import type { ProposalSignatureView } from '../../../../shared/types'
import { SignatureGlyph, formatSignedAt } from '../../signature/SignatureMark'
import type { PrintContext } from './PrintDocument'

/**
 * Comprovante de aceite (layout único, com as cores da plataforma: preto e dourado).
 * Inspirado num modelo de fatura: faixa no topo, itens num cartão sobreposto, totais e assinaturas.
 * Sai como última página do PDF da proposta e sozinho em /p/:slug/comprovante.
 */

const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E8CF8A'
const INK = '#141414'
const PAPER = '#F6F4EF'

function brDate(date: string | Date, withTime = false) {
    return new Date(date).toLocaleString('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' } : { dateStyle: 'long', timeZone: 'America/Sao_Paulo' })
}

/** Número curto e estável do comprovante (do código de verificação do aceite). */
export function receiptNumber(contentHash: string) {
    return `LD-${contentHash.slice(0, 8).toUpperCase()}`
}

function plainText(html: string) {
    return html.replace(/<\/(p|li|h\d)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{2,}/g, '\n').trim()
}

type Row = { n: number; name: string; description?: string | null; unit: string; qty: string; total: string; note?: string }

function receiptRows(ctx: PrintContext): Row[] {
    const accepted = ctx.acceptance?.accepted
    const pkg = ctx.packages.find((p) => p.id === accepted?.packageId)
    if (!pkg) return accepted?.packageName ? [{ n: 1, name: accepted.packageName, unit: '—', qty: '1', total: accepted.totalCents != null ? formatCents(accepted.totalCents) : 'Sob consulta' }] : []
    const optionalIds = accepted?.optionalIds ?? []
    const fixed = pkg.priceMode === 'FIXED'
    const items = (pkg.items ?? []).filter((item) => {
        const kind = item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED')
        return kind !== 'OPTIONAL' || optionalIds.includes(item.id)
    })
    if (items.length === 0) return [{ n: 1, name: pkg.name, description: pkg.description, unit: '—', qty: '1', total: accepted?.totalCents != null ? formatCents(accepted.totalCents) : 'Sob consulta' }]
    return items.map((item, i) => {
        const kind = item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED')
        const qty = Number(item.quantity ?? 1)
        const unitCents = item.unitPriceCents ?? 0
        const line = lineTotalCents({ quantity: qty, unitPriceCents: unitCents })
        // Pacote de valor fechado: os itens descrevem o que está incluso, sem preço por linha.
        const priced = !fixed && kind !== 'COURTESY' && unitCents > 0
        return {
            n: i + 1,
            name: item.name,
            description: item.description,
            unit: priced ? formatCents(unitCents) : '—',
            qty: `${formatQuantity(qty)}${item.unit ? ` ${item.unit}` : ''}`,
            total: kind === 'COURTESY' ? 'Cortesia' : priced ? formatCents(line) : 'Incluso',
            note: kind === 'OPTIONAL' ? 'opcional' : undefined,
        }
    })
}

function Signature({ signature, role, pending }: { signature: ProposalSignatureView | null; role: string; pending: string }) {
    return (
        <div className="rc-sign">
            <div className="rc-sign-glyph">{signature ? <SignatureGlyph signature={signature} height={54} /> : <span className="rc-sign-pending">{pending}</span>}</div>
            <div className="rc-sign-line" />
            <p className="rc-sign-name">{signature?.signerName ?? '—'}</p>
            <p className="rc-sign-role">
                {role}
                {signature?.signerTitle ? ` · ${signature.signerTitle}` : ''}
            </p>
            {signature && (
                <p className="rc-sign-meta">
                    CPF {signature.document} · {formatSignedAt(signature.signedAt)}
                    <br />
                    E-mail confirmado por código
                </p>
            )}
        </div>
    )
}

export function AcceptanceReceipt({ ctx, terms: termsHtml }: { ctx: PrintContext; terms?: string | null }) {
    const state = ctx.acceptance
    const accepted = state?.state === 'ACCEPTED' ? state.accepted : undefined
    if (!state || !accepted) return null
    const evidence = ctx.acceptedEvidence
    const company = ctx.placeholders.empresa
    const provider = ctx.provider
    const clientSig = ctx.signatures?.client ?? null
    const providerSig = ctx.signatures?.provider?.current ? ctx.signatures.provider : null
    const signerDoc = evidence?.signerDocument && /^\d{11}$/.test(evidence.signerDocument) ? formatCpf(evidence.signerDocument) : clientSig?.document ?? evidence?.signerDocument ?? null
    const rows = receiptRows(ctx)
    const pkg = ctx.packages.find((p) => p.id === accepted.packageId)
    const pricing = pkg?.pricing
        ? calculatePackagePricing(
              {
                  priceMode: pkg.priceMode,
                  fixedPriceCents: pkg.fixedPriceCents,
                  discountType: pkg.discountType,
                  discountValue: pkg.discountValue,
                  items: (pkg.items ?? []).map((item) => ({ id: item.id, kind: item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED'), quantity: item.quantity ?? 1, unitPriceCents: item.unitPriceCents ?? 0 })),
              },
              accepted.optionalIds
          )
        : null
    const total = accepted.totalCents != null ? formatCents(accepted.totalCents) : pkg?.priceLabel?.trim() || 'Sob consulta'
    const terms = termsHtml ? plainText(termsHtml) : ''
    const contacts: Array<[string, string]> = [
        ...(provider?.whatsapp ? [['WhatsApp', provider.whatsapp] as [string, string]] : []),
        ...(provider?.email ? [['E-mail', provider.email] as [string, string]] : []),
        ...(provider?.instagram ? [['Instagram', `@${provider.instagram.replace(/^@/, '')}`] as [string, string]] : []),
    ]
    const summary: Array<[string, string]> = pricing && !pricing.onRequest
        ? [
              ['Subtotal', formatCents(pricing.baseCents)],
              ...(pricing.optionalsCents > 0 ? [['Opcionais', formatCents(pricing.optionalsCents)] as [string, string]] : []),
              ...(pricing.discountCents > 0 ? [['Desconto', `− ${formatCents(pricing.discountCents)}`] as [string, string]] : []),
          ]
        : []

    const evidenceItems: ReactNode[] = [
        <>Aceite em {brDate(state.acceptedAt!, true)}</>,
        ...(evidence?.signerEmail ? [<>E-mail {evidence.signerEmail}</>] : []),
        ...(evidence?.ip ? [<>IP {evidence.ip}</>] : []),
        <>Proposta online: <a href={ctx.proposalUrl}>{ctx.proposalUrl}</a></>,
    ]

    return (
        <section className="rc-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
                @page receipt { size: A4; margin: 0; background: ${PAPER}; }
                .rc-page { page: receipt; break-before: page; position: relative; width: 210mm; min-height: 297mm; background: ${PAPER}; color: ${INK}; font-family: 'Inter', Arial, sans-serif; font-size: 9.5pt; line-height: 1.45; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .rc-page * { box-sizing: border-box; }
                .rc-page a { color: inherit; word-break: break-all; }
                .rc-band { height: 86mm; padding: 13mm 16mm 0; color: #fff; display: grid; grid-template-columns: 1.15fr 1fr; gap: 10mm;
                    background: radial-gradient(120% 140% at 100% 0%, rgba(201,168,76,.55) 0%, rgba(201,168,76,0) 55%), linear-gradient(115deg, #0B0B0B 0%, #15120C 45%, #2A2213 75%, #5C4A1F 100%); }
                .rc-brand { display: flex; align-items: center; gap: 8pt; font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 12pt; letter-spacing: .02em; }
                .rc-brand img { height: 30pt; max-width: 46mm; object-fit: contain; }
                .rc-title { font-family: 'Montserrat', Arial, sans-serif; font-weight: 800; font-size: 34pt; letter-spacing: .01em; line-height: 1; margin: 8mm 0 3pt; }
                .rc-number { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 10.5pt; color: ${GOLD_LIGHT}; margin: 0; }
                .rc-issued { margin: 5mm 0 0; font-size: 9pt; color: rgba(255,255,255,.75); }
                .rc-info { padding-top: 2mm; }
                .rc-info dt { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 9.5pt; color: ${GOLD_LIGHT}; margin: 0; }
                .rc-info dd { margin: 1pt 0 4.5pt; font-size: 8.5pt; color: rgba(255,255,255,.8); }
                .rc-info .rc-due { margin-top: 2mm; font-size: 9.5pt; color: #fff; }
                .rc-info .rc-due strong { color: ${GOLD_LIGHT}; font-family: 'Montserrat', Arial, sans-serif; }
                .rc-card { position: relative; margin: -22mm 12mm 0; background: #fff; border-radius: 6mm 6mm 0 0; padding: 5mm 6mm 1mm; }
                .rc-table { width: 100%; border-collapse: separate; border-spacing: 0 1.2mm; }
                .rc-table th { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 9.5pt; text-align: left; padding: 2.4mm 3mm; background: #EDEAE3; }
                .rc-table th:first-child { border-radius: 2.5mm 0 0 2.5mm; } .rc-table th:last-child { border-radius: 0 2.5mm 2.5mm 0; }
                .rc-table td { padding: 1.8mm 3mm; vertical-align: top; font-size: 8.5pt; }
                .rc-table tr.rc-alt td { background: #F4F2EC; }
                .rc-table tr.rc-alt td:first-child { border-radius: 2.5mm 0 0 2.5mm; } .rc-table tr.rc-alt td:last-child { border-radius: 0 2.5mm 2.5mm 0; }
                .rc-table .rc-num { width: 12mm; font-weight: 600; }
                .rc-table .rc-r { text-align: right; white-space: nowrap; }
                .rc-table .rc-c { text-align: center; white-space: nowrap; }
                .rc-item { font-weight: 600; font-size: 9pt; }
                .rc-desc { display: block; color: rgba(0,0,0,.55); font-size: 8pt; }
                .rc-tag { margin-left: 4pt; font-size: 6.5pt; text-transform: uppercase; letter-spacing: .06em; color: #8a6d23; border: 1px solid rgba(201,168,76,.6); border-radius: 4pt; padding: 0 3pt; }
                .rc-bottom { margin: 0 12mm; background: #fff; padding: 2mm 9mm 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
                .rc-h { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 10pt; margin: 0 0 2mm; text-transform: uppercase; letter-spacing: .04em; }
                .rc-thanks { font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 12pt; margin: 0 0 2mm; }
                .rc-contacts { margin: 0 0 4mm; padding: 0; list-style: none; font-size: 8.5pt; color: rgba(0,0,0,.7); }
                .rc-contacts b { color: ${INK}; font-weight: 600; margin-right: 4pt; }
                .rc-terms { white-space: pre-line; font-size: 8pt; color: rgba(0,0,0,.65); max-height: 34mm; overflow: hidden; margin: 0; }
                .rc-sum p { display: flex; justify-content: space-between; margin: 0 0 2.5mm; font-size: 8.5pt; }
                .rc-sum p span:first-child { font-weight: 600; }
                .rc-total { display: flex; justify-content: space-between; align-items: center; border-radius: 3mm; padding: 3.5mm 5mm; margin-top: 2mm; color: ${INK};
                    background: linear-gradient(100deg, #B8913A 0%, ${GOLD} 45%, ${GOLD_LIGHT} 100%); font-family: 'Montserrat', Arial, sans-serif; font-weight: 800; font-size: 12.5pt; }
                .rc-chosen { margin: 3mm 0 0; font-size: 8pt; color: rgba(0,0,0,.6); }
                .rc-signs { margin: 0 12mm; background: #fff; padding: 0 9mm 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; break-inside: avoid; }
                .rc-sign { text-align: center; }
                .rc-sign-glyph { height: 54px; display: flex; align-items: flex-end; justify-content: center; }
                .rc-sign-pending { font-size: 8pt; font-style: italic; color: rgba(0,0,0,.45); padding-bottom: 3pt; }
                .rc-sign-line { height: 1px; background: rgba(0,0,0,.35); margin: 2pt 6% 3pt; }
                .rc-sign-name { margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-weight: 700; font-size: 10pt; }
                .rc-sign-role { margin: 1pt 0 0; font-size: 7pt; letter-spacing: .1em; text-transform: uppercase; color: rgba(0,0,0,.55); }
                .rc-sign-meta { margin: 2pt 0 0; font-size: 7pt; color: rgba(0,0,0,.6); line-height: 1.4; }
                .rc-foot { margin: 0 12mm; background: #fff; border-top: 1px solid #ECE8DF; padding: 3mm 9mm 4mm; break-inside: avoid; font-size: 7pt; color: rgba(0,0,0,.6); border-radius: 0 0 6mm 6mm; }
                .rc-foot p { margin: 0 0 1.5mm; }
                .rc-hash { font-family: 'Courier New', monospace; font-size: 7pt; word-break: break-all; color: ${INK}; }
                .rc-brandline { text-align: center; margin: 2mm 0 0; font-size: 7pt; color: rgba(0,0,0,.45); }
                @media screen { .rc-page { margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,.35); } }
            `}</style>

            <header className="rc-band">
                <div>
                    <div className="rc-brand">
                        {provider?.logoUrl ? <img src={provider.logoUrl} alt="" /> : null}
                        {!provider?.logoUrl && <span>{company}</span>}
                    </div>
                    <h1 className="rc-title">COMPROVANTE</h1>
                    <p className="rc-number"># {receiptNumber(accepted.contentHash)}</p>
                    <p className="rc-issued">
                        {company}, {brDate(state.acceptedAt!)}
                    </p>
                </div>
                <dl className="rc-info">
                    <dt>Data do aceite</dt>
                    <dd>{brDate(state.acceptedAt!, true)}</dd>
                    {accepted.packageName && (
                        <>
                            <dt>Pacote</dt>
                            <dd>{accepted.packageName}</dd>
                        </>
                    )}
                    <dt>Para:</dt>
                    <dd>
                        {ctx.clientName}
                        <br />
                        {state.acceptedBy}
                        {signerDoc ? <> · CPF {signerDoc}</> : null}
                    </dd>
                    <p className="rc-due">
                        Total: <strong>{total}</strong>
                    </p>
                </dl>
            </header>

            <div className="rc-card">
                <table className="rc-table">
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>Descrição</th>
                            <th className="rc-r">Valor</th>
                            <th className="rc-c">Qtd.</th>
                            <th className="rc-r">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.n} className={row.n % 2 === 0 ? 'rc-alt' : ''}>
                                <td className="rc-num">{String(row.n).padStart(2, '0')}.</td>
                                <td>
                                    <span className="rc-item">{row.name}</span>
                                    {row.note && <span className="rc-tag">{row.note}</span>}
                                    {row.description && <span className="rc-desc">{row.description}</span>}
                                </td>
                                <td className="rc-r">{row.unit}</td>
                                <td className="rc-c">{row.qty}</td>
                                <td className="rc-r">{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rc-bottom">
                <div>
                    <p className="rc-thanks">Obrigado pela confiança!</p>
                    {contacts.length > 0 && (
                        <ul className="rc-contacts">
                            {contacts.map(([label, value]) => (
                                <li key={label}>
                                    <b>{label}</b>
                                    {value}
                                </li>
                            ))}
                        </ul>
                    )}
                    {terms && (
                        <>
                            <p className="rc-h">Condições</p>
                            <p className="rc-terms">{terms}</p>
                        </>
                    )}
                </div>
                <div className="rc-sum">
                    {summary.map(([label, value]) => (
                        <p key={label}>
                            <span>{label}</span>
                            <span>{value}</span>
                        </p>
                    ))}
                    <div className="rc-total">
                        <span>Total</span>
                        <span>{total}</span>
                    </div>
                    {accepted.packageName && (
                        <p className="rc-chosen">
                            Pacote {accepted.packageName}
                            {accepted.optionals.length ? ` + ${accepted.optionals.join(', ')}` : ''}
                        </p>
                    )}
                </div>
            </div>

            <div className="rc-signs">
                <Signature signature={providerSig} role={`Pela ${company}`} pending="Assinatura da empresa pendente" />
                <Signature signature={clientSig} role="Cliente" pending="—" />
            </div>

            <div className="rc-foot">
                <p>
                    Assinaturas eletrônicas com CPF, e-mail confirmado por código, data, hora e IP registrados (MP 2.200-2/2001, art. 10, § 2º). {evidenceItems.map((item, i) => <span key={i}>{i > 0 && ' · '}{item}</span>)}
                </p>
                <p>
                    Código de verificação (SHA-256 do conteúdo e da escolha no aceite): <span className="rc-hash">{accepted.contentHash}</span>
                </p>
                {!ctx.removeBranding && <p className="rc-brandline">Comprovante emitido pelo Lumen Deal · deal.lumendevstudios.com</p>}
            </div>
        </section>
    )
}
