-- Migração: Frente 2 — Pagamentos Asaas + Webhooks Idempotentes + Menor Privilégio (RLS)
-- Idempotente, compatível com projetos dinâmicos (Frente 1) e doações institucionais ('geral', 'natal').

-- ============================================================
-- 1. Endurecer funções de timestamp e atualização de saldo de projetos
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  -- Se a migração 20261127 já criou refunded_amount e a versão mais nova do trigger,
  -- não regride update_project_amount() numa reexecução desta migração.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'donations'
      AND column_name = 'refunded_amount'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_project_amount()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = pg_catalog, public, pg_temp
      AS $body$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.status = 'completed' AND NEW.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_amount = COALESCE(current_amount, 0) + NEW.amount
            WHERE id = NEW.project_id;
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          -- Caso raro: mudança de project_id em doação já concluída
          IF OLD.status = 'completed' AND OLD.project_id IS NOT NULL AND OLD.project_id IS DISTINCT FROM NEW.project_id THEN
            UPDATE public.projects
            SET current_amount = GREATEST(0, COALESCE(current_amount, 0) - OLD.amount)
            WHERE id = OLD.project_id;

            IF NEW.status = 'completed' AND NEW.project_id IS NOT NULL THEN
              UPDATE public.projects
              SET current_amount = COALESCE(current_amount, 0) + NEW.amount
              WHERE id = NEW.project_id;
            END IF;
            RETURN NEW;
          END IF;

          IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' AND NEW.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_amount = COALESCE(current_amount, 0) + NEW.amount
            WHERE id = NEW.project_id;
          ELSIF OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed' AND OLD.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_amount = GREATEST(0, COALESCE(current_amount, 0) - OLD.amount)
            WHERE id = OLD.project_id;
          ELSIF OLD.status = 'completed' AND NEW.status = 'completed' AND OLD.amount IS DISTINCT FROM NEW.amount AND NEW.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_amount = GREATEST(0, COALESCE(current_amount, 0) - OLD.amount + NEW.amount)
            WHERE id = NEW.project_id;
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          IF OLD.status = 'completed' AND OLD.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_amount = GREATEST(0, COALESCE(current_amount, 0) - OLD.amount)
            WHERE id = OLD.project_id;
          END IF;
          RETURN OLD;
        END IF;

        RETURN COALESCE(NEW, OLD);
      END;
      $body$;
    $fn$;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.update_project_amount() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2. Evoluir public.donations para Asaas e campanhas institucionais
-- ============================================================
ALTER TABLE public.donations
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN project_id DROP NOT NULL;

