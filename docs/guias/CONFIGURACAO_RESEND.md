# 📧 Configuração do Resend

## 🎯 **O que é o Resend?**

O Resend é um serviço de email transacional que permite enviar emails automaticamente quando eventos acontecem no sistema (como doações bem-sucedidas).

## 🔧 **Configuração**

### **1. Criar conta no Resend:**
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu domínio (opcional, mas recomendado)

### **2. Obter API Key:**
1. No dashboard do Resend, vá para "API Keys"
2. Clique em "Create API Key"
3. Dê um nome (ex: "Portal Imagine")
4. Copie a chave (começa com `re_`)

### **3. Configurar variáveis de ambiente:**

#### **No Vercel:**
1. Acesse o dashboard do Vercel
2. Vá para o projeto "portal-imagine"
3. Clique em "Settings" > "Environment Variables"
4. Adicione:
   ```
   RESEND_API_KEY=re_GRZ1apgC_Cf3M4P5VAGTdbgKWNpcou454
   ```

#### **No arquivo .env.local (desenvolvimento):**
```env
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **4. Configurar domínio (opcional):**

#### **Para usar domínio personalizado:**
1. No Resend, vá para "Domains"
2. Adicione seu domínio: `imagineinstituto.com`
3. Configure os registros DNS conforme instruções
4. Aguarde a verificação

#### **Para usar domínio do Resend:**
- Use `noreply@resend.dev` (funciona imediatamente)

## 📧 **Emails Automáticos Implementados**

### **Email de Boas-vindas:**
- **Quando**: Após doação bem-sucedida
- **Para**: Novos usuários
- **Conteúdo**: 
  - Agradecimento pela doação
  - Credenciais de acesso (email + senha temporária)
  - Link para acessar o portal
  - Instruções para redefinir senha

### **Email de Confirmação:**
- **Quando**: Imediatamente após doação
- **Para**: Todos os doadores
- **Conteúdo**:
  - Confirmação da doação
  - Detalhes (valor, projeto, ID)
  - Informações sobre próximos passos

### **Email de Atualização de Projeto:**
- **Quando**: Marco atingido, projeto concluído, nova informação
- **Para**: Doadores do projeto
- **Conteúdo**:
  - Tipo de atualização (marco, conclusão, progresso)
  - Mensagem personalizada
  - Links para ver o projeto completo

### **Email de Notificação Admin:**
- **Quando**: Nova doação, meta atingida, alertas do sistema
- **Para**: Administradores
- **Conteúdo**:
  - Detalhes da notificação
  - Dados técnicos relevantes
  - Link para dashboard admin

### **Email de Lembrete Recorrente:**
- **Quando**: Antes da próxima cobrança recorrente
- **Para**: Doadores com doações recorrentes
- **Conteúdo**:
  - Detalhes da doação recorrente
  - Data do próximo pagamento
  - Links para gerenciar doações

## 🎨 **Personalização**

### **🏛️ Logo do Instituto Imagine**
Todos os emails incluem o logo oficial do Instituto Imagine:

- **URL**: `https://portal.imagineinstituto.com/images/logo.png`
- **Altura**: 60-80px (otimizada para emails)
- **Implementação**: Automática em todos os templates
- **Fallback**: Texto alternativo configurado

```typescript
// src/lib/email-config.ts
export const getLogoUrl = (): string => {
  return 'https://portal.imagineinstituto.com/images/logo.png'
}
```

### **Alterar remetente:**
No arquivo `src/lib/resend.ts`, linha 25:
```typescript
from: 'Instituto Imagine <noreply@imagineinstituto.com>',
```

### **Alterar templates:**
- Edite o HTML nos templates em `src/lib/resend.ts`
- Use variáveis CSS para personalizar cores e estilos
- Teste sempre em diferentes clientes de email

### **Adicionar novos emails:**
1. Crie nova função em `src/lib/resend.ts`
2. Chame a função onde necessário
3. Teste o envio

## 🧪 **Testando**

### **1. Teste com script automatizado:**
```bash
# Testar todos os tipos de email
node scripts/test-email-system.js all

# Testar tipos específicos
node scripts/test-email-system.js welcome
node scripts/test-email-system.js confirmation
node scripts/test-email-system.js update
node scripts/test-email-system.js reminder
node scripts/test-email-system.js admin
```

### **2. Teste de Logo:**
```bash
# Testar diferentes URLs de logo
node scripts/test-logo-urls.js

# Testar template específico com logo
node scripts/test-welcome-with-logo.js

# Teste final com logo de produção
node scripts/test-final-logo.js
```

### **2. Teste local:**
```bash
npm run dev
# Faça uma doação de teste
# Verifique os logs do console
```

