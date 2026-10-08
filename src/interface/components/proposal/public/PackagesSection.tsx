import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { calculatePackagePricing, formatCents, formatQuantity, lineTotalCents, packagePriceText } from '../../../../shared/pricing'
import type { Package, PackageItem, Proposal, Provider } from '../../../../shared/types'
import type { ThemeTokens } from '../ThemeSelector'
import type { ProposalSelection } from '../blocks/selection'
import { BlockTypeLabel } from '../blocks/shared'

interface PackagesSectionProps {
    proposal: Pick<Proposal, 'clientName'>
    packages: Array<Package & { items?: PackageItem[] }>
    provider?: Provider
    tk: ThemeTokens
    onPackageExpand?: (pkgId: string) => void
    /** Usado pelo bloco de preços: âncora, título e texto de introdução próprios. */
    sectionId?: string
    title?: string
    eyebrow?: string
    intro?: string
    /** Seleção compartilhada com o bloco de aceite (página em blocos). */
    selection?: ProposalSelection | null
    /** Âncora do bloco de aceite: o pacote ganha o botão "Escolher e aceitar". */
    acceptanceId?: string
}

export function PackagesSection({ proposal, packages, provider, tk, onPackageExpand, sectionId = 'packages', title, eyebrow = 'Investimento', intro, selection, acceptanceId }: PackagesSectionProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    // Opcionais que o cliente marcou em cada pacote: o total é recalculado na hora, sem chamar o servidor.
    const [selectedOptionals, setSelectedOptionals] = useState<Record<string, string[]>>({})

    const toggleOptional = (packageId: string, itemId: string) => {
        if (selection) return selection.toggleOptional(packageId, itemId)
        setSelectedOptionals((current) => {
            const list = current[packageId] ?? []
            return {
                ...current,
                [packageId]: list.includes(itemId) ? list.filter((id) => id !== itemId) : [...list, itemId],
            }
        })
    }
    const packageLabel = provider?.packageLabel || 'Pacotes'
    const packageLabelSingular = provider?.packageLabel?.replace(/s$/, '') || 'pacote'

    const toggle = (pkgId: string) => {
        setExpanded((prev) => {
            if (!prev[pkgId] && onPackageExpand) onPackageExpand(pkgId)
            return { ...prev, [pkgId]: !prev[pkgId] }
        })
    }

    if (!packages || packages.length === 0) return null

    return (
        <section id={sectionId} data-section={sectionId} className="px-6 py-24 md:py-32" style={{ background: 'var(--pp-bg)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    {/* Página em blocos: o rótulo só aparece na revisão do editor. */}
                    {!eyebrow && <BlockTypeLabel>Investimento</BlockTypeLabel>}
                    {eyebrow && <p className="pp-body text-xs tracking-widest uppercase mb-3 font-medium" style={{ color: 'var(--pp-accent)' }}>{eyebrow}</p>}
                    <h2 className="pp-heading text-3xl md:text-4xl font-light italic mb-4" style={{ color: 'var(--pp-text)' }}>{title || packageLabel}</h2>
                    <div className="pp-divider mb-4" />
                    {intro && (
                        <p className="pp-body text-sm leading-relaxed max-w-xl mx-auto mb-3 whitespace-pre-line" style={{ color: 'var(--pp-text)', opacity: 0.85 }}>{intro}</p>
                    )}
                    <p className="pp-body text-sm" style={{ color: 'var(--pp-muted)' }}>Toque em um {packageLabelSingular.toLowerCase()} para ver os detalhes</p>
                </div>
                {/* items-start: abrir um pacote não estica o vizinho da mesma linha (parecia que os dois abriam). */}
                <div className={`grid items-start gap-6 ${packages.length === 1 ? 'max-w-sm mx-auto' : packages.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
                    {packages.map((pkg) => {
                        const isOpen = !!expanded[pkg.id]
                        const chosen = (selection ? selection.optionals : selectedOptionals)[pkg.id] ?? []
                        const isChosen = !!acceptanceId && selection?.selectedPackageId === pkg.id
                        const hasPricing = !!pkg.pricing
                        const pricing = hasPricing
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
                                chosen
                            )
                            : null
                        const priceText = pricing
                            ? pricing.onRequest
                                ? pkg.priceLabel?.trim() || 'Sob consulta'
                                : `${pkg.priceLabel?.trim() ? `${pkg.priceLabel.trim()} ` : ''}${formatCents(pricing.totalCents)}`
                            : packagePriceText(pkg)
                        const chosenNames = (pkg.items ?? []).filter((item) => chosen.includes(item.id)).map((item) => item.name)
                        const hasMedia = pkg.mediaUrl && pkg.mediaUrl.length > 0;

                        return (
                            <div
                                key={pkg.id}
                                className="relative flex flex-col rounded-3xl overflow-hidden transition-all cursor-pointer"
                                onClick={() => toggle(pkg.id)}
                                style={{
                                    background: pkg.isHighlighted
                                        ? `linear-gradient(135deg, ${pkg.highlightColor ?? tk.accent}15 0%, ${tk.card_bg} 70%)`
                                        : tk.card_bg,
                                    border: isChosen
                                        ? '2px solid var(--pp-accent)'
                                        : `1px solid ${pkg.isHighlighted ? (pkg.highlightColor ?? tk.accent) + '55' : 'var(--pp-border)'}`,
                                    boxShadow: pkg.isHighlighted ? `0 0 40px ${(pkg.highlightColor ?? tk.accent)}18` : 'none',
                                }}
                            >
                                {isChosen && (
                                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold pp-body"
                                        style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent, #000)' }}>
                                        <Check className="w-3 h-3" /> Escolhido
                                    </div>
                                )}
                                {/* Media Background */}
                                {hasMedia && pkg.mediaType === 'video' ? (
                                    <video src={pkg.mediaUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                                ) : hasMedia && pkg.mediaType === 'image' ? (
                                    <img src={pkg.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                ) : null}

                                {/* Overlay */}
                                {hasMedia && <div className="absolute inset-0 bg-black/60" />}
                                
                                {pkg.isHighlighted && pkg.highlightLabel && (
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold z-10"
                                        style={{ background: pkg.highlightColor ?? tk.accent, color: tk.bg }}>
                                        {pkg.highlightLabel}
                                    </div>
                                )}

                                <div className="relative z-10 p-7 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="pp-heading text-2xl font-light mb-1" style={{ color: 'var(--pp-accent)' }} aria-live="polite">
                                                    {pricing && pricing.discountCents > 0 && (
                                                        <span className="block text-sm line-through opacity-60">{formatCents(pricing.grossCents)}</span>
                                                    )}
                                                    {priceText}
                                                </p>
                                                <h3 className="pp-heading text-xl font-semibold mb-2" style={{ color: 'var(--pp-text)' }}>{pkg.name}</h3>
                                                {pkg.description && (
                                                    <p className="pp-body text-sm leading-relaxed" style={{ color: 'var(--pp-muted)' }}>{pkg.description}</p>
                                                )}
                                            </div>
                                            <ChevronDown
                                                className="w-5 h-5 flex-shrink-0 mt-1 transition-transform duration-300"
                                                style={{ color: 'var(--pp-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="relative z-10 px-7 pb-7 pt-4 border-t" style={{ borderColor: 'var(--pp-border)', background: 'color-mix(in srgb, var(--pp-card-bg) 70%, transparent)' }}
                                        onClick={(e) => e.stopPropagation()}>
                                        {pkg.items && pkg.items.length > 0 && (
                                            <ul className="space-y-2.5 my-4">
                                                {pkg.items.map((item) => {
                                                    const kind = item.kind ?? (item.isCourtesy ? 'COURTESY' : 'INCLUDED')
                                                    const line = lineTotalCents({ quantity: item.quantity ?? 1, unitPriceCents: item.unitPriceCents ?? 0 })
                                                    const qty = Number(item.quantity ?? 1)
                                                    const qtyText = qty !== 1 || item.unit ? `${formatQuantity(qty)}${item.unit ? ` ${item.unit}` : '×'} ` : ''

                                                    if (kind === 'OPTIONAL') {
                                                        const checked = chosen.includes(item.id)
                                                        return (
                                                            <li key={item.id}>
                                                                <label className="flex items-center gap-2.5 pp-body text-sm cursor-pointer select-none rounded-xl px-2 py-1.5 -mx-2 transition"
                                                                    style={{ color: checked ? 'var(--pp-text)' : 'var(--pp-muted)', background: checked ? 'color-mix(in srgb, var(--pp-accent) 10%, transparent)' : 'transparent' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleOptional(pkg.id, item.id)}
                                                                        className="w-4 h-4 accent-current"
                                                                        style={{ accentColor: 'var(--pp-accent)' }}
                                                                    />
                                                                    <span className="flex-1">
                                                                        {qtyText}{item.name}
                                                                        <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">opcional</span>
                                                                        {item.description && <span className="block text-xs opacity-70">{item.description}</span>}
                                                                    </span>
                                                                    {line > 0 && <span className="text-xs whitespace-nowrap" style={{ color: 'var(--pp-accent)' }}>+ {formatCents(line)}</span>}
                                                                </label>
                                                            </li>
                                                        )
                                                    }

                                                    const isCourtesy = kind === 'COURTESY'
                                                    return (
                                                        <li key={item.id} className="flex items-center gap-2.5 pp-body text-sm"
                                                            style={{ color: isCourtesy ? 'var(--pp-accent)' : 'var(--pp-muted)' }}>
                                                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} />
                                                            <span className="flex-1">
                                                                {qtyText}{item.name}
                                                                {item.description && <span className="block text-xs opacity-70">{item.description}</span>}
                                                            </span>
                                                            {isCourtesy && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-medium whitespace-nowrap"
                                                                    style={{ background: 'var(--pp-accent)', color: '#000', opacity: 0.85 }}>
                                                                    Cortesia{line > 0 && <span className="ml-1 line-through">{formatCents(line)}</span>}
                                                                </span>
                                                            )}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                        {pricing && !pricing.onRequest && (pricing.optionalsCents > 0 || pricing.discountCents > 0 || pricing.courtesyValueCents > 0) && (
                                            <div className="mb-4 rounded-2xl px-4 py-3 pp-body text-sm space-y-1" style={{ border: '1px solid var(--pp-border)' }} aria-live="polite">
                                                {pricing.optionalsCents > 0 && (
                                                    <div className="flex justify-between" style={{ color: 'var(--pp-muted)' }}>
                                                        <span>Opcionais escolhidos</span><span>+ {formatCents(pricing.optionalsCents)}</span>
                                                    </div>
                                                )}
                                                {pricing.discountCents > 0 && (
                                                    <div className="flex justify-between" style={{ color: 'var(--pp-muted)' }}>
                                                        <span>Desconto</span><span>− {formatCents(pricing.discountCents)}</span>
                                                    </div>
                                                )}
                                                {pricing.courtesyValueCents > 0 && (
                                                    <div className="flex justify-between" style={{ color: 'var(--pp-accent)' }}>
                                                        <span>Você ganha em cortesias</span><span>{formatCents(pricing.courtesyValueCents)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-semibold pt-1" style={{ color: 'var(--pp-text)', borderTop: '1px solid var(--pp-border)' }}>
                                                    <span>Total</span><span style={{ color: 'var(--pp-accent)' }}>{formatCents(pricing.totalCents)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {acceptanceId && selection && (
                                            <a
                                                href={`#${acceptanceId}`}
                                                onClick={(e) => { e.stopPropagation(); selection.choosePackage(pkg.id) }}
                                                className="mt-2 block text-center py-3 px-6 rounded-2xl text-sm font-semibold pp-body transition-all hover:opacity-90"
                                                style={{ background: 'var(--pp-accent)', color: 'var(--pp-on-accent, #000)' }}
                                            >
                                                {isChosen ? 'Seguir para o aceite' : 'Escolher este pacote'}
                                            </a>
                                        )}
                                        {provider?.whatsapp && acceptanceId && (
                                            <a
                                                href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre o ${pkg.name} da proposta para ${proposal.clientName}.`)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-2 block text-center py-2 text-xs pp-body hover:opacity-80"
                                                style={{ color: 'var(--pp-muted)' }}
                                            >
                                                Tirar dúvida no WhatsApp
                                            </a>
                                        )}
                                        {provider?.whatsapp && !acceptanceId && (
                                            <a
                                                href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                    `Olá! Tenho interesse no ${pkg.name} para ${proposal.clientName}` +
                                                    (chosenNames.length ? `, com os opcionais: ${chosenNames.join(', ')}` : '') +
                                                    (pricing && !pricing.onRequest ? ` (total ${formatCents(pricing.totalCents)})` : '') +
                                                    '.'
                                                )}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-2 block text-center py-3 px-6 rounded-2xl text-sm font-semibold pp-body transition-all hover:opacity-90"
                                                style={pkg.isHighlighted
                                                    ? { background: pkg.highlightColor ?? tk.accent, color: tk.bg }
                                                    : { border: `1px solid var(--pp-border)`, color: 'var(--pp-text)' }}
                                            >
                                                {pkg.ctaText ?? 'Quero este pacote'}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
