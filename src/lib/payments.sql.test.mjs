import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { transitionDonationState } from './payments.ts'

// Testes executáveis das migrações de pagamentos em Postgres local descartável (PGlite).
// Nunca conecta ao Supabase: o banco é criado em memória para cada teste.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const M25 = '20261125_harden_rls_and_remove_framer_trigger.sql'
const M26 = '20261126_asaas_payments_and_webhooks.sql'
const M27 = '20261127_banca_fixes.sql'
const M28 = '20261128_banca_r3_fixes.sql'
const M29 = '20261129_banca_r4_fixes.sql'

// Estado do banco antes da migração 20261126 (tabelas base do projeto, com as colunas que 26 e 27 tocam).
const FIXTURE = `
-- service_role com BYPASSRLS, como no Supabase (a rota de servidor escreve sem política).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'donor'
);
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Projeto',
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  show_on_site BOOLEAN NOT NULL DEFAULT true,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id),
  campaign_slug TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency TEXT,
  anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.donations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.profiles, public.projects, public.donations, public.favorites TO service_role;
`

function migrationSql(name) {
  return fs.readFileSync(path.join(repoRoot, 'supabase/migrations', name), 'utf8')
}

async function freshDb(migrations = []) {
  const db = new PGlite()
  await db.exec(FIXTURE)
  for (const name of migrations) await db.exec(migrationSql(name))
  return db
}

/** Troca de papel como o PostgREST faz: authenticated/anon/service_role com o JWT do usuário. */
async function as(db, role, jwtSub = '') {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${jwtSub}', false);`)
  if (role) await db.exec(`SET ROLE ${role}`)
}

async function reset(db) {
  await as(db, null)
}

async function insertAuthUser(db, id, email, confirmed = true) {
  await db.query(
    `INSERT INTO auth.users (id, email, email_confirmed_at) VALUES ($1, $2, CASE WHEN $3::boolean THEN now() END)`,
    [id, email, confirmed]
  )
  await db.query(`INSERT INTO public.profiles (id, email, name) VALUES ($1, $2, 'Nome')`, [id, email])
}

async function insertAuthUserOnly(db, id, email) {
  await db.query(`INSERT INTO auth.users (id, email, email_confirmed_at) VALUES ($1, $2, now())`, [id, email])
}

async function insertProject(db, currentAmount = 0) {
  const { rows } = await db.query(
    `INSERT INTO public.projects (title, slug, current_amount) VALUES ('Projeto teste', 'projeto-teste', $1) RETURNING id`,
    [currentAmount]
  )
  return rows[0].id
}

async function insertDonation(db, o) {
  const { rows } = await db.query(
    `INSERT INTO public.donations (user_id, project_id, amount, status, refunded_amount, asaas_payment_id, donor_email, anonymous, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, now()))
     RETURNING id`,
    [
      o.userId ?? null,
      o.projectId ?? null,
      o.amount,
      o.status ?? 'pending',
      o.refunded ?? 0,
      o.paymentId ?? null,
      o.email ?? null,
      o.anonymous ?? false,
      o.createdAt ?? null,
    ]
  )
  return rows[0].id
}

async function readDonation(db, id) {
  const { rows } = await db.query(
    `SELECT status, refunded_amount::float8 AS refunded_amount, amount::float8 AS amount, donor_email FROM public.donations WHERE id = $1`,
    [id]
  )
  return rows[0]
}

async function projectAmount(db, id) {
  const { rows } = await db.query(`SELECT current_amount::float8 AS amount FROM public.projects WHERE id = $1`, [id])
  return rows[0].amount
}

