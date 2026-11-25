-- Seed idempotente dos 6 projetos oficiais do site institucional
-- Preserva UUIDs existentes (esporte, educacao, familias) e pausa/oculta os 2 projetos "Meio Ambiente" de teste.

BEGIN;

-- 1. Atualizar os 3 projetos existentes preservando UUIDs, target_amount e current_amount
UPDATE public.projects
SET
  title = 'Esporte e Juventude',
  description = 'Aulas de esporte e acompanhamento contínuo para formar disciplina, cooperação e confiança.',
  long_description = 'Aulas regulares de esporte, com professor que conhece cada aluno e acompanha a família. No tatame a criança aprende disciplina, respeito e a trabalhar em equipe.',
  category = 'esporte',
  status = 'active',
  location = 'Uberlândia, MG',
  image_url = '/img/esporte.webp',
  slug = 'esporte',
  show_on_site = true,
  site_order = 3,
  site_data = jsonb_build_object(
    'frente', 'Crianças e Juventude',
    'causa', 'Esporte',
    'corClass', 'cor-azul',
    'heroImg', '/img/esporte.webp',
    'alt', 'Turma de crianças de quimono sentada no tatame com o professor ao fundo',
    'resumo', 'Aulas de esporte e acompanhamento contínuo para formar disciplina, cooperação e confiança.',
    'intro', 'Aulas regulares de esporte, com professor que conhece cada aluno e acompanha a família. No tatame a criança aprende disciplina, respeito e a trabalhar em equipe.',
    'desafio', 'Em muitos bairros não há quadra, tatame nem aula de graça para criança. Sem um horário fixo de treino, o jovem fica sem rotina, sem professor por perto e sem turma.',
    'fazemos', jsonb_build_array(
      'Aulas regulares no tatame',
      'Valores: disciplina, respeito e cooperação',
      'Acompanhamento das famílias'
    ),
    'incentivoTag', 'Pode ser incentivado · Esporte',
    'incentivoAviso', 'este projeto pode ser inscrito na lei de incentivo de esporte. Quando for aprovado, você poderá destinar parte do seu IR para ele.',
    'portalCampaignSlug', 'esporte-social'
  )
WHERE id = 'dd0107dc-1802-47af-8755-371603acf890';

UPDATE public.projects
SET
  title = 'Saúde Emocional e Famílias Atípicas',
  description = 'Acompanhamento psicossocial e espaços de escuta para famílias atípicas e para quem atravessa desafios emocionais.',
  long_description = 'O Instituto estruturou atendimentos voltados à saúde mental e ao acolhimento de famílias atípicas, com acompanhamento psicossocial e espaços de escuta. Um cuidado especializado para quem enfrenta desafios que pouca gente vê.',
  category = 'saude',
  status = 'active',
  location = 'Uberlândia, MG',
  image_url = '/img/educacao2.webp',
  slug = 'familias',
  show_on_site = true,
  site_order = 5,
  site_data = jsonb_build_object(
    'frente', 'Acolhimento psicossocial',
    'causa', 'Saúde',
    'corClass', 'cor-magenta',
    'heroImg', '/img/educacao2.webp',
    'alt', 'Educadora abraçando um menino com protetor auricular',
    'resumo', 'Acompanhamento psicossocial e espaços de escuta para famílias atípicas e para quem atravessa desafios emocionais.',
    'intro', 'O Instituto estruturou atendimentos voltados à saúde mental e ao acolhimento de famílias atípicas, com acompanhamento psicossocial e espaços de escuta. Um cuidado especializado para quem enfrenta desafios que pouca gente vê.',
    'desafio', 'A família atípica vive uma rotina pesada, muitas vezes sem rede de apoio, com fila longa para atendimento e pouca gente disposta a ouvir.',
    'fazemos', jsonb_build_array(
      'Acompanhamento psicossocial',
      'Grupos e espaços de escuta',
      'Acolhimento de famílias atípicas'
    ),
    'portalCampaignSlug', 'saude-comunitaria'
  )
WHERE id = '6e302335-89a9-4336-9160-70c038576a97';

