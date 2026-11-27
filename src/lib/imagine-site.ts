export const SITE_PUBLIC_PATHS = [
  '/',
  '/blog',
  '/empresas',
  '/natal-feliz',
  '/politica-de-privacidade',
  '/projetos/artes',
  '/projetos/amarelinha',
  '/projetos/esporte',
  '/projetos/social',
  '/projetos/familias',
  '/projetos/educacao',
] as const

const RESERVED_PUBLIC_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'novo',
  'editar',
  'relatorios',
  'projetos',
  'empresas',
  'natal-feliz',
  'politica-de-privacidade',
  'entrar',
  'geral',
  'natal',
])

export function isInstitutionalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  let clean = pathname.split(/[?#]/)[0].trim()
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // mantém valor bruto se percent-encoding for malformado
  }
  clean = clean.toLowerCase()
  if (!clean) return false
  const normalized = clean.replace(/\/+$/, '') || '/'
  if ((SITE_PUBLIC_PATHS as readonly string[]).includes(normalized)) return true
  // Qualquer rota pública /blog ou /blog/* é institucional (não existe rota de portal sob /blog).
  if (normalized === '/blog' || normalized.startsWith('/blog/')) return true
  // Qualquer rota pública /projetos/<slug> (exatamente 2 segmentos) é institucional;
  // /projetos e /projetos/<id>/relatorios pertencem ao Portal autenticado.
  return /^\/projetos\/[a-z0-9][a-z0-9-]*$/.test(normalized)
}

export function getInstitutionalProjectPathByPortalId(
  portalProjectId: string,
  slug?: string | null
): string {
  const cleanSlug = (slug || '').trim().toLowerCase()
  if (
    cleanSlug &&
    !RESERVED_PUBLIC_SLUGS.has(cleanSlug) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)
  ) {
    return `/projetos/${cleanSlug}`
  }
  const match = IMAGINE_PROJECTS.find((p) => p.portalProjectId === portalProjectId)
  return match ? `/projetos/${match.id}` : '/#projetos'
}

export const IMAGINE_SITE_CONFIG = {
  irAtivo: false,
  pixChave: '',
  pixNome: 'INSTITUTO IMAGINE',
  pixCidade: 'UBERLANDIA',
  whatsapp: '5534996945150',
  prazoIR: '15/12/2026',
  arrecadado: null as number | null,
  meta: null as number | null,
}

export const IMAGINE_ASSETS = {
  ajudar: '/img/ajudar.webp',
  arte: '/img/arte.webp',
  arte2: '/img/arte2.webp',
  blog3: '/img/blog3.webp',
  doacao: '/img/doacao.webp',
  educacao: '/img/educacao.webp',
  educacao2: '/img/educacao2.webp',
  esporte: '/img/esporte.webp',
  esporte2: '/img/esporte2.webp',
  favicon: '/img/favicon.png',
  fundador: '/img/fundador.webp',
  hero1: '/img/hero1.webp',
  hero2: '/img/hero2.webp',
  hero3: '/img/hero3.webp',
  heroiMostra02: '/img/heroi-mostra02.webp',
  heroiMostra17: '/img/heroi-mostra17.webp',
  heroiMostra18: '/img/heroi-mostra18.webp',
  heroiMostra68: '/img/heroi-mostra68.webp',
  juventude: '/img/juventude.webp',
  logoBranco: '/img/logo-branco.png',
  logoCor: '/img/logo-cor.png',
  sobre: '/img/sobre.webp',
  social: '/img/social.webp',
  social2: '/img/social2.webp',
  social3: '/img/social3.webp',
  voluntario: '/img/voluntario.webp',
} as const

export type ProjectId = 'artes' | 'amarelinha' | 'esporte' | 'social' | 'familias' | 'educacao'
export type PageKey = 'home' | 'empresas' | 'natal-feliz' | 'privacidade' | 'projeto' | ProjectId

export interface ProjectInfo {
  id: string
  titulo: string
  frente: string
  causa: string
  corClass: 'cor-magenta' | 'cor-verde' | 'cor-azul' | 'cor-laranja'
  cardImg: string
  heroImg: string
  alt: string
  resumo: string
  intro: string
  desafio: string
  fazemos: string[]
  incentivoTag?: string
  incentivoAviso?: string
  beneficiarios?: string
  metaTexto?: string
  shareUrl: string
  /** ID do projeto cadastrado no Supabase/Portal para checkout nativo (quando disponível) */
  portalProjectId?: string
  portalCampaignSlug?: string
}