/** Chama apply_asaas_webhook_event como service_role (único papel que pode executá-la). */
async function webhook(db, o) {
  await as(db, 'service_role')
  const { rows } = await db.query(
    `SELECT public.apply_asaas_webhook_event(
       p_event_id => $1::text,
       p_event_type => $2::text,
       p_external_reference => $3::text,
       p_asaas_checkout_id => $4::text,
       p_asaas_payment_id => $5::text,
       p_asaas_subscription_id => $6::text,
       p_asaas_customer_id => NULL::text,
       p_target_status => $7::text,
       p_payment_method => NULL::text,
       p_amount => $8::numeric,
       p_donor_name => NULL::text,
       p_donor_email => $9::text,
       p_payload => '{}'::jsonb,
       p_refunded_amount => $10::numeric
     ) AS r`,
    [
      o.eventId,
      o.type,
      o.externalRef ?? null,
      o.checkoutId ?? null,
      o.paymentId ?? null,
      o.subscriptionId ?? null,
      o.target ?? null,
      o.amount ?? null,
      o.email ?? null,
      o.refunded ?? null,
    ]
  )
  await reset(db)
  return rows[0].r
}

const SERVICE_ROLE_SUB = '' // service_role não usa JWT de usuário

test('itens 3 e 9: estorno parcial antes da confirmação se mantém; a confirmação vira partially_refunded (100 -> 30 -> CONFIRMED)', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const projectId = await insertProject(db, 0)
  const id = await insertDonation(db, { projectId, amount: 100, status: 'pending', paymentId: 'pay_3' })

  const partial = await webhook(db, {
    eventId: 'evt_3a', type: 'PAYMENT_PARTIALLY_REFUNDED', paymentId: 'pay_3',
    target: 'partially_refunded', amount: 100, refunded: 30,
  })
  assert.equal(partial.matched, true)
  assert.equal(partial.refund_changed, true)
  let d = await readDonation(db, id)
  assert.equal(d.status, 'pending', 'pendente continua pendente')
  assert.equal(d.refunded_amount, 30, 'estornado 30 gravado antes da confirmação')
  assert.equal(await projectAmount(db, projectId), 0, 'pendente não entra no saldo')

  const confirmed = await webhook(db, {
    eventId: 'evt_3b', type: 'PAYMENT_CONFIRMED', paymentId: 'pay_3', target: 'completed', amount: 100,
  })
  assert.equal(confirmed.current_status, 'partially_refunded')
  d = await readDonation(db, id)
  assert.equal(d.status, 'partially_refunded')
  assert.equal(d.refunded_amount, 30)
  assert.equal(await projectAmount(db, projectId), 70, 'projeto recebe o líquido 70')
  await db.close()
})

test('item 4: estorno total grava refunded_amount = amount; parcial atrasado sobre refunded não altera nada nem alerta', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const projectId = await insertProject(db, 0)
  const id = await insertDonation(db, { projectId, amount: 100, status: 'completed', paymentId: 'pay_4' })
  assert.equal(await projectAmount(db, projectId), 100)

  const total = await webhook(db, {
    eventId: 'evt_4a', type: 'PAYMENT_REFUNDED', paymentId: 'pay_4', target: 'refunded', amount: 100,
  })
  assert.equal(total.current_status, 'refunded')
  let d = await readDonation(db, id)
  assert.equal(d.refunded_amount, 100, 'estorno total grava o valor total')
  assert.equal(await projectAmount(db, projectId), 0)

  const late = await webhook(db, {
    eventId: 'evt_4b', type: 'PAYMENT_PARTIALLY_REFUNDED', paymentId: 'pay_4',
    target: 'partially_refunded', amount: 100, refunded: 30,
  })
  assert.equal(late.current_status, 'refunded')
  assert.equal(late.status_changed, false)
  assert.equal(late.refund_changed, false, 'sem alerta de estorno atrasado')
  d = await readDonation(db, id)
  assert.equal(d.status, 'refunded')
  assert.equal(d.refunded_amount, 100, 'valor estornado não diminui')
  await db.close()
})

