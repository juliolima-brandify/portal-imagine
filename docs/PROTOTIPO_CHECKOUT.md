# 🚀 Protótipo de Checkout Melhorado - Portal Instituto Imagine

## 📋 **Visão Geral**

Este protótipo contém as melhorias propostas para o sistema de checkout de doações:

### ✨ **Melhorias Implementadas**

1. **Checkout One-Page**: Todos os dados (resumo, pessoais, pagamento) em uma única tela
2. **Layout Otimizado**: Valores de doação no lado esquerdo, formulário no lado direito
3. **Embed Simplificado**: Apenas botão "Doar Agora" que abre o checkout completo
4. **Design Consistente**: Fonte Instrument Sans e botões verdes arredondados
5. **UX Melhorada**: Menos cliques, mais intuitivo

---

## 🎯 **Como Usar o Protótipo**

### **URLs de Teste**

- **Checkout One-Page**: `/prototype/checkout/[id]`
- **Embed Simplificado**: `/prototype/embed/[id]`
- **Página de Demonstração**: `/prototype/demo`

### **Exemplos de URLs**

```
# Checkout one-page para projeto ID 1
http://localhost:3000/prototype/checkout/1

# Embed simplificado para projeto ID 1
http://localhost:3000/prototype/embed/1

# Página de demonstração
http://localhost:3000/prototype/demo
```

---

## 🔧 **Estrutura do Protótipo**

```
src/app/prototype/
├── demo/
│   └── page.tsx              # Página de demonstração
├── checkout/
│   └── [id]/
│       └── page.tsx          # Checkout one-page melhorado
└── embed/
    └── [id]/
        └── page.tsx          # Embed simplificado
```

---

## 🎨 **Design System**

### **Cores**
- **Verde Principal**: `#22C55E`
- **Verde Hover**: `#16A34A`
- **Verde Claro**: `#DCFCE7`
- **Cinza**: `#6B7280`

### **Tipografia**
- **Fonte**: Instrument Sans (Google Fonts)
- **Tamanhos**: 14px, 16px, 18px, 24px, 32px

### **Componentes**
- **Botões**: `rounded-full`, `font-semibold`, `hover:shadow-lg`
- **Inputs**: `rounded-full`, `focus:ring-green-500`
- **Cards**: `rounded-xl`, `shadow-lg`, `border border-gray-200`

---

## 🧪 **Testes Recomendados**

### **1. Teste do Checkout One-Page**
- [ ] Acessar `/prototype/checkout/1`
- [ ] Verificar layout de duas colunas
- [ ] Testar seleção de valores (lado esquerdo)
- [ ] Preencher dados pessoais (lado direito)
- [ ] Testar formulário de pagamento
- [ ] Verificar responsividade mobile

### **2. Teste do Embed Simplificado**
- [ ] Acessar `/prototype/embed/1`
- [ ] Verificar apenas botão "Doar Agora"
- [ ] Testar redirecionamento para checkout
- [ ] Verificar comunicação com iframe

### **3. Teste de Integração**
- [ ] Embed → Checkout (fluxo completo)
- [ ] Validação de dados
- [ ] Processamento de pagamento
- [ ] Página de sucesso

---

## 📱 **Responsividade**

### **Desktop (1024px+)**
- Layout de duas colunas
- Valores à esquerda, formulário à direita
- Cards com sombras e bordas arredondadas

### **Tablet (768px - 1023px)**
- Layout adaptado
- Valores em grid 2x3
- Formulário abaixo

### **Mobile (< 768px)**
- Layout de coluna única
- Valores em grid 2x3
- Formulário em tela cheia
- Botões touch-friendly

---

## 🔄 **Fluxo de Doação**

### **Fluxo Atual (3 etapas)**
1. Selecionar valor
2. Preencher dados pessoais
3. Processar pagamento

### **Fluxo Melhorado (1 etapa)**
1. **Tudo em uma tela**: Valor + Dados + Pagamento

### **Vantagens**
- ✅ Menos cliques
- ✅ Melhor conversão
- ✅ UX mais intuitiva
- ✅ Menos abandono

---

## 🚀 **Próximos Passos**

1. **Testar protótipo** com usuários reais
2. **Coletar feedback** sobre UX
3. **Ajustar design** baseado nos testes
4. **Implementar** na versão de produção
5. **Monitorar** métricas de conversão

---

## 📊 **Métricas para Acompanhar**

- **Taxa de Conversão**: % de visitantes que completam a doação
- **Taxa de Abandono**: % que saem durante o processo
- **Tempo de Conclusão**: Tempo médio para completar doação
- **Erros de Validação**: Campos com mais problemas
- **Dispositivos**: Desktop vs Mobile vs Tablet

---

## 🛠️ **Tecnologias**

- **Next.js 14** com App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilização
- **Stripe** para pagamentos
- **Supabase** para dados
- **Instrument Sans** para tipografia

---

## 📞 **Suporte**

Para dúvidas sobre o protótipo:
- Verificar logs do console
- Testar em diferentes navegadores
- Validar responsividade
- Conferir integração com Stripe/Supabase

