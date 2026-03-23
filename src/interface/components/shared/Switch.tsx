import { useId } from 'react'

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
    const id = useId()
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:ring-offset-2 focus:ring-offset-black ${
                    checked ? 'bg-[#C9A84C]' : 'bg-gray-600'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
            <label htmlFor={id} onClick={() => onChange(!checked)} className="text-sm text-white/80 cursor-pointer">
                {label}
            </label>
        </div>
    )
}