export const IMAGINE_PROJECTS: ProjectInfo[] = [
  {
    id: 'artes',
    titulo: 'Artes e Expressão',
    frente: 'Ministério de Artes',
    causa: 'Cultura e Artes',
    corClass: 'cor-magenta',
    cardImg: IMAGINE_ASSETS.arte2,
    heroImg: IMAGINE_ASSETS.heroiMostra18,
    alt: 'Bailarinas do Instituto Imagine em espetáculo no palco, com figurinos em tons de areia',
    resumo: 'Aulas contínuas de ballet, jazz, contemporâneo, hip hop e circo, e espetáculos que já entraram no calendário da cidade.',
    intro: 'Aulas de ballet, jazz, contemporâneo, hip hop e circo, toda semana, para crianças e adolescentes. Elas descobrem um talento, ganham confiança e aprendem a trabalhar em grupo. O trabalho é sério e profissional e chega ao palco nos espetáculos de Natal, Páscoa e férias de julho — como a Mostra Artística 2026, “Minha Mãe é Uma Crente”, no Teatro Municipal de Uberlândia.',
    desafio: 'Em muitos bairros, criança nunca fez uma aula de dança nem subiu num palco. Aula particular custa caro, e sem ela fica difícil descobrir um talento e acreditar nele.',
    fazemos: [
      'Ballet, jazz, contemporâneo e hip hop',
      'Circo',
      'Espetáculos e musicais no calendário da cidade',
      'Mostra Artística anual',
    ],
    incentivoTag: 'Pode ser incentivado · Cultura',
    incentivoAviso: 'este projeto pode ser inscrito na lei de incentivo de cultura. Quando for aprovado, você poderá destinar parte do seu IR para ele.',
    shareUrl: 'https://imagineinstituto.com/projetos/artes/',
  },
  {
    id: 'amarelinha',
    titulo: 'Projeto Amarelinha',
    frente: 'Contraturno socioeducativo',
    causa: 'Educação',
    corClass: 'cor-verde',
    cardImg: IMAGINE_ASSETS.hero2,
    heroImg: IMAGINE_ASSETS.hero2,
    alt: 'Menina sorrindo de óculos rosa à mesa de atividades do Projeto Amarelinha',
    resumo: 'Contraturno escolar como tempo de convivência, cuidado e descoberta. Cada atividade tem uma intenção.',
    intro: 'O Projeto Amarelinha recebe as crianças no período em que elas não estão na escola. Ali elas brincam, convivem, leem e são cuidadas por gente que acompanha cada uma. Brincar também é aprender, e cada atividade é pensada com intenção.',
    desafio: 'Depois da aula, muita criança fica sozinha em casa ou na rua, sem lugar seguro e sem ninguém acompanhando. É nesse horário que o contraturno faz diferença.',
    fazemos: [
      'Atividades de convivência e brincadeira dirigida',
      'Acompanhamento e cuidado no contraturno',
      'Leitura e estímulo ao aprendizado',
    ],
    shareUrl: 'https://imagineinstituto.com/projetos/amarelinha/',
  },
  {
    id: 'esporte',
    titulo: 'Esporte e Juventude',
    frente: 'Crianças e Juventude',
    causa: 'Esporte',
    corClass: 'cor-azul',
    cardImg: IMAGINE_ASSETS.esporte,
    heroImg: IMAGINE_ASSETS.esporte,
    alt: 'Turma de crianças de quimono sentada no tatame com o professor ao fundo',
    resumo: 'Aulas de esporte e acompanhamento contínuo para formar disciplina, cooperação e confiança.',
    intro: 'Aulas regulares de esporte, com professor que conhece cada aluno e acompanha a família. No tatame a criança aprende disciplina, respeito e a trabalhar em equipe.',
    desafio: 'Em muitos bairros não há quadra, tatame nem aula de graça para criança. Sem um horário fixo de treino, o jovem fica sem rotina, sem professor por perto e sem turma.',
    fazemos: [
      'Aulas regulares no tatame',
      'Valores: disciplina, respeito e cooperação',
      'Acompanhamento das famílias',
    ],
    incentivoTag: 'Pode ser incentivado · Esporte',
    incentivoAviso: 'este projeto pode ser inscrito na lei de incentivo de esporte. Quando for aprovado, você poderá destinar parte do seu IR para ele.',
    shareUrl: 'https://imagineinstituto.com/projetos/esporte/',
    portalProjectId: 'dd0107dc-1802-47af-8755-371603acf890',
    portalCampaignSlug: 'esporte-social',
  },
  {
    id: 'social',
    titulo: 'Ação Social e Comunidade',
    frente: 'Bom Samaritano · Natal Feliz · Agasalho',
    causa: 'Assistência Social',
    corClass: 'cor-laranja',
    cardImg: IMAGINE_ASSETS.doacao,
    heroImg: IMAGINE_ASSETS.social,
    alt: 'Voluntários do Instituto Imagine organizando sacolas de doação',
    resumo: 'Marmitas para quem está na rua, cestas básicas, Campanha do Agasalho e brinquedos novos no Natal Feliz.',
    intro: 'A frente social cuida de pessoas e famílias em vulnerabilidade, com escuta, orientação e encaminhamento para a rede pública. O Ministério Bom Samaritano leva marmitas a pessoas em situação de rua, distribui cestas básicas e visita casas de recuperação, asilos e orfanatos. Duas campanhas marcam o ano: a Campanha do Agasalho e o Natal Feliz, que entrega brinquedos novos a crianças de comunidades carentes.',
    desafio: 'Tem gente em situação de rua sem ter o que comer, família que chega ao fim do mês sem comida em casa e criança que passa o Natal sem um presente.',
    fazemos: [
      'Marmitas para pessoas em situação de rua',
      'Cestas básicas para famílias',
      'Visitas a asilos, orfanatos e casas de recuperação',
      'Campanha do Agasalho e Natal Feliz',
    ],
    shareUrl: 'https://imagineinstituto.com/projetos/social/',
  },
  {
    id: 'familias',
    titulo: 'Saúde Emocional e Famílias Atípicas',
    frente: 'Acolhimento psicossocial',
    causa: 'Saúde',
    corClass: 'cor-magenta',
    cardImg: IMAGINE_ASSETS.educacao2,
    heroImg: IMAGINE_ASSETS.educacao2,
    alt: 'Educadora abraçando um menino com protetor auricular',
    resumo: 'Acompanhamento psicossocial e espaços de escuta para famílias atípicas e para quem atravessa desafios emocionais.',
    intro: 'O Instituto estruturou atendimentos voltados à saúde mental e ao acolhimento de famílias atípicas, com acompanhamento psicossocial e espaços de escuta. Um cuidado especializado para quem enfrenta desafios que pouca gente vê.',
    desafio: 'A família atípica vive uma rotina pesada, muitas vezes sem rede de apoio, com fila longa para atendimento e pouca gente disposta a ouvir.',
    fazemos: [
      'Acompanhamento psicossocial',
      'Grupos e espaços de escuta',
      'Acolhimento de famílias atípicas',
    ],
    shareUrl: 'https://imagineinstituto.com/projetos/familias/',
    portalProjectId: '6e302335-89a9-4336-9160-70c038576a97',
    portalCampaignSlug: 'saude-comunitaria',
  },
  {
    id: 'educacao',
    titulo: 'Educação',
    frente: 'Reforço, oficinas e capacitação',
    causa: 'Educação',
    corClass: 'cor-verde',
    cardImg: IMAGINE_ASSETS.educacao,
    heroImg: IMAGINE_ASSETS.educacao,
    alt: 'Menino concentrado escrevendo em uma atividade de reforço escolar',
    resumo: 'Reforço escolar, oficinas, cursos de capacitação e incentivo à leitura para abrir portas.',
    intro: 'Reforço escolar para quem está ficando para trás, oficinas e cursos de capacitação para jovens e adultos, e incentivo à leitura. Quem aprende mais tem mais porta aberta.',
    desafio: 'A criança que não tem ninguém em casa para ajudar na lição vai ficando para trás na escola, e o adulto sem curso não consegue um emprego melhor.',
    fazemos: [
      'Reforço escolar comunitário',
      'Oficinas e cursos de capacitação',
      'Incentivo à leitura',
    ],
    shareUrl: 'https://imagineinstituto.com/projetos/educacao/',
    portalProjectId: '8edcad55-041b-4c90-b53c-9cd120eb4c3b',
    portalCampaignSlug: 'educacao-digital',
  },
]

