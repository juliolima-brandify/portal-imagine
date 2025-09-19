# 📚 Documentação Portal Instituto Imagine

Documentação completa do sistema Portal Instituto Imagine.

## 📋 Índice da Documentação

### **🌍 Ambientes**
- [Configuração de Ambientes](ambientes/AMBIENTES.md) - Visão geral dos 3 ambientes
- [Configurar Ambiente Dev](ambientes/CONFIGURAR_DEV.md) - Setup do ambiente de desenvolvimento

### **⚙️ Configuração**
- [Stripe Produção](configuracao/STRIPE_PRODUCAO.md) - Configurar Stripe para produção
- [Configuração Completa do Stripe](configuracao/CONFIGURACAO_STRIPE_COMPLETA.md) - Setup completo do Stripe
- [Configuração do Supabase](configuracao/CONFIGURACAO_SUPABASE.md) - Setup do Supabase

### **🚀 Deploy**
- [Instruções de Deploy](deploy/DEPLOY.md) - Guia de deploy

### **📜 Scripts**
- [Documentação de Scripts](scripts/README.md) - Scripts disponíveis

## 🎯 Guia Rápido

### **Para Desenvolvedores**
1. **Configurar ambiente local**: `npm run dev`
2. **Configurar ambiente dev**: `npm run setup:dev`
3. **Deploy para produção**: `npm run deploy:prod`

### **Para Clientes**
1. **Configurar chaves de produção** (Stripe, Supabase)
2. **Configurar no Vercel Dashboard**
3. **Testar ambiente de produção**

## 🔧 Scripts Principais

### **Desenvolvimento**
```bash
npm run dev              # Servidor local
npm run build            # Build de produção
npm run lint             # Linter
```

### **Deploy**
```bash
npm run deploy:local     # Deploy local
npm run deploy:dev       # Deploy dev
npm run deploy:prod      # Deploy produção
```

### **Configuração**
```bash
npm run setup:dev        # Setup ambiente dev
npm run generate:secrets # Gerar secrets
```

## 🌐 URLs dos Ambientes

| Ambiente | URL | Status |
|----------|-----|--------|
| **Local** | `http://localhost:3000` | ✅ Funcionando |
| **Dev** | `https://portal-dev.vercel.app` | ✅ Funcionando |
| **Prod** | `https://portal.imagineinstituto.com` | ✅ Funcionando |

## 📞 Suporte

### **Documentação**
- Toda a documentação está organizada nesta pasta
- Scripts automatizados disponíveis
- Estrutura profissional implementada

### **Contato**
- **Desenvolvedor**: [Seu contato]
- **Documentação**: Disponível no repositório
- **Suporte**: Conforme acordado

---

**🎯 Sistema Portal Instituto Imagine - 100% Funcional e Documentado**