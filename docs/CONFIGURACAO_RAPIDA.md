# ⚡ Configuração Rápida - Supabase

## 🎯 **Para ativar o Supabase agora:**

### **1. Configure as variáveis de ambiente**

Crie ou edite o arquivo `.env.local` na raiz do projeto com suas credenciais do Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Stripe Configuration (opcional por enquanto)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret_aqui

# Site Principal
NEXT_PUBLIC_MAIN_SITE_URL=https://imagineinstituto.com

# Environment
NODE_ENV=development
```

### **2. Execute o script de teste**

```bash
npm run test-supabase
```

### **3. Se tudo estiver funcionando, você verá:**

```
🔍 Testando conexão com Supabase...
✅ Conexão com Supabase funcionando!

🔍 Verificando tabelas...
✅ Tabela profiles: OK
✅ Tabela projects: OK
✅ Tabela donations: OK
✅ Tabela favorites: OK
✅ Tabela notifications: OK

🔄 Migrando projetos...
✅ 4 projetos inseridos com sucesso!

✅ Teste e migração concluídos!
```

---

## 🚀 **Próximos passos após configurar:**

1. **Teste a página de projetos** - `http://localhost:3000/projetos`
2. **Teste a autenticação** - `http://localhost:3000/auth`
3. **Configure o Stripe** (se quiser pagamentos reais)

---

## 📋 **Checklist de configuração:**

- [ ] Projeto Supabase criado
- [ ] Scripts SQL executados (`supabase-setup.sql` e `supabase-storage-setup.sql`)
- [ ] Variáveis de ambiente configuradas
- [ ] Script de teste executado com sucesso
- [ ] Página de projetos carregando dados reais

---

**Depois de configurar, me avise que continuamos com a migração completa!** 🎯

