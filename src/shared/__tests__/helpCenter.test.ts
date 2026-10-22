import { describe, expect, it } from 'vitest'
import { ARTICLES, findArticle, normalize, searchHelp } from '../help/articles'
import { HELP } from '../help/content'

describe('central de ajuda', () => {
    it('carrega os artigos em ordem, com título e resumo', () => {
        expect(ARTICLES.length).toBeGreaterThanOrEqual(10)
        expect(ARTICLES[0].slug).toBe('primeiros-passos')
        for (const article of ARTICLES) {
            expect(article.title.length).toBeGreaterThan(3)
            expect(article.summary.length).toBeGreaterThan(10)
            expect(article.body.length).toBeGreaterThan(50)
        }
    })

    it('todo "Saiba mais" do catálogo aponta para um artigo existente', () => {
        const broken = Object.entries(HELP).filter(([, e]) => e.article && !findArticle(e.article)).map(([k]) => k)
        expect(broken).toEqual([])
    })

    it('links internos dos artigos levam a artigos existentes', () => {
        const broken: string[] = []
        for (const article of ARTICLES) {
            for (const match of article.body.matchAll(/\]\(\/ajuda\/([a-z0-9-]+)\)/g)) {
                if (!findArticle(match[1])) broken.push(`${article.slug} → ${match[1]}`)
            }
        }
        expect(broken).toEqual([])
    })

    it('busca sem acento, por título e conteúdo, em artigos e no catálogo', () => {
        expect(normalize('Notificação')).toBe('notificacao')
        const all = searchHelp('')
        expect(all.articles).toHaveLength(ARTICLES.length)
        expect(all.entries).toHaveLength(Object.keys(HELP).length)

        const accept = searchHelp('aceite comprovante')
        expect(accept.articles.map((a) => a.slug)).toContain('aceite-online')
        expect(searchHelp('NOTIFICACOES').articles.length + searchHelp('avisos').articles.length).toBeGreaterThan(0)
        expect(searchHelp('opcional').entries.length).toBeGreaterThan(0)
        expect(searchHelp('xyzzy-nao-existe')).toEqual({ articles: [], entries: [] })
    })
})
