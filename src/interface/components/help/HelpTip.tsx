import * as Tooltip from '@radix-ui/react-tooltip'
import { HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HELP } from '../../../shared/help/content'

/**
 * Ícone "?" ao lado de um campo: explica para que serve e como usar.
 * Abre ao parar o mouse ~0,5 s, ao focar com o teclado (Tab) ou ao tocar no celular.
 */
export default function HelpTip({ helpKey, side = 'top' }: { helpKey: string; side?: 'top' | 'right' | 'bottom' | 'left' }) {
    const entry = HELP[helpKey]
    if (!entry) {
        if (import.meta.env.DEV) console.warn(`[HelpTip] chave de ajuda inexistente: ${helpKey}`)
        return null
    }

    return (
        <Tooltip.Provider delayDuration={500}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button
                        type="button"
                        aria-label={`Ajuda: ${entry.title}`}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white/35 hover:text-[#C9A84C] focus:text-[#C9A84C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 transition"
                        onClick={(event) => event.preventDefault()}
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side={side}
                        sideOffset={6}
                        collisionPadding={12}
                        className="z-[100] max-w-xs rounded-xl border border-white/10 bg-[#161616] px-3.5 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                    >
                        <p className="text-xs font-semibold text-[#C9A84C]">{entry.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/75">{entry.body}</p>
                        {entry.article && (
                            <Link to={`/ajuda/${entry.article}`} className="mt-2 inline-block text-[11px] font-medium text-[#C9A84C] hover:underline">
                                Saiba mais →
                            </Link>
                        )}
                        <Tooltip.Arrow className="fill-[#161616]" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

/** Rótulo de campo com dica integrada. */
export function FieldLabel({ htmlFor, children, helpKey }: { htmlFor?: string; children: React.ReactNode; helpKey?: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-1.5">
            <label htmlFor={htmlFor} className="block text-[10px] font-medium tracking-widest uppercase text-white/50">
                {children}
            </label>
            {helpKey && <HelpTip helpKey={helpKey} />}
        </div>
    )
}
