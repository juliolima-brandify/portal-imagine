# 🔗 Integração Site Principal + Portal

## 📋 **Estratégia Implementada**

### **Site Principal (Framer) - Marketing:**
- **Foco**: Apresentação atrativa de projetos
- **Funcionalidade**: Marketing e conversão inicial
- **Doações**: Sistema integrado (Stripe)

### **Portal (Next.js) - Checkout + Admin:**
- **Foco**: Checkout especializado e administração
- **Funcionalidade**: Doações, dashboard, relatórios
- **Usuários**: Doadores e administradores

## 🔄 **Fluxo do Usuário**

1. **Usuário acessa** site principal (Framer)
2. **Vê projetos** de forma atrativa
3. **Clica "Ver Projeto"** → volta para site principal (detalhes)
4. **Clica "Doar"** → vai para portal (checkout)
5. **Faz doação** no portal
6. **Acessa dashboard** no portal (opcional)

## 🛠️ **Implementação no Site Principal (Framer)**

### **Links para o Portal:**

```html
<!-- Botão para ver detalhes (volta para site principal) -->
<a href="https://imagineinstituto.com/projetos/projeto-1">
  Ver Projeto
</a>

<!-- Botão para doar (vai para portal) -->
<a href="https://portal.imagineinstituto.com/doar/1">
  Doar Agora
</a>

<!-- Link para dashboard (após doação) -->
<a href="https://portal.imagineinstituto.com/dashboard">
  Acompanhar Minhas Doações
</a>
```

### **URLs do Portal:**

- **Projetos**: `https://portal.imagineinstituto.com/projetos`
- **Doação**: `https://portal.imagineinstituto.com/doar/[id]`
- **Dashboard**: `https://portal.imagineinstituto.com/dashboard`
- **Admin**: `https://portal.imagineinstituto.com/admin`

## ✅ **O que foi Implementado no Portal**

### **1. Limpeza e Foco:**
- ✅ Removida página de detalhes de projeto
- ✅ Página de projetos focada em checkout
- ✅ Links "Ver Detalhes" redirecionam para site principal

### **2. Páginas Completas:**
- ✅ `/sobre` - Informações sobre o portal
- ✅ `/contato` - Formulário de contato
- ✅ `/transparencia` - Relatórios e transparência

### **3. Checkout Otimizado:**
- ✅ Breadcrumbs para navegação
- ✅ Indicador de progresso (3 passos)
- ✅ Botões de navegação entre passos
- ✅ UX melhorada para conversão

### **4. Sistema Funcional:**
- ✅ Stripe 100% integrado
- ✅ Dashboard para doadores
- ✅ Admin para gestão
- ✅ Relatórios avançados

## 🎯 **URLs para Integração**

### **Site Principal → Portal:**
```
Doação específica:
https://portal.imagineinstituto.com/doar/1

Doação geral:
https://portal.imagineinstituto.com/doar/geral

Dashboard:
https://portal.imagineinstituto.com/dashboard

Projetos:
https://portal.imagineinstituto.com/projetos
```

### **Portal → Site Principal:**
```
Detalhes do projeto:
https://imagineinstituto.com/projetos/1

Site principal:
https://imagineinstituto.com
```

## 🔧 **Configuração Necessária**

### **No Site Principal (Framer):**
1. **Implementar links** para o portal
2. **Configurar Stripe** (se necessário)
3. **Testar integração** entre os sites

### **No Portal (Next.js):**
1. **Variáveis de ambiente** configuradas
2. **Stripe** funcionando
3. **Deploy** ativo no Vercel

## 📊 **Status Atual**

### **✅ Portal 100% Funcional:**
- Sistema de doações com Stripe
- Dashboard para doadores
- Admin para gestão
- Páginas institucionais
- Checkout otimizado

### **🔄 Próximos Passos:**
1. **Site Principal**: Implementar links para portal
2. **Teste**: Validar integração completa
3. **Deploy**: Atualizar portal no Vercel

## 🚀 **Deploy**

O portal está pronto para deploy no Vercel:

```bash
# Build bem-sucedido
npm run build ✅

# Deploy automático ativo
# A cada push no GitHub
```

## 📞 **Suporte**

Para dúvidas sobre a integração:
- **Portal**: `https://portal.imagineinstituto.com/contato`
- **Documentação**: Este arquivo
- **Logs**: Vercel Dashboard

---

**🎉 Portal Instituto Imagine - Pronto para Integração!**