-- Preservar histórico contábil caso perfil ou projeto seja removido no futuro
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_user_id_fkey,
  DROP CONSTRAINT IF EXISTS donations_project_id_fkey;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID,
  ADD CONSTRAINT donations_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS campaign_slug TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'asaas',
  ADD COLUMN IF NOT EXISTS asaas_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donations_provider_chk' AND conrelid = 'public.donations'::regclass
  ) THEN
    ALTER TABLE public.donations
      ADD CONSTRAINT donations_provider_chk
      CHECK (provider IN ('asaas', 'stripe_legacy', 'pix_direct'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donations_amount_positive_chk' AND conrelid = 'public.donations'::regclass
  ) THEN
    ALTER TABLE public.donations
      ADD CONSTRAINT donations_amount_positive_chk
      CHECK (amount > 0);
  END IF;
END $$;

-- Índices para unicidade Asaas, FKs, histórico do doador e painel admin
CREATE UNIQUE INDEX IF NOT EXISTS donations_asaas_checkout_id_uidx
  ON public.donations (asaas_checkout_id)
  WHERE asaas_checkout_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS donations_asaas_payment_id_uidx
  ON public.donations (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_asaas_subscription_id_idx
  ON public.donations (asaas_subscription_id, created_at DESC)
  WHERE asaas_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_user_created_idx
  ON public.donations (user_id, created_at DESC, id ASC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_project_status_idx
  ON public.donations (project_id, status)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS donations_status_created_idx
  ON public.donations (status, created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS donations_donor_email_lower_idx
  ON public.donations (lower(donor_email))
  WHERE donor_email IS NOT NULL;

DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_amount_trigger ON public.donations;
CREATE TRIGGER update_project_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_amount();

-- ============================================================
-- 3. Tabela de Idempotência de Webhooks (public.webhook_events)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  event_id TEXT PRIMARY KEY
    CHECK (char_length(trim(event_id)) BETWEEN 1 AND 200),
  provider TEXT NOT NULL DEFAULT 'asaas'
    CHECK (provider IN ('asaas')),
  event_type TEXT NOT NULL
    CHECK (char_length(trim(event_type)) BETWEEN 1 AND 120),
  donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_events_donation_id_idx
  ON public.webhook_events (donation_id)
  WHERE donation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS webhook_events_processed_at_idx
  ON public.webhook_events (processed_at DESC);

-- ============================================================
-- 4. Função Transacional Atômica para Processar Eventos Asaas
-- ============================================================
DO $$
BEGIN
  -- Só cria a assinatura inicial de 13 parâmetros se a versão de 14 parâmetros (20261127)
  -- ainda não existir, garantindo reexecução 100% idempotente entre as duas migrações.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'apply_asaas_webhook_event'
      AND p.pronargs = 14
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
        p_payload JSONB DEFAULT '{}'::jsonb
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = pg_catalog, public, pg_temp
      AS $body$
      DECLARE
        v_row public.donations%ROWTYPE;
        v_found BOOLEAN := FALSE;
        v_ref_uuid UUID := NULL;
        v_next_status TEXT;
        v_new_donation_id UUID;
      BEGIN
        IF p_event_id IS NULL OR char_length(trim(p_event_id)) = 0 THEN
          RAISE EXCEPTION 'event_id é obrigatório' USING ERRCODE = '22023';
        END IF;

        INSERT INTO public.webhook_events (event_id, provider, event_type, payload)
        VALUES (trim(p_event_id), 'asaas', COALESCE(NULLIF(trim(p_event_type), ''), 'UNKNOWN'), COALESCE(p_payload, '{}'::jsonb))
        ON CONFLICT (event_id) DO NOTHING;

        IF NOT FOUND THEN
          RETURN jsonb_build_object(
            'duplicate', true,
            'matched', false
          );
        END IF;

        -- 1) Buscar por asaas_payment_id exato
        IF p_asaas_payment_id IS NOT NULL AND char_length(trim(p_asaas_payment_id)) > 0 THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_payment_id = trim(p_asaas_payment_id)
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 2) Buscar por externalReference (UUID da doação criada em create-session)
        IF NOT v_found AND p_external_reference IS NOT NULL AND trim(p_external_reference) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          v_ref_uuid := trim(p_external_reference)::uuid;
          SELECT * INTO v_row
          FROM public.donations
          WHERE id = v_ref_uuid
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 3) Buscar por asaas_checkout_id
        IF NOT v_found AND p_asaas_checkout_id IS NOT NULL AND char_length(trim(p_asaas_checkout_id)) > 0 THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_checkout_id = trim(p_asaas_checkout_id)
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        -- 4) Buscar pela assinatura recorrente (renovações mensais/trimestrais/anuais)
        IF NOT v_found AND p_asaas_subscription_id IS NOT NULL AND char_length(trim(p_asaas_subscription_id)) > 0 THEN
          SELECT * INTO v_row
          FROM public.donations
          WHERE asaas_subscription_id = trim(p_asaas_subscription_id)
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE;
          v_found := FOUND;
        END IF;

        IF NOT v_found THEN
          DELETE FROM public.webhook_events
          WHERE event_id = trim(p_event_id)
            AND donation_id IS NULL;

          RETURN jsonb_build_object(
            'duplicate', false,
            'matched', false
          );
        END IF;

        -- Se já existe cobrança anterior distinta para esta assinatura, trata-se de nova parcela recorrente
        IF v_row.is_recurring
           AND v_row.asaas_payment_id IS NOT NULL
           AND p_asaas_payment_id IS NOT NULL
           AND trim(p_asaas_payment_id) <> ''
           AND v_row.asaas_payment_id <> trim(p_asaas_payment_id) THEN

          v_next_status := COALESCE(p_target_status, 'pending');
          IF v_next_status NOT IN ('pending', 'completed', 'failed', 'refunded') THEN
            v_next_status := 'pending';
          END IF;

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
            donor_email
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
            COALESCE(lower(NULLIF(trim(p_donor_email), '')), v_row.donor_email)
          )
          RETURNING id INTO v_new_donation_id;

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
            'status_changed', (v_next_status <> 'pending')
          );
        END IF;

        -- Máquina de estados protegida contra eventos fora de ordem
        IF p_target_status IS NULL OR p_target_status NOT IN ('pending', 'completed', 'failed', 'refunded') THEN
          v_next_status := v_row.status;
        ELSIF v_row.status = 'refunded' THEN
          v_next_status := 'refunded';
        ELSIF v_row.status = 'completed' AND p_target_status IN ('pending', 'failed') THEN
          v_next_status := 'completed';
        ELSE
          v_next_status := p_target_status;
        END IF;

        UPDATE public.donations
        SET
          status = v_next_status,
          payment_method = COALESCE(NULLIF(trim(p_payment_method), ''), payment_method),
          asaas_checkout_id = COALESCE(NULLIF(trim(p_asaas_checkout_id), ''), asaas_checkout_id),
          asaas_payment_id = COALESCE(NULLIF(trim(p_asaas_payment_id), ''), asaas_payment_id),
          asaas_subscription_id = COALESCE(NULLIF(trim(p_asaas_subscription_id), ''), asaas_subscription_id),
          asaas_customer_id = COALESCE(NULLIF(trim(p_asaas_customer_id), ''), asaas_customer_id),
          donor_name = COALESCE(NULLIF(trim(p_donor_name), ''), donor_name),
          donor_email = COALESCE(lower(NULLIF(trim(p_donor_email), '')), donor_email)
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
          'status_changed', (v_row.status IS DISTINCT FROM v_next_status)
        );
      END;
      $body$;
    $fn$;

    REVOKE EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
      TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB
    ) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.apply_asaas_webhook_event(
      TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB
    ) TO service_role;
  END IF;
END $$;

-- ============================================================
-- 5. RLS e Menor Privilégio em public.donations e public.webhook_events
-- ============================================================
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.donations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.webhook_events FROM PUBLIC, anon, authenticated;

-- Autenticados leem apenas colunas não internas das próprias doações (ou todas se admin);
-- todas as escritas passam pelas rotas de servidor (service_role).
GRANT SELECT (
  id,
  user_id,
  project_id,
  campaign_slug,
  amount,
  currency,
  status,
  payment_method,
  asaas_checkout_id,
  asaas_payment_id,
  asaas_subscription_id,
  is_recurring,
  recurring_frequency,
  message,
  anonymous,
  receipt_sent_at,
  created_at,
  updated_at
) ON public.donations TO authenticated;

GRANT ALL ON public.donations TO service_role;
GRANT ALL ON public.webhook_events TO service_role;

DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;

CREATE POLICY "Users can view own donations" ON public.donations
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all donations" ON public.donations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );
