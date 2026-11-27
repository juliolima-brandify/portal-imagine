'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import './imagine-site.css'
import {
  IMAGINE_ASSETS,
  IMAGINE_PROJECTS,
  IMAGINE_SITE_CONFIG,
  HOME_GALLERY,
  NATAL_GALLERY,
  HOME_FAQ_TABS,
  NATAL_FAQ,
  formatBRL,
  formatBRLCompact,
  parseBRNumber,
  simulateIR2026,
  type PageKey,
  type ProjectInfo,
  type IRSimulationResult,
} from '@/lib/imagine-site'
import { formatBlogDatePTBR, type PublicBlogPostSummary } from '@/lib/blog-posts'
import {
  MIN_DONATION_BRL,
  getFrequencyLabelPTBR,
  validateCheckoutAmountBrl,
  type RecurringFrequency,
} from '@/lib/payments'

interface ImagineSitePageProps {
  page: PageKey
  projects?: ProjectInfo[]
  activeProject?: ProjectInfo | null
  blogPosts?: PublicBlogPostSummary[]
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

const IconPix = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l4.5 4.5L12 11 7.5 6.5z" /><path d="M12 13l4.5 4.5L12 22l-4.5-4.5z" />
    <path d="M2 12l4.5-4.5L11 12l-4.5 4.5z" /><path d="M13 12l4.5-4.5L22 12l-4.5 4.5z" />
  </svg>
)
const IconCalendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M9 15l2 2 4-4" />
  </svg>
)
const IconDoc = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" />
  </svg>
)
const IconReceipt = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-3 2-3-2-3 2-3-2-3 2z" /><path d="M8 9h8M8 13h5" />
  </svg>
)
const IconBuilding = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6M9 10h.01M15 10h.01" />
  </svg>
)
const IconHeart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)
const IconGift = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" />
  </svg>
)

