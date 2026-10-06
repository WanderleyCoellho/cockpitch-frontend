import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Bold, Film, ImagePlus, Italic, List, ListOrdered, Plus, Trash2, X } from 'lucide-react'
import { httpGateway } from '../../../../infra/gateway/HttpGateway'
import { sanitizeHtml } from '../../../../shared/sanitizeHtml'
import type { MediaKind } from '../../../../shared/blocks'
import { FieldLabel } from '../../help/HelpTip'

export const inputClass =
    'w-full px-3.5 py-2.5 border border-white/12 rounded-xl bg-white/4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 focus:bg-white/6 transition-all'

export function Field({ label, helpKey, children, hint }: { label: string; helpKey?: string; children: ReactNode; hint?: string }) {
    return (
        <div>
            <FieldLabel helpKey={helpKey}>{label}</FieldLabel>
            {children}
            {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
        </div>
    )
}

export function TextInput({ value, onChange, placeholder, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
    return <input type="text" className={inputClass} value={value ?? ''} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
}

export function TextArea({ value, onChange, placeholder, maxLength, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; rows?: number }) {
    return (
        <textarea
            className={`${inputClass} resize-y min-h-[72px]`}
            rows={rows}
            value={value ?? ''}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-2.5 text-sm text-white/75 cursor-pointer select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#C9A84C]' : 'bg-white/15'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            {label}
        </label>
    )
}

/**
 * Editor de texto simples (negrito, itálico, listas). Colar sempre entra como texto puro
 * e o HTML é sanitizado a cada alteração — o backend sanitiza de novo ao salvar.
 */
export function RichTextInput({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (el && document.activeElement !== el && el.innerHTML !== value) el.innerHTML = sanitizeHtml(value)
    }, [value])

    const emit = () => {
        const el = ref.current
        if (!el) return
        const text = el.textContent?.trim() ?? ''
        onChange(text ? sanitizeHtml(el.innerHTML) : '')
    }

    const exec = (command: string) => {
        ref.current?.focus()
        document.execCommand(command)
        emit()
    }

    const tools: Array<{ command: string; label: string; Icon: typeof Bold }> = [
        { command: 'bold', label: 'Negrito', Icon: Bold },
        { command: 'italic', label: 'Itálico', Icon: Italic },
        { command: 'insertUnorderedList', label: 'Lista', Icon: List },
        { command: 'insertOrderedList', label: 'Lista numerada', Icon: ListOrdered },
    ]

    return (
        <div className="rounded-xl border border-white/12 bg-white/4 focus-within:border-[#C9A84C]/50 transition-all">
            <div className="flex gap-1 px-2 py-1.5 border-b border-white/8">
                {tools.map(({ command, label, Icon }) => (
                    <button
                        key={command}
                        type="button"
                        title={label}
                        aria-label={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => exec(command)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                    >
                        <Icon className="w-3.5 h-3.5" />
                    </button>
                ))}
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={emit}
                onBlur={emit}
                onPaste={(e) => {
                    e.preventDefault()
                    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
                }}
                className="min-h-[110px] px-3.5 py-2.5 text-sm text-white/85 leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 empty:before:content-[attr(data-placeholder)] empty:before:text-white/25"
            />
        </div>
    )
}

function detectKind(file: File): MediaKind {
    return file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name) ? 'video' : 'image'
}

async function upload(file: File) {
    const { file_url } = await httpGateway.uploadFile(file)
    return { url: file_url, type: detectKind(file) }
}

/** Uma mídia (imagem ou vídeo) enviada para o storage da plataforma. */
export function MediaInput({
    url,
    type,
    onChange,
    accept = 'image/*,video/mp4,video/webm,video/quicktime',
    label = 'Enviar imagem ou vídeo',
}: {
    url?: string
    type?: MediaKind
    onChange: (media: { url: string; type: MediaKind } | null) => void
    accept?: string
    label?: string
}) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const onFile = async (file?: File) => {
        if (!file) return
        setBusy(true)
        setError(null)
        try {
            onChange(await upload(file))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.')
        } finally {
            setBusy(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div>
            <div className="flex items-center gap-3">
                {url ? (
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/30 flex-shrink-0">
                        {type === 'video' ? <video src={url} muted className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                        {type === 'video' && <Film className="absolute bottom-1 left-1 w-3.5 h-3.5 text-white/80" />}
                        <button type="button" onClick={() => onChange(null)} aria-label="Remover mídia" className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white/80 hover:text-white">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : null}
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-white/20 text-xs text-white/60 hover:text-white hover:border-[#C9A84C]/50 disabled:opacity-50"
                >
                    {busy ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                    {busy ? 'Enviando…' : url ? 'Trocar' : label}
                </button>
                <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
    )
}

/** Envio de várias mídias de uma vez (galeria). */
export function MultiMediaUpload({ onAdd, disabled }: { onAdd: (items: Array<{ url: string; type: MediaKind }>) => void; disabled?: boolean }) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const onFiles = async (files: File[]) => {
        if (files.length === 0) return
        setBusy(true)
        setError(null)
        try {
            const uploaded: Array<{ url: string; type: MediaKind }> = []
            for (const file of files) uploaded.push(await upload(file))
            onAdd(uploaded)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível enviar os arquivos.')
        } finally {
            setBusy(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div>
            <button
                type="button"
                disabled={busy || disabled}
                onClick={() => inputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-white/20 text-xs text-white/60 hover:text-white hover:border-[#C9A84C]/50 disabled:opacity-50"
            >
                {busy ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {busy ? 'Enviando…' : 'Adicionar fotos ou vídeos'}
            </button>
            <input ref={inputRef} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFiles(Array.from(e.target.files ?? []))} />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
    )
}

/** Lista editável (itens do escopo, perguntas do FAQ, etapas…) com reordenação por setas. */
export function ListEditor<T>({
    items,
    onChange,
    create,
    renderItem,
    max,
    addLabel,
    itemLabel,
}: {
    items: T[]
    onChange: (items: T[]) => void
    create: () => T
    renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode
    max: number
    addLabel: string
    itemLabel: (index: number) => string
}) {
    const update = (index: number, patch: Partial<T>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    const move = (index: number, delta: number) => {
        const target = index + delta
        if (target < 0 || target >= items.length) return
        const next = [...items]
        ;[next[index], next[target]] = [next[target], next[index]]
        onChange(next)
    }

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/35">{itemLabel(index)}</span>
                        <div className="flex gap-0.5">
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover para cima" className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20">
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Mover para baixo" className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20">
                                <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Remover" className="p-1 rounded text-white/40 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    {renderItem(item, (patch) => update(index, patch))}
                </div>
            ))}
            {items.length < max && (
                <button type="button" onClick={() => onChange([...items, create()])} className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#d8b65a]">
                    <Plus className="w-3.5 h-3.5" /> {addLabel}
                </button>
            )}
        </div>
    )
}
