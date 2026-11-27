-- Migração de correções da Banca de Revisão (commit 7fef677)
-- Idempotente. Não deve ser aplicada em produção sem a /banca aprovar este commit.
--
-- Cobre:
--   R9  fallback do webhook removido (rota responde 503 sem a RPC)
--   R10 estorno parcial (status partially_refunded + refunded_amount)
--   R15 zero Stripe na árvore ativa (coluna legada migrada e removida)
--   R17 lock de reenvio de recibo (receipt_lock_at)

-- ============================================================
-- 1. Status parcialmente estornado e valores de estorno
-- ============================================================
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_lock_at TIMESTAMPTZ;

-- Remove qualquer CHECK legado que restrinja status, independentemente do nome.
-- (A tabela donations não é criada neste repositório; o nome em produção pode variar.)
DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.donations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%disputed%'
  ) THEN
    FOR v_constraint IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.donations'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.donations DROP CONSTRAINT %I', v_constraint.conname);
    END LOOP;

    ALTER TABLE public.donations
      ADD CONSTRAINT donations_status_chk
      CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'))
      NOT VALID;

    ALTER TABLE public.donations VALIDATE CONSTRAINT donations_status_chk;
  END IF;
END $$;

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_refunded_amount_chk;
ALTER TABLE public.donations
  ADD CONSTRAINT donations_refunded_amount_chk
  CHECK (refunded_amount >= 0 AND refunded_amount <= amount)
  NOT VALID;

ALTER TABLE public.donations VALIDATE CONSTRAINT donations_refunded_amount_chk;

