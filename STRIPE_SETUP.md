# 💳 Configuração do Stripe - Instituto Imagine

## 📋 Passo a Passo para Configurar o Stripe

### 1. Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Clique em "Start now" ou "Sign up"
3. Preencha os dados da organização:
   - **Business type**: Non-profit organization
   - **Country**: Brazil
   - **Business name**: Instituto Imagine
   - **Website**: https://imagineinstituto.com
4. Complete a verificação da conta

### 2. Configurar Produtos e Preços

1. No dashboard do Stripe, vá para **Products**
2. Clique em "Add product"
3. Crie produtos para cada categoria de projeto:
   - **Educação Digital** - R$ 50,00
   - **Saúde Comunitária** - R$ 50,00
   - **Meio Ambiente** - R$ 50,00
   - **Esporte Social** - R$ 50,00

### 3. Configurar Webhooks

1. Vá para **Developers** > **Webhooks**
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Events to send**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Copie o **Signing secret** (começa com `whsec_`)

### 4. Obter Chaves de API

1. Vá para **Developers** > **API keys**
2. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_test_` ou `pk_live_`)
   - **Secret key** (começa com `sk_test_` ou `sk_live_`)

### 5. Configurar Métodos de Pagamento

1. Vá para **Settings** > **Payment methods**
2. Habilite os métodos desejados:
   - ✅ **Credit cards** (Visa, Mastercard, Elo)
   - ✅ **PIX** (Brasil)
   - ✅ **Boleto** (Brasil)
   - ✅ **Bank transfer** (Brasil)

### 6. Configurar Checkout

1. Vá para **Settings** > **Checkout**
2. Configure:
   - **Payment methods**: Habilite PIX, cartão e boleto
   - **Customer information**: Email obrigatório
   - **Shipping address**: Não obrigatório
   - **Billing address**: Não obrigatório

### 7. Atualizar Variáveis de Ambiente

Atualize seu arquivo `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

### 8. Testar Pagamentos

#### 8.1 Cartões de Teste
Use estes cartões para testar:

**Cartões que funcionam:**
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

**Cartões que falham:**
- `4000 0000 0000 0002` - Cartão recusado
- `4000 0000 0000 9995` - Fundos insuficientes

**Dados para todos os cartões de teste:**
- **CVV**: Qualquer 3 dígitos
- **Data de expiração**: Qualquer data futura
- **CEP**: Qualquer CEP válido

#### 8.2 PIX de Teste
- Use qualquer chave PIX válida
- O pagamento será simulado

#### 8.3 Boleto de Teste
- Gere um boleto de teste
- Use o código de barras fornecido

### 9. Configurar Produção

#### 9.1 Ativar Conta
1. Complete a verificação da conta
2. Adicione informações bancárias
3. Ative a conta para receber pagamentos

#### 9.2 Atualizar Chaves
1. Troque as chaves de teste pelas de produção
2. Atualize as variáveis de ambiente
3. Configure webhooks para produção

#### 9.3 Configurar Domínio
1. Adicione seu domínio nas configurações
2. Configure SSL/HTTPS
3. Teste os webhooks em produção

### 10. Monitoramento

#### 10.1 Dashboard
- Monitore pagamentos em tempo real
- Acompanhe métricas de conversão
- Verifique disputas e reembolsos

#### 10.2 Logs
- Configure alertas para falhas
- Monitore webhooks
- Acompanhe erros de pagamento

#### 10.3 Relatórios
- Gere relatórios mensais
- Exporte dados para análise
- Configure notificações por email

## 🔧 Configurações Avançadas

### Taxas e Comissões
- **Stripe**: 3.4% + R$ 0,39 por transação
- **PIX**: 1.99% + R$ 0,39 por transação
- **Boleto**: 1.99% + R$ 0,39 por transação

### Limites
- **Transação mínima**: R$ 1,00
- **Transação máxima**: R$ 50.000,00
- **Volume mensal**: Sem limite

### Suporte
- **Documentação**: https://stripe.com/docs
- **Suporte**: https://support.stripe.com
- **Status**: https://status.stripe.com

## 🚨 Troubleshooting

### Erro de Webhook
1. Verifique se a URL está correta
2. Confirme se o webhook está ativo
3. Teste com o Stripe CLI

### Erro de Chaves
1. Verifique se as chaves estão corretas
2. Confirme se são de teste ou produção
3. Teste com cartões de teste

### Erro de Pagamento
1. Verifique os logs do Stripe
2. Confirme se o método está habilitado
3. Teste com diferentes cartões

## 📞 Suporte

Se encontrar problemas:
1. Consulte a documentação do Stripe
2. Use o Stripe CLI para debug
3. Entre em contato com o suporte do Stripe

---

**Próximo passo**: Testar a integração completa! 🎯
