# 🚀 Checklist Deploy Produção - Portal Instituto Imagine

## 📋 **Status Atual**
✅ **Build de produção**: Funcionando (com warnings)  
🔄 **Ambiente dev**: Deploy realizado com chat  
⏳ **Ambiente prod**: Aguardando checklist completo  

---

## ✅ **CHECKLIST OBRIGATÓRIO**

### **1. 🔧 Testes Técnicos**

#### **1.1 Build de Produção**
- [x] ✅ **Build funciona sem erros** (`npm run build`)
- [ ] ⚠️ **Corrigir warnings** (não críticos, mas recomendados)
- [ ] ✅ **Testar build local** com `npm run start`

#### **1.2 Variáveis de Ambiente**
- [ ] ✅ **Verificar env.prod.example** vs ambiente real
- [ ] ✅ **Supabase PROD** configurado corretamente
- [ ] ✅ **Stripe LIVE** configurado corretamente
- [ ] ✅ **Resend PROD** configurado corretamente
- [ ] ✅ **NEXTAUTH_URL** apontando para produção
- [ ] ✅ **NEXTAUTH_SECRET** configurado

#### **1.3 Funcionalidades Críticas**
- [ ] ✅ **Sistema de doações** funcionando
- [ ] ✅ **Autenticação** funcionando
- [ ] ✅ **Dashboard admin** funcionando
- [ ] ✅ **Chat de suporte** funcionando
- [ ] ✅ **Sistema híbrido de checkout** funcionando
- [ ] ✅ **Emails transacionais** funcionando

### **2. 🌐 Testes de Integração**

#### **2.1 Supabase Produção**
- [ ] ✅ **Conexão** com banco de produção
- [ ] ✅ **RLS (Row Level Security)** ativo
- [ ] ✅ **Usuários demo** funcionando
- [ ] ✅ **Dados reais** carregando

#### **2.2 Stripe Produção**
- [ ] ✅ **Chaves LIVE** configuradas
- [ ] ✅ **Webhooks** apontando para produção
- [ ] ✅ **Teste de pagamento** real
- [ ] ✅ **PIX habilitado** (se necessário)

#### **2.3 Resend Produção**
- [ ] ✅ **API key** de produção
- [ ] ✅ **Domínio verificado**
- [ ] ✅ **Templates** funcionando
- [ ] ✅ **Logo** carregando corretamente

### **3. 🎨 Testes de Interface**

#### **3.1 Design System**
- [ ] ✅ **Cores** consistentes
- [ ] ✅ **Tipografia** funcionando
- [ ] ✅ **Componentes** renderizando
- [ ] ✅ **Responsividade** mobile/desktop

#### **3.2 Navegação**
- [ ] ✅ **Sidebar** funcionando
- [ ] ✅ **Links** funcionando
- [ ] ✅ **Breadcrumbs** funcionando
- [ ] ✅ **Botões** funcionando

#### **3.3 Chat de Suporte**
- [ ] ✅ **Widget** aparecendo
- [ ] ✅ **Posicionamento** correto
- [ ] ✅ **Responsividade** mobile
- [ ] ✅ **Integração** funcionando

### **4. 📱 Testes de Dispositivos**

#### **4.1 Desktop**
- [ ] ✅ **Chrome** funcionando
- [ ] ✅ **Firefox** funcionando
- [ ] ✅ **Safari** funcionando
- [ ] ✅ **Edge** funcionando

#### **4.2 Mobile**
- [ ] ✅ **iOS Safari** funcionando
- [ ] ✅ **Android Chrome** funcionando
- [ ] ✅ **Responsividade** adequada
- [ ] ✅ **Touch** funcionando

### **5. 🔐 Testes de Segurança**

#### **5.1 Autenticação**
- [ ] ✅ **Login** funcionando
- [ ] ✅ **Logout** funcionando
- [ ] ✅ **Redirecionamento** correto
- [ ] ✅ **Sessões** seguras