test('item 8: backfill de refunded_amount em doações já refunded, pela migração 28 (preservado pela 29)', async () => {
  const db = await freshDb([M25, M26, M27])
  await insertAuthUser(db, '00000000-0000-0000-0000-00000000000a', 'antes@x.com')
  const id = await insertDonation(db, {
    userId: '00000000-0000-0000-0000-00000000000a', amount: 80, status: 'refunded', refunded: 0,
  })
  assert.equal((await readDonation(db, id)).refunded_amount, 0, 'estado anterior à correção')
  await db.exec(migrationSql(M28))
  assert.equal((await readDonation(db, id)).refunded_amount, 80)
  await db.exec(migrationSql(M29))
  assert.equal((await readDonation(db, id)).refunded_amount, 80)
  await db.close()
})

test('item 9: PARTIALLY_REFUNDED sem valor concluído não muda status nem registra estorno', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const projectId = await insertProject(db, 0)
  const pending = await insertDonation(db, { projectId, amount: 100, status: 'pending', paymentId: 'pay_9a' })
  const confirmed = await insertDonation(db, { projectId, amount: 50, status: 'completed', paymentId: 'pay_9b' })

  const r1 = await webhook(db, {
    eventId: 'evt_9a', type: 'PAYMENT_PARTIALLY_REFUNDED', paymentId: 'pay_9a', target: 'partially_refunded', amount: 100,
  })
  assert.equal(r1.current_status, 'pending')
  assert.equal(r1.refund_changed, false)
  assert.equal((await readDonation(db, pending)).refunded_amount, 0)

  const r2 = await webhook(db, {
    eventId: 'evt_9b', type: 'PAYMENT_PARTIALLY_REFUNDED', paymentId: 'pay_9b', target: 'partially_refunded', amount: 50,
  })
  assert.equal(r2.current_status, 'completed', 'confirmada continua confirmada sem valor')
  assert.equal(r2.status_changed, false)
  assert.equal((await readDonation(db, confirmed)).status, 'completed')
  assert.equal(await projectAmount(db, projectId), 50)
  await db.close()
})

test('item 5: evento sem doação responde matched=false e libera o event_id para nova entrega', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const r = await webhook(db, { eventId: 'evt_nao_casa', type: 'PAYMENT_CONFIRMED', paymentId: 'pay_inexistente', target: 'completed', amount: 10 })
  assert.equal(r.matched, false)
  assert.equal(r.duplicate, false)
  const { rows } = await db.query(`SELECT count(*)::int AS n FROM public.webhook_events WHERE event_id = 'evt_nao_casa'`)
  assert.equal(rows[0].n, 0, 'sem linha em webhook_events: uma nova entrega pode casar depois')

  // A rota grava o evento em webhook_unmatched (service_role), que o visitante e o usuário não leem.
  await as(db, 'service_role')
  await db.query(
    `INSERT INTO public.webhook_unmatched (event_id, event_type, asaas_payment_id, payload) VALUES ('evt_nao_casa', 'PAYMENT_CONFIRMED', 'pay_inexistente', '{}')`
  )
  await reset(db)
  await as(db, 'authenticated', SERVICE_ROLE_SUB)
  await assert.rejects(db.query(`SELECT count(*) FROM public.webhook_unmatched`), /permission denied/)
  await reset(db)
  await as(db, 'anon')
  await assert.rejects(db.query(`SELECT count(*) FROM public.webhook_unmatched`), /permission denied/)
  await reset(db)
  await db.close()
})