export const HOME_GALLERY = [
  { src: IMAGINE_ASSETS.heroiMostra68, alt: 'Menino sorrindo com fantasia de onça de papelão nos bastidores da Mostra Artística' },
  { src: IMAGINE_ASSETS.hero3, alt: 'Palhaços e músico animando a comunidade em ação de Natal' },
  { src: IMAGINE_ASSETS.blog3, alt: 'Meninas de figurino azul dançando no palco' },
  { src: IMAGINE_ASSETS.juventude, alt: 'Professor de quimono abraçando dois alunos no tatame' },
  { src: IMAGINE_ASSETS.social, alt: 'Cortejo de voluntários e crianças pela rua do bairro' },
  { src: IMAGINE_ASSETS.hero1, alt: 'Voluntária entregando presente de Natal a crianças' },
  { src: IMAGINE_ASSETS.arte, alt: 'Espetáculo no palco com cruzes iluminadas ao fundo' },
  { src: IMAGINE_ASSETS.sobre, alt: 'Equipe de voluntários fantasiados de palhaço' },
  { src: IMAGINE_ASSETS.social3, alt: 'Festa de rua com crianças, bandeiras e Papai Noel' },
  { src: IMAGINE_ASSETS.esporte2, alt: 'Famílias e crianças de quimono reunidas com o professor' },
  { src: IMAGINE_ASSETS.ajudar, alt: 'Voluntária fazendo pintura facial em uma criança' },
]

