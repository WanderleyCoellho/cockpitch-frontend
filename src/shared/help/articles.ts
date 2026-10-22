import { HELP, type HelpEntry } from './content'

/**
 * Central de ajuda (spec in-app-guidance): artigos em Markdown + o mesmo catálogo das dicas "?".
 * Arquivo `NN-slug.md`: o número define a ordem; a 1ª linha (#) é o título e a 2ª, o resumo.
 */
const files = import.meta.glob('./articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export type HelpArticle = { slug: string; title: string; summary: string; body: string }

export const ARTICLES: HelpArticle[] = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, raw]) => {
        const slug = path.split('/').pop()!.replace(/^\d+-/, '').replace(/\.md$/, '')
        const lines = raw.replace(/\r/g, '').split('\n')
        const title = lines[0].replace(/^#\s*/, '').trim()
        const summary = (lines[1] ?? '').trim()
        const body = lines.slice(2).join('\n').trim()
        return { slug, title, summary, body }
    })

export function findArticle(slug: string | undefined) {
    return ARTICLES.find((article) => article.slug === slug) ?? null
}

/** Sem acento e minúsculo: "Notificação" encontra "notificacao". */
export function normalize(text: string) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export type HelpSearchResult = {
    articles: HelpArticle[]
    entries: Array<[string, HelpEntry]>
}

/** Busca por título e conteúdo; todas as palavras precisam aparecer. */
export function searchHelp(query: string): HelpSearchResult {
    const words = normalize(query).split(/\s+/).filter(Boolean)
    const matches = (text: string) => {
        const haystack = normalize(text)
        return words.every((word) => haystack.includes(word))
    }
    const entries = Object.entries(HELP)
    if (words.length === 0) return { articles: ARTICLES, entries }
    return {
        articles: ARTICLES.filter((a) => matches(`${a.title} ${a.summary} ${a.body}`)),
        entries: entries.filter(([, e]) => matches(`${e.title} ${e.body} ${e.area}`)),
    }
}