-- ============================================================
-- 2. Zero Stripe: migrar dados da coluna legada e removê-la
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'donations'
      AND column_name = 'stripe_payment_intent_id'
  ) THEN
    -- IDs de checkout gravados como `asaas_chk_<id>` vão para asaas_checkout_id
    UPDATE public.donations
    SET asaas_checkout_id = COALESCE(
      NULLIF(asaas_checkout_id, ''),
      NULLIF(replace(stripe_payment_intent_id, 'asaas_chk_', ''), '')
    )
    WHERE stripe_payment_intent_id LIKE 'asaas_chk_%'
      AND asaas_checkout_id IS NULL;

    -- Demais IDs (cobranças) vão para asaas_payment_id
    UPDATE public.donations
    SET asaas_payment_id = COALESCE(NULLIF(asaas_payment_id, ''), stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL
      AND stripe_payment_intent_id <> ''
      AND stripe_payment_intent_id NOT LIKE 'asaas_chk_%'
      AND asaas_payment_id IS NULL;

    ALTER TABLE public.donations DROP COLUMN stripe_payment_intent_id;
  END IF;
END $$;

-- Provider legado vira asaas e o CHECK deixa de citar o provedor antigo
UPDATE public.donations SET provider = 'asaas' WHERE provider = 'stripe_legacy';
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_provider_chk;
ALTER TABLE public.donations
  ADD CONSTRAINT donations_provider_chk
  CHECK (provider IN ('asaas', 'pix_direct'));

-- ============================================================
-- 3. Trigger de saldo com estorno parcial
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_project_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_old_recognized NUMERIC := 0;
  v_new_recognized NUMERIC := 0;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.project_id IS NOT NULL THEN
    v_old_recognized := CASE
      WHEN OLD.status = 'refunded' THEN 0
      WHEN OLD.status = 'completed' THEN COALESCE(OLD.amount, 0)
      WHEN OLD.status = 'partially_refunded' THEN GREATEST(COALESCE(OLD.amount, 0) - COALESCE(OLD.refunded_amount, 0), 0)
      ELSE 0
    END;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.project_id IS NOT NULL THEN
    v_new_recognized := CASE
      WHEN NEW.status = 'refunded' THEN 0
      WHEN NEW.status = 'completed' THEN COALESCE(NEW.amount, 0)
      WHEN NEW.status = 'partially_refunded' THEN GREATEST(COALESCE(NEW.amount, 0) - COALESCE(NEW.refunded_amount, 0), 0)
      ELSE 0
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF v_new_recognized > 0 THEN
      UPDATE public.projects
      SET current_amount = COALESCE(current_amount, 0) + v_new_recognized
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF v_old_recognized > 0 THEN
      UPDATE public.projects
      SET current_amount = GREATEST(COALESCE(current_amount, 0) - v_old_recognized, 0)
      WHERE id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF OLD.project_id IS NOT DISTINCT FROM NEW.project_id THEN
    IF v_new_recognized <> v_old_recognized AND NEW.project_id IS NOT NULL THEN
      UPDATE public.projects
      SET current_amount = GREATEST(COALESCE(current_amount, 0) + (v_new_recognized - v_old_recognized), 0)
      WHERE id = NEW.project_id;
    END IF;
  ELSE
    IF v_old_recognized > 0 AND OLD.project_id IS NOT NULL THEN
      UPDATE public.projects
      SET current_amount = GREATEST(COALESCE(current_amount, 0) - v_old_recognized, 0)
      WHERE id = OLD.project_id;
    END IF;
    IF v_new_recognized > 0 AND NEW.project_id IS NOT NULL THEN
      UPDATE public.projects
      SET current_amount = COALESCE(current_amount, 0) + v_new_recognized
      WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_project_amount() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 4. RPC idempotente com estorno parcial
-- ============================================================
DROP FUNCTION IF EXISTS public.apply_asaas_webhook_event(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB
);
DROP FUNCTION IF EXISTS public.apply_asaas_webhook_event(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB
);

DO $$
DECLARE
  v_sig TEXT;
BEGIN
  FOR v_sig IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'apply_asaas_webhook_event'
      AND p.pronargs <> 14
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s', v_sig);
  END LOOP;
END $$;

DO $guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'asaas_donation_transition'
  ) THEN
    EXECUTE $fn$
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
      AS $body$
      DECLARE
        v_row public.donations%ROWTYPE;
        v_found BOOLEAN := false;
        v_next_status TEXT;
        v_eff_amount NUMERIC;
        v_refunded NUMERIC := 0;
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
          RETURN jsonb_build_object(
            'duplicate', true,
            'matched', false,
            'created_renewal', false
          );
        END IF;

        -- 1) Cobrança exata
        IF p_asaas_payment_id IS NOT NULL AND char_length(trim(p_asaas_payment_id)) > 0 THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_payment_id = trim(p_asaas_payment_id)
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 2) externalReference (UUID da doação)
        IF NOT v_found AND p_external_reference IS NOT NULL
           AND trim(p_external_reference) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE id = trim(p_external_reference)::uuid
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 3) Checkout
        IF NOT v_found AND p_asaas_checkout_id IS NOT NULL AND char_length(trim(p_asaas_checkout_id)) > 0 THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_checkout_id = trim(p_asaas_checkout_id)
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 4) Assinatura (renovação). Só faz sentido com status conhecido.
        IF NOT v_found
           AND p_asaas_subscription_id IS NOT NULL
           AND char_length(trim(p_asaas_subscription_id)) > 0
           AND p_target_status IS NOT NULL
           AND trim(p_target_status) IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded') THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_subscription_id = trim(p_asaas_subscription_id)
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        IF NOT v_found THEN
          -- Não envenena webhook_events quando a doação ainda não existe / asaas_checkout_id está em corrida inicial
          DELETE FROM public.webhook_events
          WHERE event_id = trim(p_event_id)
            AND donation_id IS NULL;

          RETURN jsonb_build_object(
            'duplicate', false,
            'matched', false,
            'created_renewal', false
          );
        END IF;

        -- Nova parcela de assinatura: mesmo contrato, cobrança diferente
        IF v_row.is_recurring
           AND p_asaas_payment_id IS NOT NULL
           AND char_length(trim(p_asaas_payment_id)) > 0
           AND v_row.asaas_payment_id IS NOT NULL
           AND v_row.asaas_payment_id <> ''
           AND v_row.asaas_payment_id <> trim(p_asaas_payment_id)
           AND p_target_status IS NOT NULL
           AND trim(p_target_status) IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded') THEN

          v_next_status := trim(p_target_status);
          v_eff_amount := CASE WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount ELSE v_row.amount END;
          v_refunded := CASE
            WHEN v_next_status = 'refunded' THEN LEAST(GREATEST(COALESCE(p_refunded_amount, v_eff_amount), 0), v_eff_amount)
            WHEN v_next_status = 'partially_refunded' THEN LEAST(GREATEST(COALESCE(p_refunded_amount, 0), 0), v_eff_amount)
            ELSE 0
          END;

          INSERT INTO public.donations (
            user_id,
            project_id,
            campaign_slug,
            amount,
            currency,
            status,
            payment_method,
            provider,
            asaas_payment_id,
            asaas_subscription_id,
            asaas_customer_id,
            is_recurring,
            recurring_frequency,
            anonymous,
            donor_name,
            donor_email,
            refunded_amount
          ) VALUES (
            v_row.user_id,
            v_row.project_id,
            v_row.campaign_slug,
            v_eff_amount,
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
            UPDATE public.webhook_events
            SET donation_id = v_new_donation_id
            WHERE event_id = trim(p_event_id);

            RETURN jsonb_build_object(
              'duplicate', false,
              'matched', true,
              'created_renewal', true,
              'donation_id', v_new_donation_id,
              'previous_status', 'pending',
              'current_status', v_next_status,
              'status_changed', true,
              'refund_changed', (v_refunded > 0)
            );
          END IF;

          -- Corrida: a linha já foi criada por outra entrega. Atualiza a existente.
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_payment_id = trim(p_asaas_payment_id)
          FOR UPDATE;
          v_found := FOUND;
          IF NOT v_found THEN
            DELETE FROM public.webhook_events
            WHERE event_id = trim(p_event_id)
              AND donation_id IS NULL;

            RETURN jsonb_build_object(
              'duplicate', false,
              'matched', false,
              'created_renewal', false
            );
          END IF;
        END IF;

        -- Máquina de estados (eventos fora de ordem não rebaixam doação confirmada)
        IF p_target_status IS NULL
           OR trim(p_target_status) NOT IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded') THEN
          v_next_status := v_row.status;
        ELSIF v_row.status = 'refunded' THEN
          v_next_status := 'refunded';
        ELSIF v_row.status = 'partially_refunded' THEN
          v_next_status := CASE WHEN trim(p_target_status) = 'refunded' THEN 'refunded' ELSE 'partially_refunded' END;
        ELSIF v_row.status = 'completed' AND trim(p_target_status) IN ('pending', 'failed') THEN
          v_next_status := 'completed';
        ELSIF trim(p_target_status) = 'partially_refunded' AND v_row.status <> 'completed' THEN
          v_next_status := v_row.status;
        ELSE
          v_next_status := trim(p_target_status);
        END IF;

        v_eff_amount := COALESCE(
          LEAST(CASE WHEN p_amount IS NOT NULL AND p_amount > 0 THEN p_amount ELSE NULL END, v_row.amount),
          v_row.amount
        );

        v_refunded := CASE
          WHEN v_next_status = 'refunded' THEN
            LEAST(GREATEST(COALESCE(p_refunded_amount, v_row.amount), 0), v_row.amount)
          WHEN v_next_status = 'partially_refunded' THEN
            GREATEST(
              COALESCE(v_row.refunded_amount, 0),
              LEAST(GREATEST(COALESCE(p_refunded_amount, 0), 0), v_eff_amount)
            )
          ELSE COALESCE(v_row.refunded_amount, 0)
        END;

        UPDATE public.donations
        SET
          status = v_next_status,
          payment_method = COALESCE(NULLIF(trim(p_payment_method), ''), payment_method),
          asaas_checkout_id = COALESCE(NULLIF(trim(p_asaas_checkout_id), ''), asaas_checkout_id),
          asaas_payment_id = COALESCE(NULLIF(trim(p_asaas_payment_id), ''), asaas_payment_id),
          asaas_subscription_id = COALESCE(NULLIF(trim(p_asaas_subscription_id), ''), asaas_subscription_id),
          asaas_customer_id = COALESCE(NULLIF(trim(p_asaas_customer_id), ''), asaas_customer_id),
          donor_name = COALESCE(NULLIF(trim(p_donor_name), ''), donor_name),
          donor_email = COALESCE(lower(NULLIF(trim(p_donor_email), '')), donor_email),
          refunded_amount = v_refunded
        WHERE id = v_row.id;

        UPDATE public.webhook_events
        SET donation_id = v_row.id
        WHERE event_id = trim(p_event_id);

        RETURN jsonb_build_object(
          'duplicate', false,
          'matched', true,
          'created_renewal', false,
          'donation_id', v_row.id,
          'previous_status', v_row.status,
          'current_status', v_next_status,
          'status_changed', v_row.status IS DISTINCT FROM v_next_status,
          'refund_changed', v_row.refunded_amount IS DISTINCT FROM v_refunded
        );
      END;
      $body$;
    $fn$;

    REVOKE EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
      TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB, NUMERIC
    ) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
      TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB, NUMERIC
    ) TO service_role;
  END IF;
END $guard$;

-- ============================================================
-- 5. Grants de leitura (sem coluna interna de lock)
-- ============================================================
GRANT SELECT (refunded_amount) ON public.donations TO authenticated;

-- ============================================================
-- 6. Hardening de schema (R8)
-- ============================================================
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;
