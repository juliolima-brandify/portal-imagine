# 🚀 Scripts de Automação para Checkout

Este diretório contém scripts para automatizar o preenchimento do checkout durante os testes.

## 📁 Arquivos Disponíveis

### 1. `auto-fill-checkout.js` - Script Completo
Script avançado com múltiplas funções e opções de teste.

### 2. `console-script.js` - Script Simples
Script básico para copiar e colar diretamente no console.

## 🎯 Como Usar

### Método 1: Script Completo

1. **Abra o console do navegador** (F12)
2. **Copie o conteúdo** de `auto-fill-checkout.js`
3. **Cole no console** e pressione Enter
4. **Execute**: `autoFillCheckout()`

### Método 2: Script Simples

1. **Abra o console do navegador** (F12)
2. **Copie o conteúdo** de `console-script.js`
3. **Cole no console** e pressione Enter
4. **Aguarde** o preenchimento automático

## 🛠️ Comandos Disponíveis (Script Completo)

```javascript
// Preencher com dados padrão
autoFillCheckout()

// Preencher com projeto e valor específicos
autoFillCheckout('550e8400-e29b-41d4-a716-446655440002', 100)

// Limpar todos os campos
clearCheckout()

// Testar diferentes cartões
testCard('visa')        // Visa
testCard('mastercard')  // MasterCard
testCard('amex')        // American Express
testCard('declined')    // Cartão recusado
testCard('insufficient') // Fundos insuficientes

// Preencher com dados customizados
fillWithData({
  name: 'Maria Santos',
  email: 'maria@email.com',
  amount: 250
})
```

## 🧪 Dados de Teste

### Cartões de Teste (Stripe)

| Tipo | Número | Resultado |
|------|--------|-----------|
| **Visa** | `4242 4242 4242 4242` | ✅ Aprovado |
| **MasterCard** | `5555 5555 5555 4444` | ✅ Aprovado |
| **American Express** | `3782 822463 10005` | ✅ Aprovado |
| **Recusado** | `4000 0000 0000 0002` | ❌ Recusado |
| **Fundos Insuficientes** | `4000 0000 0000 9995` | ❌ Insuficiente |

### Dados Padrão

- **Nome**: João Silva
- **Email**: joao.silva@email.com
- **Validade**: 12 / 25
- **CVC**: 123
- **Valor**: R$ 50

## 🔧 URLs de Teste

- **Educação Digital**: `/prototype/checkout/550e8400-e29b-41d4-a716-446655440001`
- **Saúde Comunitária**: `/prototype/checkout/550e8400-e29b-41d4-a716-446655440002`
- **Meio Ambiente**: `/prototype/checkout/550e8400-e29b-41d4-a716-446655440003`

## 🎯 Fluxo de Teste Completo

1. **Acesse** uma das URLs de teste
2. **Abra o console** (F12)
3. **Execute** o script de preenchimento
4. **Clique** em "Finalizar doação"
5. **Verifique** o resultado

## 🐛 Troubleshooting

### Script não funciona
- Verifique se está na página correta do checkout
- Confirme se o console está aberto
- Recarregue a página e tente novamente

### Campos não preenchidos
- Verifique se os seletores CSS estão corretos
- Use `clearCheckout()` para limpar e tentar novamente
- Verifique se há erros no console

### Erro de UUID
- Use as URLs com UUIDs válidos
- Verifique se o projeto existe no banco

## 📝 Personalização

Para personalizar os dados, edite as variáveis no início dos scripts:

```javascript
// Dados padrão
const defaultData = {
  name: 'Seu Nome',
  email: 'seu@email.com',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12 / 25',
  cvc: '123'
}
```

## 🎉 Benefícios

- ✅ **Testes rápidos**: Preenchimento em segundos
- ✅ **Dados consistentes**: Sempre os mesmos dados de teste
- ✅ **Múltiplos cenários**: Diferentes cartões e valores
- ✅ **Fácil uso**: Copiar, colar, executar
- ✅ **Debugging**: Logs detalhados no console

---

**💡 Dica**: Use estes scripts para acelerar seus testes de desenvolvimento e garantir que o checkout funcione corretamente em diferentes cenários!