export const NATAL_GALLERY = [
  { src: IMAGINE_ASSETS.social3, alt: 'Festa de Natal na rua, com crianças, bandeiras e Papai Noel' },
  { src: IMAGINE_ASSETS.hero1, alt: 'Voluntária entregando presente de Natal a crianças' },
  { src: IMAGINE_ASSETS.social2, alt: 'Voluntários e crianças dançando na rua durante a ação de Natal' },
  { src: IMAGINE_ASSETS.sobre, alt: 'Voluntários fantasiados de palhaço na ação de Natal' },
  { src: IMAGINE_ASSETS.fundador, alt: 'Voluntária fantasiada de palhaça conversando com uma moradora' },
]

export const HOME_FAQ_TABS = [
  {
    id: 'faq-0',
    label: 'Doação',
    items: [
      { q: 'Como faço para doar?', a: 'Escolha um projeto, toque em “Quero doar”, defina o valor e conclua o pagamento no ambiente seguro do Asaas (Pix ou Cartão de Crédito). Assim que o pagamento é confirmado, você recebe o recibo e o acesso ao Portal do Doador no seu e-mail.' },
      { q: 'Posso escolher para qual projeto vai a minha doação?', a: 'Sim. Cada doação é registrada no projeto que você escolheu. Se preferir, escolha “Onde for mais necessário” e o Instituto direciona para a frente com mais urgência.' },
      { q: 'Existe valor mínimo?', a: 'Pelo checkout online (Pix ou Cartão), o valor mínimo de processamento é R$ 5,00. Para doação de itens ou outros formatos, fale conosco pelo WhatsApp.' },
      { q: 'Posso doar todo mês?', a: 'Pode. Marque “Quero doar todo mês” ao escolher o valor e ative sua assinatura recorrente no cartão. A doação recorrente é o que mantém as aulas e os atendimentos funcionando o ano inteiro.' },
      { q: 'Recebo recibo?', a: 'Sim. Assim que o pagamento é confirmado, enviamos automaticamente o recibo com o CNPJ do Instituto Imagine para o seu e-mail, e ele também fica salvo no seu Portal do Doador.' },
    ],
  },
  {
    id: 'faq-1',
    label: 'Imposto de Renda',
    items: [
      { q: 'O que é destinar parte do Imposto de Renda?', a: 'Quem faz a declaração pelo modelo completo pode direcionar até 6% do imposto devido para projetos aprovados em leis de incentivo (cultura, esporte, fundos da criança e do idoso). O valor doado é abatido do imposto: volta como restituição ou diminui o que você tem a pagar.' },
      { q: 'Já posso destinar meu IR para o Instituto Imagine?', a: 'Ainda não. O Instituto está preparando seus projetos de arte e esporte para as leis de incentivo. Deixe seu contato na seção “Doe com seu Imposto de Renda” e avisamos assim que abrir. Até lá, a doação pelo Pix ajuda do mesmo jeito, mas não é abatida do IR.' },
      { q: 'Quem pode destinar?', a: 'Pessoa física que declara pelo modelo completo e tem imposto devido. Quem usa o modelo simplificado não pode abater doações.' },
      { q: 'Como sei quanto posso destinar?', a: 'Use o simulador desta página para ter uma estimativa e confirme com o seu contador. A referência é o “Total do imposto devido” da sua última declaração: 6% dele é o potencial aproximado.' },
      { q: 'Até quando posso fazer a destinação?', a: 'Para entrar na declaração do ano seguinte, a doação precisa ser feita até o fim do ano-calendário — nas campanhas, normalmente até meados de dezembro.' },
    ],
  },
  {
    id: 'faq-2',
    label: 'Transparência',
    items: [
      { q: 'O Instituto Imagine é uma organização formal?', a: 'Sim. É uma associação sem fins lucrativos, com CNPJ 14.351.728/0001-72, fundada em 08/09/2011 em Uberlândia-MG. É o braço social da Igreja Batista Imagine.' },
      { q: 'Como as doações são usadas?', a: 'Nos materiais, alimentos, aulas, atendimentos e campanhas de cada projeto. Publicamos o relatório de prestação de contas nesta página.' },
      { q: 'Vou saber o resultado da minha doação?', a: 'Sim. Quem deixa o contato recebe as atualizações dos projetos, com números e histórias reais.' },
    ],
  },
  {
    id: 'faq-3',
    label: 'Voluntariado e empresas',
    items: [
      { q: 'Como me torno voluntário?', a: 'Preencha o formulário de contato escolhendo “Quero ser voluntário(a)”. A equipe chama você para conhecer as frentes e encontrar o lugar certo para o seu tempo e talento.' },
      { q: 'Minha empresa pode apoiar?', a: 'Pode, com patrocínio de projeto, doação de produtos e serviços, voluntariado corporativo ou uma campanha interna para os colaboradores destinarem parte do IR.' },
      { q: 'Posso ajudar sem dinheiro?', a: 'Sim: com tempo, com doação de roupas, alimentos e brinquedos nas campanhas, e divulgando o Instituto como embaixador.' },
    ],
  },
]

