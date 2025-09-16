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
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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

## 📧 **Emails Automáticos**

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

## 🎨 **Personalização**

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

### **1. Teste local:**
```bash
npm run dev
# Faça uma doação de teste
# Verifique os logs do console
```

### **2. Teste em produção:**
1. Faça uma doação real
2. Verifique se o email chegou
3. Teste os links do email

### **3. Verificar logs:**
- **Vercel**: Dashboard > Functions > Logs
- **Resend**: Dashboard > Logs

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

## 📝 **Exemplo de uso:**

```typescript
import { sendWelcomeEmail } from '@/lib/resend'

// Enviar email de boas-vindas
await sendWelcomeEmail({
  name: 'João Silva',
  email: 'joao@email.com',
  tempPassword: 'abc123',
  donationAmount: 100,
  projectTitle: 'Educação Digital'
})
```

## 🎉 **Pronto!**

Após configurar o Resend, os usuários receberão emails automáticos:
- ✅ Confirmação de doação
- ✅ Credenciais de acesso
- ✅ Instruções para usar o portal
- ✅ Links para redefinir senha

**Sistema de email 100% funcional!** 📧✨
