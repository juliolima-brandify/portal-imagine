# 🎯 **Script Framer - Nova Estratégia (Embed Simplificado)**

## 📋 **Nova Estratégia Implementada:**

### **1. Embed (Framer) - Apenas Valor:**
- ✅ Seleção de valor (botões + campo personalizado)
- ✅ Botão "Continuar Doação"

### **2. Checkout (Portal) - Dados + Pagamento:**
- ✅ **Doação recorrente** (checkbox + frequência)
- ✅ **Mensagem personalizada** (campo de texto)
- ✅ **Doação anônima** (checkbox)
- ✅ **Resumo da doação** (projeto + valor + opções)
- ✅ **Dados pessoais** (nome, email, CPF, telefone)
- ✅ **Formulário de pagamento** Stripe
- ✅ Processamento completo

---

## 🖼️ **Código para Framer:**

### **HTML Container:**
```html
<div id="donation-embed-container" style="width: 100%; max-width: 400px; margin: 0 auto;">
  <!-- O iframe será inserido aqui -->
</div>
```

### **JavaScript Completo:**
```html
<script>
(function() {
  // Configurações
  const EMBED_URL = 'https://portal.imagineinstituto.com/embed/checkout/1';
  const CHECKOUT_URL = 'https://portal.imagineinstituto.com/doar/1';
  
  // Container do embed
  const container = document.getElementById('donation-embed-container');
  
  if (!container) {
    console.error('Container #donation-embed-container não encontrado');
    return;
  }

  // Criar iframe
  const iframe = document.createElement('iframe');
  iframe.src = EMBED_URL;
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  iframe.allow = 'payment';
  
  // Adicionar iframe ao container
  container.appendChild(iframe);

  // Escutar mensagens do iframe
  window.addEventListener('message', function(event) {
    // Verificar origem
    if (event.origin !== 'https://portal.imagineinstituto.com') {
      return;
    }

    const { type, data, source } = event.data;
    
    if (source !== 'portal-embed') {
      return;
    }

    switch (type) {
      case 'REDIRECT_TO_CHECKOUT':
        handleRedirectToCheckout(data);
        break;
      case 'PAYMENT_SUCCESS':
        handlePaymentSuccess(data);
        break;
      case 'PAYMENT_ERROR':
        handlePaymentError(data);
        break;
    }
  });

  function handleRedirectToCheckout(data) {
    console.log('Redirecionando para checkout:', data);
    
    // Criar URL com parâmetros (apenas valor)
    const urlParams = new URLSearchParams({
      amount: data.amount
    });
    
    const checkoutUrl = `${CHECKOUT_URL}?${urlParams.toString()}`;
    
    // Mostrar loading
    showLoading('Redirecionando para finalizar doação...');
    
    // Redirecionar após um pequeno delay
    setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 1000);
  }

  function handlePaymentSuccess(data) {
    console.log('Pagamento realizado com sucesso:', data);
    showSuccess('Doação realizada com sucesso! Obrigado pelo seu apoio!');
  }

  function handlePaymentError(data) {
    console.error('Erro no pagamento:', data);
    showError('Erro no pagamento. Tente novamente.');
  }

  function showLoading(message) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        background: #f8fafc;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <p style="
          color: #64748b;
          font-size: 16px;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">${message}</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  function showSuccess(message) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        background: #f0fdf4;
        border-radius: 12px;
        border: 2px solid #bbf7d0;
      ">
        <div style="
          width: 60px;
          height: 60px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: white;
        ">✓</div>
        <h3 style="
          color: #166534;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 10px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">Sucesso!</h3>
        <p style="
          color: #166534;
          font-size: 14px;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">${message}</p>
      </div>
    `;
  }

  function showError(message) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
        background: #fef2f2;
        border-radius: 12px;
        border: 2px solid #fecaca;
      ">
        <div style="
          width: 60px;
          height: 60px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: white;
        ">✕</div>
        <h3 style="
          color: #dc2626;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 10px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">Erro</h3>
        <p style="
          color: #dc2626;
          font-size: 14px;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">${message}</p>
      </div>
    `;
  }

  // Log de inicialização
  console.log('🎯 Embed de doação carregado com sucesso!');
  console.log('📋 Nova estratégia: Embed simplificado → Checkout completo');
  
})();
</script>
```

---

## 🎯 **Como Usar no Framer:**

### **1. Adicionar HTML Container:**
- Vá em **"Code"** ou **"Embed"**
- Adicione o HTML container

### **2. Adicionar JavaScript:**
- Adicione o script completo
- O iframe será criado automaticamente

### **3. Personalizar (Opcional):**
- Altere `EMBED_URL` para outro projeto
- Altere `CHECKOUT_URL` para outro projeto
- Modifique estilos conforme necessário

---

## ✨ **Vantagens da Nova Estratégia:**

### **🎯 Para o Usuário:**
- ✅ **Processo mais claro** - Escolhe valor no embed, completa dados no checkout
- ✅ **Menos fricção** - Embed simples e direto
- ✅ **Mais confiança** - Checkout completo com resumo detalhado
- ✅ **Melhor UX** - Fluxo otimizado para conversão

### **🔧 Para o Desenvolvimento:**
- ✅ **Embed mais leve** - Apenas seleção de valor
- ✅ **Checkout completo** - Todos os dados e pagamento
- ✅ **Fácil manutenção** - Separação clara de responsabilidades
- ✅ **Melhor performance** - Carregamento otimizado

### **📊 Para Conversão:**
- ✅ **Menos abandono** - Processo em etapas
- ✅ **Mais transparência** - Resumo claro antes do pagamento
- ✅ **Melhor confiança** - Checkout profissional
- ✅ **Maior conversão** - UX otimizada

---

## 🧪 **Testando:**

### **1. Teste Local:**
```bash
# Acesse o embed
https://portal.imagineinstituto.com/embed/checkout/1

# Teste o fluxo completo
# 1. Escolha valor no embed
# 2. Clique "Continuar Doação"
# 3. Complete dados no checkout
# 4. Finalize pagamento
```

### **2. Teste no Framer:**
- Adicione o código no Framer
- Teste o fluxo completo
- Verifique redirecionamentos
- Confirme mensagens de feedback

---

## 🎉 **Status:**
- ✅ **Embed simplificado** - Implementado
- ✅ **Checkout com resumo** - Implementado  
- ✅ **Script Framer** - Atualizado
- ✅ **Fluxo completo** - Funcionando

**🚀 Nova estratégia 100% implementada e pronta para uso!**