export const NATAL_FAQ = [
  { q: 'O brinquedo precisa ser novo?', a: 'Sim. O Natal Feliz arrecada brinquedos novos, para que cada criança receba um presente como o de qualquer outra.' },
  { q: 'Posso doar dinheiro em vez do brinquedo?', a: 'Pode. Escolha “Natal Feliz 2026” no formulário de doação e pague pelo Pix. O Instituto compra os brinquedos com o valor arrecadado.' },
  { q: 'Quem recebe os presentes?', a: 'Crianças de comunidades carentes de Uberlândia atendidas pelo Instituto e por suas ações sociais.' },
  { q: 'Empresas podem participar?', a: 'Podem, com cotas de brinquedos ou arrecadação entre os colaboradores. Veja a página para empresas.' },
]

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatBRLCompact(v: number): string {
  return v >= 1000
    ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil'
    : formatBRL(v)
}

export function parseBRNumber(raw: string): number {
  if (typeof raw !== 'string') return 0
  const cleaned = raw.trim().replace(/^R\$\s*/i, '').replace(/\s+/g, '')
  if (!cleaned) return 0

  let normalized = cleaned
  if (cleaned.includes(',')) {
    // Formato brasileiro: 1.250,50 ou 50,50
    if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(cleaned)) return 0
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    // Formato decimal com ponto: 50.5 ou 1000.50
    normalized = cleaned
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // Milhar brasileiro sem centavos: 1.000 ou 10.000
    normalized = cleaned.replace(/\./g, '')
  } else if (!/^\d+$/.test(cleaned)) {
    return 0
  }

  const v = Number(normalized)
  return Number.isFinite(v) && v > 0 ? v : 0
}