export default function ImagineSitePage({
  page,
  projects,
  activeProject,
  blogPosts,
}: ImagineSitePageProps) {
  const { irAtivo, whatsapp, prazoIR, arrecadado, meta } = IMAGINE_SITE_CONFIG
  const siteProjects = projects ?? IMAGINE_PROJECTS
  const anchor = (id: string) => (page === 'home' ? `#${id}` : `/#${id}`)

  const [navSolid, setNavSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [causaFiltro, setCausaFiltro] = useState('todos')
  const [faqTab, setFaqTab] = useState('faq-0')
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({})
  const [toastMsg, setToastMsg] = useState('')
  const [indicador, setIndicador] = useState('')

  // Modal de doação unificado via Asaas Checkout (Pix e Cartão) + contingência WhatsApp
  const [modalOpen, setModalOpen] = useState(false)
  const [doarProj, setDoarProj] = useState('geral')
  const [doarValor, setDoarValor] = useState(50)
  const [doarOutro, setDoarOutro] = useState('')
  const [doarNome, setDoarNome] = useState('')
  const [doarMensagem, setDoarMensagem] = useState('')
  const [doarAnonima, setDoarAnonima] = useState(false)
  const [doarMensal, setDoarMensal] = useState(false)
  const [doarFrequencia, setDoarFrequencia] = useState<RecurringFrequency>('monthly')
  const [doarLoading, setDoarLoading] = useState(false)
  const [doarErro, setDoarErro] = useState('')
  const doarLockRef = useRef(false)
  const doarLoadingRef = useRef(false)
  doarLoadingRef.current = doarLoading
  const galRef = useRef<HTMLDivElement | null>(null)

  // Simulador IR
  const [simSal, setSimSal] = useState('')
  const [simAlu, setSimAlu] = useState('')
  const [simBon, setSimBon] = useState('')
  const [simDep, setSimDep] = useState('0')
  const [simEdu, setSimEdu] = useState('')
  const [simSau, setSimSau] = useState('')
  const [simPgbl, setSimPgbl] = useState('')
  const [simOut, setSimOut] = useState('')
  const [simRes, setSimRes] = useState<IRSimulationResult | null>(null)

  // Embaixador
  const [embNome, setEmbNome] = useState('')
  const [embLink, setEmbLink] = useState('')

  // Contato
  const [cNome, setCNome] = useState('')
  const [cAss, setCAss] = useState('Quero fazer uma doação')
  const [cMsg, setCMsg] = useState('')

  const toastTimer = useRef<number | null>(null)
  const showToast = (msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2200)
  }

  const copyText = (txt: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => showToast('Copiado')).catch(() => showToast('Copiado'))
    } else {
      showToast('Copiado')
    }
  }

  const openWhats = (msg: string) => {
    if (typeof window === 'undefined') return
    const full = indicador ? `${msg}\n\n(Indicação de: ${indicador})` : msg
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(full)}`, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    const sanitizeIndicador = (raw: string | null) =>
      (raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60)

    try {
      const p = sanitizeIndicador(new URLSearchParams(window.location.search).get('indicador'))
      if (p) {
        window.localStorage.setItem('ii-indicador', p)
        setIndicador(p)
      } else {
        setIndicador(sanitizeIndicador(window.localStorage.getItem('ii-indicador')))
      }
    } catch {}

    const onScroll = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!doarLoadingRef.current && !doarLockRef.current) {
          setModalOpen(false)
        }
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)

    const onPageShow = () => {
      doarLockRef.current = false
      setDoarLoading(false)
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pageshow', onPageShow)
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [modalOpen])

  useEffect(() => {
    if (page !== 'home') return
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => setHeroIdx((i) => (i + 1) % 3), 6000)
    return () => window.clearInterval(id)
  }, [page])

  const openDoar = (projId?: string, mensal = false) => {
    setDoarProj(projId || 'geral')
    setDoarValor(50)
    setDoarOutro('')
    setDoarMensagem('')
    setDoarAnonima(false)
    setDoarMensal(mensal)
    setDoarFrequencia('monthly')
    setDoarErro('')
    setDoarLoading(false)
    doarLockRef.current = false
    setModalOpen(true)
  }

  const selectedProjectInfo = useMemo(
    () =>
      doarProj === 'geral' || doarProj === 'natal'
        ? undefined
        : siteProjects.find((p) => p.id === doarProj),
    [siteProjects, doarProj]
  )

  const projLabelMap = useMemo(() => {
    const map: Record<string, string> = {
      geral: 'Onde for mais necessário',
      natal: 'Natal Feliz 2026',
    }
    for (const p of siteProjects) {
      if (p.id === 'geral' || p.id === 'natal') continue
      map[p.id] = p.titulo
    }
    return map
  }, [siteProjects])

  const projectHrefOrHash = (slug: string) =>
    siteProjects.some((p) => p.id === slug) ? `/projetos/${slug}` : '#projetos'

  const causasDisponiveis = useMemo(() => {
    const unique = new Set<string>()
    for (const p of siteProjects) {
      if (p.causa) unique.add(p.causa)
    }
    return ['todos', ...Array.from(unique)]
  }, [siteProjects])

  const handleDoarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (doarLockRef.current || doarLoading) return
    setDoarErro('')

    const validation = validateCheckoutAmountBrl(doarValor)
    if (!validation.ok) {
      setDoarErro(validation.error)
      return
    }

    doarLockRef.current = true
    setDoarLoading(true)

    try {
      const targetProjectId = selectedProjectInfo?.portalProjectId || doarProj
      const targetTitle = projLabelMap[doarProj] || doarProj
      const noteParts = [doarMensagem.trim()]
      if (indicador) {
        noteParts.push(`(Indicação: ${indicador})`)
      }
      const combinedMessage = noteParts.filter(Boolean).join(' ').slice(0, 500)

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: validation.valueBrl,
          projectId: targetProjectId,
          projectTitle: targetTitle,
          source: 'site',
          options: {
            isRecurring: doarMensal,
            frequency: doarFrequencia,
            anonymous: doarAnonima,
            message: combinedMessage,
            donorName: !doarAnonima && doarNome.trim() ? doarNome.trim() : undefined,
          },
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (res.ok && json.success && typeof json.url === 'string' && json.url) {
        window.location.href = json.url
        return
      }

      setDoarErro(
        json.error ||
          'Não foi possível abrir a página segura de pagamento agora. Tente novamente ou chame nossa equipe no WhatsApp.'
      )
      doarLockRef.current = false
      setDoarLoading(false)
    } catch {
      setDoarErro(
        'Falha de conexão ao iniciar o pagamento. Verifique sua internet ou fale conosco pelo WhatsApp.'
      )
      doarLockRef.current = false
      setDoarLoading(false)
    }
  }

  const handleSimSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = simulateIR2026({
      sal: parseBRNumber(simSal),
      alu: parseBRNumber(simAlu),
      bon: parseBRNumber(simBon),
      dep: parseInt(simDep, 10) || 0,
      edu: parseBRNumber(simEdu),
      sau: parseBRNumber(simSau),
      pgbl: parseBRNumber(simPgbl),
      out: parseBRNumber(simOut),
    })
    if (!res) {
      showToast('Informe seus rendimentos')
      return
    }
    setSimRes(res)
  }

  const handleEmbSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = embNome.trim()
    if (!n) return
    const slug = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://imagineinstituto.com/'
    setEmbLink(`${origin}?indicador=${slug}`)
  }

  const handleContSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    openWhats(`Olá, Instituto Imagine!\nNome: ${cNome}\nAssunto: ${cAss}\n\n${cMsg}`)
  }

  const campPct = meta && meta > 0 ? Math.min(100, Math.round(((arrecadado || 0) / meta) * 100)) : 0
  const toggleFaq = (key: string) => setOpenFaqs((prev) => ({ ...prev, [key]: !prev[key] }))

  const renderProjectCard = (p: ProjectInfo) => (
    <article className={`proj gb ${p.corClass}`} key={p.id}>
      <div className="proj-f">
        <img src={p.cardImg} alt={p.alt} loading="lazy" decoding="async" />
        <div className="proj-tag">
          <span>{p.causa}</span>
          {p.incentivoTag && <span className="inc">{p.incentivoTag}</span>}
        </div>
      </div>
      <div className="proj-b">
        <span className="proj-frente"><i />{p.frente}</span>
        <h3>{p.titulo}</h3>
        <p className="proj-r">{p.resumo}</p>
        <div className="proj-n">
          <div>Beneficiários<b>{p.beneficiarios || <span className="pend">a definir</span>}</b></div>
          <div>Meta 2026<b>{p.metaTexto || <span className="pend">a definir</span>}</b></div>
        </div>
        <div className="proj-a">
          <button type="button" className="btn btn-sm" onClick={() => openDoar(p.id)}>
            <span className="bt">Quero doar</span><PillBtnIcon />
          </button>
          <Link className="btn-mais" href={`/projetos/${p.id}`}>Saiba mais</Link>
        </div>
      </div>
    </article>
  )

  const renderBlogCard = (post: PublicBlogPostSummary) => (
    <article className={`proj gb ${post.projectColorClass}`} key={post.id}>
      <Link href={`/blog/${post.slug}`} className="proj-f" aria-label={post.title}>
        <img src={post.coverImageUrl} alt={post.coverAlt} loading="lazy" decoding="async" />
        <div className="proj-tag">
          <span className={post.postType === 'accountability' ? 'inc' : ''}>{post.postTypeLabel}</span>
        </div>
      </Link>
      <div className="proj-b">
        <span className="proj-frente"><i />{post.projectTitle || 'Instituto Imagine'}</span>
        <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
        <p className="proj-r">{post.excerpt}</p>
        <div className="ii-blog-meta">
          <span>{formatBlogDatePTBR(post.publishedAt)} · {post.readingTimeMinutes} min</span>
          <Link className="lnk" href={`/blog/${post.slug}`}>Ler <ArrowIcon /></Link>
        </div>
      </div>
    </article>
  )

  const currentProject = activeProject ?? siteProjects.find((p) => p.id === page)

  return (
    <div className="ii-root" data-ir={irAtivo ? 'on' : 'off'}>
      <header className={`nav${navSolid ? ' solid' : ''}${menuOpen ? ' aberto' : ''}`}>
        <div className="w nav-in gb">
          <Link href={anchor('inicio')} className="nav-logo" aria-label="Instituto Imagine — início" onClick={() => setMenuOpen(false)}>
            <img src={IMAGINE_ASSETS.logoCor} alt="Instituto Imagine" width={764} height={378} />
          </Link>
          <nav className="nav-links" aria-label="Principal">
            <Link href={anchor('projetos')} onClick={() => setMenuOpen(false)}>Projetos</Link>
            <Link href={anchor('como-doar')} onClick={() => setMenuOpen(false)}>Como doar</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>Notícias</Link>
            <Link href={anchor('imposto')} onClick={() => setMenuOpen(false)}>Imposto de Renda</Link>
            <Link href="/empresas" aria-current={page === 'empresas' ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Empresas</Link>
            <Link href={anchor('transparencia')} onClick={() => setMenuOpen(false)}>Transparência</Link>
            <Link href={anchor('faq')} onClick={() => setMenuOpen(false)}>Dúvidas</Link>
            <Link href="/entrar" onClick={() => setMenuOpen(false)}>Entrar</Link>
          </nav>
          <div className="nav-act">
            <button type="button" className="btn btn-sm" onClick={() => openDoar('')}>
              <span className="bt">Quero doar</span><PillBtnIcon />
            </button>
            <button type="button" className="nav-menu" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="hero escuro" id="inicio">
              <div className="hero-fotos" aria-hidden="true">
                <img className={heroIdx === 0 ? 'on' : ''} src={IMAGINE_ASSETS.heroiMostra02} alt="" style={{ objectPosition: '60% 55%' }} />
                <img className={heroIdx === 1 ? 'on' : ''} src={IMAGINE_ASSETS.heroiMostra17} alt="" style={{ objectPosition: '75% 40%' }} />
                <img className={heroIdx === 2 ? 'on' : ''} src={IMAGINE_ASSETS.heroiMostra18} alt="" style={{ objectPosition: '60% 75%' }} />
              </div>
              <div className="w hero-g">
                <div>
                  <span className="k">Instituto Imagine · organização social em Uberlândia-MG</span>
                  <h1>Projetos sociais em Uberlândia: <em>você escolhe</em> para onde vai a sua doação.</h1>
                  <p className="hero-p">Para quem quer ajudar crianças e famílias da cidade e quer ter certeza de onde o dinheiro chega. Seis projetos que já funcionam — arte, esporte, contraturno escolar e ação social. Em vez de doar sem saber o destino, você escolhe o projeto, paga com Pix ou Cartão na página segura do Asaas e recebe o recibo.</p>
                  <div className="hero-act">
                    <a className="btn" href="#projetos"><span className="bt">Escolher um projeto</span><PillBtnIcon /></a>
                    <button type="button" className="btn btn-ghost" onClick={() => openDoar('')}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button>
                  </div>
                  <p className="hero-prova">
                    <span>CNPJ 14.351.728/0001-72</span>
                    <span>Desde 2011</span>
                    <span>Braço social da Igreja Batista Imagine</span>
                  </p>
                </div>
                <aside>
                  <div className="campanha gb">
                    <div className="campanha-k">Campanha 2026 · arrecadado</div>
                    <div className="campanha-v">
                      {arrecadado !== null ? (
                        <><small>R$</small>{formatBRLCompact(arrecadado).replace('R$ ', '')}</>
                      ) : (
                        <span className="pend">valor a definir</span>
                      )}
                    </div>
                    <div className="barra" role="presentation"><i style={{ width: `${campPct}%` }} /></div>
                    <div className="campanha-m">
                      <span>{meta ? `Meta ${formatBRLCompact(meta)}` : 'Meta a definir'}</span>
                      <span>{meta ? `${campPct}%` : ''}</span>
                    </div>
                    <button type="button" className="btn btn-full" onClick={() => openDoar('')}>
                      <span className="bt">Doar agora</span><PillBtnIcon />
                    </button>
                  </div>
                  <a className="ir-faixa gb" href="#imposto">
                    <span className="selo selo-breve so-off">Em breve</span>
                    <span className="selo so-on">Aberto</span>
                    <span>Destine até <b>6% do seu Imposto de Renda</b> para os projetos do Instituto.</span>
                  </a>
                </aside>
              </div>
            </section>

            <section className="nums-sec" aria-label="Resultados">
              <div className="w nums">
                <div className="num"><b>10.000<span>+</span></b><p>vidas impactadas</p></div>
                <div className="num"><b>120<span>+</span></b><p>ações realizadas</p></div>
                <div className="num"><b>8</b><p>cidades alcançadas</p></div>
                <div className="num"><b>2011</b><p>ano de fundação</p></div>
              </div>
            </section>

            <section className="camp-sec">
              <div className="w">
                <Link className="camp gb" href="/natal-feliz">
                  <img src={IMAGINE_ASSETS.hero1} alt="Voluntária do Instituto entregando presente de Natal a crianças" loading="lazy" />
                  <div>
                    <span className="k">Campanha do momento</span>
                    <h2>Natal Feliz 2026</h2>
                    <p>Um brinquedo novo para cada criança. Doe o brinquedo ou o valor dele pelo Pix.</p>
                    <span className="lnk">Quero participar <ArrowIcon /></span>
                  </div>
                </Link>
              </div>
            </section>

            <section className="sec" id="problema">
              <div className="w">
                <div className="cab">
                  <div><span className="k">O problema</span><h2 className="t">Em Uberlândia, tem criança <em>sem lugar seguro</em> depois da escola.</h2></div>
                  <p className="lead">E tem gente querendo ajudar que não sabe se a doação chega. As duas coisas se resolvem no mesmo lugar.</p>
                </div>
                <div className="dores">
                  <article className="dor gb cor-verde"><span className="proj-frente"><i />Depois da aula</span><p>Muita criança fica sozinha em casa ou na rua, sem lugar seguro e sem ninguém acompanhando.</p><Link className="lnk" href={projectHrefOrHash('amarelinha')}>Projeto Amarelinha <ArrowIcon /></Link></article>
                  <article className="dor gb cor-laranja"><span className="proj-frente"><i />Na rua</span><p>Tem gente em situação de rua sem ter o que comer e família que chega ao fim do mês sem comida em casa.</p><Link className="lnk" href={projectHrefOrHash('social')}>Ação Social <ArrowIcon /></Link></article>
                  <article className="dor gb cor-magenta"><span className="proj-frente"><i />Em casa</span><p>A família atípica vive uma rotina pesada, muitas vezes sem rede de apoio e sem quem ouça.</p><Link className="lnk" href={projectHrefOrHash('familias')}>Famílias Atípicas <ArrowIcon /></Link></article>
                  <article className="dor gb cor-azul"><span className="proj-frente"><i />No bairro</span><p>Criança que nunca fez uma aula de dança, nunca subiu num palco nem pisou num tatame.</p><Link className="lnk" href={projectHrefOrHash('artes')}>Artes e Esporte <ArrowIcon /></Link></article>
                </div>
                <div className="dor-doador gb">
                  <div><b>Quem quer ajudar também tem um problema:</b> não saber para onde vai o dinheiro.</div>
                  <p>Aqui você escolhe o projeto, paga com Pix ou Cartão na página segura do Asaas (CNPJ 14.351.728/0001-72) e recebe o recibo.</p>
                  <a className="lnk" href="#como-doar">Ver como funciona <ArrowIcon /></a>
                </div>
              </div>
            </section>

            <section className="sec sec-alt" id="como-doar">
              <div className="w">
                <div className="cab">
                  <div><span className="k">Passo a passo</span><h2 className="t">Doar leva <em>dois minutos.</em></h2></div>
                  <button type="button" className="btn" onClick={() => openDoar('')}><span className="bt">Começar agora</span><PillBtnIcon /></button>
                </div>
                <div className="passos">
                  <div className="passo gb"><h3>Escolha o projeto</h3><p>Arte, esporte, educação, saúde emocional ou ação social. Ou deixe o Instituto direcionar para onde for mais necessário.</p></div>
                  <div className="passo gb"><h3>Defina o valor</h3><p>Qualquer valor ajuda. Se preferir, marque a doação mensal.</p></div>
                  <div className="passo gb"><h3>Pague com Pix ou Cartão</h3><p>Na página segura do Asaas, com QR Code Pix ou cartão de crédito. O valor vai para a conta do Instituto Imagine (CNPJ 14.351.728/0001-72).</p></div>
                  <div className="passo gb"><h3>Receba o recibo</h3><p>O recibo e o acesso ao Portal do Doador chegam automaticamente no seu e-mail.</p></div>
                </div>
              </div>
            </section>

            <section className="sec" id="projetos">
              <div className="w">
                <div className="cab">
                  <div><span className="k">Projetos</span><h2 className="t">Conheça os projetos <em>que você apoia.</em></h2></div>
                  <p className="lead">Seis frentes que já funcionam em Uberlândia. Escolha a que mais fala com você.</p>
                </div>
                <div className="filtros gb" role="group" aria-label="Filtrar por causa">
                  {causasDisponiveis.map((f) => (
                    <button key={f} type="button" aria-pressed={causaFiltro === f} onClick={() => setCausaFiltro(f)}>
                      {f === 'todos' ? 'Todos' : f}
                    </button>
                  ))}
                </div>
                <div className="projs" style={{ marginTop: 28 }}>
                  {(() => {
                    const visible = siteProjects.filter((p) => causaFiltro === 'todos' || p.causa === causaFiltro)
                    if (visible.length === 0) {
                      return (
                        <p className="lead" style={{ gridColumn: '1 / -1' }}>
                          Nenhum projeto encontrado para esta causa no momento.
                        </p>
                      )
                    }
                    return visible.map(renderProjectCard)
                  })()}
                </div>
              </div>
            </section>

            <section className="sec sec-alt" id="imposto">
              <div className="w ir">
                <div>
                  <span className="k">Doe com seu Imposto de Renda</span>
                  <h2 className="t">Parte do imposto que você já paga pode <em>ficar em Uberlândia.</em></h2>
                  <p className="lead">Quem declara pelo modelo completo pode destinar até 6% do imposto devido a projetos aprovados em leis de incentivo. Você não gasta nada a mais: o valor volta na restituição ou diminui o imposto a pagar.</p>
                  <ul className="ir-lista">
                    <li>Vale para quem faz a declaração completa e tem imposto devido.</li>
                    <li>A doação feita em 2026 entra na declaração de 2027.</li>
                    <li>Você recebe o recibo e as instruções para declarar.</li>
                    <li>Pode dividir o valor entre projetos ou concentrar em um só.</li>
                  </ul>
                  <div className="aviso so-off"><b>Em preparação.</b> O Instituto Imagine está preparando seus projetos de arte e esporte para as leis de incentivo. Simule o seu potencial e deixe seu contato: avisamos assim que a destinação abrir. Até lá, a doação pelo Pix ajuda do mesmo jeito, mas não é abatida do IR.</div>
                  <div className="aviso aviso-ok so-on"><b>Destinação aberta até {prazoIR}.</b> Escolha um projeto incentivado e faça a sua destinação.</div>
                </div>
                <form className="sim gb" id="form-sim" onSubmit={handleSimSubmit} noValidate>
                  <h3>Simule o seu potencial</h3>
                  <p>Estimativa do ano-calendário 2026. Nada do que você digita é guardado.</p>
                  <div className="sim-g">
                    <span className="sim-sub">Rendimentos</span>
                    <div className="campo"><label htmlFor="s-sal">Salário bruto mensal (R$)</label><input id="s-sal" inputMode="decimal" placeholder="0,00" value={simSal} onChange={(e) => setSimSal(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-alu">Aluguéis recebidos por mês (R$)</label><input id="s-alu" inputMode="decimal" placeholder="0,00" value={simAlu} onChange={(e) => setSimAlu(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-bon">Bônus anual, exceto PLR (R$)</label><input id="s-bon" inputMode="decimal" placeholder="0,00" value={simBon} onChange={(e) => setSimBon(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-dep">Dependentes</label><select id="s-dep" value={simDep} onChange={(e) => setSimDep(e.target.value)}>{[0,1,2,3,4,5,6].map((n) => <option key={n} value={String(n)}>{n}</option>)}</select></div>
                    <span className="sim-sub">Despesas dedutíveis por mês</span>
                    <div className="campo"><label htmlFor="s-edu">Educação (R$)</label><input id="s-edu" inputMode="decimal" placeholder="0,00" value={simEdu} onChange={(e) => setSimEdu(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-sau">Saúde não reembolsada (R$)</label><input id="s-sau" inputMode="decimal" placeholder="0,00" value={simSau} onChange={(e) => setSimSau(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-pgbl">Previdência PGBL (R$)</label><input id="s-pgbl" inputMode="decimal" placeholder="0,00" value={simPgbl} onChange={(e) => setSimPgbl(e.target.value)} /></div>
                    <div className="campo"><label htmlFor="s-out">Outras deduções (R$)</label><input id="s-out" inputMode="decimal" placeholder="0,00" value={simOut} onChange={(e) => setSimOut(e.target.value)} /></div>
                  </div>
                  <button className="btn btn-full" type="submit"><span className="bt">Calcular meu potencial</span><PillBtnIcon /></button>
                  {simRes && (
                    <div className="sim-res" aria-live="polite">
                      <span className="campanha-k">Você pode destinar cerca de</span>
                      <div className="big">{formatBRL(simRes.pot)}</div>
                      <p>{simRes.obs}</p>
                      <dl>
                        <dt>Rendimentos no ano</dt><dd>{formatBRL(simRes.rend)}</dd>
                        <dt>Deduções (com INSS estimado)</dt><dd>{formatBRL(simRes.ded)}</dd>
                        <dt>Imposto devido estimado</dt><dd>{formatBRL(simRes.imp)}</dd>
                      </dl>
                      <span className="so-off">
                        <button type="button" className="btn btn-full" onClick={() => openWhats(`Olá! Quero ser avisado(a) quando o Instituto Imagine abrir a destinação do Imposto de Renda.\nMeu potencial estimado: ${formatBRL(simRes.pot)}`)}>
                          <span className="bt">Quero ser avisado(a)</span><PillBtnIcon />
                        </button>
                      </span>
                      <span className="so-on">
                        <a className="btn btn-full" href="#projetos"><span className="bt">Destinar agora</span><PillBtnIcon /></a>
                      </span>
                    </div>
                  )}
                  <p className="nota">Estimativa pela tabela progressiva e pela redução da Lei 15.270/2025, sem 13º e sem rendimentos isentos. Não é orientação tributária: confirme com o seu contador.</p>
                </form>
              </div>
            </section>

            <section className="sec" id="transparencia">
              <div className="w">
                <div className="cab">
                  <div><span className="k">Transparência</span><h2 className="t">Você sabe para onde <em>vai cada real.</em></h2></div>
                  <p className="lead">Cada doação fica registrada no projeto escolhido. Os dados oficiais do Instituto estão aqui, abertos.</p>
                </div>
                <div className="transp">
                  <div className="doc gb"><span>CNPJ</span><b>14.351.728/0001-72</b><p>Associação sem fins lucrativos, ativa.</p></div>
                  <div className="doc gb"><span>Desde</span><b>08/09/2011</b><p>Braço social da Igreja Batista Imagine, em Uberlândia-MG.</p></div>
                  <div className="doc gb"><span>Nota Fiscal Mineira</span><b>Entidade cadastrada</b><p>Cadastro na SEF-MG desde 18/09/2025.</p></div>
                  <div className="doc gb"><span>Prestação de contas</span><b>Relatório 2026</b><p><span className="pend">a publicar</span></p></div>
                </div>
              </div>
            </section>

            <section className="sec sec-alt" id="ajudar">
              <div className="w">
                <div className="cab">
                  <div><span className="k">Outras formas de ajudar</span><h2 className="t">Não dá para doar agora? <em>Tem outro jeito.</em></h2></div>
                  <p className="lead">Doação mensal, Imposto de Renda, Nota Fiscal Mineira, empresa, tempo ou a sua rede de contatos.</p>
                </div>
                <div className="formas">
                  <article className="forma gb"><span className="ico"><IconPix /></span><h3>Doação com Pix ou Cartão</h3><p>Escolha o projeto e o valor. Você paga na página segura do Asaas, com Pix (QR Code) ou cartão de crédito.</p><button type="button" className="btn btn-sm" onClick={() => openDoar('')}><span className="bt">Doar agora</span><PillBtnIcon /></button></article>
                  <article className="forma gb"><span className="ico"><IconCalendar /></span><h3>Doação mensal</h3><p>Quem doa todo mês mantém as aulas e os atendimentos funcionando o ano inteiro.</p><button type="button" className="btn btn-sm btn-ghost" onClick={() => openDoar('', true)}><span className="bt">Quero ser mensal</span><PillBtnIcon /></button></article>
                  <article className="forma gb"><span className="ico"><IconDoc /></span><span className="selo selo-breve so-off">Em breve</span><h3>Imposto de Renda</h3><p>Destine até 6% do imposto devido aos projetos incentivados e receba o valor de volta na declaração.</p><a className="lnk" href="#imposto">Simular meu potencial <ArrowIcon /></a></article>
                  <article className="forma gb"><span className="ico"><IconReceipt /></span><h3>Nota Fiscal Mineira</h3><p>O Instituto está cadastrado como entidade social no programa Nota Fiscal Mineira, da Secretaria de Fazenda de MG.</p><a className="lnk" href="https://notafiscalmineira.fazenda.mg.gov.br/entidades-sociais/detalhe?cnpj=14351728000172" target="_blank" rel="noopener">Ver cadastro <ArrowIcon /></a></article>
                  <article className="forma gb"><span className="ico"><IconBuilding /></span><h3>Empresas parceiras</h3><p>Patrocínio de projeto, doação de produtos e serviços ou uma campanha de IR com os seus colaboradores.</p><a className="lnk" href="#empresas">Quero ser parceiro <ArrowIcon /></a></article>
                  <article className="forma gb"><span className="ico"><IconHeart /></span><h3>Voluntariado e embaixadores</h3><p>Doe tempo e talento nas ações, ou divulgue o Instituto com o seu link de embaixador.</p><a className="lnk" href="#embaixador">Quero participar <ArrowIcon /></a></article>
                </div>
              </div>
            </section>

            <section className="sec" id="empresas">
              <div className="w">
                <div className="cab"><div><span className="k">Empresas e embaixadores</span><h2 className="t">Junte a sua empresa <em>e a sua rede.</em></h2></div></div>
                <div className="duo">
                  <article className="emp gb">
                    <div className="emp-f"><img src={IMAGINE_ASSETS.voluntario} alt="Voluntários e comunidade reunidos em ação de rua do Instituto" loading="lazy" /></div>
                    <div className="emp-b">
                      <h3>Empresa parceira</h3>
                      <ul>
                        <li>Patrocínio de um projeto, com relatório de impacto</li>
                        <li>Campanha interna para colaboradores destinarem parte do IR</li>
                        <li>Doação de produtos e serviços</li>
                        <li>Voluntariado corporativo nas ações</li>
                      </ul>
                      <Link className="btn btn-sm" href="/empresas"><span className="bt">Ver formas de parceria</span><PillBtnIcon /></Link>
                    </div>
                  </article>
                  <form className="emb gb" id="form-emb" onSubmit={handleEmbSubmit} noValidate>
                    <span className="k" id="embaixador">Seja embaixador(a)</span>
                    <h3>Seu link, sua corrente do bem.</h3>
                    <p>Gere um link pessoal e envie para amigos, família e colegas. Cada doação feita pelo seu link chega para o Instituto com a sua indicação.</p>
                    <div className="campo"><label htmlFor="e-nome">Seu nome</label><input id="e-nome" placeholder="Como você quer aparecer" value={embNome} onChange={(e) => setEmbNome(e.target.value)} required /></div>
                    <button className="btn btn-full" type="submit"><span className="bt">Gerar meu link</span><PillBtnIcon /></button>
                    {embLink && (
                      <div className="emb-link">
                        <code>{embLink}</code>
                        <div>
                          <button type="button" className="btn-mais" onClick={() => copyText(embLink)}>Copiar link</button>
                          <button type="button" className="btn-mais" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça o Instituto Imagine e apoie um dos projetos: arte, esporte, educação e cuidado social em Uberlândia. ${embLink}`)}`, '_blank', 'noopener')}>Enviar no WhatsApp</button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </section>

            <section className="sec sec-alt" id="historia">
              <div className="w hist">
                <div className="hist-f">
                  <img src={IMAGINE_ASSETS.fundador} alt="Voluntária fantasiada de palhaça com chapéu do Instituto Imagine em ação com crianças" loading="lazy" />
                  <div className="gb"><b>Desde 2011</b><span>cuidando de famílias, crianças e de quem está na rua em Uberlândia.</span></div>
                </div>
                <div>
                  <span className="k">Nossa história</span>
                  <h2 className="t">Não nasceu no papel. <em>Nasceu nas ruas.</em></h2>
                  <p>O Instituto Imagine é o braço social da Igreja Batista Imagine. Começou com o Natal Feliz, arrecadando brinquedos novos para crianças em vulnerabilidade, e cresceu com o Ministério Bom Samaritano, as aulas de arte, o esporte e o acolhimento de famílias atípicas.</p>
                  <blockquote className="cit">“A fé verdadeira se prova na prática: é uma marmita entregue a quem tem fome, é um espaço de arte que desperta talentos, é um curso que abre portas para o futuro.”</blockquote>
                  <p style={{ fontSize: 14 }}>Fundador do Instituto Imagine <span className="pend">nome a confirmar</span></p>
                  <div className="valores"><span>Excelência</span><span>Serviço</span><span>Transformação</span></div>
                </div>
              </div>
            </section>

            <section className="sec" id="fotos" style={{ overflow: 'hidden' }}>
              <div className="w cab">
                <div><span className="k">Galeria</span><h2 className="t">O que a sua doação <em>já constrói.</em></h2></div>
                <div className="gal-nav">
                  <button type="button" aria-label="Fotos anteriores" onClick={() => galRef.current?.scrollBy({ left: -(galRef.current.clientWidth * 0.6), behavior: 'smooth' })}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <button type="button" aria-label="Próximas fotos" onClick={() => galRef.current?.scrollBy({ left: galRef.current.clientWidth * 0.6, behavior: 'smooth' })}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              </div>
              <div className="gal" ref={galRef}>
                {HOME_GALLERY.map((g, i) => <figure key={i}><img src={g.src} alt={g.alt} loading="lazy" /></figure>)}
              </div>
              <div className="w" style={{ marginTop: 26 }}>
                <a className="lnk" href="https://www.instagram.com/institutoimagineoficial/" target="_blank" rel="noopener">Acompanhe no Instagram @institutoimagineoficial <ArrowIcon /></a>
              </div>
            </section>

            {blogPosts && blogPosts.length > 0 && (
              <section className="sec" id="noticias" style={{ paddingTop: 0 }}>
                <div className="w">
                  <div className="cab">
                    <div>
                      <span className="k">Notícias e Prestação de Contas</span>
                      <h2 className="t">Acompanhe os projetos <em>na prática.</em></h2>
                    </div>
                    <Link className="lnk" href="/blog">Ver todas as notícias <ArrowIcon /></Link>
                  </div>
                  <div className="projs">{blogPosts.slice(0, 3).map(renderBlogCard)}</div>
                </div>
              </section>
            )}

            <section className="sec sec-alt" id="faq">
              <div className="w faq">
                <div>
                  <span className="k">Perguntas frequentes</span>
                  <h2 className="t">Tire suas <em>dúvidas.</em></h2>
                  <p className="lead">Não encontrou? Fale com a gente no WhatsApp.</p>
                  <div className="faq-abas" role="tablist">
                    {HOME_FAQ_TABS.map((t) => (
                      <button key={t.id} type="button" role="tab" aria-selected={faqTab === t.id} onClick={() => setFaqTab(t.id)}>{t.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  {HOME_FAQ_TABS.filter((t) => t.id === faqTab).map((tab) => (
                    <div key={tab.id} role="tabpanel">
                      {tab.items.map((item, idx) => {
                        const k = `${tab.id}-${idx}`
                        const isOpen = !!openFaqs[k]
                        return (
                          <div key={k} className={`faq-i${isOpen ? ' on' : ''}`}>
                            <h3 style={{ fontSize: 'inherit' }}>
                              <button type="button" aria-expanded={isOpen} onClick={() => toggleFaq(k)}>{item.q}<i aria-hidden="true" /></button>
                            </h3>
                            <div className="faq-r"><div><p>{item.a}</p></div></div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="sec" id="contato">
              <div className="w cont">
                <div>
                  <span className="k">Contato</span>
                  <h2 className="t">Vamos <em>conversar?</em></h2>
                  <p className="lead">Dúvidas, voluntariado, parcerias ou doações de itens: a equipe responde pelo WhatsApp.</p>
                  <div className="cont-info">
                    <a className="gb" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                      <div><b>(34) 99694-5150 <span className="pend">confirmar</span></b><span>WhatsApp do Instituto</span></div>
                    </a>
                    <a className="gb" href="https://www.instagram.com/institutoimagineoficial/" target="_blank" rel="noopener">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
                      <div><b>@institutoimagineoficial</b><span>Instagram</span></div>
                    </a>
                    <div className="gb">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      <div><b>Uberlândia-MG</b><span>R. Rui de Castro Santos, 1991 — Grand Ville, Uberlândia-MG, 38406-260</span></div>
                    </div>
                  </div>
                </div>
                <form className="form gb" id="form-cont" onSubmit={handleContSubmit}>
                  <div className="duas">
                    <div className="campo"><label htmlFor="c-nome">Nome</label><input id="c-nome" value={cNome} onChange={(e) => setCNome(e.target.value)} required /></div>
                    <div className="campo"><label htmlFor="c-ass">Assunto</label><select id="c-ass" value={cAss} onChange={(e) => setCAss(e.target.value)}><option>Quero fazer uma doação</option><option>Quero ser voluntário(a)</option><option>Parcerias e empresas</option><option>Imposto de Renda</option><option>Outros assuntos</option></select></div>
                  </div>
                  <div className="campo"><label htmlFor="c-msg">Mensagem</label><textarea id="c-msg" value={cMsg} onChange={(e) => setCMsg(e.target.value)} required /></div>
                  <button className="btn btn-full" type="submit"><span className="bt">Enviar pelo WhatsApp</span><PillBtnIcon /></button>
                </form>
              </div>
            </section>

            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="w">
                <div className="cta escuro">
                  <Pecas />
                  <h2>Escolha um projeto. <em style={{ fontStyle: 'normal', color: 'var(--c)' }}>Doe em dois minutos.</em></h2>
                  <p>Pix ou Cartão na página segura do Asaas, recibo com CNPJ e notícias do projeto que você apoiou.</p>
                  <div className="hero-act">
                    <a className="btn" href="#projetos"><span className="bt">Escolher um projeto</span><PillBtnIcon /></a>
                    <button type="button" className="btn btn-ghost" onClick={() => openDoar('')}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'empresas' && (
          <>
            <section className="proj-hero escuro">
              <img src={IMAGINE_ASSETS.voluntario} alt="Voluntários e comunidade reunidos em ação de rua do Instituto Imagine" />
              <div className="w">
                <nav className="migalha" aria-label="Você está em"><Link href="/">Início</Link> / Para empresas</nav>
                <span className="k">Para empresas</span>
                <h1>Sua empresa ao lado de crianças e famílias de Uberlândia.</h1>
                <p className="hero-p">O Instituto Imagine atua desde 2011 com arte, esporte, educação, saúde emocional e ação social. A sua empresa escolhe como participar: patrocínio de um projeto, doação de produtos, voluntariado ou uma campanha com os colaboradores.</p>
                <div className="hero-act">
                  <button type="button" className="btn" onClick={() => openWhats('Olá! Represento uma empresa e quero conversar sobre parceria com o Instituto Imagine.')}><span className="bt">Conversar sobre parceria</span><PillBtnIcon /></button>
                  <Link className="btn btn-ghost" href="/#projetos"><span className="bt">Ver os projetos</span><PillBtnIcon /></Link>
                </div>
              </div>
            </section>
            <section className="nums-sec" aria-label="Resultados">
              <div className="w nums">
                <div className="num"><b>10.000<span>+</span></b><p>vidas impactadas</p></div>
                <div className="num"><b>120<span>+</span></b><p>ações realizadas</p></div>
                <div className="num"><b>8</b><p>cidades alcançadas</p></div>
                <div className="num"><b>2011</b><p>ano de fundação</p></div>
              </div>
            </section>
            <section className="sec">
              <div className="w">
                <div className="cab"><div><span className="k">Formas de parceria</span><h2 className="t">Escolha o <em>jeito da sua empresa.</em></h2></div></div>
                <div className="formas">
                  <article className="forma gb"><span className="ico"><IconBuilding /></span><h3>Patrocínio de projeto</h3><p>A empresa adota um dos seis projetos e acompanha o resultado com relatório de impacto.</p></article>
                  <article className="forma gb"><span className="ico"><IconHeart /></span><h3>Natal Feliz</h3><p>Cotas de brinquedos ou arrecadação entre os colaboradores para a campanha de Natal.</p><Link className="lnk" href="/natal-feliz">Ver a campanha <ArrowIcon /></Link></article>
                  <article className="forma gb"><span className="selo selo-breve so-off">Em breve</span><span className="ico"><IconDoc /></span><h3>Campanha de IR com a equipe</h3><p>Os colaboradores destinam parte do Imposto de Renda aos projetos incentivados, sem custo para a empresa.</p></article>
                  <article className="forma gb"><span className="ico"><IconReceipt /></span><h3>Produtos e serviços</h3><p>Alimentos, roupas, materiais, transporte, gráfica, espaço para eventos: o que a empresa já faz pode virar doação.</p></article>
                  <article className="forma gb"><span className="ico"><IconHeart /></span><h3>Voluntariado corporativo</h3><p>A equipe participa de uma ação do Instituto, como a entrega do Natal Feliz ou o Bom Samaritano.</p></article>
                  <article className="forma gb"><span className="ico"><IconCalendar /></span><h3>Doação mensal</h3><p>Um valor fixo por mês que mantém aulas e atendimentos funcionando o ano inteiro.</p></article>
                </div>
              </div>
            </section>
            <section className="sec sec-alt">
              <div className="w">
                <div className="cab">
                  <div><span className="k">Cotas de patrocínio</span><h2 className="t">Três níveis de <em>participação.</em></h2></div>
                  <p className="lead"><span className="pend">valores e contrapartidas: proposta a aprovar pela diretoria</span></p>
                </div>
                <div className="cotas">
                  <article className="cota gb cor-magenta"><span className="proj-frente"><i />Cota</span><h3>Apoiador</h3><b className="cota-v"><span className="pend">valor a definir</span></b><ul className="ir-lista"><li>Nome da empresa na página de parceiros</li><li>Relatório de impacto do projeto apoiado</li><li>Certificado de parceria</li></ul></article>
                  <article className="cota gb cor-laranja"><span className="proj-frente"><i />Cota</span><h3>Parceiro</h3><b className="cota-v"><span className="pend">valor a definir</span></b><ul className="ir-lista"><li>Tudo do Apoiador</li><li>Logo na página do projeto apoiado</li><li>Agradecimento nas redes do Instituto</li><li>Visita ao projeto com a equipe</li></ul></article>
                  <article className="cota gb cor-azul"><span className="proj-frente"><i />Cota</span><h3>Mantenedor</h3><b className="cota-v"><span className="pend">valor a definir</span></b><ul className="ir-lista"><li>Tudo do Parceiro</li><li>Logo no rodapé do site</li><li>Ação de voluntariado exclusiva para a equipe</li><li>Encontro anual de resultados com a diretoria</li></ul></article>
                </div>
              </div>
            </section>
            <section className="sec" id="transparencia">
              <div className="w">
                <div className="cab"><div><span className="k">Transparência</span><h2 className="t">Você sabe para onde <em>vai cada real.</em></h2></div><p className="lead">Cada doação fica registrada no projeto escolhido. Os dados oficiais do Instituto estão aqui, abertos.</p></div>
                <div className="transp">
                  <div className="doc gb"><span>CNPJ</span><b>14.351.728/0001-72</b><p>Associação sem fins lucrativos, ativa.</p></div>
                  <div className="doc gb"><span>Desde</span><b>08/09/2011</b><p>Braço social da Igreja Batista Imagine, em Uberlândia-MG.</p></div>
                  <div className="doc gb"><span>Nota Fiscal Mineira</span><b>Entidade cadastrada</b><p>Cadastro na SEF-MG desde 18/09/2025.</p></div>
                  <div className="doc gb"><span>Prestação de contas</span><b>Relatório 2026</b><p><span className="pend">a publicar</span></p></div>
                </div>
              </div>
            </section>
            <section className="sec sec-alt" id="projetos">
              <div className="w">
                <div className="cab"><div><span className="k">Projetos para patrocinar</span><h2 className="t">Onde a sua empresa <em>pode estar.</em></h2></div></div>
                <div className="projs">{siteProjects.map(renderProjectCard)}</div>
              </div>
            </section>
            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="w">
                <div className="cta escuro">
                  <Pecas />
                  <h2>Vamos conversar sobre <em style={{ fontStyle: 'normal', color: 'var(--c)' }}>a sua parceria?</em></h2>
                  <p>A equipe do Instituto apresenta os projetos, os números e monta a proposta com a sua empresa.</p>
                  <div className="hero-act">
                    <button type="button" className="btn" onClick={() => openWhats('Olá! Represento uma empresa e quero conversar sobre parceria com o Instituto Imagine.')}><span className="bt">Falar pelo WhatsApp</span><PillBtnIcon /></button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'natal-feliz' && (
          <>
            <section className="proj-hero escuro">
              <img src={IMAGINE_ASSETS.hero3} alt="Palhaços e músico de gorro de Papai Noel animando crianças na ação de Natal" style={{ objectPosition: '65% 40%' }} />
              <div className="w">
                <nav className="migalha" aria-label="Você está em"><Link href="/">Início</Link> / Natal Feliz 2026</nav>
                <span className="k">Campanha Natal Feliz 2026</span>
                <h1>Um brinquedo novo para cada criança.</h1>
                <p className="hero-p">O Natal Feliz é a ação mais antiga do Instituto Imagine: começou antes mesmo de o Instituto existir no papel. Todo ano, arrecadamos brinquedos novos para crianças de comunidades carentes de Uberlândia. Você pode doar o brinquedo ou o valor dele pelo Pix.</p>
                <div className="hero-act">
                  <button type="button" className="btn" onClick={() => openDoar('natal')}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button>
                  <a className="btn btn-ghost" href="#como-ajudar"><span className="bt">Quero entregar um brinquedo</span><PillBtnIcon /></a>
                </div>
              </div>
            </section>
            <section className="nums-sec">
              <div className="w nums nums-3">
                <div className="num"><b><span className="pend">a definir</span></b><p>meta de brinquedos</p></div>
                <div className="num"><b><span className="pend">a definir</span></b><p>prazo para doar</p></div>
                <div className="num"><b><span className="pend">a definir</span></b><p>dia da entrega</p></div>
              </div>
            </section>
            <section className="sec" id="como-ajudar">
              <div className="w">
                <div className="cab"><div><span className="k">Como participar</span><h2 className="t">Três jeitos de <em>fazer o Natal</em> de uma criança.</h2></div></div>
                <div className="formas">
                  <article className="forma gb"><span className="ico"><IconPix /></span><h3>Doe pelo Pix</h3><p>O Instituto compra o brinquedo para você. Qualquer valor ajuda. <span className="pend">valor médio de um brinquedo a confirmar</span></p><button type="button" className="btn btn-sm" onClick={() => openDoar('natal')}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button></article>
                  <article className="forma gb"><span className="ico"><IconGift /></span><h3>Entregue um brinquedo novo</h3><p>Leve um brinquedo novo ao ponto de coleta. <span className="pend">endereço, horário e faixa de idade a confirmar</span></p><button type="button" className="lnk" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => openWhats('Olá! Quero entregar um brinquedo para o Natal Feliz. Onde e até quando posso levar?')}>Perguntar onde entregar <ArrowIcon /></button></article>
                  <article className="forma gb"><span className="ico"><IconHeart /></span><h3>Seja voluntário na entrega</h3><p>A festa de entrega precisa de gente para organizar, animar e entregar os presentes.</p><button type="button" className="lnk" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => openWhats('Olá! Quero ser voluntário(a) na entrega do Natal Feliz.')}>Quero ser voluntário <ArrowIcon /></button></article>
                </div>
              </div>
            </section>
            <section className="sec sec-alt" style={{ overflow: 'hidden' }}>
              <div className="w cab"><div><span className="k">Natal Feliz de outros anos</span><h2 className="t">É assim que o <em>presente chega.</em></h2></div></div>
              <div className="gal">{NATAL_GALLERY.map((g, i) => <figure key={i}><img src={g.src} alt={g.alt} loading="lazy" /></figure>)}</div>
            </section>
            <section className="sec">
              <div className="w faq">
                <div><span className="k">Dúvidas</span><h2 className="t">Sobre o <em>Natal Feliz.</em></h2></div>
                <div>
                  {NATAL_FAQ.map((item, idx) => {
                    const k = `natal-${idx}`
                    const isOpen = !!openFaqs[k]
                    return (
                      <div key={k} className={`faq-i${isOpen ? ' on' : ''}`}>
                        <h3 style={{ fontSize: 'inherit' }}>
                          <button type="button" aria-expanded={isOpen} onClick={() => toggleFaq(k)}>{item.q}<i aria-hidden="true" /></button>
                        </h3>
                        <div className="faq-r"><div><p>{item.a}</p></div></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="w">
                <div className="cta escuro">
                  <Pecas />
                  <h2>Escolha um projeto. <em style={{ fontStyle: 'normal', color: 'var(--c)' }}>Doe em dois minutos.</em></h2>
                  <p>Pix ou Cartão na página segura do Asaas, recibo com CNPJ e notícias do projeto que você apoiou.</p>
                  <div className="hero-act">
                    <Link className="btn" href="/#projetos"><span className="bt">Escolher um projeto</span><PillBtnIcon /></Link>
                    <button type="button" className="btn btn-ghost" onClick={() => openDoar('natal')}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {currentProject && (
          <>
            <section className="proj-hero escuro">
              <img src={currentProject.heroImg} alt={currentProject.alt} />
              <div className="w">
                <nav className="migalha" aria-label="Você está em"><Link href="/#projetos">Projetos</Link> / {currentProject.titulo}</nav>
                <span className="k">{currentProject.frente}</span>
                <h1>{currentProject.titulo}</h1>
                <p className="hero-p">{currentProject.resumo}</p>
                <div className="hero-act">
                  <button type="button" className="btn" onClick={() => openDoar(currentProject.id)}><span className="bt">Quero doar para este projeto</span><PillBtnIcon /></button>
                  <Link className="btn btn-ghost" href="/#projetos"><span className="bt">Ver todos os projetos</span><PillBtnIcon /></Link>
                </div>
              </div>
            </section>
            <section className="sec">
              <div className="w pp">
                <div className="pp-txt">
                  <h2 className="t">O projeto</h2>
                  <p>{currentProject.intro}</p>
                  {currentProject.desafio && (
                    <>
                      <h3>O desafio</h3>
                      <p>{currentProject.desafio}</p>
                    </>
                  )}
                  {currentProject.fazemos.length > 0 && (
                    <>
                      <h3>O que fazemos</h3>
                      <ul className="ir-lista">{currentProject.fazemos.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    </>
                  )}
                  {currentProject.incentivoAviso && (
                    <div className="aviso so-off">
                      <b>Imposto de Renda:</b> {currentProject.incentivoAviso}{' '}
                      <Link className="lnk" href="/#imposto">Simular meu potencial</Link>
                    </div>
                  )}
                </div>
                <aside className={`pp-doa gb ${currentProject.corClass}`}>
                  <span className="campanha-k">Apoie este projeto</span>
                  <div className="proj-n">
                    <div>Beneficiários<b>{currentProject.beneficiarios || <span className="pend">a definir</span>}</b></div>
                    <div>Meta 2026<b>{currentProject.metaTexto || <span className="pend">a definir</span>}</b></div>
                  </div>
                  <button type="button" className="btn btn-full" onClick={() => openDoar(currentProject.id)}>
                    <span className="bt">Doar pelo Pix</span><PillBtnIcon />
                  </button>
                  <p className="nota">Pix ou Cartão na página segura do Asaas (CNPJ 14.351.728/0001-72) e recibo por e-mail depois da confirmação.</p>
                  <a className="lnk" href={`https://wa.me/?text=${encodeURIComponent(`Conheça o projeto ${currentProject.titulo} do Instituto Imagine: ${currentProject.shareUrl}`)}`} target="_blank" rel="noopener">
                    Compartilhar no WhatsApp <ArrowIcon />
                  </a>
                </aside>
              </div>
            </section>
            {blogPosts && blogPosts.length > 0 && (
              <section className="sec" id="atualizacoes-projeto" style={{ paddingTop: 0 }}>
                <div className="w">
                  <div className="cab">
                    <div>
                      <span className="k">Atualizações deste projeto</span>
                      <h2 className="t">Notícias e prestação de contas</h2>
                    </div>
                    <Link className="lnk" href="/blog">Ver todas <ArrowIcon /></Link>
                  </div>
                  <div className="projs">{blogPosts.slice(0, 3).map(renderBlogCard)}</div>
                </div>
              </section>
            )}
            {siteProjects.some((p) => p.id !== currentProject.id) && (
              <section className="sec sec-alt" id="projetos">
                <div className="w">
                  <div className="cab"><div><span className="k">Outros projetos</span><h2 className="t">Conheça também</h2></div></div>
                  <div className="projs">{siteProjects.filter((p) => p.id !== currentProject.id).map(renderProjectCard)}</div>
                </div>
              </section>
            )}
            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="w">
                <div className="cta escuro">
                  <Pecas />
                  <h2>Escolha um projeto. <em style={{ fontStyle: 'normal', color: 'var(--c)' }}>Doe em dois minutos.</em></h2>
                  <p>Pix ou Cartão na página segura do Asaas, recibo com CNPJ e notícias do projeto que você apoiou.</p>
                  <div className="hero-act">
                    <Link className="btn" href="/#projetos"><span className="bt">Escolher um projeto</span><PillBtnIcon /></Link>
                    <button type="button" className="btn btn-ghost" onClick={() => openDoar(currentProject.id)}><span className="bt">Doar pelo Pix</span><PillBtnIcon /></button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'privacidade' && (
          <section className="sec legal">
            <div className="w">
              <div className="legal-in">
                <nav className="migalha" aria-label="Você está em"><Link href="/">Início</Link> / Política de privacidade</nav>
                <span className="k">Política de privacidade</span>
                <h1 className="t">Como o Instituto Imagine cuida dos seus dados</h1>
                <p className="nota">Atualizada em 23/11/2026. <span className="pend">texto-base: revisar com o jurídico do Instituto</span></p>
                <h2>Quem é o responsável</h2>
                <p>Instituto Imagine, associação sem fins lucrativos, CNPJ 14.351.728/0001-72, R. Rui de Castro Santos, 1991 — Grand Ville, Uberlândia-MG, 38406-260. É o Instituto quem decide como os dados são usados (controlador, nos termos da Lei Geral de Proteção de Dados, Lei 13.709/2018).</p>
                <h2>O que coletamos</h2>
                <p>Os dados chegam até nós apenas quando você realiza uma doação ou escolhe falar com o Instituto:</p>
                <ul>
                  <li><b>Doação online:</b> projeto escolhido, valor, modalidade (única ou recorrente) e os dados de identificação solicitados no checkout seguro da instituição de pagamento Asaas (nome, e-mail, CPF/CNPJ e meio de pagamento). O Instituto Imagine não armazena números de cartão de crédito em seus servidores.</li>
                  <li><b>Contato, voluntariado, empresas e avisos de Imposto de Renda:</b> nome, telefone e a mensagem que você escreve.</li>
                  <li><b>Simulador de Imposto de Renda:</b> os valores ficam só no seu navegador e não são enviados a ninguém.</li>
                  <li><b>Link de embaixador:</b> o código de indicação fica guardado no seu navegador para registrar quem indicou a doação.</li>
                </ul>
                <h2>Para que usamos</h2>
                <ul>
                  <li>Processar a sua doação, enviar automaticamente o recibo com CNPJ por e-mail, liberar seu acesso ao Portal do Doador e cumprir obrigações legais e fiscais.</li>
                  <li>Responder ao seu contato e organizar o voluntariado.</li>
                  <li>Enviar notícias e prestações de contas dos projetos apoiados.</li>
                </ul>
                <h2>Com quem compartilhamos</h2>
                <p>Não vendemos nem cedemos seus dados. As doações online (Pix e Cartão de Crédito) são processadas pela instituição de pagamento Asaas Gestão Financeira S.A., os e-mails transacionais de recibo e acesso ao Portal são entregues via Resend, e o atendimento direto ocorre pelo WhatsApp (Meta). O site carrega fontes do Google Fonts e é distribuído pela rede da Cloudflare, que pode registrar dados técnicos de segurança e acesso, como o endereço IP.</p>
                <h2>Medição de acesso</h2>
                <p>Para saber quais páginas e botões funcionam, usamos uma ferramenta de medição instalada em servidor próprio (Umami). Ela não usa cookies, não identifica você e mostra só números agregados, como total de visitas, páginas vistas, de onde as pessoas chegaram e quantas vezes um botão foi usado.</p>
                <h2>Por quanto tempo guardamos</h2>
                <p>Pelo tempo necessário para cada finalidade e pelos prazos exigidos em lei para documentos fiscais e recibos.</p>
                <h2>Seus direitos</h2>
                <p>Você pode pedir a qualquer momento: confirmação de que tratamos seus dados, acesso, correção, exclusão, revogação do consentimento e informações sobre compartilhamento (art. 18 da LGPD). Fale com a gente pelo WhatsApp <a className="lnk" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">(34) 99694-5150</a>.</p>
              </div>
            </div>
          </section>
        )}
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
                <li><a href="#doar" onClick={(e) => { e.preventDefault(); openDoar('') }}>Doar pelo Pix</a></li>
                <li><Link href="/natal-feliz">Natal Feliz 2026</Link></li>
                <li><Link href={anchor('imposto')}>Imposto de Renda</Link></li>
                <li><Link href="/empresas">Para empresas</Link></li>
                <li><Link href={anchor('form-emb')}>Embaixadores</Link></li>
              </ul>
            </div>
            <div>
              <h4>Instituto</h4>
              <ul>
                <li><Link href={anchor('projetos')}>Projetos</Link></li>
                <li><Link href="/blog">Notícias e Prestação de Contas</Link></li>
                <li><Link href={anchor('historia')}>Nossa história</Link></li>
                <li><Link href={anchor('transparencia')}>Transparência</Link></li>
                <li><Link href={anchor('faq')}>Dúvidas</Link></li>
              </ul>
            </div>
            <div>
              <h4>Contato</h4>
              <ul>
                <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">WhatsApp</a></li>
                <li><a href="https://www.instagram.com/institutoimagineoficial/" target="_blank" rel="noopener">Instagram</a></li>
                <li><a href="https://www.instagram.com/imagineuberlandia/" target="_blank" rel="noopener">Igreja Batista Imagine</a></li>
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

      {modalOpen && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="md-t"
          onClick={(e) => {
            if (e.target === e.currentTarget && !doarLoading) setModalOpen(false)
          }}
        >
          <div className="modal-c">
            <button
              type="button"
              className="modal-x"
              aria-label="Fechar"
              disabled={doarLoading}
              onClick={() => setModalOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="modal-in">
              <form onSubmit={(e) => void handleDoarSubmit(e)} noValidate>
                <Pecas />
                <h3 id="md-t">Faça a sua doação</h3>
                <p className="modal-sub">
                  Pagamento seguro via Asaas (Pix ou Cartão) · CNPJ 14.351.728/0001-72
                </p>
                <div style={{ display: 'grid', gap: 15 }}>
                  <div className="campo">
                    <label htmlFor="d-proj">Destino da doação</label>
                    <select
                      id="d-proj"
                      value={doarProj}
                      disabled={doarLoading}
                      onChange={(e) => {
                        setDoarProj(e.target.value)
                        setDoarErro('')
                      }}
                    >
                      {Object.entries(projLabelMap).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo">
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tx-2)' }}>Valor</span>
                    <div className="valores-d">
                      {[30, 50, 100, 200].map((v) => (
                        <button
                          key={v}
                          type="button"
                          disabled={doarLoading}
                          aria-pressed={doarValor === v && !doarOutro}
                          onClick={() => {
                            setDoarValor(v)
                            setDoarOutro('')
                            setDoarErro('')
                          }}
                        >
                          R$ {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="campo">
                    <label htmlFor="d-outro">
                      Outro valor em R$ (mínimo {formatBRL(MIN_DONATION_BRL)})
                    </label>
                    <input
                      id="d-outro"
                      inputMode="decimal"
                      disabled={doarLoading}
                      placeholder="Ex.: 75,00"
                      value={doarOutro}
                      onChange={(e) => {
                        setDoarOutro(e.target.value)
                        setDoarValor(parseBRNumber(e.target.value))
                        setDoarErro('')
                      }}
                    />
                  </div>

                  {!doarAnonima && (
                    <div className="campo">
                      <label htmlFor="d-nome">Seu nome (opcional)</label>
                      <input
                        id="d-nome"
                        maxLength={120}
                        disabled={doarLoading}
                        placeholder="Você também poderá preencher na tela de pagamento"
                        value={doarNome}
                        onChange={(e) => setDoarNome(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="campo">
                    <label htmlFor="d-msg">Mensagem de apoio (opcional)</label>
                    <input
                      id="d-msg"
                      maxLength={500}
                      disabled={doarLoading}
                      placeholder="Deixe um recado para a equipe do projeto"
                      value={doarMensagem}
                      onChange={(e) => setDoarMensagem(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <label className="chk">
                      <input
                        type="checkbox"
                        disabled={doarLoading}
                        checked={doarMensal}
                        onChange={(e) => setDoarMensal(e.target.checked)}
                      />{' '}
                      Quero doar todo mês (assinatura automática no cartão)
                    </label>

                    {doarMensal && (
                      <div className="campo" style={{ paddingLeft: 4 }}>
                        <label htmlFor="d-freq">Periodicidade</label>
                        <select
                          id="d-freq"
                          value={doarFrequencia}
                          disabled={doarLoading}
                          onChange={(e) => setDoarFrequencia(e.target.value as RecurringFrequency)}
                        >
                          <option value="monthly">Mensal</option>
                          <option value="quarterly">Trimestral</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    )}

                    <label className="chk">
                      <input
                        type="checkbox"
                        disabled={doarLoading}
                        checked={doarAnonima}
                        onChange={(e) => setDoarAnonima(e.target.checked)}
                      />{' '}
                      Doar anonimamente (não exibir meu nome em listagens)
                    </label>
                  </div>

                  {doarErro && (
                    <div className="aviso" role="alert" style={{ margin: 0 }}>
                      <b>Atenção:</b> {doarErro}
                    </div>
                  )}

                  <button className="btn btn-full" type="submit" disabled={doarLoading}>
                    <span className="bt">
                      {doarLoading
                        ? 'Abrindo pagamento seguro...'
                        : `Continuar para pagamento · ${formatBRL(doarValor > 0 ? doarValor : 0)}${
                            doarMensal ? `/${getFrequencyLabelPTBR(doarFrequencia).toLowerCase()}` : ''
                          }`}
                    </span>
                    <PillBtnIcon />
                  </button>

                  <p className="nota" style={{ margin: 0, textAlign: 'center' }}>
                    Você concluirá com Pix ou Cartão na página segura do Asaas e receberá o recibo com CNPJ por e-mail.{' '}
                    <button
                      type="button"
                      className="lnk"
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 'inherit' }}
                      onClick={() =>
                        openWhats(
                          `Olá! Quero fazer uma doação de ${formatBRL(doarValor > 0 ? doarValor : 50)}${doarMensal ? ' recorrente' : ''} para "${projLabelMap[doarProj] || doarProj}" e gostaria de ajuda.`
                        )
                      }
                    >
                      Precisa de ajuda no WhatsApp?
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}

      <a className="wa" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" aria-label="Falar com o Instituto no WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.1 1.3 15.2.1 12 .1 5.5.1.2 5.4.2 11.9c0 2.1.5 4.1 1.6 5.9L.1 24l6.3-1.7c1.7.9 3.7 1.4 5.6 1.4 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.4-8.3z" />
        </svg>
      </a>
    </div>
  )
}