test('item 1: authenticated não troca profiles.email (vira erro); o e-mail segue auth.users', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const ATTACKER = '00000000-0000-0000-0000-0000000000a1'
  const VICTIM = '00000000-0000-0000-0000-0000000000b1'
  await insertAuthUser(db, ATTACKER, 'atacante@x.com')
  await insertAuthUser(db, VICTIM, 'vitima@x.com')

  // Inserção pelo cliente: o e-mail gravado é o da própria conta em auth.users, não o informado.
  await insertAuthUserOnly(db, '00000000-0000-0000-0000-0000000000a9', 'novo@x.com')
  await as(db, 'authenticated', '00000000-0000-0000-0000-0000000000a9')
  await db.query(
    `INSERT INTO public.profiles (id, email, name) VALUES ('00000000-0000-0000-0000-0000000000a9', 'hacker@x.com', 'Novo')`
  )
  await reset(db)
  const inserted = await db.query(`SELECT email FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000a9'`)
  assert.equal(inserted.rows[0].email, 'novo@x.com')

  await as(db, 'authenticated', ATTACKER)
  await assert.rejects(
    db.query(`UPDATE public.profiles SET email = 'vitima@x.com' WHERE id = $1`, [ATTACKER]),
    /alterado pelo provedor|42501/
  )
  await reset(db)
  await as(db, 'authenticated', ATTACKER)
  await db.query(`UPDATE public.profiles SET name = 'Outro nome' WHERE id = $1`, [ATTACKER])
  await reset(db)

  const { rows } = await db.query(`SELECT email, name FROM public.profiles WHERE id = $1`, [ATTACKER])
  assert.equal(rows[0].email, 'atacante@x.com')
  assert.equal(rows[0].name, 'Outro nome', 'o próprio nome continua editável')

  // E-mail muda só pelo provedor (auth.users): o perfil acompanha.
  await db.query(`UPDATE auth.users SET email = 'nova@x.com' WHERE id = $1`, [ATTACKER])
  const after = await db.query(`SELECT email FROM public.profiles WHERE id = $1`, [ATTACKER])
  assert.equal(after.rows[0].email, 'nova@x.com')
  await db.close()
})

test('item 1: a conta do doador é achada por auth.users (e-mail confirmado, exato), nunca por profiles.email', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const VICTIM = '00000000-0000-0000-0000-0000000000b2'
  const UNCONFIRMED = '00000000-0000-0000-0000-0000000000c2'
  const SPOOF = '00000000-0000-0000-0000-0000000000d2'
  await insertAuthUser(db, VICTIM, 'vitima2@x.com')
  await insertAuthUser(db, UNCONFIRMED, 'pendente@x.com', false)
  await insertAuthUser(db, SPOOF, 'real@x.com')
  // Perfil com e-mail divergente (legado ou adulterado direto no banco): não vale para a busca.
  await db.query(`UPDATE public.profiles SET email = 'fantasma@x.com' WHERE id = $1`, [SPOOF])

  await as(db, 'service_role')
  const found = await db.query(`SELECT user_id FROM public.find_confirmed_auth_user_ids_by_email($1)`, ['  VITIMA2@x.com '])
  assert.deepEqual(found.rows.map((r) => r.user_id), [VICTIM], 'comparação exata e normalizada')
  const unconfirmed = await db.query(`SELECT user_id FROM public.find_confirmed_auth_user_ids_by_email($1)`, ['pendente@x.com'])
  assert.deepEqual(unconfirmed.rows, [], 'e-mail não confirmado não vincula doação')
  const spoofed = await db.query(`SELECT user_id FROM public.find_confirmed_auth_user_ids_by_email($1)`, ['fantasma@x.com'])
  assert.deepEqual(spoofed.rows, [], 'profiles.email não é fonte de identidade')
  await reset(db)

  await as(db, 'authenticated', VICTIM)
  await assert.rejects(
    db.query(`SELECT user_id FROM public.find_confirmed_auth_user_ids_by_email($1)`, ['vitima2@x.com']),
    /permission denied/
  )
  await reset(db)
  await db.close()
})

test('item 7: e-mails de doação e de perfil são gravados normalizados (lower/trim)', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  await insertAuthUser(db, '00000000-0000-0000-0000-0000000000e1', 'Mixed@X.com')
  const id = await insertDonation(db, { amount: 10, status: 'pending', email: '  Foo@X.com ' })
  assert.equal((await readDonation(db, id)).donor_email, 'foo@x.com')
  await db.query(`UPDATE public.donations SET donor_email = ' BAR@x.com ' WHERE id = $1`, [id])
  assert.equal((await readDonation(db, id)).donor_email, 'bar@x.com')
  const prof = await db.query(`SELECT email FROM public.profiles WHERE id = '00000000-0000-0000-0000-0000000000e1'`)
  assert.equal(prof.rows[0].email, 'mixed@x.com')
  await db.close()
})