UPDATE public.projects
SET
  title = 'Educação',
  description = 'Reforço escolar, oficinas, cursos de capacitação e incentivo à leitura para abrir portas.',
  long_description = 'Reforço escolar para quem está ficando para trás, oficinas e cursos de capacitação para jovens e adultos, e incentivo à leitura. Quem aprende mais tem mais porta aberta.',
  category = 'educacao',
  status = 'active',
  location = 'Uberlândia, MG',
  image_url = '/img/educacao.webp',
  slug = 'educacao',
  show_on_site = true,
  site_order = 6,
  site_data = jsonb_build_object(
    'frente', 'Reforço, oficinas e capacitação',
    'causa', 'Educação',
    'corClass', 'cor-verde',
    'heroImg', '/img/educacao.webp',
    'alt', 'Menino concentrado escrevendo em uma atividade de reforço escolar',
    'resumo', 'Reforço escolar, oficinas, cursos de capacitação e incentivo à leitura para abrir portas.',
    'intro', 'Reforço escolar para quem está ficando para trás, oficinas e cursos de capacitação para jovens e adultos, e incentivo à leitura. Quem aprende mais tem mais porta aberta.',
    'desafio', 'A criança que não tem ninguém em casa para ajudar na lição vai ficando para trás na escola, e o adulto sem curso não consegue um emprego melhor.',
    'fazemos', jsonb_build_array(
      'Reforço escolar comunitário',
      'Oficinas e cursos de capacitação',
      'Incentivo à leitura'
    ),
    'portalCampaignSlug', 'educacao-digital'
  )
WHERE id = '8edcad55-041b-4c90-b53c-9cd120eb4c3b';

