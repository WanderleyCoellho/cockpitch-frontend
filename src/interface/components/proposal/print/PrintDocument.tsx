import type { ReactNode } from 'react'
import {
    blockTitle,
    fillPlaceholders,
    fillPlaceholdersHtml,
    type PlaceholderContext,
    type ProposalBlock,
} from '../../../../shared/blocks'
import { calculatePackagePricing, formatCents, formatQuantity, lineTotalCents, packagePriceText } from '../../../../shared/pricing'
import { sanitizeHtml } from '../../../../shared/sanitizeHtml'
import type { AcceptanceState, Package, PackageItem, ProposalResponse, Provider } from '../../../../shared/types'
import type { ThemeTokens } from '../ThemeSelector'
import { isDarkTheme } from '../public/theme'

type Pkg = Package & { items?: PackageItem[] }

export type PrintContext = {
    tk: ThemeTokens
    clientName: string
    provider?: Provider | null
    packages: Pkg[]
    placeholders: PlaceholderContext
    validUntil?: Date | null
    proposalUrl: string
    /** Pacote e opcionais escolhidos (ou aceitos). */
    selection: { packageId: string | null; optionalIds: string[] }
    acceptance?: AcceptanceState
    /** Aceite completo (e-mail, documento, IP), só quando a equipe da empresa imprime pelo painel. */
    acceptedEvidence?: ProposalResponse | null
    removeBranding: boolean
}

const MUTED = (tk: ThemeTokens) => (isDarkTheme(tk) ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.6)')
const BORDER = (tk: ThemeTokens) => (isDarkTheme(tk) ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)')

function formatDate(date: Date | string | null | undefined, withTime = false) {
    if (!date) return ''
    return new Date(date).toLocaleString('pt-BR', withTime ? { dateStyle: 'long', timeStyle: 'short' } : { dateStyle: 'long' })
}

function isVideo(url?: string, type?: string) {
    return type === 'video' || (!!url && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url))
}

function Section({ title, children, keepTogether = false }: { title?: string; children: ReactNode; keepTogether?: boolean }) {
    return (
        <section className={`pdf-section ${keepTogether ? 'pdf-keep' : ''}`}>
            {title && <h2 className="pdf-h2">{title}</h2>}
            {children}
        </section>
    )
}

function Rich({ html, ctx }: { html: string; ctx: PrintContext }) {
    return <div className="pdf-rich" dangerouslySetInnerHTML={{ __html: sanitizeHtml(fillPlaceholdersHtml(html, ctx.placeholders)) }} />
}

function VideoNote({ url }: { url: string }) {
    return (
        <div className="pdf-video-note">
            Há vídeos nesta seção: assista na versão online da proposta — <a href={url}>{url}</a>
        </div>
    )
}

function Cover({ block, ctx }: { block: Extract<ProposalBlock, { type: 'cover' }>; ctx: PrintContext }) {
    const { data } = block
    const image = data.mediaUrl && !isVideo(data.mediaUrl, data.mediaType) ? data.mediaUrl : null
    return (
        <section className="pdf-cover pdf-keep">
            {image && <img src={image} alt="" className="pdf-cover-img" />}
            {data.showClientName && <p className="pdf-eyebrow">Preparada para {ctx.clientName}</p>}
            <h1 className="pdf-h1">{fillPlaceholders(data.headline, ctx.placeholders)}</h1>
            {data.subheadline && <p className="pdf-lead">{fillPlaceholders(data.subheadline, ctx.placeholders)}</p>}
            <p className="pdf-meta">
                {ctx.validUntil && <>Válida até {formatDate(ctx.validUntil)} · </>}
                Emitida em {formatDate(new Date())}
            </p>
        </section>
    )
}

