import { useEffect, useMemo, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookmarkPlus, ChevronDown, Copy, Eye, EyeOff, GripVertical, LayoutTemplate, Lightbulb, Plus, Trash2, X } from 'lucide-react'
import { httpGateway } from '../../../../infra/gateway/HttpGateway'
import { applyTipFix, blockOrderTips } from '../../../../shared/blockTips'
import type { BlockLibrary } from '../../../../shared/types'
import {
    BLOCK_META,
    BLOCK_TYPES,
    MAX_BLOCKS,
    blockTitle,
    createBlock,
    duplicateBlock,
    type BlockType,
    type ProposalBlock,
} from '../../../../shared/blocks'
import HelpTip from '../../help/HelpTip'
import { BlockRenderer, visibleBlocks } from '../blocks/BlockRenderer'
import type { BlockContext } from '../blocks/shared'
import { ProposalThemeStyle, themeCssVars } from '../public/theme'
import { BlockFields } from './BlockFields'
import { SavedBlocksList, SystemLibraryList } from './BlockLibraryPanel'
import { Field, TextInput } from './fields'

const PREVIEW_WIDTH = 1180

/** Pré-visualização ao vivo: a página real, reduzida para caber no painel. */
function LivePreview({ blocks, ctx, focusId }: { blocks: ProposalBlock[]; ctx: BlockContext; focusId: string | null }) {
    const frameRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.5)

    useEffect(() => {
        const frame = frameRef.current
        if (!frame || typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / PREVIEW_WIDTH)))
        observer.observe(frame)
        return () => observer.disconnect()
    }, [])

    // Ao abrir um bloco no editor, a pré-visualização rola até ele.
    useEffect(() => {
        if (!focusId || !frameRef.current) return
        const target = frameRef.current.querySelector<HTMLElement>(`[data-section="${CSS.escape(focusId)}"]`)
        if (!target) return
        const frame = frameRef.current
        const top = target.getBoundingClientRect().top - frame.getBoundingClientRect().top + frame.scrollTop
        frame.scrollTo({ top, behavior: 'smooth' })
    }, [focusId])

    const shown = visibleBlocks(blocks)
    return (
        <div ref={frameRef} className="relative h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-black/40">
            <div
                className="pp-scope origin-top-left"
                style={{ width: PREVIEW_WIDTH, zoom: scale, background: 'var(--pp-bg)', color: 'var(--pp-text)', ...themeCssVars(ctx.tk) }}
            >
                <ProposalThemeStyle tk={ctx.tk} />
                {shown.length > 0 ? (
                    <BlockRenderer blocks={shown} ctx={{ ...ctx, preview: true }} />
                ) : (
                    <p className="p-24 text-center text-2xl" style={{ color: 'var(--pp-muted)' }}>Nenhum bloco visível.</p>
                )}
            </div>
        </div>
    )
}

type AddTab = 'basic' | 'library' | 'saved'

function AddBlockMenu({ blocks, library, onAdd, onInsert, onClose }: {
    blocks: ProposalBlock[]
    library?: BlockLibrary
    onAdd: (type: BlockType) => void
    onInsert: (block: ProposalBlock) => void
    onClose: () => void
}) {
    const [tab, setTab] = useState<AddTab>('basic')
    const takenSingles = useMemo(() => new Set(blocks.filter((b) => BLOCK_META[b.type].single).map((b) => b.type)), [blocks])
    const tabs: Array<{ id: AddTab; label: string }> = [
        { id: 'basic', label: 'Básicos' },
        { id: 'library', label: 'Biblioteca' },
        { id: 'saved', label: 'Salvos da empresa' },
    ]
    return (
        <div className="rounded-2xl border border-white/12 bg-[#151515] p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                <div role="tablist" aria-label="Origem do bloco" className="flex gap-1">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.id}
                            onClick={() => setTab(t.id)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg ${tab === t.id ? 'bg-white/10 text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 rounded text-white/40 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {tab === 'basic' && (
                <div className="grid sm:grid-cols-2 gap-1.5">
                    {BLOCK_TYPES.map((type) => {
                        const meta = BLOCK_META[type]
                        const taken = meta.single && blocks.some((b) => b.type === type)
                        return (
                            <button
                                key={type}
                                type="button"
                                disabled={taken}
                                onClick={() => onAdd(type)}
                                className="text-left rounded-xl px-3 py-2.5 border border-transparent hover:border-[#C9A84C]/40 hover:bg-white/5 disabled:opacity-35 disabled:hover:border-transparent disabled:hover:bg-transparent"
                            >
                                <p className="text-sm text-white/90">{meta.label}{taken && <span className="text-[10px] text-white/40"> · já está na proposta</span>}</p>
                                <p className="text-[11px] leading-snug text-white/40 mt-0.5">{meta.help}</p>
                            </button>
                        )
                    })}
                </div>
            )}
            {tab !== 'basic' && !library && <p className="text-xs text-white/40 px-1 py-3">Carregando a biblioteca…</p>}
            {tab === 'library' && library && <SystemLibraryList library={library} takenSingles={takenSingles} onInsert={onInsert} />}
            {tab === 'saved' && library && <SavedBlocksList library={library} takenSingles={takenSingles} onInsert={onInsert} />}
        </div>
    )
}

