import type { Provider } from "../../../shared/types";
import { ChevronDown } from 'lucide-react';

const FONT_OPTIONS = [
    { label: 'Padrão do Tema', value: '' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Lato', value: 'Lato' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
];

const fieldsetClass = "p-4 border border-white/10 rounded-2xl";
const labelClass = "block text-xs font-medium tracking-widest uppercase text-white/55 mb-2";

interface ContentEditorProps {
    provider: Provider | null | undefined;
    sectionsConfig: Record<string, any>;
    onConfigChange: (newConfig: Record<string, any>) => void;
}

export default function ContentEditor({ provider, sectionsConfig, onConfigChange }: ContentEditorProps) {

    const handleFieldChange = (section: string, element: string, field: 'text' | 'color' | 'font', value: string) => {
        const newConfig = { ...sectionsConfig };
        if (!newConfig[section]) newConfig[section] = {};
        if (!newConfig[section][element]) newConfig[section][element] = {};

        if (field === 'text') {
            newConfig[section][element].text = value;
        } else {
            if (!newConfig[section][element].style) newConfig[section][element].style = {};
            newConfig[section][element].style[field] = value;
        }

        onConfigChange(newConfig);
    };

    const getValue = (section: string, element: string, field: 'text' | 'color' | 'font') => {
        const config = sectionsConfig?.[section]?.[element];
        if (field === 'text') {
            return config?.text;
        }
        return config?.style?.[field];
    }

    return (
        <div className="space-y-6">
            <div className={fieldsetClass}>
                <h3 className="font-semibold text-white">Seção: Sobre Nós</h3>
                <p className="text-xs text-white/40 mb-4">Deixe os campos em branco para usar os textos e estilos padrão do seu perfil.</p>

                <div className="space-y-4">
                    {/* About Title */}
                    <div>
                        <label className={labelClass}>Título</label>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                            <input
                                type="text"
                                placeholder={provider?.aboutTitle || "Título da seção sobre"}
                                value={getValue('about', 'title', 'text') ?? ''}
                                onChange={(e) => handleFieldChange('about', 'title', 'text', e.target.value)}
                                className="w-full px-3 py-2 border border-white/12 rounded-lg bg-white/4 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
                            />
                            <input
                                type="color"
                                value={getValue('about', 'title', 'color') ?? '#ffffff'}
                                onChange={(e) => handleFieldChange('about', 'title', 'color', e.target.value)}
                                className="h-full w-12 rounded-lg bg-transparent border-none cursor-pointer"
                                title="Selecionar cor do título"
                            />
                            <div className="relative">
                                <select
                                    value={getValue('about', 'title', 'font') ?? ''}
                                    onChange={(e) => handleFieldChange('about', 'title', 'font', e.target.value)}
                                    className="appearance-none w-full h-full bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 pr-8 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                                >
                                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"/>
                            </div>
                        </div>
                    </div>

                    {/* About Subtitle */}
                    <div>
                        <label className={labelClass}>Subtítulo</label>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                            <input
                                type="text"
                                placeholder={provider?.aboutSubtitle || "Subtítulo da seção sobre"}
                                value={getValue('about', 'subtitle', 'text') ?? ''}
                                onChange={(e) => handleFieldChange('about', 'subtitle', 'text', e.target.value)}
                                className="w-full px-3 py-2 border border-white/12 rounded-lg bg-white/4 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 text-sm"
                            />
                            <input
                                type="color"
                                value={getValue('about', 'subtitle', 'color') ?? '#ffffff'}
                                onChange={(e) => handleFieldChange('about', 'subtitle', 'color', e.target.value)}
                                className="h-full w-12 rounded-lg bg-transparent border-none cursor-pointer"
                                title="Selecionar cor do subtítulo"
                            />
                            <div className="relative">
                                <select
                                    value={getValue('about', 'subtitle', 'font') ?? ''}
                                    onChange={(e) => handleFieldChange('about', 'subtitle', 'font', e.target.value)}
                                    className="appearance-none w-full h-full bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 pr-8 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                                >
                                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"/>
                            </div>
                        </div>
                    </div>

                     {/* About Body */}
                     <div>
                        <label className={labelClass}>Texto Principal</label>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                            <textarea
                                placeholder={provider?.aboutText || "Texto principal da seção sobre..."}
                                value={getValue('about', 'body', 'text') ?? ''}
                                onChange={(e) => handleFieldChange('about', 'body', 'text', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-white/12 rounded-lg bg-white/4 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 text-sm resize-none"
                            />
                            <div className="flex flex-col gap-2">
                                <input
                                    type="color"
                                    value={getValue('about', 'body', 'color') ?? '#ffffff'}
                                    onChange={(e) => handleFieldChange('about', 'body', 'color', e.target.value)}
                                    className="h-full w-12 rounded-lg bg-transparent border-none cursor-pointer"
                                    title="Selecionar cor do texto"
                                />
                                <div className="relative h-full">
                                    <select
                                        value={getValue('about', 'body', 'font') ?? ''}
                                        onChange={(e) => handleFieldChange('about', 'body', 'font', e.target.value)}
                                        className="appearance-none w-full h-full bg-white/5 border border-white/10 text-white/60 rounded-lg px-3 pr-8 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                                    >
                                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outras seções aqui... */}
        </div>
    );
}