test('item 10: relatório público devolve só agregados (sem PII) e o visitante não lê donations', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const U1 = '00000000-0000-0000-0000-0000000000f1'
  const U2 = '00000000-0000-0000-0000-0000000000f2'
  await insertAuthUser(db, U1, 'u1@x.com')
  await insertAuthUser(db, U2, 'u2@x.com')
  const P = await insertProject(db, 0)
  await insertDonation(db, { userId: U1, projectId: P, amount: 100, status: 'completed', email: 'Ana@x.com', paymentId: 'r1' })
  await insertDonation(db, { userId: U1, projectId: P, amount: 50, status: 'completed', email: 'ana@x.com', paymentId: 'r2' })
  await insertDonation(db, { userId: U2, projectId: P, amount: 100, status: 'partially_refunded', refunded: 40, paymentId: 'r3' })
  await insertDonation(db, { userId: U2, projectId: P, amount: 30, status: 'refunded', refunded: 30, email: 'x@x.com', paymentId: 'r4' })
  await insertDonation(db, { projectId: P, amount: 10, status: 'pending', paymentId: 'r5' })
  await insertDonation(db, { projectId: P, amount: 20, status: 'completed', anonymous: true, paymentId: 'r6' })

  await as(db, 'anon')
  const { rows } = await db.query(`SELECT public.get_project_public_report($1::uuid) AS report`, [P])
  const report = rows[0].report
  await reset(db)

  // 100 + 50 + (100 - 40) + 20 = 230; doações reconhecidas = 4; doadores = ana, U2 e a anônima.
  assert.equal(Number(report.net_total), 230)
  assert.equal(report.donation_count, 4)
  assert.equal(report.unique_donors, 3)
  assert.equal(report.monthly.length, 1)
  assert.equal(Number(report.monthly[0].net), 230)
  assert.equal(report.monthly[0].donors, 3)
  assert.equal(report.recent.length, 4)
  const serialized = JSON.stringify(report)
  assert.equal(serialized.includes('@'), false, 'nenhum e-mail no agregado')
  assert.equal(serialized.includes(U1), false, 'nenhum user_id no agregado')
  assert.equal(serialized.includes('Ana'), false, 'nenhum nome no agregado')

  await as(db, 'anon')
  await assert.rejects(db.query(`SELECT count(*) FROM public.donations`), /permission denied/)
  await reset(db)
  await db.close()
})

test('item 11: totais do admin por status vêm da RPC agregada e não são lidos por anon', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const P = await insertProject(db, 0)
  await insertDonation(db, { projectId: P, amount: 100, status: 'completed', paymentId: 't1', email: 'a@x.com' })
  await insertDonation(db, { projectId: P, amount: 100, status: 'partially_refunded', refunded: 40, paymentId: 't2', email: 'b@x.com' })
  await insertDonation(db, { projectId: P, amount: 30, status: 'refunded', refunded: 30, paymentId: 't3' })
  await insertDonation(db, { projectId: P, amount: 10, status: 'pending', paymentId: 't4' })

  await as(db, 'service_role')
  const { rows } = await db.query(`SELECT public.admin_donation_totals() AS t`)
  await reset(db)
  const t = rows[0].t
  assert.equal(t.by_status.completed.count, 1)
  assert.equal(Number(t.by_status.completed.net), 100)
  assert.equal(Number(t.by_status.partially_refunded.net), 60)
  assert.equal(Number(t.by_status.partially_refunded.refunded), 40)
  assert.equal(Number(t.by_status.refunded.refunded), 30)
  assert.equal(Number(t.by_status.pending.gross), 10)
  // Só doações reconhecidas (completed e partially_refunded) contam: a@x.com e b@x.com.
  assert.equal(t.unique_donors, 2)

  await as(db, 'anon')
  await assert.rejects(db.query(`SELECT public.admin_donation_totals()`), /permission denied/)
  await reset(db)
  await db.close()
})