### **3. Teste em produção:**
1. Faça uma doação real
2. Verifique se o email chegou
3. Teste os links do email

### **4. Verificar logs:**
- **Vercel**: Dashboard > Functions > Logs
- **Resend**: Dashboard > Logs
- **Console**: Logs detalhados do sistema

### **5. Teste de funcionalidades:**
```bash
# Testar envio de email de boas-vindas
node -e "
const { welcomeNewDonor } = require('./src/lib/email-service');
welcomeNewDonor('João Silva', 'teste@email.com', 'temp123', 100, 'Educação Digital');
"

# Testar notificação admin
node -e "
const { notifyAdminNewDonation } = require('./src/lib/email-service');
notifyAdminNewDonation('Maria Santos', 'maria@email.com', 150, 'Alimentação Escolar', 'don_123');
"
```

## 📊 **Monitoramento**

### **Métricas importantes:**
- Taxa de entrega
- Taxa de abertura
- Taxa de cliques
- Bounces e spam

### **Onde verificar:**
- Dashboard do Resend
- Logs do Vercel
- Console do navegador

## 🔒 **Segurança**

### **Boas práticas:**
- ✅ Nunca commite a API key
- ✅ Use domínio verificado
- ✅ Configure SPF/DKIM
- ✅ Monitore bounces
- ✅ Respeite limites de rate

### **Limites gratuitos:**
- 3.000 emails/mês
- 100 emails/dia
- Domínios verificados: 1

## 🚨 **Troubleshooting**

### **Email não enviado:**
1. Verifique se `RESEND_API_KEY` está configurada
2. Verifique os logs do Vercel
3. Verifique se o domínio está verificado
4. Teste com domínio do Resend primeiro

### **Email na caixa de spam:**
1. Configure SPF/DKIM
2. Use domínio verificado
3. Evite palavras que triggam spam
4. Configure feedback loop

### **Erro de autenticação:**
1. Verifique se a API key está correta
2. Verifique se não expirou
3. Regenerar API key se necessário

## 📝 **Exemplos de uso:**

### **Usando o EmailService (Recomendado):**
```typescript
import { EmailService } from '@/lib/email-service'

// Enviar email de boas-vindas
await EmailService.sendWelcome({
  name: 'João Silva',
  email: 'joao@email.com',
  tempPassword: 'abc123',
  donationAmount: 100,
  projectTitle: 'Educação Digital'
})

// Enviar confirmação de doação
await EmailService.sendDonationConfirmation({
  name: 'Maria Santos',
  email: 'maria@email.com',
  amount: 150,
  projectTitle: 'Alimentação Escolar',
  donationId: 'don_123456789',
  paymentMethod: 'PIX'
})

// Enviar atualização de projeto
await EmailService.sendProjectUpdate({
  name: 'Pedro Costa',
  email: 'pedro@email.com',
  projectTitle: 'Construção da Biblioteca',
  projectId: 'proj_123',
  updateType: 'milestone',
  updateMessage: 'Acabamos de atingir 50% da meta!',
  projectUrl: 'https://portal.imagineinstituto.com/projetos/proj_123'
})
```

### **Usando funções de conveniência:**
```typescript
import { 
  welcomeNewDonor, 
  confirmDonation, 
  notifyProjectUpdate,
  notifyAdminNewDonation 
} from '@/lib/email-service'

// Funções simplificadas
await welcomeNewDonor('João Silva', 'joao@email.com', 'temp123', 100, 'Educação Digital')
await confirmDonation('Maria Santos', 'maria@email.com', 150, 'don_123', 'Alimentação Escolar')
await notifyProjectUpdate('Pedro', 'pedro@email.com', 'Biblioteca', 'proj_123', 'milestone', '50% atingido!')
await notifyAdminNewDonation('João', 'joao@email.com', 200, 'Educação Digital', 'don_456')
```

### **Envio em lote:**
```typescript
import { EmailService } from '@/lib/email-service'

const emails = [
  { type: 'welcome', data: { name: 'João', email: 'joao@email.com', ... } },
  { type: 'confirmation', data: { name: 'Maria', email: 'maria@email.com', ... } },
  { type: 'update', data: { name: 'Pedro', email: 'pedro@email.com', ... } }
]

const result = await EmailService.sendBatch(emails)
console.log(`Enviados: ${result.success}, Falharam: ${result.failed}`)
```

## 🎉 **Pronto!**

Após configurar o Resend, os usuários receberão emails automáticos:
- ✅ Confirmação de doação
- ✅ Credenciais de acesso
- ✅ Instruções para usar o portal
- ✅ Links para redefinir senha

**Sistema de email 100% funcional!** 📧✨
