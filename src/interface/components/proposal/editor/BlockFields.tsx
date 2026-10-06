import { Trash2 } from 'lucide-react'
import type { ProposalBlock } from '../../../../shared/blocks'
import { Field, ListEditor, MediaInput, MultiMediaUpload, RichTextInput, TextArea, TextInput, Toggle, inputClass } from './fields'

type Props<B extends ProposalBlock> = { block: B; onChange: (data: B['data']) => void }

function patcher<B extends ProposalBlock>({ block, onChange }: Props<B>) {
    return (patch: Partial<B['data']>) => onChange({ ...block.data, ...patch })
}

/** Formulário do conteúdo de cada tipo de bloco. */
export function BlockFields({ block, onChange }: { block: ProposalBlock; onChange: (data: ProposalBlock['data']) => void }) {
    switch (block.type) {
        case 'cover': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-4">
                    <Field label="Título principal" helpKey="blocks.placeholders">
                        <TextInput value={block.data.headline} maxLength={160} onChange={(headline) => set({ headline })} placeholder="Ex.: Proposta para {cliente}" />
                    </Field>
                    <Field label="Subtítulo">
                        <TextArea value={block.data.subheadline} maxLength={300} rows={2} onChange={(subheadline) => set({ subheadline })} />
                    </Field>
                    <Field label="Imagem ou vídeo de fundo" helpKey="blocks.media" hint="Vídeos tocam sem som, em repetição. Use arquivos leves (até ~20 MB).">
                        <MediaInput
                            url={block.data.mediaUrl}
                            type={block.data.mediaType}
                            onChange={(media) => set({ mediaUrl: media?.url, mediaType: media?.type })}
                        />
                    </Field>
                    <Toggle checked={block.data.showClientName} onChange={(showClientName) => set({ showClientName })} label='Mostrar "Preparada para (nome do cliente)"' />
                </div>
            )
        }
        case 'about': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-4">
                    <Field label="Texto" helpKey="blocks.richText">
                        <RichTextInput value={block.data.body} onChange={(body) => set({ body })} placeholder="Conte quem é a {empresa}…" />
                    </Field>
                    <Field label="Foto ou vídeo (opcional)" helpKey="blocks.media">
                        <MediaInput url={block.data.mediaUrl} type={block.data.mediaType} onChange={(media) => set({ mediaUrl: media?.url, mediaType: media?.type })} />
                    </Field>
                </div>
            )
        }
        case 'scope': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-4">
                    <Field label="Introdução (opcional)">
                        <TextArea value={block.data.intro} maxLength={2000} rows={2} onChange={(intro) => set({ intro })} />
                    </Field>
                    <ListEditor
                        items={block.data.items}
                        onChange={(items) => set({ items })}
                        create={() => ({ title: '', description: '' })}
                        max={50}
                        addLabel="Adicionar item"
                        itemLabel={(i) => `Item ${i + 1}`}
                        renderItem={(item, update) => (
                            <>
                                <TextInput value={item.title} maxLength={160} placeholder="Ex.: Planejamento mensal" onChange={(title) => update({ title })} />
                                <TextArea value={item.description} maxLength={600} rows={2} placeholder="Detalhe (opcional)" onChange={(description) => update({ description })} />
                            </>
                        )}
                    />
                </div>
            )
        }
        case 'pricing': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-3">
                    <Field label="Texto antes dos pacotes (opcional)" helpKey="blocks.pricing">
                        <TextArea value={block.data.intro} maxLength={2000} rows={2} onChange={(intro) => set({ intro })} />
                    </Field>
                    <p className="text-xs text-white/40">Os pacotes deste bloco são os marcados na aba <strong className="text-white/70">Pacotes</strong>.</p>
                </div>
            )
        }
        case 'gallery': {
            const set = patcher({ block, onChange })
            const items = block.data.items
            return (
                <div className="space-y-3">
                    {items.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {items.map((item, index) => (
                                <div key={`${item.url}-${index}`} className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
                                    <div className="relative aspect-video">
                                        {item.type === 'video' ? <video src={item.url} muted className="w-full h-full object-cover" /> : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                                        <button
                                            type="button"
                                            onClick={() => set({ items: items.filter((_, i) => i !== index) })}
                                            aria-label="Remover"
                                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white/80 hover:text-red-300"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-transparent px-2 py-1.5 text-[11px] text-white/70 placeholder-white/25 focus:outline-none"
                                        placeholder="Legenda (opcional)"
                                        maxLength={200}
                                        value={item.caption}
                                        onChange={(e) => set({ items: items.map((it, i) => (i === index ? { ...it, caption: e.target.value } : it)) })}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <Field label="Mídias" helpKey="blocks.media" hint={`${items.length} de 60`}>
                        <MultiMediaUpload
                            disabled={items.length >= 60}
                            onAdd={(added) => set({ items: [...items, ...added.map((m) => ({ ...m, caption: '' }))].slice(0, 60) })}
                        />
                    </Field>
                </div>
            )
        }
        case 'timeline': {
            const set = patcher({ block, onChange })
            return (
                <ListEditor
                    items={block.data.steps}
                    onChange={(steps) => set({ steps })}
                    create={() => ({ title: '', description: '', duration: '' })}
                    max={30}
                    addLabel="Adicionar etapa"
                    itemLabel={(i) => `Etapa ${i + 1}`}
                    renderItem={(step, update) => (
                        <>
                            <div className="grid grid-cols-[1fr_140px] gap-2">
                                <TextInput value={step.title} maxLength={160} placeholder="Nome da etapa" onChange={(title) => update({ title })} />
                                <TextInput value={step.duration} maxLength={60} placeholder="Prazo (ex.: 1 semana)" onChange={(duration) => update({ duration })} />
                            </div>
                            <TextArea value={step.description} maxLength={600} rows={2} placeholder="O que acontece nesta etapa" onChange={(description) => update({ description })} />
                        </>
                    )}
                />
            )
        }
        case 'testimonials': {
            const set = patcher({ block, onChange })
            return (
                <ListEditor
                    items={block.data.items}
                    onChange={(items) => set({ items })}
                    create={(): (typeof block.data.items)[number] => ({ quote: '', author: '', role: '' })}
                    max={30}
                    addLabel="Adicionar depoimento"
                    itemLabel={(i) => `Depoimento ${i + 1}`}
                    renderItem={(item, update) => (
                        <>
                            <TextArea value={item.quote} maxLength={1000} rows={3} placeholder="O que o cliente disse" onChange={(quote) => update({ quote })} />
                            <div className="grid grid-cols-2 gap-2">
                                <TextInput value={item.author} maxLength={120} placeholder="Nome" onChange={(author) => update({ author })} />
                                <TextInput value={item.role} maxLength={120} placeholder="Empresa ou cidade" onChange={(role) => update({ role })} />
                            </div>
                            <MediaInput url={item.photoUrl} type="image" accept="image/*" label="Foto (opcional)" onChange={(media) => update({ photoUrl: media?.url })} />
                        </>
                    )}
                />
            )
        }
        case 'faq': {
            const set = patcher({ block, onChange })
            return (
                <ListEditor
                    items={block.data.items}
                    onChange={(items) => set({ items })}
                    create={() => ({ question: '', answer: '' })}
                    max={50}
                    addLabel="Adicionar pergunta"
                    itemLabel={(i) => `Pergunta ${i + 1}`}
                    renderItem={(item, update) => (
                        <>
                            <TextInput value={item.question} maxLength={300} placeholder="Pergunta" onChange={(question) => update({ question })} />
                            <TextArea value={item.answer} maxLength={3000} rows={3} placeholder="Resposta" onChange={(answer) => update({ answer })} />
                        </>
                    )}
                />
            )
        }
        case 'team': {
            const set = patcher({ block, onChange })
            return (
                <ListEditor
                    items={block.data.members}
                    onChange={(members) => set({ members })}
                    create={(): (typeof block.data.members)[number] => ({ name: '', role: '', bio: '' })}
                    max={30}
                    addLabel="Adicionar pessoa"
                    itemLabel={(i) => `Pessoa ${i + 1}`}
                    renderItem={(member, update) => (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <TextInput value={member.name} maxLength={120} placeholder="Nome" onChange={(name) => update({ name })} />
                                <TextInput value={member.role} maxLength={120} placeholder="Função" onChange={(role) => update({ role })} />
                            </div>
                            <TextArea value={member.bio} maxLength={600} rows={2} placeholder="Resumo (opcional)" onChange={(bio) => update({ bio })} />
                            <MediaInput url={member.photoUrl} type="image" accept="image/*" label="Foto (opcional)" onChange={(media) => update({ photoUrl: media?.url })} />
                        </>
                    )}
                />
            )
        }
        case 'terms': {
            const set = patcher({ block, onChange })
            return (
                <Field label="Texto" helpKey="blocks.richText">
                    <RichTextInput value={block.data.body} onChange={(body) => set({ body })} placeholder="Validade, forma de pagamento, regras…" />
                </Field>
            )
        }
        case 'contact': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-4">
                    <Field label="Mensagem (opcional)">
                        <TextArea value={block.data.message} maxLength={600} rows={2} onChange={(message) => set({ message })} />
                    </Field>
                    <Field label="Botões exibidos" helpKey="blocks.contact">
                        <div className="space-y-2.5">
                            <Toggle checked={block.data.showWhatsapp} onChange={(showWhatsapp) => set({ showWhatsapp })} label="WhatsApp" />
                            <Toggle checked={block.data.showEmail} onChange={(showEmail) => set({ showEmail })} label="E-mail" />
                            <Toggle checked={block.data.showInstagram} onChange={(showInstagram) => set({ showInstagram })} label="Instagram" />
                        </div>
                    </Field>
                </div>
            )
        }
        case 'acceptance': {
            const set = patcher({ block, onChange })
            return (
                <div className="space-y-4">
                    <Field label="Texto antes do formulário (opcional)" helpKey="blocks.acceptance">
                        <TextArea value={block.data.intro} maxLength={1000} rows={2} placeholder="Ex.: Gostou? Escolha o pacote e aceite online." onChange={(intro) => set({ intro })} />
                    </Field>
                    <Field label="O cliente pode" helpKey="blocks.acceptanceOptions">
                        <div className="space-y-2.5">
                            <Toggle checked={block.data.allowChangeRequest} onChange={(allowChangeRequest) => set({ allowChangeRequest })} label="Pedir ajuste" />
                            <Toggle checked={block.data.allowDecline} onChange={(allowDecline) => set({ allowDecline })} label="Recusar" />
                            <Toggle checked={block.data.requireDocument} onChange={(requireDocument) => set({ requireDocument })} label="Exigir CPF/CNPJ para aceitar" />
                        </div>
                    </Field>
                </div>
            )
        }
        case 'cta': {
            const set = patcher({ block, onChange })
            return (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                    <Field label="Frase de destaque">
                        <TextInput value={block.data.headline} maxLength={160} onChange={(headline) => set({ headline })} />
                    </Field>
                    <Field label="Texto do botão">
                        <input className={inputClass} value={block.data.buttonLabel} maxLength={40} onChange={(e) => set({ buttonLabel: e.target.value })} />
                    </Field>
                </div>
            )
        }
        default:
            return null
    }
}
