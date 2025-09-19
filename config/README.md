# ⚙️ Configuração de Ambientes

Esta pasta contém os arquivos de configuração para cada ambiente do Portal Instituto Imagine.

## 📁 Arquivos Disponíveis

### **🏠 Local (Desenvolvimento)**
- `env.local.example` - Configuração para ambiente local
- **Uso**: Prototipação e desenvolvimento
- **Banco**: Sem banco (dados mock)

### **🧪 Dev (Testes)**
- `env.dev.example` - Configuração para ambiente dev
- **Uso**: Testes de integração
- **Banco**: Supabase DEV

### **🚀 Prod (Produção)**
- `env.prod.example` - Configuração para ambiente prod
- **Uso**: Ambiente final
- **Banco**: Supabase PROD

## 🔧 Como Usar

### **1. Configurar Ambiente Local**
```bash
# Copiar arquivo de exemplo
cp env.local.example .env.local

# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

### **2. Configurar Ambiente Dev**
```bash
# Configurar ambiente dev
npm run setup:dev

# Deploy automático
npm run deploy:dev
```

### **3. Configurar Ambiente Prod**
```bash
# Deploy para produção
npm run deploy:prod
```

## ⚠️ Importante

### **Segurança**
- **Nunca** commite arquivos `.env.local`
- **Sempre** use variáveis de ambiente no Vercel
- **Mantenha** credenciais seguras

### **Configuração**
- **Cada ambiente** tem suas próprias credenciais
- **Separação** total entre ambientes
- **Controle** de acesso por ambiente

## 📚 Documentação

- [Configuração de Ambientes](../docs/ambientes/AMBIENTES.md)
- [Configurar Ambiente Dev](../docs/ambientes/CONFIGURAR_DEV.md)
- [Stripe Produção](../docs/configuracao/STRIPE_PRODUCAO.md)

---

**🎯 Configuração organizada e segura para todos os ambientes**
