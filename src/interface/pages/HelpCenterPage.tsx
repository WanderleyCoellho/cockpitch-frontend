import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, BookOpen, ChevronRight, Search } from 'lucide-react'
import { ARTICLES, findArticle, searchHelp } from '../../shared/help/articles'
import type { HelpEntry } from '../../shared/help/content'

const AREA_ORDER: HelpEntry['area'][] = ['Propostas', 'Pacotes', 'Equipe', 'Conta', 'Planos']

const markdownClass =
    'text-[15px] leading-relaxed text-white/75 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 ' +
    '[&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-2 ' +
    '[&_strong]:text-white [&_a]:text-[#C9A84C] [&_a:hover]:underline [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] ' +
    '[&_blockquote]:border-l-2 [&_blockquote]:border-[#C9A84C] [&_blockquote]:pl-4 [&_blockquote]:text-white/60 ' +
    '[&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_th]:text-left [&_th]:text-white/90 [&_th]:font-semibold [&_th]:border-b [&_th]:border-white/15 [&_th]:py-2 [&_th]:pr-3 ' +
    '[&_td]:border-b [&_td]:border-white/8 [&_td]:py-2 [&_td]:pr-3'

function ArticleView({ slug }: { slug: string }) {
    const article = findArticle(slug)
    if (!article) {
        return (
            <div className="space-y-4">
                <p className="text-white/60">Artigo não encontrado.</p>
                <Link to="/ajuda" className="text-[#C9A84C] text-sm hover:underline">Voltar para a central de ajuda</Link>
            </div>
        )
    }
    const index = ARTICLES.findIndex((a) => a.slug === slug)
    const next = ARTICLES[index + 1]
    return (
        <article className="max-w-3xl">
            <Link to="/ajuda" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Central de ajuda
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-white">{article.title}</h1>
            <p className="mt-2 text-white/50">{article.summary}</p>
            <div className={`mt-6 ${markdownClass}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Links internos navegam sem recarregar a página.
                        a: ({ href = '', children }) =>
                            href.startsWith('/') ? <Link to={href}>{children}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                    }}
                >
                    {article.body}
                </ReactMarkdown>
            </div>
            {next && (
                <Link to={`/ajuda/${next.slug}`} className="mt-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#C9A84C]/40">
                    <span>
                        <span className="block text-[11px] uppercase tracking-widest text-white/35">Próximo</span>
                        <span className="text-white/85">{next.title}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#C9A84C]" />
                </Link>
            )}
        </article>
    )
}

/** Central de ajuda (spec in-app-guidance): artigos por tarefa + glossário com os mesmos textos das dicas "?". */
export default function HelpCenterPage() {
    const { slug } = useParams()
    const [query, setQuery] = useState('')
    const results = useMemo(() => searchHelp(query), [query])

    if (slug) {
        return (
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                <ArticleView slug={slug} />
            </div>
        )
    }

    const byArea = AREA_ORDER.map((area) => [area, results.entries.filter(([, e]) => e.area === area)] as const).filter(([, list]) => list.length > 0)
    const empty = results.articles.length === 0 && results.entries.length === 0

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-light text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#C9A84C]" /> Central de ajuda
                </h1>
                <p className="text-white/40 mt-1 text-sm">Passo a passo de cada tarefa e o significado de cada campo do painel.</p>
            </div>

            <label className="relative block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                    type="search"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar: aceite, PDF, opcional, convite…"
                    aria-label="Buscar na central de ajuda"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/12 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50"
                />
            </label>

            {empty && <p className="text-white/50 text-sm">Nada encontrado para “{query}”. Tente outra palavra.</p>}

            {results.articles.length > 0 && (
                <section>
                    <h2 className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Guias</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {results.articles.map((article) => (
                            <Link key={article.slug} to={`/ajuda/${article.slug}`} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#C9A84C]/40 transition-colors">
                                <p className="text-white font-medium group-hover:text-[#C9A84C]">{article.title}</p>
                                <p className="text-sm text-white/45 mt-1">{article.summary}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {byArea.length > 0 && (
                <section>
                    <h2 className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Campos e recursos</h2>
                    <div className="space-y-6">
                        {byArea.map(([area, entries]) => (
                            <div key={area}>
                                <h3 className="text-sm font-semibold text-white/80 mb-2">{area}</h3>
                                <dl className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.02]">
                                    {entries.map(([key, entry]) => (
                                        <div key={key} className="p-4">
                                            <dt className="text-sm font-medium text-[#C9A84C]">{entry.title}</dt>
                                            <dd className="text-sm text-white/65 mt-1 leading-relaxed">
                                                {entry.body}
                                                {entry.article && (
                                                    <Link to={`/ajuda/${entry.article}`} className="ml-2 text-xs text-white/40 hover:text-[#C9A84C]">Saiba mais →</Link>
                                                )}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
