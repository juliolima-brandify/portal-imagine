# 🔧 Correção do Schema do Banco de Dados

Guia para corrigir o erro "Could not find the 'checkout_tracking_url' column" no Supabase.

## 🚨 **Problema Identificado**

```
❌ Erro ao criar projeto: Could not find the 'checkout_tracking_url' column of 'projects' in the schema cache
```

**Causa:** Faltam colunas na tabela `projects` do Supabase.

## 🛠️ **Solução: Adicionar Colunas Faltantes**

### **Método 1: Via Supabase Dashboard (Recomendado)**

1. **Acessar Supabase Dashboard**
   - Ir para [supabase.com](https://supabase.com)
   - Acessar seu projeto

2. **Ir para SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

3. **Executar o SQL de Correção**
   ```sql
   -- Adicionar colunas faltantes na tabela projects
   ALTER TABLE projects 
   ADD COLUMN IF NOT EXISTS has_funding_goal BOOLEAN DEFAULT true,
   ADD COLUMN IF NOT EXISTS checkout_tracking_url TEXT,
   ADD COLUMN IF NOT EXISTS framer_project_url TEXT;

   -- Atualizar projetos existentes
   UPDATE projects 
   SET has_funding_goal = true 
   WHERE has_funding_goal IS NULL;
   ```

4. **Executar Query**
   - Clique em "Run" para executar o SQL
   - Aguarde a confirmação de sucesso

### **Método 2: Via Script Automatizado**

```bash
# Navegar para o diretório do projeto
cd portal-imagine

# Executar script de correção
node scripts/fix-database-schema.js
```

## 📋 **Colunas Adicionadas**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `has_funding_goal` | BOOLEAN | Define se o projeto tem meta de arrecadação visível |
| `checkout_tracking_url` | TEXT | URL do checkout com tracking |
| `framer_project_url` | TEXT | URL do projeto no site principal |

## ✅ **Verificação**

Após executar a correção:

1. **Testar criação de projeto**
   - Acessar `/admin/projetos`
   - Clicar em "Criar Projeto"
   - Preencher e salvar

2. **Verificar funcionalidades**
   - ✅ Criação de projetos
   - ✅ Edição de projetos
   - ✅ Meta de arrecadação opcional
   - ✅ Autocomplete de estados
   - ✅ URLs de checkout automáticas

## 🔍 **Troubleshooting**

### **Erro: "Permission denied"**
```sql
-- Verificar permissões da tabela
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'projects';
```

### **Erro: "Column already exists"**
```sql
-- Verificar se as colunas já existem
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('has_funding_goal', 'checkout_tracking_url', 'framer_project_url');
```

### **Erro: "RLS policy"**
- Verificar se as políticas RLS permitem INSERT/UPDATE
- Considerar desabilitar RLS temporariamente para a correção

## 🎯 **Resultado Esperado**

Após a correção:

- ✅ **Criação de projetos** funcionando
- ✅ **Edição de projetos** funcionando  
- ✅ **Meta opcional** implementada
- ✅ **Autocomplete de estados** funcionando
- ✅ **Checkout atualizado** automaticamente

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs do Supabase**
2. **Executar SQL manualmente**
3. **Contatar suporte técnico**

---

**🎯 Portal Instituto Imagine - Schema do Banco Corrigido**