-- 2. Inserir/atualizar os 3 novos projetos oficiais (artes, amarelinha, social)
INSERT INTO public.projects (
  title, description, long_description, category, target_amount, current_amount,
  status, location, image_url, organization, slug, show_on_site, site_order, site_data
)
VALUES
(
  'Artes e Expressão',
  'Aulas contínuas de ballet, jazz, contemporâneo, hip hop e circo, e espetáculos que já entraram no calendário da cidade.',
  'Aulas de ballet, jazz, contemporâneo, hip hop e circo, toda semana, para crianças e adolescentes. Elas descobrem um talento, ganham confiança e aprendem a trabalhar em grupo. O trabalho é sério e profissional e chega ao palco nos espetáculos de Natal, Páscoa e férias de julho — como a Mostra Artística 2026, “Minha Mãe é Uma Crente”, no Teatro Municipal de Uberlândia.',
  'cultura',
  0,
  0,
  'active',
  'Uberlândia, MG',
  '/img/arte2.webp',
  'Instituto Imagine',
  'artes',
  true,
  1,
  jsonb_build_object(
    'frente', 'Ministério de Artes',
    'causa', 'Cultura e Artes',
    'corClass', 'cor-magenta',
    'heroImg', '/img/heroi-mostra18.webp',
    'alt', 'Bailarinas do Instituto Imagine em espetáculo no palco, com figurinos em tons de areia',
    'resumo', 'Aulas contínuas de ballet, jazz, contemporâneo, hip hop e circo, e espetáculos que já entraram no calendário da cidade.',
    'intro', 'Aulas de ballet, jazz, contemporâneo, hip hop e circo, toda semana, para crianças e adolescentes. Elas descobrem um talento, ganham confiança e aprendem a trabalhar em grupo. O trabalho é sério e profissional e chega ao palco nos espetáculos de Natal, Páscoa e férias de julho — como a Mostra Artística 2026, “Minha Mãe é Uma Crente”, no Teatro Municipal de Uberlândia.',
    'desafio', 'Em muitos bairros, criança nunca fez uma aula de dança nem subiu num palco. Aula particular custa caro, e sem ela fica difícil descobrir um talento e acreditar nele.',
    'fazemos', jsonb_build_array(
      'Ballet, jazz, contemporâneo e hip hop',
      'Circo',
      'Espetáculos e musicais no calendário da cidade',
      'Mostra Artística anual'
    ),
    'incentivoTag', 'Pode ser incentivado · Cultura',
    'incentivoAviso', 'este projeto pode ser inscrito na lei de incentivo de cultura. Quando for aprovado, você poderá destinar parte do seu IR para ele.',
    'portalCampaignSlug', 'artes'
  )
),
(
  'Projeto Amarelinha',
  'Contraturno escolar como tempo de convivência, cuidado e descoberta. Cada atividade tem uma intenção.',
  'O Projeto Amarelinha recebe as crianças no período em que elas não estão na escola. Ali elas brincam, convivem, leem e são cuidadas por gente que acompanha cada uma. Brincar também é aprender, e cada atividade é pensada com intenção.',
  'educacao',
  0,
  0,
  'active',
  'Uberlândia, MG',
  '/img/hero2.webp',
  'Instituto Imagine',
  'amarelinha',
  true,
  2,
  jsonb_build_object(
    'frente', 'Contraturno socioeducativo',
    'causa', 'Educação',
    'corClass', 'cor-verde',
    'heroImg', '/img/hero2.webp',
    'alt', 'Menina sorrindo de óculos rosa à mesa de atividades do Projeto Amarelinha',
    'resumo', 'Contraturno escolar como tempo de convivência, cuidado e descoberta. Cada atividade tem uma intenção.',
    'intro', 'O Projeto Amarelinha recebe as crianças no período em que elas não estão na escola. Ali elas brincam, convivem, leem e são cuidadas por gente que acompanha cada uma. Brincar também é aprender, e cada atividade é pensada com intenção.',
    'desafio', 'Depois da aula, muita criança fica sozinha em casa ou na rua, sem lugar seguro e sem ninguém acompanhando. É nesse horário que o contraturno faz diferença.',
    'fazemos', jsonb_build_array(
      'Atividades de convivência e brincadeira dirigida',
      'Acompanhamento e cuidado no contraturno',
      'Leitura e estímulo ao aprendizado'
    ),
    'portalCampaignSlug', 'amarelinha'
  )
),
(
  'Ação Social e Comunidade',
  'Marmitas para quem está na rua, cestas básicas, Campanha do Agasalho e brinquedos novos no Natal Feliz.',
  'A frente social cuida de pessoas e famílias em vulnerabilidade, com escuta, orientação e encaminhamento para a rede pública. O Ministério Bom Samaritano leva marmitas a pessoas em situação de rua, distribui cestas básicas e visita casas de recuperação, asilos e orfanatos. Duas campanhas marcam o ano: a Campanha do Agasalho e o Natal Feliz, que entrega brinquedos novos a crianças de comunidades carentes.',
  'social',
  0,
  0,
  'active',
  'Uberlândia, MG',
  '/img/doacao.webp',
  'Instituto Imagine',
  'social',
  true,
  4,
  jsonb_build_object(
    'frente', 'Bom Samaritano · Natal Feliz · Agasalho',
    'causa', 'Assistência Social',
    'corClass', 'cor-laranja',
    'heroImg', '/img/social.webp',
    'alt', 'Voluntários do Instituto Imagine organizando sacolas de doação',
    'resumo', 'Marmitas para quem está na rua, cestas básicas, Campanha do Agasalho e brinquedos novos no Natal Feliz.',
    'intro', 'A frente social cuida de pessoas e famílias em vulnerabilidade, com escuta, orientação e encaminhamento para a rede pública. O Ministério Bom Samaritano leva marmitas a pessoas em situação de rua, distribui cestas básicas e visita casas de recuperação, asilos e orfanatos. Duas campanhas marcam o ano: a Campanha do Agasalho e o Natal Feliz, que entrega brinquedos novos a crianças de comunidades carentes.',
    'desafio', 'Tem gente em situação de rua sem ter o que comer, família que chega ao fim do mês sem comida em casa e criança que passa o Natal sem um presente.',
    'fazemos', jsonb_build_array(
      'Marmitas para pessoas em situação de rua',
      'Cestas básicas para famílias',
      'Visitas a asilos, orfanatos e casas de recuperação',
      'Campanha do Agasalho e Natal Feliz'
    ),
    'portalCampaignSlug', 'social'
  )
)
ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  image_url = EXCLUDED.image_url,
  show_on_site = EXCLUDED.show_on_site,
  site_order = EXCLUDED.site_order,
  site_data = EXCLUDED.site_data;

-- 3. Pausar e ocultar do site os 2 projetos "Meio Ambiente" de teste
UPDATE public.projects
SET
  status = 'paused',
  show_on_site = false,
  slug = NULL
WHERE id IN (
  '7ca94b90-3d53-40ba-bffb-58f39c66bef7',
  '09b9bf45-b99d-466a-b631-6ee5f5fe9d49'
);

COMMIT;
