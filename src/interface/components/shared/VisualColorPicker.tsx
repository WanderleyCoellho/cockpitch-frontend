import { useId } from 'react'

interface VisualColorPickerProps {
    label: string
    color?: string | null
    onChange: (color: string) => void
}

export function VisualColorPicker({ label, color, onChange }: VisualColorPickerProps) {
    const id = useId()
    const colorValue = color || ''

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-white mb-1">
                {label}
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-black/20 focus-within:ring-2 focus-within:ring-[#C9A84C]/40">
                <input
                    id={id}
                    type="color"
                    value={colorValue.startsWith('#') ? colorValue : '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer flex-shrink-0 border-0 bg-transparent p-0"
                />
                <input
                    className="flex-1 min-w-0 bg-transparent text-sm text-white/75 focus:outline-none font-mono placeholder-white/25"
                    value={colorValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#F59E0B"
                    maxLength={7}
                />
            </div>
        </div>
    )
}
