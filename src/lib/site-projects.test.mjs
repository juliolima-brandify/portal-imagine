import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isValidUuid,
  normalizeSlug,
  isValidProjectSlug,
  sanitizeImageUrl,
  mapDbProjectToSiteProject,
  mapDbProjectsToSiteProjects,
  loadPublicSiteProjectsWithFallback,
  sanitizeAdminProjectPayload,
} from './site-projects.ts'
import { IMAGINE_PROJECTS } from './imagine-site.ts'

test('R2: normalizeSlug e isValidProjectSlug sanitizam acentos e bloqueiam slugs reservados e UUIDs', () => {
  assert.equal(normalizeSlug('  Música & Dança 2026! '), 'musica-danca-2026')
  assert.equal(normalizeSlug('Artes_Expressão'), 'artes-expressao')
  assert.equal(isValidProjectSlug('musica-danca-2026'), true)
  assert.equal(isValidProjectSlug('relatorios'), false)
  assert.equal(isValidProjectSlug('admin'), false)
  assert.equal(isValidProjectSlug('api'), false)
  assert.equal(isValidProjectSlug('geral'), false)
  assert.equal(isValidProjectSlug('natal'), false)
  assert.equal(isValidProjectSlug('dd0107dc-1802-47af-8755-371603acf890'), false)
  assert.equal(isValidUuid('dd0107dc-1802-47af-8755-371603acf890'), true)
  assert.equal(isValidUuid('nao-e-uuid'), false)
  assert.equal(isValidProjectSlug(''), false)
})

