# 📜 Scripts Portal Instituto Imagine

Scripts utilitários para desenvolvimento, deploy e configuração do Portal Instituto Imagine.

## 📁 Scripts Disponíveis

### **🚀 Deploy**
- `deploy-local.sh` - Deploy ambiente local
- `deploy-dev.sh` - Deploy ambiente dev
- `deploy-prod.sh` - Deploy ambiente prod

### **⚙️ Configuração**
- `setup-dev-environment.sh` - Configurar ambiente dev
- `configure-dev-database.sh` - Configurar banco dev
- `setup-dev-database.sh` - Setup do banco dev
- `generate-secrets.js` - Gerar secrets NextAuth

### **🧪 Testes**
- `test-supabase-connection.js` - Testar conexão Supabase
- `test-supabase.js` - Testes do Supabase
- `check-projects.js` - Verificar projetos
- `test-donation-*.js` - Testes de doação

### **🔧 Automação**
- `auto-fill-checkout.js` - Preenchimento automático checkout
- `console-script.js` - Script para console
- `simple-fill.js` - Preenchimento simples
- `universal-fill.js` - Preenchimento universal

### **🌐 Deploy**
- `setup-caprover.sh` - Setup CapRover
- `check-dns.sh` - Verificar DNS

## 🎯 Como Usar

### **Scripts NPM**
```bash
# Deploy
npm run deploy:local     # Deploy local
npm run deploy:dev       # Deploy dev
npm run deploy:prod      # Deploy prod

# Configuração
npm run setup:dev        # Setup ambiente dev
npm run configure:dev-db # Configurar banco dev
npm run generate:secrets # Gerar secrets

# Testes
npm run test-supabase    # Testar Supabase
```

### **Scripts Diretos**
```bash
# Configurar ambiente dev
./scripts/setup-dev-environment.sh

# Deploy para produção
./scripts/deploy-prod.sh

# Gerar secrets
node scripts/generate-secrets.js
```

## 🔧 Configuração

### **Permissões**
```bash
# Dar permissão de execução
chmod +x scripts/*.sh
```

### **Dependências**
```bash
# Instalar dependências
npm install

# Verificar Node.js
node --version
```

## 📚 Documentação

### **Scripts de Deploy**
- **Local**: Desenvolvimento sem banco
- **Dev**: Testes com integrações reais
- **Prod**: Ambiente final

### **Scripts de Configuração**
- **Ambiente Dev**: Setup completo
- **Banco Dev**: Configuração do Supabase
- **Secrets**: Geração automática

### **Scripts de Teste**
- **Supabase**: Teste de conexão
- **Doações**: Teste de funcionalidades
- **Projetos**: Verificação de dados

## ⚠️ Importante

### **Segurança**
- **Nunca** commite credenciais
- **Sempre** use variáveis de ambiente
- **Mantenha** scripts seguros

### **Uso**
- **Teste** antes de usar em produção
- **Verifique** configurações
- **Mantenha** backups

## 🎯 Benefícios

### **✅ Automação**
- Deploy automático
- Configuração simplificada
- Testes automatizados

### **✅ Produtividade**
- Scripts prontos
- Configuração rápida
- Deploy fácil

### **✅ Manutenção**
- Scripts organizados
- Documentação completa
- Fácil atualização

---

**🎯 Scripts organizados e documentados para máxima produtividade**
