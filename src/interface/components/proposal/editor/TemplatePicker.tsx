import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilePlus2, Sparkles, Trash2 } from 'lucide-react'
import { httpGateway } from '../../../../infra/gateway/HttpGateway'
import { BLOCK_META, createBlock, type ProposalBlock } from '../../../../shared/blocks'
import { SEGMENTS, segmentLabel } from '../../../../shared/segments'
import type { ProposalTemplate } from '../../../../shared/types'
import HelpTip from '../../help/HelpTip'
import { THEMES } from '../ThemeSelector'

/** Proposta em branco: só o essencial. */
export function blankTemplateBlocks(): ProposalBlock[] {
    const blocks: ProposalBlock[] = []
    for (const type of ['cover', 'pricing', 'contact'] as const) blocks.push(createBlock(type, blocks))
    return blocks
}

function ThemeSwatch({ theme }: { theme?: string | null }) {
    const tk = THEMES[theme ?? 'dark_luxury'] ?? THEMES.dark_luxury
    return (
        <span className="flex h-8 w-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0" aria-hidden>
            <span className="flex-1" style={{ background: tk.bg }} />
            <span className="w-3" style={{ background: tk.card_bg }} />
            <span className="w-3" style={{ background: tk.accent }} />
        </span>
    )
}

function TemplateCard({ template, highlighted, onPick, onDelete }: {
    template: ProposalTemplate
    highlighted?: boolean
    onPick: () => void
    onDelete?: () => void
}) {
    const types = [...new Set(template.blocks.map((b) => b.type))].filter((t) => t in BLOCK_META)
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onPick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick())}
            className={`group relative text-left rounded-2xl border p-4 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 ${highlighted ? 'border-[#C9A84C]/45 bg-[#C9A84C]/[0.06]' : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}
        >
            <div className="flex items-start gap-3">
                <ThemeSwatch theme={template.theme} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{template.name}</p>
                    {segmentLabel(template.segment) !== template.name && <p className="text-[11px] text-white/40">{segmentLabel(template.segment)}</p>}
                </div>
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete() }}
                        aria-label={`Excluir modelo ${template.name}`}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {template.description && <p className="text-xs text-white/50 mt-3 leading-relaxed">{template.description}</p>}
            <div className="flex flex-wrap gap-1 mt-3">
                {types.map((type) => (
                    <span key={type} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/45">{BLOCK_META[type].label}</span>
                ))}
            </div>
        </div>
    )
}

/** Primeiro passo de uma proposta nova: escolher por onde começar. */
export function TemplatePicker({ segment, canManage, onPick }: {
    segment?: string | null
    canManage: boolean
    onPick: (template: ProposalTemplate | null) => void
}) {
    const queryClient = useQueryClient()
    const [showAll, setShowAll] = useState(false)
    const { data, isLoading, error } = useQuery({ queryKey: ['templates'], queryFn: () => httpGateway.listTemplates() })
    const remove = useMutation({
        mutationFn: (id: string) => httpGateway.deleteTemplate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
    })

    const system = data?.system ?? []
    const own = data?.workspace ?? []
    const recommended = system.filter((t) => t.segment === segment)
    const others = system
        .filter((t) => t.segment !== segment)
        .sort((a, b) => SEGMENTS.findIndex((s) => s.id === a.segment) - SEGMENTS.findIndex((s) => s.id === b.segment))

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-semibold text-white">Como você quer começar?</h3>
                    <HelpTip helpKey="proposal.template" />
                </div>
                <p className="text-xs text-white/40 mt-1">Escolha um modelo com seções e textos prontos. Você ajusta tudo no próximo passo.</p>
            </div>

            {isLoading && <p className="text-sm text-white/40">Carregando modelos…</p>}
            {error && <p className="text-sm text-red-400">Não foi possível carregar os modelos. Você ainda pode começar em branco.</p>}

            {own.length > 0 && (
                <section className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-widest text-white/40">Modelos da sua empresa</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {own.map((t) => (
                            <TemplateCard
                                key={t.id}
                                template={t}
                                onPick={() => onPick(t)}
                                onDelete={canManage ? () => window.confirm(`Excluir o modelo "${t.name}"? Propostas já criadas não mudam.`) && remove.mutate(t.id) : undefined}
                            />
                        ))}
                    </div>
                </section>
            )}

            {recommended.length > 0 && (
                <section className="space-y-2.5">
                    <p className="text-[11px] uppercase tracking-widest text-[#C9A84C]/80 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Recomendado para {segmentLabel(segment)}
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recommended.map((t) => <TemplateCard key={t.id} template={t} highlighted onPick={() => onPick(t)} />)}
                        <BlankCard onPick={() => onPick(null)} />
                    </div>
                </section>
            )}

            <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-white/40">{recommended.length ? 'Outros segmentos' : 'Modelos prontos'}</p>
                    {recommended.length > 0 && others.length > 0 && (
                        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs text-white/50 hover:text-white">
                            {showAll ? 'Ocultar' : `Ver todos (${others.length})`}
                        </button>
                    )}
                </div>
                {(showAll || recommended.length === 0) && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {others.map((t) => <TemplateCard key={t.id} template={t} onPick={() => onPick(t)} />)}
                        {recommended.length === 0 && <BlankCard onPick={() => onPick(null)} />}
                    </div>
                )}
            </section>
        </div>
    )
}

function BlankCard({ onPick }: { onPick: () => void }) {
    return (
        <button
            type="button"
            onClick={onPick}
            className="rounded-2xl border border-dashed border-white/15 p-4 text-left hover:border-white/30 hover:bg-white/[0.03] transition-all"
        >
            <FilePlus2 className="w-5 h-5 text-white/40" />
            <p className="text-sm font-medium text-white mt-3">Começar em branco</p>
            <p className="text-xs text-white/40 mt-1">Só capa, preços e contato. Você adiciona o resto.</p>
        </button>
    )
}
