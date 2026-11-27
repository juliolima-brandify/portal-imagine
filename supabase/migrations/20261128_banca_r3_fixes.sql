-- Correções da Banca R3 sobre o commit a607706 (idempotente, pode ser reexecutada).
-- Não aplicar em produção sem a /banca aprovar o commit que contém este arquivo.
--
-- Cobre:
--   Item 1  profiles.email não pode ser alterado por authenticated; profiles.email segue auth.users
--   Item 3  estorno parcial antes da confirmação é gravado (refunded_amount monotônico)
--   Item 4  estorno total grava refunded_amount = amount; evento parcial atrasado não altera nada
--   Item 5  webhook_unmatched para eventos sem doação (conciliação, D10)
--   Item 6  (ver 20261126) GRANT de refunded_amount sobrevive a reexecuções fora de ordem
--   Item 7  e-mails normalizados (lower/trim) na gravação
--   Item 8  backfill de refunded_amount em doações já refunded
--   Item 9  PARTIALLY_REFUNDED sem valor não muda status
--   Item 10 RPC pública de agregados do relatório do projeto (sem PII)
--   Item 11 RPC de totais do admin (GROUP BY status)
--   Item 1  RPC de busca de conta por e-mail em auth.users (somente service_role)

-- ============================================================
-- 1. Blindagem de public.profiles.email e sincronização com auth.users
-- ============================================================
-- E-mail do próprio usuário autenticado (nunca o de outra conta). Necessário porque
-- authenticated não lê auth.users diretamente.
CREATE OR REPLACE FUNCTION public.own_auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT lower(trim(u.email)) FROM auth.users u WHERE u.id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.own_auth_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.own_auth_email() TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email THEN
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

DROP TRIGGER IF EXISTS protect_profile_email_trigger ON public.profiles;
CREATE TRIGGER protect_profile_email_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_email();

-- Sincroniza profiles.email quando auth.users.email muda (fonte da verdade é auth.users).
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET email = lower(trim(NEW.email))
  WHERE id = NEW.id
    AND email IS DISTINCT FROM lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS sync_profile_email_from_auth_trigger ON auth.users;
    CREATE TRIGGER sync_profile_email_from_auth_trigger
      AFTER UPDATE OF email ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_profile_email_from_auth();

    UPDATE public.profiles p
    SET email = lower(trim(u.email))
    FROM auth.users u
    WHERE u.id = p.id
      AND p.email IS DISTINCT FROM lower(trim(u.email));
  END IF;
END $$;

-- Busca de conta por e-mail usada pelo provisionamento do doador (item 1).
-- Usa auth.users, nunca profiles.email. Só conta com e-mail confirmado conta como
-- vínculo; o limite de 2 linhas deixa a ambiguidade visível ao chamador.
CREATE OR REPLACE FUNCTION public.find_confirmed_auth_user_ids_by_email(p_email TEXT)
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
    AND u.email_confirmed_at IS NOT NULL
  LIMIT 2;
$$;

REVOKE ALL ON FUNCTION public.find_confirmed_auth_user_ids_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_confirmed_auth_user_ids_by_email(TEXT) TO service_role;

-- ============================================================
-- 2. Normalização de e-mail em donations (item 7) e backfill
-- ============================================================
CREATE OR REPLACE FUNCTION public.normalize_donation_donor_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  NEW.donor_email := NULLIF(lower(trim(NEW.donor_email)), '');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.normalize_donation_donor_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS normalize_donation_donor_email_trigger ON public.donations;
CREATE TRIGGER normalize_donation_donor_email_trigger
  BEFORE INSERT OR UPDATE OF donor_email ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_donation_donor_email();

UPDATE public.donations
SET donor_email = NULLIF(lower(trim(donor_email)), '')
WHERE donor_email IS DISTINCT FROM NULLIF(lower(trim(donor_email)), '');

-- ============================================================
-- 3. Item 8: backfill de refunded_amount em doações já estornadas
-- ============================================================
UPDATE public.donations SET refunded_amount = amount
WHERE status = 'refunded' AND COALESCE(refunded_amount, 0) = 0;

