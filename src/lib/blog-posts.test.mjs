import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeBlogSlug,
  isValidBlogSlug,
  sanitizeBlogCoverUrl,
  sanitizeLinkHref,
  stripMarkdown,
  deriveExcerpt,
  estimateReadingTimeMinutes,
  parseSafeMarkdown,
  parseInlineMarkdown,
  resolveCanonicalUrl,
  resolveAbsoluteOgImage,
  mapDbBlogPostToPublic,
  loadPublicBlogPostsWithFallback,
  sanitizeAdminBlogPostPayload,
  detectImageMimeFromBytes,
  extractBlogStoragePath,
} from './blog-posts.ts'
import { IMAGINE_PROJECTS } from './imagine-site.ts'

test('R6: normalizeBlogSlug e isValidBlogSlug sanitizam acentos, corte 100 chars sem hifen final e bloqueiam reservados', () => {
  assert.equal(normalizeBlogSlug('  Prestação de Contas: Nov/2026! '), 'prestacao-de-contas-nov-2026')
  const cutSlug = normalizeBlogSlug('a'.repeat(99) + ' b')
  assert.equal(cutSlug.endsWith('-'), false)
  assert.equal(isValidBlogSlug(cutSlug), true)

  assert.equal(isValidBlogSlug('prestacao-de-contas-nov-2026'), true)
  assert.equal(isValidBlogSlug('admin'), false)
  assert.equal(isValidBlogSlug('api'), false)
  assert.equal(isValidBlogSlug('novo'), false)
  assert.equal(isValidBlogSlug('upload'), false)
  assert.equal(isValidBlogSlug('dd0107dc-1802-47af-8755-371603acf890'), false)
  assert.equal(isValidBlogSlug('a'), false)
})

