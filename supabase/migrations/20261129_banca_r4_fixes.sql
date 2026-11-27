-- Correções da Banca R4 sobre o commit 56d31a2 (idempotente, pode ser reexecutada).
-- Não aplicar em produção sem a /banca aprovar o commit que contém este arquivo.
--
-- Cobre:
--   Bloco 1 (D8 / B-P1)  Status 'disputed' reversível para PAYMENT_CHARGEBACK_DISPUTE
--   Bloco 2 (P4)         Guarda v_target IS NOT NULL na assinatura/renovação em apply_asaas_webhook_event
--   Bloco 3              Visibilidade RLS em get_project_public_report (SECURITY DEFINER)
--   Bloco 7 (B-P3)       RPC agregada admin_donations_report para Dashboard e Relatórios Admin
--   Bloco 15             protect_profile_email tolerante a caixa/espaços equivalentes

-- ============================================================
-- 1. Status 'disputed' no CHECK de public.donations (D8 / B-P1)
-- ============================================================
DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.donations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.donations DROP CONSTRAINT %I', v_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_status_chk
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed'))
  NOT VALID;

ALTER TABLE public.donations VALIDATE CONSTRAINT donations_status_chk;

-- ============================================================
-- 2. protect_profile_email comparando lower(trim(...)) (Bloco 15)
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'UPDATE' AND lower(trim(NEW.email)) IS DISTINCT FROM lower(trim(OLD.email)) THEN
      RAISE EXCEPTION 'O e-mail da conta só pode ser alterado pelo provedor de autenticação'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'INSERT' THEN
      -- Na criação pelo cliente, o e-mail é o do próprio auth.users, nunca o informado.
      NEW.email := public.own_auth_email();
    END IF;
  END IF;
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_email() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 3. Transição de estado pura com 'disputed' reversível (D8)
-- ============================================================
CREATE OR REPLACE FUNCTION public.asaas_donation_transition(
  p_status TEXT,
  p_amount NUMERIC,
  p_refunded_current NUMERIC,
  p_target TEXT,
  p_refunded_in NUMERIC,
  OUT o_status TEXT,
  OUT o_refunded NUMERIC
)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_amount NUMERIC := GREATEST(COALESCE(p_amount, 0), 0);
  v_cur NUMERIC := LEAST(GREATEST(COALESCE(p_refunded_current, 0), 0), v_amount);
  v_in NUMERIC := LEAST(GREATEST(COALESCE(p_refunded_in, 0), 0), v_amount);