test('apply_asaas_webhook_event: renovação com parcela nova cria doação concluída e soma ao projeto', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const P = await insertProject(db, 0)
  await insertDonation(db, { projectId: P, amount: 100, status: 'pending', paymentId: 'sub_pay_1' })
  await db.query(`UPDATE public.donations SET is_recurring = true, asaas_subscription_id = 'sub_1'`)
  const r = await webhook(db, {
    eventId: 'evt_renew', type: 'PAYMENT_CONFIRMED', paymentId: 'sub_pay_2', subscriptionId: 'sub_1', target: 'completed', amount: 100,
  })
  assert.equal(r.created_renewal, true)
  assert.equal(r.current_status, 'completed')
  assert.equal(await projectAmount(db, P), 100)
  await db.close()
})

test('idempotência das migrações (incluindo fora de ordem após R4): GRANT, RPC única, chk disputed e report preservados', async () => {
  const sequences = [
    [M25, M26, M27, M28, M29],
    [M25, M26, M27, M28, M29, M27],
    [M25, M26, M27, M28, M29, M28],
    [M25, M26, M27, M28, M29, M26],
    [M25, M26, M27, M28, M29, M29],
  ]
  for (const seq of sequences) {
    const db = await freshDb(seq)
    const { rows } = await db.query(`
      SELECT has_column_privilege('authenticated', 'public.donations', 'refunded_amount', 'SELECT') AS auth_ok,
             has_column_privilege('anon', 'public.donations', 'refunded_amount', 'SELECT') AS anon_ok,
             (SELECT count(*)::int FROM pg_proc WHERE proname = 'apply_asaas_webhook_event') AS fn_count,
             (SELECT o_status FROM public.asaas_donation_transition('completed', 100, 0, 'disputed', NULL)) AS disp_status,
             to_regprocedure('public.admin_donations_report(timestamptz,timestamptz,uuid)') IS NOT NULL AS has_report`)
    assert.equal(rows[0].auth_ok, true, `GRANT ausente na sequência ${seq.join(' → ')}`)
    assert.equal(rows[0].anon_ok, false, `anon não pode ler o estorno (${seq.join(' → ')})`)
    assert.equal(rows[0].fn_count, 1, `uma única versão da RPC (${seq.join(' → ')})`)
    assert.equal(rows[0].disp_status, 'disputed', `guarda R4 deve preservar disputed (${seq.join(' → ')})`)
    assert.equal(rows[0].has_report, true, `admin_donations_report preservada (${seq.join(' → ')})`)
    await db.close()
  }
})

test('espelho TypeScript: transitionDonationState é igual à função SQL em toda a matriz de entradas (inclui disputed)', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const statuses = ['pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed']
  const targets = [null, 'pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed']
  const currents = [0, 30]
  const incomings = [null, 0, 30, 100]
  let checked = 0
  for (const status of statuses) {
    for (const target of targets) {
      for (const cur of currents) {
        for (const inc of incomings) {
          const sql = (
            await db.query(
              `SELECT o_status, o_refunded::float8 AS o_refunded FROM public.asaas_donation_transition($1, $2, $3, $4, $5)`,
              [status, 100, cur, target, inc]
            )
          ).rows[0]
          const ts = transitionDonationState({ status, amount: 100, refundedCurrent: cur, target, refundedIn: inc })
          const label = `${status} + ${target} (atual ${cur}, recebido ${inc})`
          assert.equal(ts.status, sql.o_status, label)
          assert.equal(ts.refunded, sql.o_refunded, label)
          checked++
        }
      }
    }
  }
  assert.equal(checked, 6 * 7 * 2 * 4)
  await db.close()
})