test('R2: parseSafeMarkdown formata H2, negrito, listas, links com parenteses e neutraliza HTML/javascript/ReDoS', () => {
  const md = [
    '## Entrega de Novembro',
    '',
    'Foram entregues **140 cestas** e *320 marmitas*. Veja **[o relatório completo](https://imagineinstituto.com/blog/relatorio)**.',
    '',
    '- Item [seguro](https://imagineinstituto.com/projetos/social)',
    '- Cidade [Uberlandia]( https://pt.wikipedia.org/wiki/Uberl%C3%A2ndia_(Minas_Gerais) )',
    '- Link [perigoso](javascript:alert(1))',
    '',
    '##',
    '>',
    '-',
    '## ',
    '> ',
    '- ',
    '',
    '<script>alert("xss")</script>',
  ].join('\n')

  const blocks = parseSafeMarkdown(md)
  assert.equal(blocks[0].type, 'h2')
  assert.equal(blocks[1].type, 'p')
  if (blocks[1].type === 'p') {
    const strongLink = blocks[1].inlines.find((t) => t.type === 'link')
    assert.ok(strongLink && strongLink.type === 'link')
    assert.equal(strongLink.strong, true)
    assert.equal(strongLink.label, 'o relatório completo')
  }
  assert.equal(blocks[2].type, 'ul')
  if (blocks[2].type === 'ul') {
    assert.equal(blocks[2].items.length, 3)
    const safeLink = blocks[2].items[0].find((t) => t.type === 'link')
    assert.ok(safeLink && safeLink.type === 'link')
    assert.equal(safeLink.href, 'https://imagineinstituto.com/projetos/social')

    const parenLink = blocks[2].items[1].find((t) => t.type === 'link')
    assert.ok(parenLink && parenLink.type === 'link')
    assert.equal(parenLink.href, 'https://pt.wikipedia.org/wiki/Uberl%C3%A2ndia_(Minas_Gerais)')

    const badLink = blocks[2].items[2].find((t) => t.type === 'link')
    assert.equal(badLink, undefined)
  }
  assert.equal(blocks[3].type, 'p')
  assert.equal(blocks.length, 4)

  // Proteção contra bypass WHATWG (\t, \n, \r, /.//, credenciais) e esquemas perigosos
  assert.equal(sanitizeLinkHref('/\t/evil.com'), null)
  assert.equal(sanitizeLinkHref('/\n/evil.com'), null)
  assert.equal(sanitizeLinkHref('/.//evil.com'), null)
  assert.equal(sanitizeLinkHref('https://user:pass@evil.com/path'), null)
  assert.equal(sanitizeLinkHref('javascript:alert(1)'), null)
  assert.equal(sanitizeLinkHref('data:text/html,hi'), null)
  assert.equal(sanitizeLinkHref('/projetos/artes'), '/projetos/artes')
  assert.equal(sanitizeLinkHref('//evil.com'), null)
  assert.equal(sanitizeBlogCoverUrl('/.//evil.com/a.webp', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(sanitizeBlogCoverUrl('https://user:pass@evil.com/a.webp', '/img/sobre.webp'), '/img/sobre.webp')

  // Proteção contra ReDoS O(N^2) com '[' sem fechamento e parens desbalanceados
  const evilInputs = [
    '[a'.repeat(25000),
    '[a]('.repeat(12500),
    '[a](x '.repeat(8000),
  ]
  const t0 = performance.now()
  for (const evilInput of evilInputs) {
    stripMarkdown(evilInput)
    parseInlineMarkdown(evilInput)
  }
  const elapsedMs = performance.now() - t0
  assert.ok(elapsedMs < 200, `Esperado parsing linear < 200ms, levou ${elapsedMs.toFixed(1)}ms`)
})

test('R5: resolveCanonicalUrl, resolveAbsoluteOgImage e deriveExcerpt geram metadados seguros', () => {
  assert.equal(resolveCanonicalUrl('/blog/acao-social'), 'https://imagineinstituto.com/blog/acao-social')
  assert.equal(resolveAbsoluteOgImage('/img/social.webp'), 'https://imagineinstituto.com/img/social.webp')
  assert.equal(
    resolveAbsoluteOgImage('https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/a.webp'),
    'https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/a.webp'
  )
  assert.equal(resolveAbsoluteOgImage('javascript:alert(1)'), 'https://imagineinstituto.com/img/sobre.webp')
  assert.equal(resolveAbsoluteOgImage('/\t/evil.com/x.png'), 'https://imagineinstituto.com/img/sobre.webp')
  assert.equal(sanitizeBlogCoverUrl('http://inseguro.com/a.jpg', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(deriveExcerpt('## Título\n**Texto** com [link](https://a.com) bem curto.'), 'Título Texto com link bem curto.')
  assert.equal(estimateReadingTimeMinutes('palavra '.repeat(450)), 3)
})

test('R1 & R6 & R8: sanitizeAdminBlogPostPayload faz whitelist, bloqueia coersoes e preserva excerpt no PUT parcial', () => {
  const created = sanitizeAdminBlogPostPayload(
    {
      title: 'Entrega de Cestas Básicas em Novembro',
      content: 'Neste sábado entregamos 140 cestas básicas para famílias acompanhadas em Uberlândia.',
      post_type: 'accountability',
      status: 'published',
      author_id: '00000000-0000-0000-0000-000000000000',
      created_at: '2020-01-01T00:00:00Z',
    },
    'create',
    { authorId: '11111111-1111-4111-8111-111111111111' }
  )

  assert.equal(created.ok, true)
  if (created.ok) {
    assert.equal(created.data.slug, 'entrega-de-cestas-basicas-em-novembro')
    assert.equal(created.data.author_id, '11111111-1111-4111-8111-111111111111')
    assert.equal('created_at' in created.data, false)
    assert.equal(created.data.reading_time_minutes, 1)
    assert.ok(typeof created.data.published_at === 'string')
    assert.ok(typeof created.data.excerpt === 'string' && created.data.excerpt.length > 10)
  }

  // Update com excerpt vazio sem content re-deriva via existingContent em vez de zerar
  const updated = sanitizeAdminBlogPostPayload(
    {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Novo Título Atualizado',
      excerpt: '',
    },
    'update',
    { existingContent: 'Texto existente completo do artigo que deve gerar o resumo.' }
  )
  assert.equal(updated.ok, true)
  if (updated.ok) {
    assert.equal('slug' in updated.data, false)
    assert.equal(updated.data.excerpt, 'Texto existente completo do artigo que deve gerar o resumo.')
  }

  // Bloqueia coerções não-string
  const badStatus = sanitizeAdminBlogPostPayload(
    { id: '22222222-2222-4222-8222-222222222222', status: null },
    'update'
  )
  assert.equal(badStatus.ok, false)
  if (!badStatus.ok) assert.equal(badStatus.status, 422)

  const badType = sanitizeAdminBlogPostPayload(
    { id: '22222222-2222-4222-8222-222222222222', post_type: 123 },
    'update'
  )
  assert.equal(badType.ok, false)
  if (!badType.ok) assert.equal(badType.status, 422)

  const badCoverAlt = sanitizeAdminBlogPostPayload(
    { id: '22222222-2222-4222-8222-222222222222', cover_alt: 999 },
    'update'
  )
  assert.equal(badCoverAlt.ok, false)
  if (!badCoverAlt.ok) assert.equal(badCoverAlt.status, 422)

  const badSeoTitle = sanitizeAdminBlogPostPayload(
    { id: '22222222-2222-4222-8222-222222222222', seo_title: { text: 'oi' } },
    'update'
  )
  assert.equal(badSeoTitle.ok, false)
  if (!badSeoTitle.ok) assert.equal(badSeoTitle.status, 422)

  const badSeoDesc = sanitizeAdminBlogPostPayload(
    { id: '22222222-2222-4222-8222-222222222222', seo_description: false },
    'update'
  )
  assert.equal(badSeoDesc.ok, false)
  if (!badSeoDesc.ok) assert.equal(badSeoDesc.status, 422)

  const badSlug = sanitizeAdminBlogPostPayload(
    {
      title: 'Admin',
      slug: 'admin',
      content: 'Conteúdo válido com mais de dez caracteres.',
    },
    'create'
  )
  assert.equal(badSlug.ok, false)
  if (!badSlug.ok) assert.equal(badSlug.status, 422)
})

test('R4: mapDbBlogPostToPublic oculta rascunhos e loadPublicBlogPostsWithFallback retorna [] em falha', async () => {
  const draft = mapDbBlogPostToPublic({
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'rascunho-secreto',
    title: 'Rascunho Secreto',
    content: 'Texto que não pode vazar publicamente.',
    status: 'draft',
  })
  assert.equal(draft, null)

  const published = mapDbBlogPostToPublic(
    {
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'troca-de-faixas-2026',
      title: 'Troca de faixas 2026',
      content: 'Sessenta e cinco crianças participaram no tatame.',
      post_type: 'news',
      project_id: 'dd0107dc-1802-47af-8755-371603acf890',
      reading_time_minutes: 4,
      status: 'published',
      published_at: '2026-11-20T15:00:00Z',
    },
    IMAGINE_PROJECTS
  )
  assert.ok(published)
  assert.equal(published?.projectSlug, 'esporte')
  assert.equal(published?.projectColorClass, 'cor-azul')
  assert.equal(published?.readingTimeMinutes, 4)

  const origErr = console.error
  console.error = () => {}
  try {
    const fallback = await loadPublicBlogPostsWithFallback(async () => {
      throw new Error('Timeout simulado')
    })
    assert.deepEqual(fallback, [])
  } finally {
    console.error = origErr
  }
})

test('R7: detectImageMimeFromBytes e extractBlogStoragePath validam magic bytes e paths seguros', () => {
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20])
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0x49, 0x48, 0x44, 0x52])
  const polyglotJpg = new Uint8Array([0xff, 0xd8, 0xff, 0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e, 0, 0, 0, 0, 0])
  const fakeSvg = new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0x3e, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

  assert.equal(detectImageMimeFromBytes(webp), 'image/webp')
  assert.equal(detectImageMimeFromBytes(jpeg), 'image/jpeg')
  assert.equal(detectImageMimeFromBytes(png), 'image/png')
  assert.equal(detectImageMimeFromBytes(polyglotJpg), null)
  assert.equal(detectImageMimeFromBytes(fakeSvg), null)

  assert.equal(
    extractBlogStoragePath(
      'https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/covers/2026/11/dd0107dc-1802-47af-8755-371603acf890.webp',
      'https://zzxtethlsdjjfjjrqmlk.supabase.co'
    ),
    'covers/2026/11/dd0107dc-1802-47af-8755-371603acf890.webp'
  )
  assert.equal(
    extractBlogStoragePath(
      'https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/covers/2026/11/dd0107dc-1802-47af-8755-371603acf890.webp?download=1'
    ),
    null
  )
  assert.equal(
    extractBlogStoragePath(
      'http://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/covers/2026/11/dd0107dc-1802-47af-8755-371603acf890.webp'
    ),
    null
  )
  assert.equal(
    extractBlogStoragePath(
      'https://evil.com/storage/v1/object/public/blog/covers/2026/11/dd0107dc-1802-47af-8755-371603acf890.webp',
      'https://zzxtethlsdjjfjjrqmlk.supabase.co'
    ),
    null
  )
  assert.equal(
    extractBlogStoragePath('https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/blog/covers/../secret.webp'),
    null
  )
  assert.equal(
    extractBlogStoragePath('https://zzxtethlsdjjfjjrqmlk.supabase.co/storage/v1/object/public/avatars/a.webp'),
    null
  )
})