BEGIN
  IF p_target IS NULL
     OR p_target NOT IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed') THEN
    o_status := p_status;
    o_refunded := v_cur;
    RETURN;
  END IF;

  -- Estorno total / chargeback definitivo é terminal e grava refunded_amount = amount.
  IF p_status = 'refunded' OR p_target = 'refunded' THEN
    o_status := 'refunded';
    o_refunded := v_amount;
    RETURN;
  END IF;

  -- Disputa de chargeback: não entra no saldo reconhecido, mas preserva refunded_amount atual.
  IF p_target = 'disputed' THEN
    o_status := 'disputed';
    o_refunded := v_cur;
    RETURN;
  END IF;

  -- Estorno parcial: valor monotônico gravado mesmo antes da confirmação ou durante disputa.
  IF p_target = 'partially_refunded' THEN
    o_refunded := GREATEST(v_cur, v_in);
    IF o_refunded <= 0 THEN
      o_status := p_status;
      RETURN;
    END IF;
    IF v_amount > 0 AND o_refunded >= v_amount THEN
      o_status := 'refunded';
    ELSIF p_status IN ('completed', 'partially_refunded') THEN
      o_status := 'partially_refunded';
    ELSE
      o_status := p_status;
    END IF;
    RETURN;
  END IF;

  -- Confirmação (ou vitória na disputa): restaura partially_refunded se já havia estorno parcial.
  IF p_target = 'completed' THEN
    o_refunded := v_cur;
    IF v_amount > 0 AND v_cur >= v_amount THEN
      o_status := 'refunded';
    ELSIF v_cur > 0 THEN
      o_status := 'partially_refunded';
    ELSE
      o_status := 'completed';
    END IF;
    RETURN;
  END IF;

  -- pending / failed: eventos atrasados nunca rebaixam doação confirmada nem em disputa.
  o_refunded := v_cur;
  IF p_status = 'disputed' THEN
    o_status := 'disputed';
    RETURN;
  END IF;
  IF p_status IN ('completed', 'partially_refunded') THEN
    IF v_cur > 0 THEN
      o_status := 'partially_refunded';
    ELSE
      o_status := 'completed';
    END IF;
    RETURN;
  END IF;
  o_status := p_target;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.asaas_donation_transition(TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC)
  FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 4. RPC de webhook (14 parâmetros) com guarda P4 e 'disputed'
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_asaas_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_external_reference TEXT DEFAULT NULL,
  p_asaas_checkout_id TEXT DEFAULT NULL,
  p_asaas_payment_id TEXT DEFAULT NULL,
  p_asaas_subscription_id TEXT DEFAULT NULL,
  p_asaas_customer_id TEXT DEFAULT NULL,
  p_target_status TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_donor_name TEXT DEFAULT NULL,
  p_donor_email TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_refunded_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_row public.donations%ROWTYPE;
  v_found BOOLEAN := false;
  v_next_status TEXT;
  v_refunded NUMERIC := 0;
  v_target TEXT := NULLIF(trim(p_target_status), '');
  v_target_valid BOOLEAN := false;
  v_new_donation_id UUID;
