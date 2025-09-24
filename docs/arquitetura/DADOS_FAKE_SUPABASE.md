# 🎯 Dados Fake no Supabase - Portal Instituto Imagine

Sistema híbrido para usar dados fake realistas no banco Supabase ao invés de mock data estática.

## 🎉 **O que mudou?**

### **✅ Antes: Mock Data Estática**
- Dados fixos no código
- Sem persistência
- Sem relacionamentos

### **🚀 Agora: Dados Fake no Banco**
- **10 projetos realistas** no Supabase
- **5 usuários fake** (1 admin + 4 doadores)
- **50 doações realistas** com valores variados
- **Favoritos** para cada usuário
- **Notificações** com conteúdo real
- **Fallback automático** para mock se Supabase não funcionar

## 📊 **Dados Inseridos**

### **Projetos (10)**
1. **Educação Digital** - São Paulo, SP
2. **Saúde Comunitária** - Bahia, BA
3. **Meio Ambiente** - Amazonas, AM
4. **Esporte Social** - Rio de Janeiro, RJ (Completo)
5. **Cultura e Arte** - Minas Gerais, MG
6. **Alimentação Saudável** - Ceará, CE
7. **Tecnologia Social** - Paraná, PR
8. **Inclusão Social** - Santa Catarina, SC
9. **Empreendedorismo Social** - Rio Grande do Sul, RS
10. **Proteção Animal** - Goiás, GO

### **Usuários (5)**
- **Admin**: `admin@institutoimagine.org`
- **Demo**: `demo@doador.com`
- **Maria Silva**: `maria.silva@email.com`
- **João Santos**: `joao.santos@email.com`
- **Ana Costa**: `ana.costa@email.com`

### **Dados Relacionais**
- **50 doações** com valores de R$ 50 a R$ 1.050
- **90% doações completas**, 10% pendentes
- **Favoritos** (2-5 por usuário)
- **Notificações** variadas (1-5 por usuário)

## 🚀 **Como Usar**

### **1. Inserir Dados Fake no Supabase**

```bash
# Executar script para inserir dados fake
npm run insert-fake-data
```

**O que o script faz:**
- ✅ Testa conexão com Supabase
- 🧹 Limpa dados existentes
- 📝 Insere 10 projetos realistas
- 👥 Insere 5 usuários fake
- 💰 Insere 50 doações variadas
- ❤️ Insere favoritos
- 🔔 Insere notificações

### **2. Sistema Híbrido Automático**

O sistema agora funciona com **fallback automático**:

```typescript
// Lógica híbrida na database.ts
export async function getProjects(): Promise<Project[]> {
  try {
    // 1. Tentar carregar do Supabase primeiro
    const { data, error } = await supabase.from('projects')...
    
    if (error) {
      console.warn('⚠️ Supabase não disponível, usando dados mock')
      return mockProjects  // Fallback para mock
    }
    
    if (!data || data.length === 0) {
      console.info('ℹ️ Nenhum projeto no Supabase, usando dados mock')
      return mockProjects  // Fallback para mock
    }
    
    console.log(`✅ ${data.length} projetos carregados do Supabase`)
    return data  // Dados reais do Supabase
  } catch (error) {
    console.warn('⚠️ Erro de conexão, usando dados mock')
    return mockProjects  // Fallback para mock
  }
}
```

### **3. Fluxos de Desenvolvimento**

#### **🌐 Com Supabase Funcionando:**
```
Frontend → Supabase Dev → Dados Fake Realistas
         ↳ Persistência real
         ↳ Relacionamentos funcionais
         ↳ CRUD completo
```

#### **💻 Offline ou Problemas:**
```
Frontend → Mock Data → Dados Estáticos
         ↳ Desenvolvimento local
         ↳ Demonstração
         ↳ Fallback seguro
```

## 🔧 **Comandos Disponíveis**

```bash
# Inserir dados fake no Supabase
npm run insert-fake-data

# Testar conexão com Supabase
npm run test-supabase

# Testar autenticação
npm run test-auth

# Rodar em desenvolvimento
npm run dev
```

## 🎯 **Vantagens**

### **✅ Dados Realistas**
- **Relacionamentos** funcionais
- **Persistência** real
- **CRUD** completo
- **Busca e filtros** funcionais

### **✅ Desenvolvimento**
- **Offline first** com fallback
- **Colaboração** entre desenvolvedores
- **Dados consistentes** entre local e dev
- **Performance** real

### **✅ Demonstração**
- **Dados variados** e interessantes
- **Valores realistas** 
- **Categorias diversas**
- **Estados diferentes** (ativo, completo, etc.)

## 🚨 **Importante**

### **Ambientes**
- **Local + Dev**: Compartilham mesmo banco Supabase
- **Prod**: Banco separado com dados reais
- **Fallback**: Mock data quando Supabase indisponível

### **Sincronização**
- **Dados são compartilhados** entre local e dev
- **Cuidado** com modificações simultâneas
- **Backup** antes de mudanças grandes

### **Reset de Dados**
```bash
# Re-executar script limpa e re-insere dados
npm run insert-fake-data
```

## 🎨 **Categorias de Projetos**

- **Educação** - educacao
- **Saúde** - saude  
- **Meio Ambiente** - meio-ambiente
- **Esporte** - esporte
- **Cultura** - cultura
- **Alimentação** - alimentacao
- **Tecnologia** - tecnologia
- **Inclusão** - inclusao
- **Empreendedorismo** - empreendedorismo
- **Animais** - animais

## 📱 **URLs de Teste**

### **Projetos**
- **Lista**: `http://localhost:3000/projetos`
- **Admin**: `http://localhost:3000/admin/projetos?demo_email=admin@institutoimagine.org`

### **Dashboard**
- **Doador**: `http://localhost:3000/dashboard?demo_email=demo@doador.com`
- **Admin**: `http://localhost:3000/dashboard?demo_email=admin@institutoimagine.org`

## 🔍 **Logs e Debug**

O sistema agora fornece logs claros:

```bash
✅ 10 projetos carregados do Supabase    # Dados reais
⚠️ Supabase não disponível, usando mock  # Fallback
ℹ️ Nenhum projeto no Supabase, usando mock # Vazio
```

---

**🎯 Agora você tem dados fake realistas no banco, com fallback automático para desenvolvimento offline!** 🚀