test('R4 Bloco 1 (D8): disputed sai de projects.current_amount sem cravar refunded_amount e pode ser revertido na vitória ou encerrado na derrota', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const P = await insertProject(db, 0)
  const d1 = await insertDonation(db, { projectId: P, amount: 100, status: 'completed', paymentId: 'pay_disp_win' })
  const d2 = await insertDonation(db, { projectId: P, amount: 80, status: 'partially_refunded', refunded: 20, paymentId: 'pay_disp_partial' })
  assert.equal(await projectAmount(db, P), 160)

  // Disputa aberta em ambas: sai do saldo, mas refunded_amount não é sobrescrito com amount.
  await webhook(db, { eventId: 'e_d1', type: 'PAYMENT_CHARGEBACK_DISPUTE', paymentId: 'pay_disp_win', target: 'disputed', amount: 100 })
  await webhook(db, { eventId: 'e_d2', type: 'PAYMENT_CHARGEBACK_DISPUTE', paymentId: 'pay_disp_partial', target: 'disputed', amount: 80 })
  assert.equal((await readDonation(db, d1)).status, 'disputed')
  assert.equal((await readDonation(db, d1)).refunded_amount, 0)
  assert.equal((await readDonation(db, d2)).status, 'disputed')
  assert.equal((await readDonation(db, d2)).refunded_amount, 20)
  assert.equal(await projectAmount(db, P), 0)

  // Vitória em d1 e d2: restauram completed (100) e partially_refunded (80 - 20 = 60).
  await webhook(db, { eventId: 'e_w1', type: 'PAYMENT_CONFIRMED', paymentId: 'pay_disp_win', target: 'completed', amount: 100 })
  await webhook(db, { eventId: 'e_w2', type: 'PAYMENT_RECEIVED', paymentId: 'pay_disp_partial', target: 'completed', amount: 80 })
  assert.equal((await readDonation(db, d1)).status, 'completed')
  assert.equal((await readDonation(db, d2)).status, 'partially_refunded')
  assert.equal(await projectAmount(db, P), 160)

  // Nova disputa seguida de derrota definitiva: refunded terminal = amount, irreversível.
  await webhook(db, { eventId: 'e_d3', type: 'PAYMENT_CHARGEBACK_DISPUTE', paymentId: 'pay_disp_win', target: 'disputed', amount: 100 })
  await webhook(db, { eventId: 'e_l3', type: 'PAYMENT_CHARGEBACK_REQUESTED', paymentId: 'pay_disp_win', target: 'refunded', amount: 100 })
  assert.equal((await readDonation(db, d1)).status, 'refunded')
  assert.equal((await readDonation(db, d1)).refunded_amount, 100)
  assert.equal(await projectAmount(db, P), 60)

  await webhook(db, { eventId: 'e_late_win', type: 'PAYMENT_CONFIRMED', paymentId: 'pay_disp_win', target: 'completed', amount: 100 })
  assert.equal((await readDonation(db, d1)).status, 'refunded', 'refunded definitivo não reverte')
  await db.close()
})

test('R4 Bloco 2 (P4): targetStatus=null em assinatura existente retorna matched=false e não cria renovação fantasma', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const P = await insertProject(db, 0)
  await insertDonation(db, { projectId: P, amount: 100, status: 'completed', paymentId: 'sub_p1' })
  await db.query(`UPDATE public.donations SET is_recurring = true, asaas_subscription_id = 'sub_p4'`)

  const upd = await webhook(db, {
    eventId: 'evt_p4_null', type: 'PAYMENT_UPDATED', paymentId: 'sub_p2', subscriptionId: 'sub_p4', target: null, amount: 100,
  })
  assert.equal(upd.matched, false)
  assert.equal(upd.created_renewal, false)
  const { rows: countRows } = await db.query(`SELECT count(*)::int AS n FROM public.donations`)
  assert.equal(countRows[0].n, 1)

  const conf = await webhook(db, {
    eventId: 'evt_p4_conf', type: 'PAYMENT_CONFIRMED', paymentId: 'sub_p2', subscriptionId: 'sub_p4', target: 'completed', amount: 100,
  })
  assert.equal(conf.matched, true)
  assert.equal(conf.created_renewal, true)
  assert.equal(await projectAmount(db, P), 200)
  await db.close()
})

