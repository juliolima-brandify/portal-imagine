'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import './imagine-site.css'
import {
  IMAGINE_ASSETS,
  IMAGINE_SITE_CONFIG,
  type ProjectInfo,
} from '@/lib/imagine-site'
import {
  formatBlogDatePTBR,
  type PublicBlogPost,
  type PublicBlogPostSummary,
} from '@/lib/blog-posts'

interface ImagineBlogViewProps {
  mode: 'list' | 'post' | 'not-found' | 'degraded'
  posts: PublicBlogPostSummary[]
  activePost?: PublicBlogPost | null
  articleContent?: React.ReactNode
  projects: ProjectInfo[]
  currentPage?: number
  totalPages?: number
  totalPosts?: number
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const PillBtnIcon = () => (
  <span className="ic"><ArrowIcon /></span>
)

const Pecas = () => (
  <span className="pecas" aria-hidden="true"><i /><i /><i /><i /></span>
)

export default function ImagineBlogView({
  mode,
  posts,
  activePost,
  articleContent,
  projects,
  currentPage = 1,
  totalPages = 1,
  totalPosts,
}: ImagineBlogViewProps) {
  const { irAtivo, whatsapp } = IMAGINE_SITE_CONFIG
  const [navSolid, setNavSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'accountability'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const okType = typeFilter === 'all' || p.postType === typeFilter
      const okProject =
        projectFilter === 'all' ||
        (projectFilter === 'geral' ? !p.projectId && !p.projectSlug : p.projectSlug === projectFilter)
      return okType && okProject
    })
  }, [posts, typeFilter, projectFilter])

  const linkedProject = useMemo(() => {
    if (!activePost?.projectSlug) return null
    return projects.find((p) => p.id === activePost.projectSlug) || null
  }, [activePost, projects])

  const relatedPosts = useMemo(() => {
    if (!activePost) return []
    return posts.filter((p) => p.slug !== activePost.slug).slice(0, 3)
  }, [posts, activePost])

  const renderPostCard = (p: PublicBlogPostSummary) => (
    <article className={`proj gb ${p.projectColorClass}`} key={p.id}>
      <Link href={`/blog/${p.slug}`} className="proj-f" aria-label={p.title}>
        <img src={p.coverImageUrl} alt={p.coverAlt} loading="lazy" decoding="async" />
        <div className="proj-tag">
          <span className={p.postType === 'accountability' ? 'inc' : ''}>{p.postTypeLabel}</span>
        </div>
      </Link>
      <div className="proj-b">
        <span className="proj-frente">
          <i />
          {p.projectTitle || 'Instituto Imagine'}
        </span>
        <h3>
          <Link href={`/blog/${p.slug}`}>{p.title}</Link>
        </h3>
        <p className="proj-r">{p.excerpt}</p>
        <div className="ii-blog-meta">
          <span>{formatBlogDatePTBR(p.publishedAt)} · {p.readingTimeMinutes} min</span>
          <Link className="lnk" href={`/blog/${p.slug}`}>
            Ler <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  )

  return (
    <div className="ii-root" data-ir={irAtivo ? 'on' : 'off'}>
      <header className={`nav${navSolid ? ' solid' : ''}${menuOpen ? ' aberto' : ''}`}>
        <div className="w nav-in gb">
          <Link href="/" className="nav-logo" aria-label="Instituto Imagine — início" onClick={() => setMenuOpen(false)}>
            <img src={IMAGINE_ASSETS.logoCor} alt="Instituto Imagine" width={764} height={378} />
          </Link>
          <nav className="nav-links" aria-label="Principal">
            <Link href="/#projetos" onClick={() => setMenuOpen(false)}>Projetos</Link>
            <Link href="/#como-doar" onClick={() => setMenuOpen(false)}>Como doar</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)} aria-current={mode === 'list' ? 'page' : undefined}>Notícias</Link>
            <Link href="/#imposto" onClick={() => setMenuOpen(false)}>Imposto de Renda</Link>
            <Link href="/empresas" onClick={() => setMenuOpen(false)}>Empresas</Link>
            <Link href="/#transparencia" onClick={() => setMenuOpen(false)}>Transparência</Link>
            <Link href="/#faq" onClick={() => setMenuOpen(false)}>Dúvidas</Link>
            <Link href="/entrar" onClick={() => setMenuOpen(false)}>Entrar</Link>
          </nav>
          <div className="nav-act">
            <Link className="btn btn-sm" href={linkedProject ? `/projetos/${linkedProject.id}` : '/#projetos'}>
              <span className="bt">Quero doar</span><PillBtnIcon />
            </Link>
            <button type="button" className="nav-menu" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>
        {mode === 'list' && (
          <section className="sec" style={{ paddingTop: 140 }}>
            <div className="w">
              <nav className="migalha" aria-label="Você está em">
                <Link href="/">Início</Link> / Notícias e Prestação de Contas
              </nav>
              <div className="cab">
                <div>
                  <span className="k">Notícias e Prestação de Contas</span>
                  <h1 className="t">Veja onde a sua doação <em>chega na prática.</em></h1>
                </div>
                <p className="lead">
                  Ações realizadas em Uberlândia, resultados das campanhas e prestações de contas ligadas aos projetos do Instituto Imagine.
                </p>
              </div>

              {posts.length > 0 && (
                <div className="ii-blog-controls">
                  <div className="filtros gb" role="group" aria-label="Filtrar por tipo">
                    <button type="button" aria-pressed={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
                      Todos ({totalPosts ?? posts.length})
                    </button>
                    <button type="button" aria-pressed={typeFilter === 'news'} onClick={() => setTypeFilter('news')}>
                      Notícias de Ações
                    </button>
                    <button type="button" aria-pressed={typeFilter === 'accountability'} onClick={() => setTypeFilter('accountability')}>
                      Prestação de Contas
                    </button>
                  </div>

                  <select
                    aria-label="Filtrar por projeto"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="ii-blog-select gb"
                  >
                    <option value="all">Projeto: Todos</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.titulo}
                      </option>
                    ))}
                    <option value="geral">Institucional / Geral</option>
                  </select>
                </div>
              )}

              {posts.length === 0 ? (
                <div className="ii-blog-empty gb">
                  <span className="k">Em breve</span>
                  <h2>As primeiras notícias e prestações de contas estão sendo preparadas.</h2>
                  <p>
                    Enquanto isso, acompanhe o dia a dia das ações no Instagram ou conheça os projetos ativos do Instituto Imagine em Uberlândia.
                  </p>
                  <div className="hero-act" style={{ justifyContent: 'center' }}>
                    <Link className="btn" href="/#projetos">
                      <span className="bt">Conhecer os projetos</span><PillBtnIcon />
                    </Link>
                    <a
                      className="btn btn-ghost"
                      href="https://www.instagram.com/institutoimagineoficial/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="bt">Ver Instagram</span><PillBtnIcon />
                    </a>
                  </div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="ii-blog-empty gb">
                  <h2>Nenhuma publicação neste filtro.</h2>
                  <p>Tente selecionar &ldquo;Todos&rdquo; ou escolher outro projeto acima.</p>
                  <button
                    type="button"
                    className="btn-mais"
                    onClick={() => {
                      setTypeFilter('all')
                      setProjectFilter('all')
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className="projs" style={{ marginTop: 28 }}>
                    {filteredPosts.map(renderPostCard)}
                  </div>
                  {totalPages > 1 && (
                    <nav className="ii-blog-pagination" aria-label="Paginação de notícias">
                      {currentPage > 1 ? (
                        <Link className="btn-mais" href={currentPage === 2 ? '/blog' : `/blog?page=${currentPage - 1}`}>
                          ← Mais recentes
                        </Link>
                      ) : (
                        <span />
                      )}
                      <span className="ii-blog-page-info">
                        Página {currentPage} de {totalPages}
                      </span>
                      {currentPage < totalPages ? (
                        <Link className="btn-mais" href={`/blog?page=${currentPage + 1}`}>
                          Mais antigas →
                        </Link>
                      ) : (
                        <span />
                      )}
                    </nav>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {mode === 'post' && activePost && (
          <>
            <section className="proj-hero escuro ii-blog-post-hero">
              <img src={activePost.coverImageUrl} alt={activePost.coverAlt} />
              <div className="w">
                <nav className="migalha" aria-label="Você está em">
                  <Link href="/">Início</Link> / <Link href="/blog">Notícias</Link>
                  {activePost.projectTitle ? ` / ${activePost.projectTitle}` : ''}
                </nav>
                <span className="k">
                  {activePost.postTypeLabel} · {formatBlogDatePTBR(activePost.publishedAt)} · {activePost.readingTimeMinutes} min de leitura
                </span>
                <h1>{activePost.title}</h1>
                <p className="hero-p">{activePost.excerpt}</p>
              </div>
            </section>

            <section className="sec">
              <div className="w pp">
                <article className="pp-txt">
                  {articleContent}
                  <div style={{ marginTop: 18 }}>
                    <Link className="lnk" href="/blog">
                      ← Voltar para todas as notícias
                    </Link>
                  </div>
                </article>

                <aside className={`pp-doa gb ${activePost.projectColorClass}`}>
                  <span className="campanha-k">
                    {linkedProject ? 'Projeto vinculado' : 'Apoie o Instituto'}
                  </span>
                  <h2 style={{ fontSize: 24 }}>
                    {linkedProject ? linkedProject.titulo : 'Instituto Imagine'}
                  </h2>
                  <p style={{ color: 'var(--tx-2)', fontSize: 16 }}>
                    {linkedProject
                      ? linkedProject.resumo
                      : 'Sua doação mantém aulas de arte, esporte, reforço escolar e ação social em Uberlândia.'}
                  </p>
                  <Link
                    className="btn btn-full"
                    href={linkedProject ? `/projetos/${linkedProject.id}` : '/#projetos'}
                  >
                    <span className="bt">
                      {linkedProject ? 'Apoiar este projeto' : 'Escolher um projeto'}
                    </span>
                    <PillBtnIcon />
                  </Link>
                  <p className="nota">
                    Pix direto na conta do Instituto Imagine (CNPJ 14.351.728/0001-72) com recibo.
                  </p>
                  <a
                    className="lnk"
                    href={`https://wa.me/?text=${encodeURIComponent(`${activePost.title} — Instituto Imagine: ${activePost.shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Compartilhar no WhatsApp <ArrowIcon />
                  </a>
                </aside>
              </div>
            </section>

            {relatedPosts.length > 0 && (
              <section className="sec sec-alt">
                <div className="w">
                  <div className="cab">
                    <div>
                      <span className="k">Continue acompanhando</span>
                      <h2 className="t">Outras atualizações</h2>
                    </div>
                    <Link className="lnk" href="/blog">
                      Ver todas <ArrowIcon />
                    </Link>
                  </div>
                  <div className="projs">{relatedPosts.map(renderPostCard)}</div>
                </div>
              </section>
            )}
          </>
        )}

        {(mode === 'not-found' || mode === 'degraded') && (
          <section className="sec" style={{ paddingTop: 140 }}>
            <div className="w">
              <div className="ii-blog-empty gb" style={{ marginTop: 0 }}>
                <span className="k">
                  {mode === 'degraded' ? 'Instabilidade temporária' : 'Publicação não encontrada'}
                </span>
                <h1>
                  {mode === 'degraded'
                    ? 'Não conseguimos carregar as notícias agora.'
                    : 'Esta notícia não está disponível.'}
                </h1>
                <p>
                  {mode === 'degraded'
                    ? 'Tente atualizar a página em alguns instantes ou conheça os projetos ativos do Instituto Imagine.'
                    : 'O link pode ter sido removido ou pertencido à versão anterior do site. Veja as notícias recentes ou conheça os projetos ativos.'}
                </p>
                <div className="hero-act" style={{ justifyContent: 'center' }}>
                  <Link className="btn" href="/blog">
                    <span className="bt">Ver notícias</span><PillBtnIcon />
                  </Link>
                  <Link className="btn btn-ghost" href="/#projetos">
                    <span className="bt">Ver projetos</span><PillBtnIcon />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="sec" style={{ paddingBottom: 0 }}>
          <div className="w">
            <div className="cta escuro">
              <Pecas />
              <h2>Escolha um projeto. <em style={{ fontStyle: 'normal', color: 'var(--c)' }}>Doe em dois minutos.</em></h2>
              <p>Pix direto na conta do Instituto Imagine, recibo com CNPJ e notícias do projeto que você apoiou.</p>
              <div className="hero-act">
                <Link className="btn" href="/#projetos"><span className="bt">Escolher um projeto</span><PillBtnIcon /></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="rod escuro">
        <div className="w">
          <div className="rod-g">
            <div>
              <img src={IMAGINE_ASSETS.logoBranco} alt="Instituto Imagine" width={772} height={389} loading="lazy" />
              <p>Braço social da Igreja Batista Imagine. Arte, esporte, educação, saúde emocional e ação social em Uberlândia-MG.</p>
            </div>
            <div>
              <h4>Doe</h4>
              <ul>
                <li><Link href="/#projetos">Doar pelo Pix</Link></li>
                <li><Link href="/natal-feliz">Natal Feliz 2026</Link></li>
                <li><Link href="/#imposto">Imposto de Renda</Link></li>
                <li><Link href="/empresas">Para empresas</Link></li>
                <li><Link href="/#form-emb">Embaixadores</Link></li>
              </ul>
            </div>
            <div>
              <h4>Instituto</h4>
              <ul>
                <li><Link href="/#projetos">Projetos</Link></li>
                <li><Link href="/blog">Notícias e Prestação de Contas</Link></li>
                <li><Link href="/#historia">Nossa história</Link></li>
                <li><Link href="/#transparencia">Transparência</Link></li>
                <li><Link href="/#faq">Dúvidas</Link></li>
              </ul>
            </div>
            <div>
              <h4>Contato</h4>
              <ul>
                <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="https://www.instagram.com/institutoimagineoficial/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://www.instagram.com/imagineuberlandia/" target="_blank" rel="noopener noreferrer">Igreja Batista Imagine</a></li>
              </ul>
            </div>
          </div>
          <div className="rod-marca" aria-hidden="true">imagine</div>
          <div className="rod-b">
            <span>© 2026 Instituto Imagine · CNPJ 14.351.728/0001-72</span>
            <span><Link href="/politica-de-privacidade">Política de privacidade</Link> · <Link href="/entrar">Portal</Link></span>
            <span>R. Rui de Castro Santos, 1991 — Grand Ville, Uberlândia-MG, 38406-260</span>
          </div>
        </div>
      </footer>

      <a className="wa" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="Falar com o Instituto no WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.1 1.3 15.2.1 12 .1 5.5.1.2 5.4.2 11.9c0 2.1.5 4.1 1.6 5.9L.1 24l6.3-1.7c1.7.9 3.7 1.4 5.6 1.4 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.4-8.3z" />
        </svg>
      </a>
    </div>
  )
}
