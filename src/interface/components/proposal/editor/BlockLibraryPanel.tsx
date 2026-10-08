import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Trash2 } from 'lucide-react'
import { httpGateway } from '../../../../infra/gateway/HttpGateway'
import { BLOCK_META, type BlockType, type ProposalBlock } from '../../../../shared/blocks'
import type { BlockLibrary } from '../../../../shared/types'
import { THEMES } from '../ThemeSelector'

/** Uma linha do conteúdo do bloco, para reconhecer na lista. */
export function blockSnippet(block: ProposalBlock): string {
    const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    switch (block.type) {
        case 'cover':
            return block.data.headline
        case 'about':
        case 'terms':
            return strip(block.data.body)
        case 'scope':
            return block.data.items.map((i) => i.title).join(' · ')
        case 'timeline':
            return block.data.steps.map((s) => s.title).join(' → ')
        case 'faq':
            return block.data.items.map((i) => i.question).join(' · ')
        case 'team':
            return block.data.members.map((m) => m.role || m.name).join(' · ')
        case 'testimonials':
            return block.data.items[0]?.quote ?? ''
        case 'contact':
            return block.data.message
        case 'cta':
            return `${block.data.headline} — botão "${block.data.buttonLabel}"`
        default:
            return ''
    }
}

function Swatch({ theme }: { theme: string }) {
    const tk = THEMES[theme] ?? THEMES.dark_luxury
    return (
        <span className="flex h-4 w-7 rounded overflow-hidden border border-white/10 flex-shrink-0" aria-hidden>
            <span className="flex-1" style={{ background: tk.bg }} />
            <span className="w-2" style={{ background: tk.accent }} />
        </span>
    )
}

function Locked({ children }: { children: string }) {
    return (
        <p className="flex items-start gap-2 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/[0.06] px-3 py-2.5 text-xs text-[#e3c97a]">
            <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {children}
        </p>
    )
}

/** Blocos prontos de todos os modelos (Essencial+). Sem o plano, aparecem bloqueados. */
export function SystemLibraryList({ library, takenSingles, onInsert }: { library: BlockLibrary; takenSingles: Set<BlockType>; onInsert: (block: ProposalBlock) => void }) {
    const [filter, setFilter] = useState<BlockType | 'all'>('all')
    const types = useMemo(() => [...new Set(library.system.map((i) => i.type))], [library.system])
    const items = library.system.filter((i) => filter === 'all' || i.type === filter)
    const unlocked = library.access.blockLibrary

    return (
        <div className="space-y-2.5">
            {unlocked ? (
                <p className="text-[11px] text-white/40 px-1">Blocos prontos dos modelos. O visual segue o tema desta proposta; o texto você ajusta depois.</p>
            ) : (
                <Locked>A biblioteca de blocos prontos está disponível a partir do plano Essencial. No Grátis, use os blocos básicos.</Locked>
            )}
            <div className="flex flex-wrap gap-1">
                {(['all', ...types] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setFilter(t)}
                        className={`text-[11px] px-2 py-1 rounded-full border ${filter === t ? 'border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 text-white/50 hover:text-white/80'}`}
                    >
                        {t === 'all' ? 'Todos' : BLOCK_META[t].label}
                    </button>
                ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5 max-h-[340px] overflow-y-auto pr-1">
                {items.map((item) => {
                    const replaces = takenSingles.has(item.type)
                    return (
                        <button
                            key={item.id}
                            type="button"
                            disabled={!unlocked || !item.block}
                            onClick={() => item.block && onInsert(item.block)}
                            className="text-left rounded-xl px-3 py-2.5 border border-white/6 hover:border-[#C9A84C]/40 hover:bg-white/5 disabled:opacity-45 disabled:hover:border-white/6 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-[#C9A84C]/80">{BLOCK_META[item.type].label}</span>
                                {replaces && unlocked && <span className="text-[10px] text-white/40">· substitui o atual</span>}
                            </div>
                            <p className="text-sm text-white/90 truncate">{item.title || BLOCK_META[item.type].defaultTitle || BLOCK_META[item.type].label}</p>
                            {item.block && <p className="text-[11px] leading-snug text-white/45 mt-0.5 line-clamp-2">{blockSnippet(item.block)}</p>}
                            <p className="flex items-center gap-1.5 text-[10px] text-white/35 mt-1.5">
                                <Swatch theme={item.theme} /> do modelo {item.templateName}
                            </p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/** Blocos salvos pela empresa (Profissional+), compartilhados com a equipe. */
export function SavedBlocksList({ library, takenSingles, onInsert }: { library: BlockLibrary; takenSingles: Set<BlockType>; onInsert: (block: ProposalBlock) => void }) {
    const queryClient = useQueryClient()
    const remove = useMutation({
        mutationFn: (id: string) => httpGateway.deleteSavedBlock(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['block-library'] }),
    })

    if (!library.access.savedBlocks) {
        return <Locked>Salvar seus próprios blocos e usar com a equipe está disponível nos planos Profissional e Equipe.</Locked>
    }
    if (library.saved.length === 0) {
        return <p className="text-xs text-white/45 px-1 py-2">Nenhum bloco salvo ainda. Abra um bloco da proposta e use “Salvar na biblioteca” para reutilizar depois, com toda a equipe.</p>
    }
    return (
        <div className="space-y-2">
            {remove.error && <p className="text-xs text-red-400 px-1">{remove.error instanceof Error ? remove.error.message : 'Não foi possível excluir.'}</p>}
            <div className="grid sm:grid-cols-2 gap-1.5 max-h-[340px] overflow-y-auto pr-1">
                {library.saved.map((item) => (
                    <div key={item.id} className="group relative rounded-xl border border-white/6 hover:border-[#C9A84C]/40 hover:bg-white/5">
                        <button type="button" onClick={() => onInsert(item.block)} className="w-full text-left px-3 py-2.5 pr-9">
                            <span className="text-[10px] uppercase tracking-widest text-[#C9A84C]/80">
                                {BLOCK_META[item.type]?.label ?? item.type}
                                {takenSingles.has(item.type) && <span className="normal-case tracking-normal text-white/40"> · substitui o atual</span>}
                            </span>
                            <p className="text-sm text-white/90 truncate">{item.name}</p>
                            <p className="text-[11px] leading-snug text-white/45 mt-0.5 line-clamp-2">{blockSnippet(item.block)}</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.confirm(`Excluir "${item.name}" da biblioteca da empresa?`) && remove.mutate(item.id)}
                            aria-label={`Excluir ${item.name}`}
                            className="absolute top-2 right-2 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