#### **5.2 Permissões**
- [ ] ✅ **Admin** acessa apenas admin
- [ ] ✅ **Doador** acessa apenas doador
- [ ] ✅ **Voluntário** acessa apenas voluntário
- [ ] ✅ **RLS** protegendo dados

### **6. 📊 Testes de Performance**

#### **6.1 Carregamento**
- [ ] ✅ **Primeira carga** < 3s
- [ ] ✅ **Navegação** < 1s
- [ ] ✅ **Imagens** otimizadas
- [ ] ✅ **Bundle size** otimizado

#### **6.2 SEO**
- [ ] ✅ **Meta tags** corretas
- [ ] ✅ **Open Graph** funcionando
- [ ] ✅ **Sitemap** gerado
- [ ] ✅ **Robots.txt** configurado

---

## ⚠️ **WARNINGS IDENTIFICADOS (Não Críticos)**

### **Warnings de Lint:**
1. **React Hook dependencies** - Alguns useEffect com dependências faltando
2. **Next.js Image** - Algumas `<img>` que poderiam ser `<Image>`
3. **Fonts** - Fonts customizadas não no _document.js
4. **Metadata base** - metadataBase não configurado

### **Warnings de Performance:**
1. **Client-side rendering** - Algumas páginas deopted para CSR
2. **Bundle size** - Alguns chunks grandes

---

## 🎯 **AÇÕES RECOMENDADAS ANTES DO DEPLOY**

### **Prioridade ALTA:**
1. **Testar chat** no ambiente dev online
2. **Verificar variáveis** de ambiente produção
3. **Testar doação** real com Stripe
4. **Verificar emails** transacionais

### **Prioridade MÉDIA:**
1. **Corrigir warnings** de lint
2. **Otimizar imagens** com Next.js Image
3. **Configurar metadataBase**
4. **Testar em diferentes browsers**

### **Prioridade BAIXA:**
1. **Otimizar bundle size**
2. **Melhorar performance**
3. **Implementar sitemap**
4. **Configurar analytics**

---

## 🚀 **PROCESSO DE DEPLOY**

### **Passo 1: Preparação**
```bash
# 1. Verificar branch atual
git status

# 2. Fazer merge dev -> main (se necessário)
git checkout main
git merge dev

# 3. Testar build final
npm run build
```

### **Passo 2: Deploy**
```bash
# 1. Push para main (deploy automático)
git push origin main

# 2. Verificar deploy no Vercel
# 3. Testar ambiente de produção
```

### **Passo 3: Verificação Pós-Deploy**
```bash
# 1. Testar todas as funcionalidades
# 2. Verificar logs do Vercel
# 3. Testar chat de suporte
# 4. Verificar emails
```

---

## 📞 **CONTATOS DE EMERGÊNCIA**

### **Em caso de problemas:**
1. **Vercel Dashboard** - Verificar logs
2. **Supabase Dashboard** - Verificar conexão
3. **Stripe Dashboard** - Verificar pagamentos
4. **Resend Dashboard** - Verificar emails

### **Rollback (se necessário):**
```bash
# Reverter para commit anterior
git revert HEAD
git push origin main
```

---

## ✅ **STATUS FINAL**

### **Pronto para Deploy:**
- [ ] ✅ **Todos os testes** críticos passando
- [ ] ✅ **Variáveis de ambiente** configuradas
- [ ] ✅ **Funcionalidades** testadas
- [ ] ✅ **Chat de suporte** funcionando
- [ ] ✅ **Build** sem erros críticos

### **URLs de Teste Pós-Deploy:**
- **Produção**: https://portal.imagineinstituto.com
- **Chat**: Widget no canto inferior direito
- **Admin**: `/admin/dashboard`
- **Doador**: `/dashboard?demo_email=demo@doador.com`

---

**📅 Criado em:** 24/09/2025  
**🔄 Última atualização:** 24/09/2025  
**👨‍💻 Responsável:** Equipe Portal Imagine  
**🎯 Status:** Aguardando aprovação para deploy