BEGIN
  IF p_event_id IS NULL OR char_length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'event_id é obrigatório' USING ERRCODE = '22023';
  END IF;

  v_target_valid :=
    v_target IS NOT NULL
    AND v_target IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed');

  INSERT INTO public.webhook_events (event_id, provider, event_type, payload)
  VALUES (
    trim(p_event_id),
    'asaas',
    COALESCE(NULLIF(trim(p_event_type), ''), 'unknown'),
    COALESCE(p_payload, '{}'::jsonb)
  )
  ON CONFLICT (event_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('duplicate', true, 'matched', false, 'created_renewal', false);
  END IF;

  -- 1) Cobrança exata
  IF p_asaas_payment_id IS NOT NULL AND char_length(trim(p_asaas_payment_id)) > 0 THEN
    SELECT * INTO v_row FROM public.donations
    WHERE asaas_payment_id = trim(p_asaas_payment_id) FOR UPDATE;
    v_found := FOUND;
  END IF;

  -- 2) externalReference (UUID da doação)
  IF NOT v_found AND p_external_reference IS NOT NULL
     AND trim(p_external_reference) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT * INTO v_row FROM public.donations
    WHERE id = trim(p_external_reference)::uuid FOR UPDATE;
    v_found := FOUND;
  END IF;

  -- 3) Checkout
  IF NOT v_found AND p_asaas_checkout_id IS NOT NULL AND char_length(trim(p_asaas_checkout_id)) > 0 THEN
    SELECT * INTO v_row FROM public.donations
    WHERE asaas_checkout_id = trim(p_asaas_checkout_id) FOR UPDATE;
    v_found := FOUND;
  END IF;

  -- 4) Assinatura (renovação): só faz sentido com status alvo válido (guarda P4).
  IF NOT v_found
     AND p_asaas_subscription_id IS NOT NULL
     AND char_length(trim(p_asaas_subscription_id)) > 0
     AND v_target_valid THEN
    SELECT * INTO v_row FROM public.donations
    WHERE asaas_subscription_id = trim(p_asaas_subscription_id)
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
    v_found := FOUND;
  END IF;

  IF NOT v_found THEN
    DELETE FROM public.webhook_events WHERE event_id = trim(p_event_id) AND donation_id IS NULL;
    RETURN jsonb_build_object('duplicate', false, 'matched', false, 'created_renewal', false);
  END IF;

  -- Nova parcela de assinatura: mesmo contrato, cobrança diferente
  IF v_row.is_recurring
     AND p_asaas_payment_id IS NOT NULL
     AND char_length(trim(p_asaas_payment_id)) > 0
     AND v_row.asaas_payment_id IS NOT NULL
     AND v_row.asaas_payment_id <> ''
     AND v_row.asaas_payment_id <> trim(p_asaas_payment_id) THEN

    -- Guarda P4: evento sem targetStatus válido (ex.: PAYMENT_UPDATED) não cria doação nem sobrescreve a parcela original.
    IF NOT v_target_valid THEN
      DELETE FROM public.webhook_events WHERE event_id = trim(p_event_id) AND donation_id IS NULL;
      RETURN jsonb_build_object('duplicate', false, 'matched', false, 'created_renewal', false);
    END IF;

    SELECT o_status, o_refunded INTO v_next_status, v_refunded
    FROM public.asaas_donation_transition(
      'pending',
      CASE WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount ELSE v_row.amount END,
      0,
      v_target,
      p_refunded_amount
    );

    INSERT INTO public.donations (
      user_id, project_id, campaign_slug, amount, currency, status, payment_method, provider,
      asaas_payment_id, asaas_subscription_id, asaas_customer_id, is_recurring, recurring_frequency,
      anonymous, donor_name, donor_email, refunded_amount
    ) VALUES (
      v_row.user_id,
      v_row.project_id,
      v_row.campaign_slug,
      CASE WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount ELSE v_row.amount END,
      v_row.currency,
      v_next_status,
      COALESCE(NULLIF(trim(p_payment_method), ''), v_row.payment_method),
      'asaas',
      trim(p_asaas_payment_id),
      COALESCE(NULLIF(trim(p_asaas_subscription_id), ''), v_row.asaas_subscription_id),
      COALESCE(NULLIF(trim(p_asaas_customer_id), ''), v_row.asaas_customer_id),
      true,
      v_row.recurring_frequency,
      v_row.anonymous,
      COALESCE(NULLIF(trim(p_donor_name), ''), v_row.donor_name),
      COALESCE(lower(NULLIF(trim(p_donor_email), '')), v_row.donor_email),
      v_refunded
    )
    ON CONFLICT (asaas_payment_id) WHERE asaas_payment_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_new_donation_id;

    IF v_new_donation_id IS NOT NULL THEN
      UPDATE public.webhook_events SET donation_id = v_new_donation_id WHERE event_id = trim(p_event_id);

      RETURN jsonb_build_object(
        'duplicate', false,
        'matched', true,
        'created_renewal', true,
        'donation_id', v_new_donation_id,
        'previous_status', 'pending',
        'current_status', v_next_status,
        'status_changed', (v_next_status <> 'pending'),
        'refund_changed', (v_refunded > 0)
      );
    END IF;

    -- Corrida: a linha já foi criada por outra entrega. Atualiza a existente.
    SELECT * INTO v_row FROM public.donations
    WHERE asaas_payment_id = trim(p_asaas_payment_id) FOR UPDATE;
    v_found := FOUND;
    IF NOT v_found THEN
      DELETE FROM public.webhook_events WHERE event_id = trim(p_event_id) AND donation_id IS NULL;
      RETURN jsonb_build_object('duplicate', false, 'matched', false, 'created_renewal', false);
    END IF;
  END IF;

  SELECT o_status, o_refunded INTO v_next_status, v_refunded
  FROM public.asaas_donation_transition(
    v_row.status,
    v_row.amount,
    v_row.refunded_amount,
    v_target,
    p_refunded_amount
  );

  UPDATE public.donations
  SET
    status = v_next_status,
    refunded_amount = v_refunded,
    payment_method = COALESCE(NULLIF(trim(p_payment_method), ''), payment_method),
    asaas_checkout_id = COALESCE(NULLIF(asaas_checkout_id, ''), NULLIF(trim(p_asaas_checkout_id), '')),
    asaas_payment_id = COALESCE(NULLIF(asaas_payment_id, ''), NULLIF(trim(p_asaas_payment_id), '')),
    asaas_subscription_id = COALESCE(NULLIF(asaas_subscription_id, ''), NULLIF(trim(p_asaas_subscription_id), '')),
    asaas_customer_id = COALESCE(NULLIF(asaas_customer_id, ''), NULLIF(trim(p_asaas_customer_id), '')),
    donor_name = COALESCE(NULLIF(trim(p_donor_name), ''), donor_name),
    donor_email = COALESCE(lower(NULLIF(trim(p_donor_email), '')), donor_email)
  WHERE id = v_row.id;

  UPDATE public.webhook_events SET donation_id = v_row.id WHERE event_id = trim(p_event_id);

  RETURN jsonb_build_object(
    'duplicate', false,
    'matched', true,
    'created_renewal', false,
    'donation_id', v_row.id,
    'previous_status', v_row.status,
    'current_status', v_next_status,
    'status_changed', (v_row.status IS DISTINCT FROM v_next_status),
    'refund_changed', (v_row.refunded_amount IS DISTINCT FROM v_refunded)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB, NUMERIC
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB, NUMERIC
) TO service_role;

