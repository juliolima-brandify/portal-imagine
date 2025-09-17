# 🖼️ Iframe para Framer - Código Final

## ✅ **Status: PRONTO PARA USO**

O iframe do checkout está funcionando perfeitamente após a correção do `X-Frame-Options`.

## 🔗 **URL do Iframe:**
```
https://portal.imagineinstituto.com/embed/checkout/1
```

## 📋 **Código HTML Completo para Framer:**

### **Opção 1: Iframe Simples**
```html
<iframe 
  src="https://portal.imagineinstituto.com/embed/checkout/1"
  width="100%"
  height="600"
  frameborder="0"
  allowtransparency="true"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
></iframe>
```

### **Opção 2: Iframe com Container Estilizado**
```html
<div style="
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
">
  <iframe 
    src="https://portal.imagineinstituto.com/embed/checkout/1"
    width="100%"
    height="600"
    frameborder="0"
    allowtransparency="true"
    style="border: none; border-radius: 12px;"
  ></iframe>
</div>
```

### **Opção 3: Iframe com JavaScript Avançado**
```html
<div id="checkout-container" style="
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
">
  <!-- Iframe será inserido aqui -->
</div>

<script>
(function() {
  // Criar iframe dinamicamente
  const iframe = document.createElement('iframe');
  iframe.src = 'https://portal.imagineinstituto.com/embed/checkout/1';
  iframe.width = '100%';
  iframe.height = '600';
  iframe.frameBorder = '0';
  iframe.allowTransparency = 'true';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';

  // Adicionar ao container
  const container = document.getElementById('checkout-container');
  if (container) {
    container.appendChild(iframe);
  }

  // Escutar mensagens do iframe
  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://portal.imagineinstituto.com') return;
    
    if (event.data.type === 'PAYMENT_SUCCESS') {
      const data = event.data.data;
      console.log('Doação realizada com sucesso:', data);
      
      // Mostrar mensagem de sucesso
      alert(`🎉 Doação de R$ ${data.amount} realizada com sucesso!`);
      
      // Opcional: Redirecionar para página de agradecimento
      // window.location.href = '/obrigado';
    }
    
    if (event.data.type === 'PAYMENT_ERROR') {
      console.error('Erro no pagamento:', event.data.data.error);
      alert('❌ Erro no processamento do pagamento. Tente novamente.');
    }
  });
})();
</script>
```

## 🎨 **Estilos CSS Adicionais (Opcional):**

```css
.checkout-iframe-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.checkout-iframe {
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 12px;
  background: white;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

/* Responsivo */
@media (max-width: 768px) {
  .checkout-iframe-container {
    padding: 15px;
    margin: 10px;
  }
  
  .checkout-iframe {
    height: 500px;
  }
}
```

## 📱 **Versão Mobile Otimizada:**

```html
<div style="
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
">
  <iframe 
    src="https://portal.imagineinstituto.com/embed/checkout/1"
    width="100%"
    height="500"
    frameborder="0"
    allowtransparency="true"
    style="border: none; border-radius: 8px;"
  ></iframe>
</div>
```

## 🔧 **Configurações Avançadas:**

### **Para diferentes projetos:**
```html
<!-- Projeto 1 -->
<iframe src="https://portal.imagineinstituto.com/embed/checkout/1"></iframe>

<!-- Projeto 2 -->
<iframe src="https://portal.imagineinstituto.com/embed/checkout/2"></iframe>

<!-- Projeto 3 -->
<iframe src="https://portal.imagineinstituto.com/embed/checkout/3"></iframe>
```

### **Com parâmetros personalizados:**
```html
<iframe 
  src="https://portal.imagineinstituto.com/embed/checkout/1?theme=dark&amount=100"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

## 🧪 **Como Testar:**

### **1. Teste direto:**
- Acesse: `https://portal.imagineinstituto.com/embed/checkout/1`
- Deve carregar sem erro de iframe

### **2. Teste no Framer:**
1. Cole o código HTML no elemento "Code" ou "Embed"
2. Publique a página
3. Teste a doação completa

### **3. Verificar funcionalidades:**
- ✅ Preenchimento de dados pessoais
- ✅ Seleção de valor
- ✅ Processamento de pagamento
- ✅ Recebimento de email
- ✅ Criação automática de usuário

## 📊 **Funcionalidades do Iframe:**

### **Passo 1 - Dados:**
- ✅ Nome completo (obrigatório)
- ✅ Email (obrigatório + validação)
- ✅ Valor da doação (R$ 25, 50, 100, 200, 500, 1000 ou personalizado)
- ✅ Doação recorrente (mensal, trimestral, anual)
- ✅ Mensagem personalizada (opcional, max 200 caracteres)
- ✅ Doação anônima (checkbox)

### **Passo 2 - Pagamento:**
- ✅ Resumo da doação
- ✅ Formulário Stripe integrado
- ✅ Botão voltar para editar
- ✅ Processamento seguro

### **Após doação:**
- ✅ Usuário criado automaticamente
- ✅ Email de boas-vindas enviado
- ✅ Credenciais de acesso fornecidas
- ✅ Links para portal e redefinição de senha

## 🎉 **Pronto para Produção!**

O iframe está 100% funcional e pronto para ser usado no Framer:

- ✅ **X-Frame-Options corrigido**
- ✅ **Deploy ativo no Vercel**
- ✅ **Sistema de pagamento funcionando**
- ✅ **Emails automáticos configurados**
- ✅ **Criação automática de usuários**
- ✅ **Design responsivo e moderno**

**Use qualquer uma das opções de código acima no Framer!** 🚀