test('R2: sanitizeImageUrl aceita caminhos internos e https e bloqueia esquemas perigosos, /\\ e http://', () => {
  assert.equal(sanitizeImageUrl('/img/esporte.webp', '/img/sobre.webp'), '/img/esporte.webp')
  assert.equal(
    sanitizeImageUrl('https://cdn.exemplo.com/foto.webp', '/img/sobre.webp'),
    'https://cdn.exemplo.com/foto.webp'
  )
  assert.equal(sanitizeImageUrl('http://cdn.exemplo.com/foto.webp', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(sanitizeImageUrl('/\\evil.com/x.png', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(sanitizeImageUrl('javascript:alert(1)', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(sanitizeImageUrl('data:text/html,<script>', '/img/sobre.webp'), '/img/sobre.webp')
  assert.equal(sanitizeImageUrl('//evil.com/x.png', '/img/sobre.webp'), '/img/sobre.webp')
})

test('R1: mapDbProjectToSiteProject suporta site_data parcial e oculta projetos pausados/ocultos/nulos', () => {
  const partial = mapDbProjectToSiteProject({
    id: 'dd0107dc-1802-47af-8755-371603acf890',
    title: 'Oficina de Música',
    description: 'Aulas gratuitas de violão e coral.',
    category: 'cultura',
    status: 'active',
    image_url: '/img/arte.webp',
    slug: 'musica',
    show_on_site: true,
    site_order: 10,
    site_data: {},
  })

  assert.ok(partial)
  assert.equal(partial.id, 'musica')
  assert.equal(partial.causa, 'Cultura e Artes')
  assert.equal(partial.corClass, 'cor-magenta')
  assert.equal(partial.cardImg, '/img/arte.webp')
  assert.equal(partial.heroImg, '/img/arte.webp')
  assert.equal(partial.resumo, 'Aulas gratuitas de violão e coral.')
  assert.equal(partial.portalProjectId, 'dd0107dc-1802-47af-8755-371603acf890')
  assert.equal(partial.beneficiarios, undefined)

  assert.equal(
    mapDbProjectToSiteProject({
      id: 'uuid-2',
      title: 'Meio Ambiente',
      category: 'meio-ambiente',
      status: 'paused',
      slug: 'meio-ambiente',
      show_on_site: true,
    }),
    null
  )

  assert.equal(
    mapDbProjectToSiteProject({
      id: 'uuid-3',
      title: 'Projeto Interno',
      category: 'social',
      status: 'active',
      slug: 'interno',
      show_on_site: false,
    }),
    null
  )

  assert.equal(
    mapDbProjectToSiteProject({
      id: 'uuid-4',
      title: 'Status nulo',
      category: 'social',
      status: null,
      slug: 'nulo',
      show_on_site: true,
    }),
    null
  )

  const deduped = mapDbProjectsToSiteProjects([
    { id: 'u1', title: 'Primeiro', category: 'esporte', status: 'active', slug: 'esporte', show_on_site: true },
    { id: 'u2', title: 'Duplicado', category: 'esporte', status: 'active', slug: 'esporte', show_on_site: true },
  ])
  assert.equal(deduped.length, 1)
  assert.equal(deduped[0].titulo, 'Primeiro')
})

test('R4: loadPublicSiteProjectsWithFallback retorna IMAGINE_PROJECTS em erro ou lista vazia', async () => {
  const originalWarn = console.warn
  console.warn = () => {}
  try {
    const fallbackErr = await loadPublicSiteProjectsWithFallback(async () => {
      throw new Error('Supabase indisponível (503)')
    }, IMAGINE_PROJECTS)
    assert.equal(fallbackErr.length, IMAGINE_PROJECTS.length)
    assert.equal(fallbackErr[0].id, 'artes')

    const fallbackEmpty = await loadPublicSiteProjectsWithFallback(async () => [], IMAGINE_PROJECTS)
    assert.equal(fallbackEmpty.length, IMAGINE_PROJECTS.length)
  } finally {
    console.warn = originalWarn
  }

  const live = await loadPublicSiteProjectsWithFallback(
    async () => [
      {
        id: 'uuid-live',
        title: 'Projeto Dinâmico',
        description: 'Vindo do banco',
        category: 'educacao',
        status: 'active',
        image_url: '/img/educacao.webp',
        slug: 'dinamico',
        show_on_site: true,
        site_order: 1,
        site_data: { frente: 'Teste Real', fazemos: ['Item 1'] },
      },
    ],
    IMAGINE_PROJECTS
  )
  assert.equal(live.length, 1)
  assert.equal(live[0].id, 'dinamico')
  assert.equal(live[0].frente, 'Teste Real')
})

test('R5: sanitizeAdminProjectPayload aplica whitelist, bloqueia coerções inválidas, UUID inválido e show_on_site sem slug', () => {
  const validUuid = 'dd0107dc-1802-47af-8755-371603acf890'
  const created = sanitizeAdminProjectPayload(
    {
      title: 'Música Jovem',
      description: 'Aulas semanais',
      category: 'cultura',
      target_amount: 15000,
      status: 'active',
      slug: 'Música Jovem!',
      show_on_site: true,
      site_order: 7,
      image_url: '/img/arte2.webp',
      site_data: {
        frente: 'Música',
        corClass: 'cor-magenta',
        fazemos: ['Violão', '  ', 'Coral'],
        heroImg: 'javascript:alert(1)',
        portalCampaignSlug: '!!!',
        injectedKey: 'nope',
      },
      current_amount: 999999,
      created_at: '2020-01-01',
      has_funding_goal: true,
      framer_project_url: 'https://framer.com/x',
    },
    'create'
  )

  assert.equal(created.ok, true)
  if (created.ok) {
    assert.equal(created.data.slug, 'musica-jovem')
    assert.equal('current_amount' in created.data, false)
    assert.equal('created_at' in created.data, false)
    assert.equal('has_funding_goal' in created.data, false)
    assert.equal('framer_project_url' in created.data, false)
    const sd = created.data.site_data
    assert.deepEqual(sd.fazemos, ['Violão', 'Coral'])
    assert.equal('heroImg' in sd, false)
    assert.equal('portalCampaignSlug' in sd, false)
    assert.equal('injectedKey' in sd, false)
  }

  for (const badSlug of ['relatorios', 'geral', 'natal', validUuid]) {
    const res = sanitizeAdminProjectPayload({ title: 'Teste', category: 'esporte', slug: badSlug }, 'create')
    assert.equal(res.ok, false)
    if (!res.ok) assert.equal(res.status, 422)
  }

  // show_on_site: true sem slug deve retornar 422
  const noSlugVisible = sanitizeAdminProjectPayload(
    { title: 'Sem Slug', category: 'esporte', show_on_site: true, slug: null },
    'create'
  )
  assert.equal(noSlugVisible.ok, false)
  if (!noSlugVisible.ok) assert.equal(noSlugVisible.status, 422)

  // Coerções perigosas em site_order e target_amount devem falhar com 422
  for (const badNum of [null, '', '   ', false, true, []]) {
    const rOrder = sanitizeAdminProjectPayload({ id: validUuid, site_order: badNum }, 'update')
    assert.equal(rOrder.ok, false)
    if (!rOrder.ok) assert.equal(rOrder.status, 422)

    const rTarget = sanitizeAdminProjectPayload({ id: validUuid, target_amount: badNum }, 'update')
    assert.equal(rTarget.ok, false)
    if (!rTarget.ok) assert.equal(rTarget.status, 422)
  }

  // site_data não-objeto em PUT não deve zerar o JSONB
  const badSiteData = sanitizeAdminProjectPayload({ id: validUuid, site_data: 'texto' }, 'update')
  assert.equal(badSiteData.ok, false)
  if (!badSiteData.ok) assert.equal(badSiteData.status, 422)

  // Remover slug em PUT oculta automaticamente do site
  const clearSlug = sanitizeAdminProjectPayload({ id: validUuid, slug: null }, 'update')
  assert.equal(clearSlug.ok, true)
  if (clearSlug.ok) {
    assert.equal(clearSlug.data.slug, null)
    assert.equal(clearSlug.data.show_on_site, false)
  }

  // ID inválido em PUT retorna 400
  const badId = sanitizeAdminProjectPayload({ id: 'abc', status: 'paused' }, 'update')
  assert.equal(badId.ok, false)
  if (!badId.ok) assert.equal(badId.status, 400)

  const toggleStatus = sanitizeAdminProjectPayload({ id: validUuid, status: 'paused' }, 'update')
  assert.equal(toggleStatus.ok, true)
  if (toggleStatus.ok) {
    assert.equal(toggleStatus.id, validUuid)
    assert.deepEqual(toggleStatus.data, { status: 'paused' })
  }
})
