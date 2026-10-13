import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eraser, PenLine, Type } from 'lucide-react'
import type { SignatureDrawing } from '../../../shared/types'

/** Fonte manuscrita da assinatura digitada (a mesma no comprovante e no PDF). */
export const SIGNATURE_FONT = 'Great Vibes'
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'

export function useSignatureFont() {
    useEffect(() => {
        if (typeof document === 'undefined' || document.querySelector('link[data-signature-font]')) return
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = FONT_URL
        link.setAttribute('data-signature-font', 'true')
        document.head.appendChild(link)
    }, [])
}

const PAD_HEIGHT = 170
const MAX_EXPORT_WIDTH = 900
const INK = '#16181d'

/**
 * Assinar desenhando (dedo ou mouse) ou digitando o nome (vira assinatura em fonte manuscrita).
 * O fundo é sempre claro, como papel, para a tinta escura ficar legível em qualquer tema.
 */
export function SignaturePad({
    value,
    onChange,
    suggestedName = '',
    disabled = false,
    tone = 'light',
}: {
    value: SignatureDrawing | null
    onChange: (value: SignatureDrawing | null) => void
    suggestedName?: string
    disabled?: boolean
    /** Cor dos controles: claro na página do cliente (usa o tema), escuro no painel. */
    tone?: 'light' | 'panel'
}) {
    useSignatureFont()
    const [mode, setMode] = useState<'DRAWN' | 'TYPED'>(value?.method ?? 'DRAWN')
    const [typed, setTyped] = useState(value?.method === 'TYPED' ? value.typedText : suggestedName)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const drawing = useRef(false)
    const last = useRef<{ x: number; y: number } | null>(null)
    const hasInk = useRef(false)

    // Canvas na resolução da tela (traço nítido), redesenhando a assinatura salva quando houver.
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
        const width = wrap.clientWidth
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(PAD_HEIGHT * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${PAD_HEIGHT}px`
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = INK
        ctx.lineWidth = 2.4
        hasInk.current = false
        if (value?.method === 'DRAWN' && value.image) {
            const img = new Image()
            img.onload = () => {
                const ratio = Math.min(width / img.width, PAD_HEIGHT / img.height)
                const w = img.width * ratio
                const h = img.height * ratio
                ctx.drawImage(img, (width - w) / 2, (PAD_HEIGHT - h) / 2, w, h)
                hasInk.current = true
            }
            img.src = value.image
        }
        // Só na montagem e quando o tamanho muda: o valor salvo é redesenhado uma vez.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (mode !== 'DRAWN') return
        setupCanvas()
        const wrap = wrapRef.current
        if (!wrap || typeof ResizeObserver === 'undefined') return
        let lastWidth = wrap.clientWidth
        const observer = new ResizeObserver(() => {
            if (wrap.clientWidth !== lastWidth) {
                lastWidth = wrap.clientWidth
                setupCanvas()
            }
        })
        observer.observe(wrap)
        return () => observer.disconnect()
    }, [mode, setupCanvas])

    const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const exportPng = () => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const scale = Math.min(1, MAX_EXPORT_WIDTH / canvas.width)
        if (scale === 1) return canvas.toDataURL('image/png')
        const out = document.createElement('canvas')
        out.width = Math.round(canvas.width * scale)
        out.height = Math.round(canvas.height * scale)
        out.getContext('2d')?.drawImage(canvas, 0, 0, out.width, out.height)
        return out.toDataURL('image/png')
    }

    const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (disabled) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drawing.current = true
        last.current = point(event)
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && last.current) {
            // Um toque vira um ponto.
            ctx.beginPath()
            ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2)
            ctx.fillStyle = INK
            ctx.fill()
        }
    }

    const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current || !last.current) return
        const ctx = canvasRef.current?.getContext('2d')
        const next = point(event)
        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(last.current.x, last.current.y)
        const mid = { x: (last.current.x + next.x) / 2, y: (last.current.y + next.y) / 2 }
        ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y)
        ctx.lineTo(next.x, next.y)
        ctx.stroke()
        last.current = next
        hasInk.current = true
    }

    const onPointerUp = () => {
        if (!drawing.current) return
        drawing.current = false
        last.current = null
        const image = hasInk.current ? exportPng() : null
        onChange(image ? { method: 'DRAWN', image } : null)
    }

    const clear = () => {
        const canvas = canvasRef.current
        canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
        hasInk.current = false
        onChange(null)
    }

    const switchMode = (next: 'DRAWN' | 'TYPED') => {
        setMode(next)
        if (next === 'TYPED') onChange(typed.trim().length >= 2 ? { method: 'TYPED', typedText: typed.trim() } : null)
        else onChange(null)
    }

    const tabBase = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors'
    const tabStyle = (active: boolean) =>
        tone === 'panel'
            ? { className: `${tabBase} ${active ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white/80'}` }
            : {
                  className: `${tabBase} pp-body`,
                  style: active ? { background: 'var(--pp-accent)', color: 'var(--pp-on-accent)' } : { color: 'var(--pp-muted)', border: '1px solid var(--pp-border)' },
              }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5" role="tablist" aria-label="Como assinar">
                    <button type="button" role="tab" aria-selected={mode === 'DRAWN'} onClick={() => switchMode('DRAWN')} disabled={disabled} {...tabStyle(mode === 'DRAWN')}>
                        <PenLine className="w-3.5 h-3.5" /> Desenhar
                    </button>
                    <button type="button" role="tab" aria-selected={mode === 'TYPED'} onClick={() => switchMode('TYPED')} disabled={disabled} {...tabStyle(mode === 'TYPED')}>
                        <Type className="w-3.5 h-3.5" /> Digitar
                    </button>
                </div>
                {mode === 'DRAWN' && (
                    <button type="button" onClick={clear} disabled={disabled} className={`inline-flex items-center gap-1 text-xs ${tone === 'panel' ? 'text-white/45 hover:text-white' : 'pp-body'}`} style={tone === 'panel' ? undefined : { color: 'var(--pp-muted)' }}>
                        <Eraser className="w-3.5 h-3.5" /> Limpar
                    </button>
                )}
            </div>

            <div ref={wrapRef} className="relative rounded-2xl overflow-hidden" style={{ background: '#fbfaf7', border: '1px solid rgba(0,0,0,0.12)', height: PAD_HEIGHT }}>
                {mode === 'DRAWN' ? (
                    <>
                        <canvas
                            ref={canvasRef}
                            aria-label="Área para desenhar a assinatura"
                            className="block cursor-crosshair"
                            style={{ touchAction: 'none' }}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                        />
                        {!value && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'rgba(0,0,0,0.35)' }}>
                                Assine aqui com o dedo ou o mouse
                            </span>
                        )}
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center px-4 overflow-hidden">
                        <span style={{ fontFamily: `'${SIGNATURE_FONT}', cursive`, fontSize: 46, color: INK, whiteSpace: 'nowrap' }}>{typed.trim() || 'Seu nome'}</span>
                    </div>
                )}
                <span className="pointer-events-none absolute left-6 right-6 bottom-7 h-px" style={{ background: 'rgba(0,0,0,0.18)' }} />
            </div>

            {mode === 'TYPED' && (
                <input
                    value={typed}
                    maxLength={80}
                    disabled={disabled}
                    aria-label="Nome para a assinatura"
                    placeholder="Digite seu nome como quer assinar"
                    onChange={(e) => {
                        setTyped(e.target.value)
                        const text = e.target.value.trim()
                        onChange(text.length >= 2 ? { method: 'TYPED', typedText: text } : null)
                    }}
                    className={
                        tone === 'panel'
                            ? 'w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/60'
                            : 'w-full px-4 py-3 rounded-xl pp-body text-sm focus:outline-none'
                    }
                    style={tone === 'panel' ? undefined : { background: 'var(--pp-bg)', border: '1px solid var(--pp-border)', color: 'var(--pp-text)' }}
                />
            )}
        </div>
    )
}