-- ============================================================
-- 4. Transição de estado pura (itens 3, 4 e 9) usada pela RPC
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
  IF p_target IS NULL OR p_target NOT IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded') THEN
    o_status := p_status;
    o_refunded := v_cur;
    RETURN;
  END IF;

  -- Estorno total é terminal e o valor estornado é o total (item 4).
  IF p_status = 'refunded' OR p_target = 'refunded' THEN
    o_status := 'refunded';
    o_refunded := v_amount;
    RETURN;
  END IF;

  -- Estorno parcial: o valor é monotônico e grava-se mesmo antes da confirmação (item 3).
  IF p_target = 'partially_refunded' THEN
    o_refunded := GREATEST(v_cur, v_in);
    -- Sem valor concluído, não muda o status nem alerta (item 9).
    IF o_refunded <= 0 THEN
      o_status := p_status;
      RETURN;
    END IF;
    IF v_amount > 0 AND o_refunded >= v_amount THEN
      o_status := 'refunded';
    ELSIF p_status IN ('completed', 'partially_refunded') THEN
      o_status := 'partially_refunded';
    ELSE
      -- pending/failed: o estorno fica registrado; o status espera a confirmação.
      o_status := p_status;
    END IF;
    RETURN;
  END IF;

  -- Confirmação. Se já há estorno parcial registrado, a doação nasce parcialmente estornada.
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

  -- pending / failed: eventos atrasados nunca rebaixam uma doação confirmada.
  o_refunded := v_cur;
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
-- 5. RPC de webhook (assinatura de 14 parâmetros) usando a transição
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
  v_new_donation_id UUID;
BEGIN
  IF p_event_id IS NULL OR char_length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'event_id é obrigatório' USING ERRCODE = '22023';
  END IF;

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

  -- 4) Assinatura (renovação)
  IF NOT v_found AND p_asaas_subscription_id IS NOT NULL AND char_length(trim(p_asaas_subscription_id)) > 0 THEN
    SELECT * INTO v_row FROM public.donations
    WHERE asaas_subscription_id = trim(p_asaas_subscription_id)
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
    v_found := FOUND;
  END IF;

  IF NOT v_found THEN
    -- Sem doação: libera o event_id para uma nova entrega (o recebimento fica em webhook_unmatched na rota).
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
    asaas_checkout_id = COALESCE(NULLIF(trim(p_asaas_checkout_id), ''), asaas_checkout_id),
    asaas_payment_id = COALESCE(NULLIF(trim(p_asaas_payment_id), ''), asaas_payment_id),
    asaas_subscription_id = COALESCE(NULLIF(trim(p_asaas_subscription_id), ''), asaas_subscription_id),
    asaas_customer_id = COALESCE(NULLIF(trim(p_asaas_customer_id), ''), asaas_customer_id),
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
-- 6. Eventos sem doação para conciliação (item 5 / D10)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_unmatched (
  event_id TEXT PRIMARY KEY
    CHECK (char_length(trim(event_id)) BETWEEN 1 AND 200),
  event_type TEXT NOT NULL,
  external_reference TEXT,
  asaas_payment_id TEXT,
  asaas_checkout_id TEXT,
  asaas_subscription_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.webhook_unmatched ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_unmatched FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.webhook_unmatched TO service_role;

-- ============================================================
-- 7. Agregados públicos do relatório do projeto (item 10)
-- Só números: nenhum e-mail, nome ou user_id sai da função.
-- Doador = e-mail normalizado; sem e-mail, user_id; sem nenhum, a própria doação.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_project_public_report(p_project_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH recognized AS (
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
    -- Últimas 5 doações reconhecidas, sem nome nem e-mail (só valor, data e se é anônima).
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
-- 8. Totais do admin por status (item 11): uma leitura agregada no lugar de reler a tabela
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_donation_totals()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH by_status AS (
    SELECT
      status,
      COUNT(*) AS cnt,
      COALESCE(SUM(amount), 0) AS gross,
      COALESCE(SUM(COALESCE(refunded_amount, 0)), 0) AS refunded,
      COALESCE(SUM(CASE
        WHEN status = 'completed' THEN amount
        WHEN status = 'partially_refunded' THEN GREATEST(amount - COALESCE(refunded_amount, 0), 0)
        ELSE 0
      END), 0) AS net
    FROM public.donations
    GROUP BY status
  )
  SELECT jsonb_build_object(
    'by_status', COALESCE((
      SELECT jsonb_object_agg(status, jsonb_build_object(
        'count', cnt, 'gross', gross, 'refunded', refunded, 'net', net))
      FROM by_status
    ), '{}'::jsonb),
    'unique_donors', (
      SELECT COUNT(DISTINCT COALESCE(
        'e:' || NULLIF(lower(trim(donor_email)), ''),
        'u:' || user_id::text,
        'd:' || id::text
      ))
      FROM public.donations
      WHERE status IN ('completed', 'partially_refunded')
    )
  );
$$;

REVOKE ALL ON FUNCTION public.admin_donation_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_donation_totals() TO service_role;

-- ============================================================
-- 9. Reafirma o GRANT do valor estornado (item 6)
-- ============================================================
GRANT SELECT (refunded_amount) ON public.donations TO authenticated;