function PackageCard({ pkg, ctx }: { pkg: Pkg; ctx: PrintContext }) {
    const chosen = ctx.selection.packageId === pkg.id
    const optionalIds = chosen ? ctx.selection.optionalIds : []
    const pricing = pkg.pricing
        ? calculatePackagePricing(
              {
                  priceMode: pkg.priceMode,
                  fixedPriceCents: pkg.fixedPriceCents,
                  discountType: pkg.discountType,
                  discountValue: pkg.discountValue,
                  items: (pkg.items ?? []).map((item) => ({
                      id: item.id,
                      kind: item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED'),
                      quantity: item.quantity ?? 1,
                      unitPriceCents: item.unitPriceCents ?? 0,
                  })),
              },
              optionalIds
          )
        : null
    const priceText = pricing
        ? pricing.onRequest
            ? pkg.priceLabel?.trim() || 'Sob consulta'
            : formatCents(pricing.totalCents)
        : packagePriceText(pkg)

    return (
        <div className={`pdf-package pdf-keep ${chosen ? 'pdf-package-chosen' : ''}`}>
            <div className="pdf-package-head">
                <div>
                    {chosen && <span className="pdf-badge">{ctx.acceptance?.state === 'ACCEPTED' ? 'Aceito' : 'Escolhido'}</span>}
                    <h3 className="pdf-h3">{pkg.name}</h3>
                    {pkg.description && <p className="pdf-muted">{pkg.description}</p>}
                </div>
                <p className="pdf-price">{priceText}</p>
            </div>
            {pkg.items && pkg.items.length > 0 && (
                <table className="pdf-table">
                    <tbody>
                        {pkg.items.map((item) => {
                            const kind = item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED')
                            const qty = Number(item.quantity ?? 1)
                            const line = lineTotalCents({ quantity: qty, unitPriceCents: item.unitPriceCents ?? 0 })
                            const selectedOptional = kind === 'OPTIONAL' && optionalIds.includes(item.id)
                            return (
                                <tr key={item.id} className={kind === 'OPTIONAL' && !selectedOptional ? 'pdf-row-optional' : ''}>
                                    <td className="pdf-qty">{qty !== 1 || item.unit ? `${formatQuantity(qty)}${item.unit ? ` ${item.unit}` : '×'}` : ''}</td>
                                    <td>
                                        {item.name}
                                        {kind === 'OPTIONAL' && <span className="pdf-tag">{selectedOptional ? 'opcional incluído' : 'opcional'}</span>}
                                        {kind === 'COURTESY' && <span className="pdf-tag">cortesia</span>}
                                        {item.description && <span className="pdf-item-desc">{item.description}</span>}
                                    </td>
                                    <td className="pdf-amount">
                                        {line > 0 && (kind === 'COURTESY' ? <s>{formatCents(line)}</s> : kind === 'OPTIONAL' && !selectedOptional ? `+ ${formatCents(line)}` : formatCents(line))}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
            {pricing && !pricing.onRequest && (pricing.discountCents > 0 || pricing.optionalsCents > 0) && (
                <div className="pdf-totals">
                    {pricing.optionalsCents > 0 && <p><span>Opcionais</span><span>+ {formatCents(pricing.optionalsCents)}</span></p>}
                    {pricing.discountCents > 0 && <p><span>Desconto</span><span>− {formatCents(pricing.discountCents)}</span></p>}
                    <p className="pdf-total"><span>Total</span><span>{formatCents(pricing.totalCents)}</span></p>
                </div>
            )}
        </div>
    )
}

function BlockPrint({ block, ctx }: { block: ProposalBlock; ctx: PrintContext }) {
    const title = blockTitle(block)
    const f = (text: string) => fillPlaceholders(text, ctx.placeholders)
    switch (block.type) {
        case 'cover':
            return <Cover block={block} ctx={ctx} />
        case 'about':
            return (
                <Section title={title}>
                    <div className={block.data.mediaUrl && !isVideo(block.data.mediaUrl, block.data.mediaType) ? 'pdf-about' : ''}>
                        {block.data.mediaUrl && !isVideo(block.data.mediaUrl, block.data.mediaType) && <img src={block.data.mediaUrl} alt="" className="pdf-about-img" />}
                        <Rich html={block.data.body} ctx={ctx} />
                    </div>
                </Section>
            )
        case 'scope':
            return (
                <Section title={title}>
                    {block.data.intro && <p className="pdf-p">{f(block.data.intro)}</p>}
                    <ul className="pdf-checklist">
                        {block.data.items.map((item, i) => (
                            <li key={i} className="pdf-keep">
                                <strong>{f(item.title)}</strong>
                                {item.description && <span className="pdf-muted"> — {f(item.description)}</span>}
                            </li>
                        ))}
                    </ul>
                </Section>
            )
        case 'pricing':
            if (ctx.packages.length === 0) return null
            return (
                <Section title={title}>
                    {block.data.intro && <p className="pdf-p">{f(block.data.intro)}</p>}
                    {ctx.packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} ctx={ctx} />)}
                </Section>
            )
        case 'gallery': {
            if (block.data.items.length === 0) return null
            const images = block.data.items.filter((item) => !isVideo(item.url, item.type))
            const videos = block.data.items.length - images.length
            return (
                <Section title={title}>
                    <div className="pdf-gallery">
                        {images.map((item, i) => (
                            <figure key={i} className="pdf-keep">
                                <img src={item.url} alt={item.caption || ''} />
                                {item.caption && <figcaption>{item.caption}</figcaption>}
                            </figure>
                        ))}
                    </div>
                    {videos > 0 && <VideoNote url={ctx.proposalUrl} />}
                </Section>
            )
        }
        case 'timeline':
            return (
                <Section title={title}>
                    <ol className="pdf-steps">
                        {block.data.steps.map((step, i) => (
                            <li key={i} className="pdf-keep">
                                <span className="pdf-step-n">{i + 1}</span>
                                <div>
                                    <strong>{f(step.title)}</strong>
                                    {step.duration && <span className="pdf-tag">{step.duration}</span>}
                                    {step.description && <p className="pdf-muted">{f(step.description)}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </Section>
            )
        case 'testimonials': {
            const items = block.data.items.filter((t) => t.quote.trim())
            if (items.length === 0) return null
            return (
                <Section title={title}>
                    {items.map((t, i) => (
                        <blockquote key={i} className="pdf-quote pdf-keep">
                            “{f(t.quote)}”
                            {(t.author || t.role) && <footer>— {[t.author, t.role].filter(Boolean).join(', ')}</footer>}
                        </blockquote>
                    ))}
                </Section>
            )
        }
        case 'faq': {
            const items = block.data.items.filter((q) => q.question.trim())
            if (items.length === 0) return null
            return (
                <Section title={title}>
                    {items.map((q, i) => (
                        <div key={i} className="pdf-faq pdf-keep">
                            <strong>{f(q.question)}</strong>
                            <p className="pdf-muted">{f(q.answer)}</p>
                        </div>
                    ))}
                </Section>
            )
        }
        case 'team': {
            const members = block.data.members.filter((m) => m.name.trim())
            if (members.length === 0) return null
            return (
                <Section title={title}>
                    <div className="pdf-team">
                        {members.map((m, i) => (
                            <div key={i} className="pdf-keep">
                                {m.photoUrl && <img src={m.photoUrl} alt="" />}
                                <strong>{m.name}</strong>
                                {m.role && <span className="pdf-muted">{m.role}</span>}
                                {m.bio && <p className="pdf-muted">{m.bio}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
            )
        }
        case 'terms':
            return (
                <Section title={title}>
                    <Rich html={block.data.body} ctx={ctx} />
                </Section>
            )
        case 'contact': {
            const p = ctx.provider
            const lines = [
                block.data.showEmail && p?.email ? `E-mail: ${p.email}` : null,
                block.data.showWhatsapp && p?.whatsapp ? `WhatsApp: ${p.whatsapp}` : null,
                block.data.showInstagram && p?.instagram ? `Instagram: @${p.instagram.replace('@', '')}` : null,
                p?.city ? p.city : null,
            ].filter(Boolean)
            return (
                <Section title={title} keepTogether>
                    {block.data.message && <p className="pdf-p">{f(block.data.message)}</p>}
                    {lines.map((line) => <p key={line} className="pdf-p">{line}</p>)}
                </Section>
            )
        }
        case 'cta':
            return (
                <Section keepTogether>
                    <p className="pdf-cta">{f(block.data.headline)}</p>
                </Section>
            )
        case 'acceptance': {
            const state = ctx.acceptance
            return (
                <Section title={title} keepTogether>
                    {state?.state === 'ACCEPTED' ? (
                        <p className="pdf-p">
                            <strong>Proposta aceita</strong> por {state.acceptedBy} em {formatDate(state.acceptedAt, true)}. O comprovante está na última página.
                        </p>
                    ) : state?.state === 'EXPIRED' ? (
                        <p className="pdf-p">O prazo desta proposta terminou em {formatDate(state.expiresAt)}. Fale com {ctx.placeholders.empresa} para receber uma versão atualizada.</p>
                    ) : (
                        <p className="pdf-p">
                            Para aceitar, pedir ajuste ou tirar dúvidas, acesse a proposta online: <a href={ctx.proposalUrl}>{ctx.proposalUrl}</a>
                        </p>
                    )}
                </Section>
            )
        }
        default:
            return null
    }
}

function AcceptanceCertificate({ ctx }: { ctx: PrintContext }) {
    const state = ctx.acceptance
    if (state?.state !== 'ACCEPTED' || !state.accepted) return null
    const evidence = ctx.acceptedEvidence
    const rows: Array<[string, ReactNode]> = [
        ['Proposta', `${ctx.placeholders.empresa} — para ${ctx.clientName}`],
        ['Aceita por', evidence?.signerName ?? state.acceptedBy ?? ''],
        ...(evidence
            ? ([
                  ['E-mail', evidence.signerEmail],
                  ...(evidence.signerDocument ? [['CPF/CNPJ', evidence.signerDocument] as [string, ReactNode]] : []),
                  ['Endereço IP', evidence.ip ?? '—'],
                  ['Navegador', <span className="pdf-small">{evidence.userAgent ?? '—'}</span>],
              ] as Array<[string, ReactNode]>)
            : []),
        ['Data e hora', formatDate(state.acceptedAt, true)],
        ['Pacote', state.accepted.packageName ?? '—'],
        ...(state.accepted.optionals.length ? [['Opcionais', state.accepted.optionals.join(', ')] as [string, ReactNode]] : []),
        ['Total', state.accepted.totalCents != null ? formatCents(state.accepted.totalCents) : 'Sob consulta'],
        ['Código de verificação', <span className="pdf-mono">{state.accepted.contentHash}</span>],
        ['Proposta online', <a href={ctx.proposalUrl}>{ctx.proposalUrl}</a>],
    ]
    return (
        <section className="pdf-certificate">
            <h2 className="pdf-h2">Comprovante de aceite</h2>
            <table className="pdf-cert-table">
                <tbody>
                    {rows.map(([label, value]) => (
                        <tr key={label}>
                            <th>{label}</th>
                            <td>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="pdf-small pdf-muted">
                O código de verificação é uma impressão digital (SHA-256) do conteúdo exato da proposta e da escolha feita no momento do aceite.
                Qualquer alteração posterior na proposta gera um código diferente.
                {!evidence && ' Os dados de contato e o endereço IP ficam registrados com a empresa.'}
            </p>
        </section>
    )
}

/** Proposta em formato de documento A4 (impressão / "Salvar como PDF"), sem elementos interativos. */
export function PrintDocument({ blocks, ctx }: { blocks: ProposalBlock[]; ctx: PrintContext }) {
    const { tk } = ctx
    const footerLeft = `${ctx.placeholders.empresa} · Proposta para ${ctx.clientName}${ctx.validUntil ? ` · válida até ${formatDate(ctx.validUntil)}` : ''}`
    const footerRight = ctx.removeBranding ? '' : 'Feito com Lumen Deal · '
    const cssString = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r]/g, ' ')}"`
    const hasCover = blocks.some((b) => b.type === 'cover')

    return (
        <div className="pdf-doc">
            <style>{`
                @page {
                    size: A4;
                    margin: 16mm 15mm 18mm;
                    /* A cor do tema também nas margens da folha (senão sobra uma moldura branca). */
                    background: ${tk.bg};
                    @bottom-left { content: ${cssString(footerLeft)}; font: 7.5pt '${tk.body_font}', Arial, sans-serif; color: ${MUTED(tk)}; }
                    @bottom-right { content: ${cssString(footerRight)} "Página " counter(page) " de " counter(pages); font: 7.5pt '${tk.body_font}', Arial, sans-serif; color: ${MUTED(tk)}; }
                }
                html, body { background: ${tk.bg} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .pdf-doc { color: ${tk.text}; font-family: '${tk.body_font}', Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; }
                .pdf-doc * { box-sizing: border-box; }
                .pdf-doc a { color: ${tk.accent}; word-break: break-all; }
                .pdf-h1 { font-family: '${tk.heading_font}', Georgia, serif; font-size: 28pt; line-height: 1.15; font-weight: 400; font-style: italic; margin: 0 0 10pt; }
                .pdf-h2 { font-family: '${tk.heading_font}', Georgia, serif; font-size: 16pt; font-weight: 400; font-style: italic; margin: 0 0 10pt; padding-bottom: 6pt; border-bottom: 1px solid ${tk.accent}; break-after: avoid; }
                .pdf-h3 { font-size: 12pt; font-weight: 600; margin: 2pt 0; }
                .pdf-eyebrow { color: ${tk.accent}; text-transform: uppercase; letter-spacing: .18em; font-size: 8pt; font-weight: 600; margin: 0 0 8pt; }
                .pdf-lead { font-size: 12pt; color: ${MUTED(tk)}; margin: 0 0 12pt; }
                .pdf-meta { font-size: 9pt; color: ${MUTED(tk)}; margin: 0; }
                .pdf-p { margin: 0 0 6pt; }
                .pdf-muted { color: ${MUTED(tk)}; margin: 2pt 0 0; }
                .pdf-small { font-size: 8pt; }
                .pdf-mono { font-family: 'Courier New', monospace; font-size: 8pt; word-break: break-all; }
                .pdf-section { margin: 0 0 18pt; }
                .pdf-keep { break-inside: avoid; page-break-inside: avoid; }
                .pdf-cover { padding: ${hasCover ? '10mm 0 12mm' : '0'}; margin-bottom: 14pt; border-bottom: 1px solid ${BORDER(tk)}; }
                .pdf-cover-img { width: 100%; height: 70mm; object-fit: cover; border-radius: 8pt; margin-bottom: 14pt; }
                .pdf-company { display: flex; align-items: center; gap: 10pt; margin-bottom: 18pt; font-weight: 600; }
                .pdf-company img { height: 26pt; object-fit: contain; }
                .pdf-rich p { margin: 0 0 6pt; } .pdf-rich ul { padding-left: 14pt; margin: 0 0 6pt; } .pdf-rich ol { padding-left: 14pt; } .pdf-rich strong { color: ${tk.text}; }
                .pdf-about { display: grid; grid-template-columns: 55mm 1fr; gap: 12pt; align-items: start; }
                .pdf-about-img { width: 100%; border-radius: 6pt; }
                .pdf-checklist { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 14pt; }
                .pdf-checklist li::before { content: "✓ "; color: ${tk.accent}; font-weight: 700; }
                .pdf-package { border: 1px solid ${BORDER(tk)}; border-radius: 8pt; padding: 10pt 12pt; margin-bottom: 10pt; background: ${tk.card_bg}; }
                .pdf-package-chosen { border: 2px solid ${tk.accent}; }
                .pdf-package-head { display: flex; justify-content: space-between; gap: 12pt; align-items: flex-start; }
                .pdf-price { font-family: '${tk.heading_font}', Georgia, serif; font-size: 15pt; color: ${tk.accent}; margin: 0; white-space: nowrap; }
                .pdf-badge { display: inline-block; background: ${tk.accent}; color: ${isDarkTheme(tk) ? '#000' : '#fff'}; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 1pt 6pt; border-radius: 8pt; }
                .pdf-table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 9.5pt; }
                .pdf-table td { padding: 4pt 0; border-top: 1px solid ${BORDER(tk)}; vertical-align: top; }
                .pdf-table tr { break-inside: avoid; }
                .pdf-qty { width: 18mm; color: ${MUTED(tk)}; white-space: nowrap; padding-right: 6pt !important; }
                .pdf-amount { text-align: right; white-space: nowrap; padding-left: 8pt !important; }
                .pdf-row-optional { color: ${MUTED(tk)}; }
                .pdf-tag { display: inline-block; margin-left: 6pt; font-size: 7pt; text-transform: uppercase; letter-spacing: .06em; color: ${tk.accent}; border: 1px solid ${BORDER(tk)}; border-radius: 6pt; padding: 0 4pt; }
                .pdf-item-desc { display: block; font-size: 8.5pt; color: ${MUTED(tk)}; }
                .pdf-totals { margin-top: 6pt; border-top: 1px solid ${BORDER(tk)}; padding-top: 6pt; font-size: 9.5pt; }
                .pdf-totals p { display: flex; justify-content: space-between; margin: 1pt 0; }
                .pdf-total { font-weight: 700; color: ${tk.accent}; }
                .pdf-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6pt; }
                .pdf-gallery figure { margin: 0; }
                .pdf-gallery img { width: 100%; height: 40mm; object-fit: cover; border-radius: 4pt; }
                .pdf-gallery figcaption { font-size: 8pt; color: ${MUTED(tk)}; }
                .pdf-video-note { margin-top: 6pt; font-size: 9pt; color: ${MUTED(tk)}; font-style: italic; }
                .pdf-steps { list-style: none; padding: 0; margin: 0; }
                .pdf-steps li { display: flex; gap: 10pt; margin-bottom: 8pt; }
                .pdf-step-n { flex: 0 0 18pt; height: 18pt; border-radius: 50%; background: ${tk.accent}; color: ${isDarkTheme(tk) ? '#000' : '#fff'}; font-size: 9pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
                .pdf-quote { margin: 0 0 10pt; padding-left: 10pt; border-left: 2px solid ${tk.accent}; font-style: italic; }
                .pdf-quote footer { font-style: normal; font-size: 9pt; color: ${MUTED(tk)}; margin-top: 3pt; }
                .pdf-faq { margin-bottom: 8pt; }
                .pdf-team { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
                .pdf-team > div { display: flex; flex-direction: column; gap: 2pt; }
                .pdf-team img { width: 22mm; height: 22mm; object-fit: cover; border-radius: 50%; }
                .pdf-cta { font-family: '${tk.heading_font}', Georgia, serif; font-size: 14pt; font-style: italic; text-align: center; margin: 0; }
                .pdf-certificate { break-before: page; }
                .pdf-cert-table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 9.5pt; }
                .pdf-cert-table th { text-align: left; width: 42mm; color: ${MUTED(tk)}; font-weight: 500; padding: 5pt 8pt 5pt 0; border-bottom: 1px solid ${BORDER(tk)}; vertical-align: top; }
                .pdf-cert-table td { padding: 5pt 0; border-bottom: 1px solid ${BORDER(tk)}; }
                .pdf-branding { margin-top: 20pt; text-align: center; font-size: 8pt; color: ${MUTED(tk)}; }
                @media screen {
                    .pdf-doc { max-width: 190mm; margin: 0 auto; padding: 16mm 15mm; background: ${tk.bg}; box-shadow: 0 10px 40px rgba(0,0,0,.35); }
                }
            `}</style>

            <div className="pdf-company">
                {ctx.provider?.logoUrl && <img src={ctx.provider.logoUrl} alt="" />}
                <span>{ctx.placeholders.empresa}</span>
            </div>

            {!hasCover && (
                <section className="pdf-cover pdf-keep">
                    <p className="pdf-eyebrow">Preparada para {ctx.clientName}</p>
                    <h1 className="pdf-h1">Proposta comercial</h1>
                    <p className="pdf-meta">{ctx.validUntil && <>Válida até {formatDate(ctx.validUntil)} · </>}Emitida em {formatDate(new Date())}</p>
                </section>
            )}

            {blocks.map((block) => <BlockPrint key={block.id} block={block} ctx={ctx} />)}

            <AcceptanceCertificate ctx={ctx} />

            {!ctx.removeBranding && <p className="pdf-branding">Proposta feita com Lumen Deal · deal.lumendevstudios.com</p>}
        </div>
    )
}
