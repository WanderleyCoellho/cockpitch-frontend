import { useState } from 'react'
import { GripVertical, Eye, EyeOff, Lock, Sparkles, Users, Star, MessageSquare, Package, Phone } from 'lucide-react'
import type { ProposalSection } from '../../../shared/types'

export const DEFAULT_SECTIONS: ProposalSection[] = [
    { id: 'hero', label: 'Abertura (Hero)', enabled: true, order: 0, pinned: true },
    { id: 'about', label: 'Sobre nós / Estilo', enabled: true, order: 1 },
    { id: 'differentials', label: 'Diferenciais', enabled: true, order: 2 },
    { id: 'testimonial', label: 'Depoimento', enabled: true, order: 3 },
    { id: 'packages', label: 'Pacotes / Investimento', enabled: true, order: 4 },
    { id: 'contact', label: 'Contato e informações finais', enabled: true, order: 5 },
]

const SECTION_META: Record<string, { icon: React.ElementType; description: string }> = {
    hero: { icon: Sparkles, description: 'Vídeo/foto de capa e nome do cliente' },
    about: { icon: Users, description: 'Texto sobre você e portfólio' },
    differentials: { icon: Star, description: 'Seus diferenciais e galeria' },
    testimonial: { icon: MessageSquare, description: 'Depoimentos de clientes' },
    packages: { icon: Package, description: 'Pacotes e investimento' },
    contact: { icon: Phone, description: 'WhatsApp, Instagram e contato' },
}

export function normalizeSections(saved?: ProposalSection[] | null): ProposalSection[] {
    if (!saved || saved.length === 0) return DEFAULT_SECTIONS
    return DEFAULT_SECTIONS.map((def) => {
        const found = saved.find((s) => s.id === def.id)
        return found ? { ...def, ...found } : def
    }).sort((a, b) => a.order - b.order)
}

interface Props {
    sections: ProposalSection[]
    onChange: (sections: ProposalSection[]) => void
    sectionsConfig: Record<string, any> | null | undefined
}

export default function SectionsEditor({ sections, onChange, sectionsConfig }: Props) {
    const [dragging, setDragging] = useState<number | null>(null)
    const [over, setOver] = useState<number | null>(null)

    const handleLabelChange = (id: string, newLabel: string) => {
        const newSections = sections.map((s) => s.id === id ? { ...s, label: newLabel } : s)
        onChange(newSections)
    }

    const toggle = (id: string) => {
        const sec = sections.find((s) => s.id === id)
        if (sec?.pinned) return
        onChange(sections.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
    }

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        if (sections[idx]?.pinned) { e.preventDefault(); return }
        setDragging(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        if (sections[idx]?.pinned) return
        setOver(idx)
    }

    const handleDrop = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        if (dragging === null || dragging === idx) return
        if (sections[idx]?.pinned || sections[dragging]?.pinned) return
        const reordered = [...sections]
        const [moved] = reordered.splice(dragging, 1)
        reordered.splice(idx, 0, moved)
        onChange(reordered.map((s, i) => ({ ...s, order: i })))
        setDragging(null)
        setOver(null)
    }

    return (
        <div className="space-y-2">
            {sections.map((section, idx) => {
                const meta = SECTION_META[section.id]
                const Icon = meta?.icon ?? GripVertical
                const isDragging = dragging === idx
                const isOver = over === idx
                const label = sectionsConfig?.[section.id]?.label || section.label

                return (
                    <div
                        key={section.id}
                        draggable={!section.pinned}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={() => { setDragging(null); setOver(null) }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${section.pinned
                                ? 'border-[#C9A84C]/20 bg-[#C9A84C]/5 cursor-default'
                                : isOver
                                    ? 'border-[#C9A84C]/50 bg-[#C9A84C]/8 cursor-grab scale-[1.01]'
                                    : isDragging
                                        ? 'border-white/20 bg-white/5 opacity-50 cursor-grabbing'
                                        : section.enabled
                                            ? 'border-white/8 bg-white/3 cursor-grab hover:border-white/15 active:cursor-grabbing'
                                            : 'border-white/4 bg-white/[0.01] opacity-45 cursor-grab hover:opacity-60'
                            }`}
                    >
                        {/* Drag handle or lock */}
                        {section.pinned
                            ? <Lock className="w-4 h-4 text-[#C9A84C]/50 flex-shrink-0" />
                            : <GripVertical className="w-4 h-4 text-white/25 flex-shrink-0" />
                        }

                        {/* Section icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${section.pinned
                                ? 'bg-[#C9A84C]/10'
                                : section.enabled
                                    ? 'bg-white/6'
                                    : 'bg-white/3'
                            }`}>
                            <Icon
                                className="w-3.5 h-3.5"
                                style={{ color: section.pinned ? '#C9A84C80' : section.enabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                            />
                        </div>

                        {/* Label + description */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => handleLabelChange(section.id, e.target.value)}
                                    className={`text-sm font-medium bg-transparent border-none focus:outline-none w-full ${section.enabled ? 'text-white/85' : 'text-white/30'}`}
                                />
                                {section.pinned && (
                                    <span className="text-[10px] text-[#C9A84C]/60 font-medium tracking-wide">sempre ativa</span>
                                )}
                            </div>
                            {meta?.description && (
                                <p className={`text-[11px] mt-0.5 truncate ${section.enabled ? 'text-white/35' : 'text-white/15'}`}>
                                    {meta.description}
                                </p>
                            )}
                        </div>

                        {/* Order badge */}
                        <span className="text-[10px] text-white/15 font-mono w-4 text-center flex-shrink-0">{idx + 1}</span>

                        {/* Visibility toggle */}
                        <button
                            type="button"
                            onClick={() => toggle(section.id)}
                            disabled={section.pinned}
                            title={section.enabled ? 'Ocultar seção' : 'Mostrar seção'}
                            className={`p-1.5 rounded-lg transition-all ${section.pinned
                                    ? 'opacity-20 cursor-not-allowed'
                                    : section.enabled
                                        ? 'text-white/50 hover:text-white/85 hover:bg-white/8'
                                        : 'text-white/25 hover:text-white/55 hover:bg-white/5'
                                }`}
                        >
                            {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                )
            })}
            <p className="text-[11px] text-white/30 pt-1 text-center">
                Arraste para reordenar · olho para ocultar seções
            </p>
        </div>
    )
}
