# 🚀 Guia de Deploy para Produção - Portal Instituto Imagine

## 📋 **Visão Geral**

Este guia detalha o processo completo de deploy do Portal Instituto Imagine para produção, incluindo pré-requisitos, checklist e procedimentos de verificação.

---

## 🔧 **Pré-requisitos**

### **✅ Contas e Serviços Necessários**
- [ ] **Vercel:** Conta configurada e projeto conectado
- [ ] **GitHub:** Repositório com código atualizado
- [ ] **Supabase:** Projeto configurado e migrado
- [ ] **Stripe:** Conta configurada e chaves obtidas
- [ ] **Resend:** Conta para envio de emails

### **✅ Variáveis de Ambiente**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# URLs
NEXT_PUBLIC_APP_URL=https://portal.imagineinstituto.com
```

---

## 📝 **Checklist Pré-Deploy**

### **🧪 Testes Locais**
- [ ] Servidor local funcionando (`npm run dev`)
- [ ] Login/registro funcionando
- [ ] Checkout funcionando
- [ ] Admin panel acessível
- [ ] Chat de suporte visível
- [ ] Responsividade testada
- [ ] Sem erros de console

### **🔍 Validação de Código**
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings
- [ ] Todos os imports corretos
- [ ] Variáveis de ambiente testadas
- [ ] APIs funcionando localmente

### **🗄️ Banco de Dados**
- [ ] Schema atualizado
- [ ] Migrations executadas
- [ ] Dados de teste criados
- [ ] Usuários demo criados (se necessário)
- [ ] Backup realizado

### **🔐 Configurações de Segurança**
- [ ] Chaves de API configuradas
- [ ] Permissões RLS verificadas
- [ ] Webhooks configurados
- [ ] Domínios autorizados

---

## 🚀 **Processo de Deploy**

### **1. 📝 Commit das Alterações**
```bash
# Adicionar arquivos modificados
git add .

# Commit com mensagem descritiva
git commit -m "feat: Descrição das alterações implementadas"

# Push para branch main
git push origin main
```

### **2. 🔄 Deploy Automático**
- O Vercel detecta automaticamente o push
- Inicia o processo de build
- Aplica as variáveis de ambiente
- Executa os testes (se configurados)
- Faz deploy para produção

### **3. ⏱️ Tempo de Deploy**
- **Build:** ~30-45 segundos
- **Deploy:** ~10-15 segundos
- **Total:** ~45-60 segundos

---

## 🔍 **Verificação Pós-Deploy**

### **🌐 URLs de Teste**
```
✅ Página Principal: https://portal.imagineinstituto.com/
✅ Login: https://portal.imagineinstituto.com/auth
✅ Checkout: https://portal.imagineinstituto.com/embed/checkout/checkout-stripe?project=mock-1
✅ Admin: https://portal.imagineinstituto.com/admin/dashboard
✅ Health Check: https://portal.imagineinstituto.com/api/health
```

### **🧪 Testes Funcionais**

#### **🔐 Sistema de Login**
- [ ] Página de login carrega
- [ ] Formulário de login funciona
- [ ] Registro de usuário funciona
- [ ] Recuperação de senha funciona
- [ ] Redirecionamento por role funciona
- [ ] Logout funciona

#### **💰 Sistema de Doações**
- [ ] Checkout carrega corretamente
- [ ] Valores pré-definidos funcionam
- [ ] Valor personalizado funciona
- [ ] Opções (recorrente, anônimo, mensagem) funcionam
- [ ] Redirecionamento para Stripe funciona
- [ ] Página de sucesso funciona

#### **👥 Sistema Admin**
- [ ] Dashboard admin acessível
- [ ] Lista de projetos carrega
- [ ] Criação de projeto funciona
- [ ] Edição de projeto funciona
- [ ] Deletar projeto funciona
- [ ] Gestão de usuários funciona

#### **💬 Chat de Suporte**
- [ ] Chat aparece nas páginas corretas
- [ ] Chat não aparece em admin/checkout
- [ ] Widget carrega corretamente
- [ ] Funcionalidade básica funciona

---

## 🛠️ **Comandos Úteis**

### **📊 Status do Deploy**
```bash
# Listar deploys
vercel ls

