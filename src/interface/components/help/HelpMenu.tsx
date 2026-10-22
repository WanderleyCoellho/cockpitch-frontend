import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, HelpCircle, PlayCircle, RotateCcw, X } from 'lucide-react'
import { useOnboarding } from '../../hooks/useOnboarding'
import { TOUR_START_EVENT } from './GuidedTour'

/** Botão "Ajuda" fixo no painel: tour da tela atual, central de ajuda e preferência de tours. */
export default function HelpMenu() {
    const [open, setOpen] = useState(false)
    const [hasTour, setHasTour] = useState(false)
    const location = useLocation()
    const { status, update } = useOnboarding()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => setOpen(false), [location.pathname])
    useEffect(() => {
        if (open) setHasTour(!!document.body.dataset.tour)
        if (!open) return
        const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const itemClass = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 text-left'

    return (
        <div ref={ref} className="fixed bottom-5 right-5 z-40 print:hidden" data-tour="help-button">
            {open && (
                <div role="menu" className="absolute bottom-14 right-0 w-64 rounded-2xl border border-white/10 bg-[#161616] p-2 shadow-2xl">
                    <div className="flex items-center justify-between px-3 py-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Ajuda</p>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-white/40 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {hasTour && (
                        <button type="button" role="menuitem" className={itemClass} onClick={() => { setOpen(false); window.dispatchEvent(new Event(TOUR_START_EVENT)) }}>
                            <PlayCircle className="w-4 h-4 text-[#C9A84C]" /> Ver o tour desta tela
                        </button>
                    )}
                    <Link to="/ajuda" role="menuitem" className={itemClass}>
                        <BookOpen className="w-4 h-4 text-[#C9A84C]" /> Central de ajuda
                    </Link>
                    <div className="my-1.5 border-t border-white/8" />
                    <label className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-white/70 cursor-pointer">
                        Mostrar tours automaticamente
                        <input
                            type="checkbox"
                            checked={!status?.toursDisabled}
                            onChange={(e) => update({ toursDisabled: !e.target.checked })}
                            style={{ accentColor: '#C9A84C' }}
                        />
                    </label>
                    <button type="button" role="menuitem" className={itemClass} onClick={() => { update({ resetTours: true, toursDisabled: false }); setOpen(false) }}>
                        <RotateCcw className="w-4 h-4 text-white/40" /> Rever todos os tours
                    </button>
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-4 py-2.5 text-sm font-medium text-white/80 shadow-xl hover:text-white hover:border-[#C9A84C]/40"
            >
                <HelpCircle className="w-4 h-4 text-[#C9A84C]" /> Ajuda
            </button>
        </div>
    )
}