const TIPS_HIDDEN_KEY = 'lumen-deal:block-tips-hidden'

function readTipsHidden() {
    try {
        return window.localStorage.getItem(TIPS_HIDDEN_KEY) === '1'
    } catch {
        return false
    }
}

/** Dicas de ordem: sugestões de mercado, com ação de um clique. Nunca bloqueiam. */
function OrderTips({ blocks, onChange }: { blocks: ProposalBlock[]; onChange: (blocks: ProposalBlock[]) => void }) {
    const tips = useMemo(() => blockOrderTips(blocks), [blocks])
    const [hidden, setHidden] = useState(readTipsHidden)
    const toggle = (value: boolean) => {
        setHidden(value)
        try {
            window.localStorage.setItem(TIPS_HIDDEN_KEY, value ? '1' : '0')
        } catch {
            /* sem armazenamento: vale só nesta tela */
        }
    }
    if (tips.length === 0) return null
    if (hidden) {
        return (
            <button type="button" onClick={() => toggle(false)} className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#C9A84C]">
                <Lightbulb className="w-3.5 h-3.5" /> Mostrar dicas de ordem ({tips.length})
            </button>
        )
    }
    return (
        <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-3 space-y-2" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e3c97a]">
                    <Lightbulb className="w-3.5 h-3.5" /> Dicas de ordem
                </p>
                <div className="flex items-center gap-1">
                    <HelpTip helpKey="blocks.orderTips" />
                    <button type="button" onClick={() => toggle(true)} className="text-[11px] text-white/35 hover:text-white/70">Ocultar</button>
                </div>
            </div>
            <ul className="space-y-1.5">
                {tips.map((tip) => (
                    <li key={tip.id} className="flex items-start justify-between gap-3 text-xs text-white/65 leading-snug">
                        <span>{tip.text}</span>
                        {tip.fix && (
                            <button
                                type="button"
                                onClick={() => onChange(applyTipFix(blocks, tip.fix!))}
                                className="flex-shrink-0 rounded-lg border border-[#C9A84C]/35 px-2 py-1 text-[11px] font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10"
                            >
                                {tip.fixLabel}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export type SaveTemplateState = { allowed: boolean; reason?: string; onSave: (name: string) => Promise<void> }

export function BlocksEditor({
    blocks,
    onChange,
    previewCtx,
    saveTemplate,
}: {
    blocks: ProposalBlock[]
    onChange: (blocks: ProposalBlock[]) => void
    previewCtx: BlockContext
    saveTemplate?: SaveTemplateState
}) {
    const [openId, setOpenId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const [templateName, setTemplateName] = useState<string | null>(null)
    const [templateStatus, setTemplateStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
    const queryClient = useQueryClient()
    const { data: library } = useQuery({ queryKey: ['block-library'], queryFn: () => httpGateway.getBlockLibrary(), staleTime: 60_000 })
    const [saving, setSaving] = useState<{ id: string; name: string; status?: { kind: 'ok' | 'error'; text: string } } | null>(null)

    const update = (id: string, patch: Partial<ProposalBlock>) =>
        onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as ProposalBlock) : b)))

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || result.destination.index === result.source.index) return
        const next = [...blocks]
        const [moved] = next.splice(result.source.index, 1)
        next.splice(result.destination.index, 0, moved)
        onChange(next)
    }

    const place = (block: ProposalBlock) => {
        // Novo bloco entra antes do contato/chamada final, onde costuma fazer mais sentido.
        const tailIndex = blocks.findIndex((b, i) => i >= blocks.length - 2 && (b.type === 'contact' || b.type === 'cta'))
        const next = [...blocks]
        next.splice(tailIndex >= 0 && block.type !== 'cta' && block.type !== 'contact' ? tailIndex : next.length, 0, block)
        onChange(next)
        setOpenId(block.id)
        setAdding(false)
    }

    const add = (type: BlockType) => place(createBlock(type, blocks))

    /** Bloco da biblioteca: entra como cópia; se o tipo só pode ter um (ex.: capa), substitui o atual. */
    const insert = (source: ProposalBlock) => {
        const existing = BLOCK_META[source.type].single ? blocks.find((b) => b.type === source.type) : undefined
        if (existing) {
            onChange(blocks.map((b) => (b.id === existing.id ? ({ ...structuredClone(source), id: existing.id, visible: existing.visible } as ProposalBlock) : b)))
            setOpenId(existing.id)
            setAdding(false)
            return
        }
        place(duplicateBlock(source, blocks))
    }

    const submitSavedBlock = async (block: ProposalBlock) => {
        if (!saving || saving.name.trim().length < 2) return
        try {
            await httpGateway.saveBlock(saving.name.trim(), block)
            setSaving({ id: block.id, name: '', status: { kind: 'ok', text: 'Salvo. Está em Adicionar bloco → Salvos da empresa, para toda a equipe.' } })
            void queryClient.invalidateQueries({ queryKey: ['block-library'] })
        } catch (err) {
            setSaving({ ...saving, status: { kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível salvar o bloco.' } })
        }
    }

    const submitTemplate = async () => {
        if (!saveTemplate || !templateName?.trim()) return
        setTemplateStatus(null)
        try {
            await saveTemplate.onSave(templateName.trim())
            setTemplateStatus({ kind: 'ok', text: 'Modelo salvo. Ele aparece em "Nova proposta" para toda a equipe.' })
            setTemplateName(null)
        } catch (err) {
            setTemplateStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível salvar o modelo.' })
        }
    }

    return (
        <div
            className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6"
            // Enter num campo de texto do editor não deve enviar o formulário da proposta.
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && e.preventDefault()}
        >
            <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white/85">Blocos da página</p>
                        <HelpTip helpKey="blocks.editor" />
                    </div>
                    <span className="text-[11px] text-white/30">{blocks.length} / {MAX_BLOCKS}</span>
                </div>

                <OrderTips blocks={blocks} onChange={onChange} />

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="blocks">
                        {(drop) => (
                            <div ref={drop.innerRef} {...drop.droppableProps} className="space-y-2">
                                {blocks.map((block, index) => {
                                    const open = openId === block.id
                                    const meta = BLOCK_META[block.type]
                                    return (
                                        <Draggable key={block.id} draggableId={block.id} index={index}>
                                            {(drag, snapshot) => (
                                                <div
                                                    ref={drag.innerRef}
                                                    {...drag.draggableProps}
                                                    className={`rounded-2xl border transition-colors ${snapshot.isDragging ? 'border-[#C9A84C]/60 bg-[#1a1a1a]' : open ? 'border-[#C9A84C]/35 bg-white/[0.03]' : 'border-white/8 bg-white/[0.02]'} ${block.visible ? '' : 'opacity-55'}`}
                                                >
                                                    <div className="flex items-center gap-2 px-2.5 py-2">
                                                        <span {...drag.dragHandleProps} className="p-1 text-white/25 hover:text-white/60 cursor-grab" aria-label="Arrastar para reordenar">
                                                            <GripVertical className="w-4 h-4" />
                                                        </span>
                                                        <button type="button" onClick={() => setOpenId(open ? null : block.id)} className="flex-1 min-w-0 text-left">
                                                            <p className="text-[10px] uppercase tracking-widest text-[#C9A84C]/80">{meta.label}</p>
                                                            <p className="text-sm text-white/85 truncate">{blockTitle(block)}</p>
                                                        </button>
                                                        <button type="button" onClick={() => update(block.id, { visible: !block.visible })} title={block.visible ? 'Ocultar do cliente' : 'Mostrar ao cliente'} aria-label={block.visible ? 'Ocultar bloco' : 'Mostrar bloco'} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                                                            {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </button>
                                                        {!meta.single && (
                                                            <button
                                                                type="button"
                                                                disabled={blocks.length >= MAX_BLOCKS}
                                                                onClick={() => {
                                                                    const copy = duplicateBlock(block, blocks)
                                                                    const next = [...blocks]
                                                                    next.splice(index + 1, 0, copy)
                                                                    onChange(next)
                                                                    setOpenId(copy.id)
                                                                }}
                                                                title="Duplicar"
                                                                aria-label="Duplicar bloco"
                                                                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={() => onChange(blocks.filter((b) => b.id !== block.id))} title="Excluir" aria-label="Excluir bloco" className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => setOpenId(open ? null : block.id)} aria-label={open ? 'Fechar edição' : 'Editar bloco'} className="p-1.5 rounded-lg text-white/40 hover:text-white">
                                                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>
                                                    {open && (
                                                        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/6">
                                                            <p className="text-[11px] text-white/35 pt-3">{meta.help}</p>
                                                            {block.type !== 'cover' && block.type !== 'cta' && (
                                                                <Field label="Título da seção" helpKey="blocks.title">
                                                                    <TextInput value={block.title} maxLength={120} placeholder={meta.defaultTitle || meta.label} onChange={(title) => update(block.id, { title })} />
                                                                </Field>
                                                            )}
                                                            <BlockFields block={block} onChange={(data) => update(block.id, { data } as Partial<ProposalBlock>)} />
                                                            {library?.access.savedBlocks && (
                                                                <div className="pt-1 space-y-2">
                                                                    {saving?.id === block.id && !saving.status?.kind.startsWith('ok') ? (
                                                                        <div className="flex gap-2">
                                                                            <TextInput value={saving.name} maxLength={80} placeholder="Nome na biblioteca (ex.: Contato do WhatsApp)" onChange={(name) => setSaving({ id: block.id, name })} />
                                                                            <button type="button" onClick={() => submitSavedBlock(block)} disabled={saving.name.trim().length < 2} className="px-3.5 rounded-xl bg-[#C9A84C] text-black text-xs font-semibold disabled:opacity-40">
                                                                                Salvar
                                                                            </button>
                                                                            <button type="button" onClick={() => setSaving(null)} className="px-2 text-white/40 hover:text-white" aria-label="Cancelar">
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button type="button" onClick={() => setSaving({ id: block.id, name: blockTitle(block) })} className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#d8b65a]">
                                                                            <BookmarkPlus className="w-3.5 h-3.5" /> Salvar na biblioteca da empresa
                                                                        </button>
                                                                    )}
                                                                    {saving?.id === block.id && saving.status && (
                                                                        <p className={`text-xs ${saving.status.kind === 'ok' ? 'text-emerald-300' : 'text-red-400'}`}>{saving.status.text}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    )
                                })}
                                {drop.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {adding ? (
                    <AddBlockMenu blocks={blocks} library={library} onAdd={add} onInsert={insert} onClose={() => setAdding(false)} />
                ) : (
                    <button
                        type="button"
                        disabled={blocks.length >= MAX_BLOCKS}
                        onClick={() => setAdding(true)}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/15 text-sm text-white/55 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 disabled:opacity-40"
                    >
                        <Plus className="w-4 h-4" /> Adicionar bloco
                    </button>
                )}

                {saveTemplate && (
                    <div className="rounded-2xl border border-white/8 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-1.5">
                            <LayoutTemplate className="w-4 h-4 text-white/45" />
                            <p className="text-sm text-white/75 flex-1">Reutilizar esta estrutura</p>
                            <HelpTip helpKey="blocks.saveTemplate" />
                        </div>
                        {!saveTemplate.allowed ? (
                            <p className="text-xs text-white/40">{saveTemplate.reason}</p>
                        ) : templateName === null ? (
                            <button type="button" onClick={() => { setTemplateName(''); setTemplateStatus(null) }} className="text-xs text-[#C9A84C] hover:text-[#d8b65a]">
                                Salvar como modelo da empresa
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <TextInput value={templateName} maxLength={80} placeholder="Nome do modelo (ex.: Social media mensal)" onChange={setTemplateName} />
                                <button type="button" onClick={submitTemplate} disabled={templateName.trim().length < 2} className="px-3.5 rounded-xl bg-[#C9A84C] text-black text-xs font-semibold disabled:opacity-40">
                                    Salvar
                                </button>
                                <button type="button" onClick={() => setTemplateName(null)} className="px-2 text-white/40 hover:text-white" aria-label="Cancelar">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {templateStatus && <p className={`text-xs ${templateStatus.kind === 'ok' ? 'text-emerald-300' : 'text-red-400'}`}>{templateStatus.text}</p>}
                    </div>
                )}
            </div>

            <div className="min-w-0 lg:sticky lg:top-4 h-[420px] lg:h-[calc(90vh-220px)] flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-widest text-white/35">Pré-visualização — atualiza enquanto você edita</p>
                <div className="flex-1 min-h-0">
                    <LivePreview blocks={blocks} ctx={previewCtx} focusId={openId} />
                </div>
            </div>
        </div>
    )
}