# Verificar deploy específico
vercel inspect [deploy-url]

# Logs do deploy
vercel logs [deployment-id]
```

### **🔧 Troubleshooting**
```bash
# Verificar variáveis de ambiente
vercel env ls

# Recriar deploy
vercel --prod

# Rollback para deploy anterior
vercel rollback [deployment-id]
```

---

## 🚨 **Problemas Comuns e Soluções**

### **❌ Deploy Falhou**
**Possíveis causas:**
- Erro de sintaxe no código
- Variáveis de ambiente faltando
- Dependências não instaladas
- Build timeout

**Soluções:**
1. Verificar logs do deploy
2. Testar build local (`npm run build`)
3. Verificar variáveis de ambiente
4. Revisar código por erros

### **❌ Página 404**
**Possíveis causas:**
- Rota não configurada
- Arquivo não encontrado
- Cache do navegador

**Soluções:**
1. Verificar estrutura de arquivos
2. Limpar cache do navegador
3. Verificar configuração do Next.js

### **❌ API Não Funciona**
**Possíveis causas:**
- Variáveis de ambiente incorretas
- Banco de dados não conectado
- Permissões incorretas

**Soluções:**
1. Verificar variáveis de ambiente
2. Testar conexão com Supabase
3. Verificar logs da API

### **❌ Chat Não Aparece**
**Possíveis causas:**
- Script do Tawk.to não carregou
- Condições de visibilidade incorretas
- JavaScript desabilitado

**Soluções:**
1. Verificar console do navegador
2. Testar em diferentes páginas
3. Verificar configuração do Tawk.to

---

## 📊 **Monitoramento Pós-Deploy**

### **🔍 Health Checks**
```bash
# Verificar status da aplicação
curl https://portal.imagineinstituto.com/api/health

# Resposta esperada:
{
  "status": "ok",
  "timestamp": "2025-10-05T14:30:00.000Z",
  "environment": "production"
}
```

### **📈 Métricas Importantes**
- **Uptime:** > 99.9%
- **Response time:** < 2 segundos
- **Error rate:** < 0.1%
- **Build success rate:** > 95%

### **🚨 Alertas Configurados**
- [ ] Deploy falhou
- [ ] Health check falhou
- [ ] Error rate alto
- [ ] Response time alto

---

## 🔄 **Processo de Rollback**

### **🔄 Rollback Automático**
```bash
# Listar deploys recentes
vercel ls

# Rollback para deploy anterior
vercel rollback [deployment-id]

# Rollback para deploy específico
vercel rollback [deployment-url]
```

### **🔍 Verificação Pós-Rollback**
- [ ] Site volta ao estado anterior
- [ ] Funcionalidades críticas funcionam
- [ ] Dados não foram perdidos
- [ ] Usuários não são afetados

---

## 📋 **Checklist Final**

### **✅ Deploy Bem-sucedido**
- [ ] Build completou sem erros
- [ ] Deploy finalizou com sucesso
- [ ] Health check retorna OK
- [ ] Todas as páginas carregam
- [ ] Funcionalidades críticas funcionam
- [ ] Chat de suporte aparece
- [ ] Admin panel acessível
- [ ] Checkout funciona

### **✅ Documentação Atualizada**
- [ ] Changelog atualizado
- [ ] Funcionalidades documentadas
- [ ] URLs de produção verificadas
- [ ] Comandos de deploy testados

---

## 📞 **Suporte**

### **🐛 Reportar Problemas**
- **Chat de suporte:** Disponível no site
- **Email:** suporte@imagineinstituto.com
- **GitHub:** Issues no repositório

### **📚 Documentação Adicional**
- **Changelog:** `docs/CHANGELOG_COMPLETO.md`
- **Funcionalidades:** `docs/FUNCIONALIDADES_IMPLEMENTADAS.md`
- **Configuração:** `docs/guias/`

---

**📝 Documento gerado em:** 05/10/2025 11:40  
**🔄 Última atualização:** Deploy v2.1.0  
**👨‍💻 Responsável:** Sistema de IA - Portal Imagine  

---

*Este guia é atualizado a cada mudança significativa no processo de deploy.*