export function generatePixBRCode(
  chave: string,
  valor: number,
  nome: string,
  cidade: string,
  txid: string
): string {
  const cleanKey = (chave || '').trim()
  if (!cleanKey) return ''

  const sanitizeAscii = (s: string, fallback: string, maxLen: number) => {
    const clean = (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .trim()
      .toUpperCase()
      .slice(0, maxLen)
    return clean || fallback
  }

  const field = (id: string, s: string) => id + String(s.length).padStart(2, '0') + s
  const cents = Number.isFinite(valor) && valor > 0 ? Math.round(valor * 100) : 0
  const amountStr = cents >= 1 && cents <= 99999999999 ? (cents / 100).toFixed(2) : ''
  const cleanTxid = (txid || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25) || '***'

  const payload =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', cleanKey)) +
    field('52', '0000') +
    field('53', '986') +
    (amountStr ? field('54', amountStr) : '') +
    field('58', 'BR') +
    field('59', sanitizeAscii(nome, 'INSTITUTO IMAGINE', 25)) +
    field('60', sanitizeAscii(cidade, 'UBERLANDIA', 15)) +
    field('62', field('05', cleanTxid)) +
    '6304'

  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) & 0xff) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface IRSimulationInput {
  sal: number
  alu: number
  bon: number
  dep: number
  edu: number
  sau: number
  pgbl: number
  out: number
}

export interface IRSimulationResult {
  rend: number
  ded: number
  imp: number
  pot: number
  obs: string
}

function calcINSS(s: number): number {
  const faixas: [number, number][] = [
    [1518, 0.075],
    [2793.88, 0.09],
    [4190.83, 0.12],
    [8157.41, 0.14],
  ]
  let ant = 0
  let t = 0
  for (let i = 0; i < faixas.length; i++) {
    const lim = faixas[i][0]
    if (s > ant) t += (Math.min(s, lim) - ant) * faixas[i][1]
    ant = lim
  }
  return t
}

function calcTabelaIR(b: number): number {
  const f: [number, number, number][] = [
    [29145.6, 0, 0],
    [33919.8, 0.075, 2185.92],
    [45012.6, 0.15, 4729.92],
    [55976.16, 0.225, 8105.88],
    [Infinity, 0.275, 10904.76],
  ]
  for (let i = 0; i < f.length; i++) {
    if (b <= f[i][0]) return Math.max(0, b * f[i][1] - f[i][2])
  }
  return 0
}

export function simulateIR2026(input: IRSimulationInput): IRSimulationResult | null {
  const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
  const round2 = (n: number) => Math.round(n * 100) / 100

  const sal = nonNeg(input.sal)
  const alu = nonNeg(input.alu)
  const bon = nonNeg(input.bon)
  const dep = Math.floor(nonNeg(input.dep))
  const edu = nonNeg(input.edu)
  const sau = nonNeg(input.sau)
  const pgbl = nonNeg(input.pgbl)
  const out = nonNeg(input.out)

  const rend = round2(sal * 12 + alu * 12 + bon)
  if (rend <= 0) return null

  const ded = round2(
    calcINSS(sal) * 12 +
      dep * 2275.08 +
      Math.min(edu * 12, 3561.5 * (1 + dep)) +
      sau * 12 +
      Math.min(pgbl * 12, rend * 0.12) +
      out * 12
  )
  const base = Math.max(0, rend - ded)
  let imp = calcTabelaIR(base)
  const red = rend <= 60000 ? imp : rend <= 88200 ? Math.max(0, 8429.73 - 0.095575 * rend) : 0
  imp = round2(Math.max(0, imp - Math.min(red, imp)))

  let simpl = calcTabelaIR(Math.max(0, rend - Math.min(rend * 0.2, 16754.34)))
  const redSimpl =
    rend <= 60000 ? simpl : rend <= 88200 ? Math.max(0, 8429.73 - 0.095575 * rend) : 0
  simpl = round2(Math.max(0, simpl - Math.min(redSimpl, simpl)))

  const pot = round2(imp * 0.06)
  let obs = ''
  if (pot < 1) {
    obs = 'Pela estimativa, você não tem imposto devido no ano — então não há valor a destinar. Uma doação pelo Pix continua fazendo diferença.'
  } else if (simpl < imp) {
    obs = 'Atenção: para o seu perfil, o modelo simplificado parece pagar menos imposto, e nele a doação não é abatida. Confirme com seu contador qual modelo usar.'
  } else {
    obs = 'Esse é o valor aproximado que você poderia destinar sem custo extra, abatido do seu imposto na declaração de 2027.'
  }
  return { rend, ded, imp, pot, obs }
}
