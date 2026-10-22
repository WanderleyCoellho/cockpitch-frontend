import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOnboarding } from '../../hooks/useOnboarding'

export type TourStep = {
    /** Valor do atributo `data-tour` do elemento destacado. Sem elemento na tela, o passo é pulado. */
    target: string
    title: string
    body: string
}

export const TOUR_START_EVENT = 'tour:start'

function findTarget(target: string) {
    return document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
}

/**
 * Tour guiado (spec in-app-guidance): aparece uma vez por pessoa em cada tela e pode ser reaberto
 * pelo botão Ajuda. Destaca o elemento e explica para que serve.
 */
export default function GuidedTour({ id, steps }: { id: string; steps: TourStep[] }) {
    const { status, update } = useOnboarding()
    const [index, setIndex] = useState<number | null>(null)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const autoStarted = useRef(false)

    const available = useCallback(() => steps.filter((s) => findTarget(s.target)), [steps])

    const start = useCallback(() => {
        if (available().length > 0) setIndex(0)
    }, [available])

    const finish = useCallback(() => {
        setIndex(null)
        update({ tourSeen: id })
    }, [id, update])

    // Diz ao botão Ajuda que esta tela tem tour.
    useEffect(() => {
        document.body.dataset.tour = id
        const onStart = () => start()
        window.addEventListener(TOUR_START_EVENT, onStart)
        return () => {
            if (document.body.dataset.tour === id) delete document.body.dataset.tour
            window.removeEventListener(TOUR_START_EVENT, onStart)
        }
    }, [id, start])

    // Primeira visita: abre sozinho (com uma pequena espera para a tela carregar).
    useEffect(() => {
        if (!status || autoStarted.current || status.toursDisabled || status.toursSeen.includes(id)) return
        autoStarted.current = true
        const timer = window.setTimeout(start, 900)
        return () => window.clearTimeout(timer)
    }, [status, id, start])

    const visible = index === null ? [] : available()
    const step = index === null ? null : visible[index] ?? null

    useLayoutEffect(() => {
        if (!step) return
        const el = findTarget(step.target)
        if (!el) return
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        const measure = () => setRect(el.getBoundingClientRect())
        measure()
        const timer = window.setTimeout(measure, 350)
        window.addEventListener('resize', measure)
        window.addEventListener('scroll', measure, true)
        cardRef.current?.focus()
        return () => {
            window.clearTimeout(timer)
            window.removeEventListener('resize', measure)
            window.removeEventListener('scroll', measure, true)
        }
    }, [step])

    useEffect(() => {
        if (index === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') finish()
            if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : Math.min(i + 1, visible.length - 1)))
            if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : Math.max(i - 1, 0)))
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [index, finish, visible.length])

    if (index === null || !step || !rect) return null

    const pad = 8
    const isLast = index >= visible.length - 1
    const below = rect.bottom + 220 < window.innerHeight
    const cardWidth = Math.min(340, window.innerWidth - 24)
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - 12))
    const top = below ? rect.bottom + pad + 10 : Math.max(12, rect.top - pad - 10 - 190)

    return createPortal(
        <div className="fixed inset-0 z-[200]" aria-live="polite">
            {/* Fundo escurecido com "buraco" no elemento; clicar fora fecha. */}
            <div className="absolute inset-0" onClick={finish} />
            <div
                className="absolute rounded-xl pointer-events-none transition-all duration-300"
                style={{
                    top: rect.top - pad,
                    left: rect.left - pad,
                    width: rect.width + pad * 2,
                    height: rect.height + pad * 2,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                    outline: '2px solid #C9A84C',
                }}
            />
            <div
                ref={cardRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-title"
                className="absolute rounded-2xl border border-white/10 bg-[#161616] p-4 shadow-2xl focus:outline-none"
                style={{ top, left, width: cardWidth }}
            >
                <div className="flex items-start justify-between gap-3">
                    <p id="tour-title" className="text-sm font-semibold text-white">{step.title}</p>
                    <button type="button" onClick={finish} aria-label="Fechar tour" className="p-0.5 text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{step.body}</p>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-white/35">{index + 1} de {visible.length}</span>
                    <div className="flex gap-2">
                        {index > 0 && (
                            <button type="button" onClick={() => setIndex(index - 1)} className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5">
                                Voltar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => (isLast ? finish() : setIndex(index + 1))}
                            className="px-3.5 py-1.5 rounded-lg bg-[#C9A84C] text-black text-xs font-semibold hover:bg-[#d8b65a]"
                        >
                            {isLast ? 'Entendi' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