test('R4 Bloco 3: get_project_public_report respeita visibilidade RLS para projetos ocultos', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const DONOR = '00000000-0000-0000-0000-0000000000d1'
  const FAV = '00000000-0000-0000-0000-0000000000d2'
  const STRANGER = '00000000-0000-0000-0000-0000000000d3'
  const ADMIN = '00000000-0000-0000-0000-0000000000d4'
  await insertAuthUser(db, DONOR, 'donor@x.com')
  await insertAuthUser(db, FAV, 'fav@x.com')
  await insertAuthUser(db, STRANGER, 'stranger@x.com')
  await insertAuthUser(db, ADMIN, 'admin@x.com')
  await db.query(`UPDATE public.profiles SET role = 'admin' WHERE id = $1`, [ADMIN])

  const { rows: projRows } = await db.query(
    `INSERT INTO public.projects (title, slug, status, show_on_site) VALUES ('Projeto Oculto', 'oculto', 'active', false) RETURNING id`
  )
  const P = projRows[0].id
  await insertDonation(db, { userId: DONOR, projectId: P, amount: 100, status: 'completed', paymentId: 'vis_1' })
  await db.query(`INSERT INTO public.favorites (user_id, project_id) VALUES ($1, $2)`, [FAV, P])

  const readReport = async (role, sub = '') => {
    await as(db, role, sub)
    const { rows } = await db.query(`SELECT public.get_project_public_report($1::uuid) AS r`, [P])
    await reset(db)
    return rows[0].r
  }

  assert.equal(Number((await readReport('anon')).net_total), 0)
  assert.equal(Number((await readReport('authenticated', STRANGER)).net_total), 0)
  assert.equal(Number((await readReport('authenticated', DONOR)).net_total), 100)
  assert.equal(Number((await readReport('authenticated', FAV)).net_total), 100)
  assert.equal(Number((await readReport('authenticated', ADMIN)).net_total), 100)
  assert.equal(Number((await readReport('service_role')).net_total), 100)
  await db.close()
})

test('R4 Bloco 7: admin_donations_report agrega no Postgres (D6/D9), é restrito a service_role', async () => {
  const db = await freshDb([M25, M26, M27, M28, M29])
  const P = await insertProject(db, 0)
  await insertDonation(db, { projectId: P, amount: 100, status: 'completed', email: 'a@x.com', paymentId: 'r_a1', anonymous: false })
  await insertDonation(db, { projectId: P, amount: 50, status: 'completed', email: 'a@x.com', paymentId: 'r_a2', anonymous: true })
  await insertDonation(db, { projectId: P, amount: 80, status: 'partially_refunded', refunded: 30, email: 'b@x.com', paymentId: 'r_b1' })
  await insertDonation(db, { projectId: P, amount: 40, status: 'disputed', email: 'c@x.com', paymentId: 'r_c1' })

  await as(db, 'service_role')
  const { rows } = await db.query(
    `SELECT public.admin_donations_report((now() - interval '7 days'), (now() + interval '1 hour'), NULL::uuid) AS rep`
  )
  await reset(db)
  const rep = rows[0].rep
  assert.equal(Number(rep.overview.net_total), 200)
  assert.equal(rep.overview.donation_count, 3)
  assert.equal(rep.overview.unique_donors, 2)
  assert.equal(rep.latest_donations.length, 4)
  assert.ok(rep.top_donors_90d.some((d) => d.label === 'Doador Anônimo'))

  await as(db, 'anon')
  await assert.rejects(db.query(`SELECT public.admin_donations_report(NULL, NULL, NULL)`), /permission denied/)
  await reset(db)
  await as(db, 'authenticated', '00000000-0000-0000-0000-000000000001')
  await assert.rejects(db.query(`SELECT public.admin_donations_report(NULL, NULL, NULL)`), /permission denied/)
  await reset(db)
  await db.close()
})