-- ============================================================
-- 5. Visibilidade RLS em get_project_public_report (Bloco 3)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_project_public_report(p_project_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH authorized_project AS (
    SELECT p.id
    FROM public.projects p
    WHERE p.id = p_project_id
      AND (
        current_user = 'service_role'
        OR current_setting('role', true) = 'service_role'
        OR (p.status = 'active' AND p.show_on_site = true AND p.slug IS NOT NULL)
        OR (
          auth.uid() IS NOT NULL
          AND current_setting('role', true) IS DISTINCT FROM 'anon'
          AND (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid() AND pr.role = 'admin'
            )
            OR EXISTS (
              SELECT 1 FROM public.donations d
              WHERE d.project_id = p.id AND d.user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1 FROM public.favorites f
              WHERE f.project_id = p.id AND f.user_id = auth.uid()
            )
          )
        )
      )
  ),
  recognized AS (
    SELECT
      d.id,
      d.created_at,
      d.anonymous,
      CASE
        WHEN d.status = 'completed' THEN d.amount
        WHEN d.status = 'partially_refunded' THEN GREATEST(d.amount - COALESCE(d.refunded_amount, 0), 0)
        ELSE 0
      END AS net,
      COALESCE(
        'e:' || NULLIF(lower(trim(d.donor_email)), ''),
        'u:' || d.user_id::text,
        'd:' || d.id::text
      ) AS donor_key
    FROM public.donations d
    WHERE d.project_id = p_project_id
      AND EXISTS (SELECT 1 FROM authorized_project)
      AND d.status IN ('completed', 'partially_refunded')
  )
  SELECT jsonb_build_object(
    'net_total', COALESCE((SELECT SUM(net) FROM recognized), 0),
    'donation_count', (SELECT COUNT(*) FROM recognized),
    'unique_donors', (SELECT COUNT(DISTINCT donor_key) FROM recognized),
    'monthly', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('month', m.month, 'net', m.net, 'count', m.cnt, 'donors', m.donors) ORDER BY m.month)
      FROM (
        SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month,
               SUM(net) AS net,
               COUNT(*) AS cnt,
               COUNT(DISTINCT donor_key) AS donors
        FROM recognized
        GROUP BY 1
      ) m
    ), '[]'::jsonb),
    'recent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('net', r.net, 'created_at', r.created_at, 'anonymous', r.anonymous)
                       ORDER BY r.created_at DESC)
      FROM (SELECT net, created_at, anonymous FROM recognized ORDER BY created_at DESC LIMIT 5) r
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_project_public_report(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_public_report(UUID) TO anon, authenticated, service_role;

-- ============================================================
-- 6. RPC agregada para Dashboard e Relatórios Admin (Bloco 7 / B-P3)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_donations_report(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(
        p_start,
        ((date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') - interval '29 days') AT TIME ZONE 'America/Sao_Paulo')
      ) AS start_ts,
      COALESCE(p_end, now()) AS end_ts
  ),
  gran AS (
    SELECT
      start_ts,
      end_ts,
      GREATEST(end_ts - start_ts, interval '1 millisecond') AS span,
      CASE
        WHEN ((end_ts AT TIME ZONE 'America/Sao_Paulo')::date - (start_ts AT TIME ZONE 'America/Sao_Paulo')::date) <= 0 THEN 'hour'
        WHEN ((end_ts AT TIME ZONE 'America/Sao_Paulo')::date - (start_ts AT TIME ZONE 'America/Sao_Paulo')::date) > 90 THEN 'month'
        ELSE 'day'
      END AS granularity
    FROM bounds
  ),
  recognized_all AS (
    SELECT
      d.id,
      d.user_id,
      d.project_id,
      d.campaign_slug,
      d.anonymous,
      d.is_recurring,
      d.payment_method,
      d.created_at,
      CASE
        WHEN d.status = 'completed' THEN d.amount
        WHEN d.status = 'partially_refunded' THEN GREATEST(d.amount - COALESCE(d.refunded_amount, 0), 0)
        ELSE 0
      END AS net,
      COALESCE(
        'e:' || NULLIF(lower(trim(d.donor_email)), ''),
        'u:' || d.user_id::text,
        'd:' || d.id::text
      ) AS donor_key,
      CASE
        WHEN d.anonymous THEN 'Doador Anônimo'
        ELSE COALESCE(NULLIF(trim(d.donor_name), ''), NULLIF(trim(pr.name), ''), 'Não identificado')
      END AS display_name
    FROM public.donations d
    LEFT JOIN public.profiles pr ON pr.id = d.user_id
    WHERE d.status IN ('completed', 'partially_refunded')
  ),
  recognized_period AS (
    SELECT r.*
    FROM recognized_all r
    CROSS JOIN gran g
    WHERE r.created_at >= g.start_ts
      AND r.created_at <= g.end_ts
      AND (p_project_id IS NULL OR r.project_id = p_project_id)
  ),
  recognized_prev AS (
    SELECT r.net
    FROM recognized_all r
    CROSS JOIN gran g
    WHERE r.created_at >= (g.start_ts - g.span - interval '1 millisecond')
      AND r.created_at < g.start_ts
      AND (p_project_id IS NULL OR r.project_id = p_project_id)
  ),
  month_windows AS (
    SELECT
      (date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo') AS cur_month_start,
      ((date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - interval '1 month') AT TIME ZONE 'America/Sao_Paulo') AS prev_month_start
  ),
  month_totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN r.created_at >= m.cur_month_start THEN r.net ELSE 0 END), 0) AS cur_month_net,
      COALESCE(SUM(CASE WHEN r.created_at >= m.prev_month_start AND r.created_at < m.cur_month_start THEN r.net ELSE 0 END), 0) AS prev_month_net
    FROM recognized_all r
    CROSS JOIN month_windows m
    WHERE (p_project_id IS NULL OR r.project_id = p_project_id)
  ),
  period_stats AS (
    SELECT
      COALESCE(SUM(net), 0) AS net_total,
      COUNT(*)::int AS donation_count,
      COUNT(DISTINCT donor_key)::int AS unique_donors,
      CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(net) / COUNT(*), 2) ELSE 0 END AS average_donation
    FROM recognized_period
  ),
  prev_stats AS (
    SELECT COALESCE(SUM(net), 0) AS previous_net_total
    FROM recognized_prev
  ),
  donor_agg AS (
    SELECT
      donor_key,
      BOOL_OR(is_recurring) AS has_recurring,
      COUNT(*)::int AS cnt,
      SUM(net) AS net
    FROM recognized_period
    GROUP BY donor_key
  ),
  segments AS (
    SELECT
      CASE
        WHEN has_recurring THEN 'Assinantes (Recorrentes)'
        WHEN cnt >= 2 THEN 'Apoiadores Frequentes (2+)'
        ELSE 'Doação Única'
      END AS segment,
      COUNT(*)::int AS cnt,
      COALESCE(SUM(net), 0) AS net
    FROM donor_agg
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'granularity', (SELECT granularity FROM gran),
    'overview', jsonb_build_object(
      'net_total', (SELECT net_total FROM period_stats),
      'donation_count', (SELECT donation_count FROM period_stats),
      'unique_donors', (SELECT unique_donors FROM period_stats),
      'average_donation', (SELECT average_donation FROM period_stats),
      'previous_net_total', (SELECT previous_net_total FROM prev_stats),
      'growth_pct', (
        SELECT CASE
          WHEN pv.previous_net_total > 0 THEN ROUND(((ps.net_total - pv.previous_net_total) / pv.previous_net_total) * 100.0, 1)
          WHEN ps.net_total > 0 THEN 100.0
          ELSE 0.0
        END
        FROM period_stats ps, prev_stats pv
      ),
      'monthly_growth_pct', (
        SELECT CASE
          WHEN mt.prev_month_net > 0 THEN ROUND(((mt.cur_month_net - mt.prev_month_net) / mt.prev_month_net) * 100.0, 1)
          WHEN mt.cur_month_net > 0 THEN 100.0
          ELSE 0.0
        END
        FROM month_totals mt
      )
    ),
    'global_totals', jsonb_build_object(
      'recognized_total', COALESCE((SELECT SUM(net) FROM recognized_all), 0),
      'recognized_count', (SELECT COUNT(*)::int FROM recognized_all)
    ),
    'series', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('bucket', s.bucket, 'net', s.net, 'count', s.cnt) ORDER BY s.bucket)
      FROM (
        SELECT
          CASE g.granularity
            WHEN 'hour' THEN to_char(r.created_at AT TIME ZONE 'America/Sao_Paulo', 'HH24') || 'h'
            WHEN 'month' THEN to_char(r.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
            ELSE to_char(r.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
          END AS bucket,
          SUM(r.net) AS net,
          COUNT(*)::int AS cnt
        FROM recognized_period r
        CROSS JOIN gran g
        GROUP BY 1
      ) s
    ), '[]'::jsonb),
    'payment_methods', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('method', pm.method, 'count', pm.cnt, 'net', pm.net) ORDER BY pm.net DESC, pm.cnt DESC)
      FROM (
        SELECT
          COALESCE(NULLIF(upper(trim(payment_method)), ''), 'OTHER') AS method,
          COUNT(*)::int AS cnt,
          SUM(net) AS net
        FROM recognized_period
        GROUP BY 1
      ) pm
    ), '[]'::jsonb),
    'donor_segments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('segment', sg.segment, 'count', sg.cnt, 'net', sg.net) ORDER BY sg.cnt DESC)
      FROM segments sg
    ), '[]'::jsonb),
    'top_projects', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('project_id', tp.project_id, 'net', tp.net, 'donors', tp.donors) ORDER BY tp.net DESC)
      FROM (
        SELECT
          project_id,
          SUM(net) AS net,
          COUNT(DISTINCT donor_key)::int AS donors
        FROM recognized_period
        WHERE project_id IS NOT NULL
        GROUP BY project_id
      ) tp
    ), '[]'::jsonb),
    'top_donors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('key', td.group_key, 'label', td.label, 'amount', td.amount, 'count', td.cnt) ORDER BY td.amount DESC, td.cnt DESC)
      FROM (
        SELECT
          CASE WHEN r.anonymous THEN 'anon:' || r.id::text ELSE r.donor_key END AS group_key,
          MAX(r.display_name) AS label,
          SUM(r.net) AS amount,
          COUNT(*)::int AS cnt
        FROM recognized_period r
        GROUP BY 1
        ORDER BY amount DESC, cnt DESC
        LIMIT 5
      ) td
    ), '[]'::jsonb),
    'top_donors_90d', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('key', td90.group_key, 'label', td90.label, 'amount', td90.amount, 'count', td90.cnt) ORDER BY td90.amount DESC, td90.cnt DESC)
      FROM (
        SELECT
          CASE WHEN r.anonymous THEN 'anon:' || r.id::text ELSE r.donor_key END AS group_key,
          MAX(r.display_name) AS label,
          SUM(r.net) AS amount,
          COUNT(*)::int AS cnt
        FROM recognized_all r
        WHERE r.created_at >= (now() - interval '90 days')
        GROUP BY 1
        ORDER BY amount DESC, cnt DESC
        LIMIT 5
      ) td90
    ), '[]'::jsonb),
    'recent_donations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', rd.id,
        'donor', rd.display_name,
        'project_id', rd.project_id,
        'campaign_slug', rd.campaign_slug,
        'project_title', rd.project_title,
        'amount', rd.net,
        'created_at', rd.created_at
      ) ORDER BY rd.created_at DESC, rd.id ASC)
      FROM (
        SELECT
          r.id,
          r.display_name,
          r.project_id,
          r.campaign_slug,
          p.title AS project_title,
          r.net,
          r.created_at
        FROM recognized_period r
        LEFT JOIN public.projects p ON p.id = r.project_id
        ORDER BY r.created_at DESC, r.id ASC
        LIMIT 10
      ) rd
    ), '[]'::jsonb),
    'latest_donations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ld.id,
        'donor', ld.display_name,
        'project_id', ld.project_id,
        'campaign_slug', ld.campaign_slug,
        'project_title', ld.project_title,
        'amount', ld.amount,
        'refunded_amount', ld.refunded_amount,
        'net_amount', ld.net_amount,
        'status', ld.status,
        'created_at', ld.created_at
      ) ORDER BY ld.created_at DESC, ld.id ASC)
      FROM (
        SELECT
          d.id,
          CASE
            WHEN d.anonymous THEN 'Doador Anônimo'
            ELSE COALESCE(NULLIF(trim(d.donor_name), ''), NULLIF(trim(pr.name), ''), 'Não identificado')
          END AS display_name,
          d.project_id,
          d.campaign_slug,
          p.title AS project_title,
          d.amount,
          COALESCE(d.refunded_amount, 0) AS refunded_amount,
          CASE
            WHEN d.status = 'completed' THEN d.amount
            WHEN d.status = 'partially_refunded' THEN GREATEST(d.amount - COALESCE(d.refunded_amount, 0), 0)
            ELSE 0
          END AS net_amount,
          d.status,
          d.created_at
        FROM public.donations d
        LEFT JOIN public.profiles pr ON pr.id = d.user_id
        LEFT JOIN public.projects p ON p.id = d.project_id
        ORDER BY d.created_at DESC, d.id ASC
        LIMIT 5
      ) ld
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_donations_report(TIMESTAMPTZ, TIMESTAMPTZ, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_donations_report(TIMESTAMPTZ, TIMESTAMPTZ, UUID)
  TO service_role;

-- ============================================================
-- 7. Reafirma GRANT de refunded_amount para authenticated
-- ============================================================
GRANT SELECT (refunded_amount) ON public.donations TO authenticated;
