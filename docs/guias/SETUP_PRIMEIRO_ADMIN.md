# 🚀 Setup do Primeiro Administrador

Guia para criar o primeiro administrador do sistema em produção.

## 📋 **Pré-requisitos**

- ✅ Deploy realizado com sucesso
- ✅ Variáveis de ambiente configuradas no Vercel
- ✅ Supabase configurado e funcionando
- ✅ Acesso ao dashboard do Supabase

## 🔐 **Métodos para Criar o Primeiro Admin**

### **Método 1: Script Automatizado (Recomendado)**

```bash
# 1. Navegar para o diretório do projeto
cd portal-imagine

# 2. Executar o script de setup
node scripts/setup-first-admin.js
```

**O que o script faz:**
- ✅ Cria usuário no Supabase Auth
- ✅ Cria perfil com role `admin`
- ✅ Configura email confirmado
- ✅ Fornece credenciais de acesso

### **Método 2: Via Dashboard Supabase**

1. **Acessar Supabase Dashboard**
   - Ir para [supabase.com](https://supabase.com)
   - Acessar seu projeto

2. **Criar Usuário no Auth**
   - Authentication → Users → Add User
   - Email: `admin@institutoimagine.org`
   - Password: `AdminImagine2024!`
   - Confirm email: ✅

3. **Criar Perfil Admin**
   - SQL Editor → New Query
   ```sql
   INSERT INTO profiles (id, email, name, role)
   VALUES (
     'USER_ID_AQUI', -- ID do usuário criado no Auth
     'admin@institutoimagine.org',
     'Administrador Instituto Imagine',
     'admin'
   );
   ```

### **Método 3: Via Interface (Se Acessível)**

1. **Criar Conta Normal**
   - Acessar `/auth`
   - Criar conta como doador

2. **Promover para Admin**
   - Acessar `/admin/usuarios` (se conseguir)
   - Editar usuário e mudar role para `admin`

## 🎯 **Credenciais Padrão do Primeiro Admin**

```
📧 Email: admin@institutoimagine.org
🔑 Senha: AdminImagine2024!
🌐 URL: https://portal.imagineinstituto.com/admin/dashboard
```

## ⚠️ **Passos de Segurança Pós-Criação**

### **1. Primeiro Login**
```bash
# Acessar URL de admin
https://portal.imagineinstituto.com/admin/dashboard

# Fazer login com credenciais criadas
```

### **2. Alterar Senha**
- Ir para `/admin/perfil`
- Alterar senha para uma mais segura
- Confirmar alteração

### **3. Verificar Acesso**
- ✅ Dashboard admin funcionando
- ✅ Gestão de projetos funcionando
- ✅ Gestão de usuários funcionando
- ✅ Relatórios funcionando

### **4. Criar Outros Admins**
- Ir para `/admin/usuarios`
- Criar novos usuários admin
- Remover dependência do admin inicial

## 🔧 **Troubleshooting**

### **Erro: "Usuário não é admin"**
```sql
-- Verificar role do usuário
SELECT id, email, name, role FROM profiles WHERE email = 'admin@institutoimagine.org';

-- Corrigir role se necessário
UPDATE profiles SET role = 'admin' WHERE email = 'admin@institutoimagine.org';
```

### **Erro: "Não consegue acessar admin"**
```sql
-- Verificar se perfil existe
SELECT * FROM profiles WHERE email = 'admin@institutoimagine.org';

-- Verificar se usuário existe no Auth
-- (Via Supabase Dashboard → Authentication → Users)
```

### **Erro: "Script não funciona"**
```bash
# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Executar com debug
DEBUG=true node scripts/setup-first-admin.js
```

## 📊 **Verificação de Funcionamento**

### **Teste Completo do Admin:**
```bash
# 1. Login
https://portal.imagineinstituto.com/admin/dashboard

# 2. Verificar Dashboard
- Métricas carregando ✅
- Gráficos funcionando ✅

# 3. Testar Gestão de Projetos
https://portal.imagineinstituto.com/admin/projetos
- Listar projetos ✅
- Criar projeto ✅
- Editar projeto ✅

# 4. Testar Gestão de Usuários
https://portal.imagineinstituto.com/admin/usuarios
- Listar usuários ✅
- Criar usuário ✅
- Editar usuário ✅

# 5. Testar Relatórios
https://portal.imagineinstituto.com/admin/relatorios
- Gráficos carregando ✅
- Exportação funcionando ✅
```

## 🎉 **Sucesso!**

Após seguir este guia, você terá:

- ✅ Primeiro administrador criado
- ✅ Acesso completo ao sistema admin
- ✅ Capacidade de gerenciar usuários
- ✅ Sistema pronto para produção

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs do Vercel**
2. **Verificar logs do Supabase**
3. **Executar script de verificação**
4. **Contatar suporte técnico**

---

**🎯 Portal Instituto Imagine - Sistema de Administração Completo**
