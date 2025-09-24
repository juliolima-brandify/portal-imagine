# 🎨 Design System - Portal Instituto Imagine

## 📋 Visão Geral

O Design System do Portal Instituto Imagine foi criado para garantir consistência visual e de experiência em todo o sistema. Ele inclui componentes, classes CSS, paleta de cores, tipografia e padrões de layout.

## 🎯 Acesso ao Design System

**URL Local**: `http://localhost:3001/design-system`

## 🎨 Paleta de Cores

### **Cores Primárias**
- **Primary Blue**: `#2563eb` - Botões principais, links ativos
- **Secondary Gray**: `#4b5563` - Botões secundários, texto
- **Background Gray**: `#f9fafb` - Fundo principal
- **Card White**: `#ffffff` - Cards, modais

### **Cores de Status**
- **Success Green**: `#16a34a` - Sucesso, confirmações
- **Warning Orange**: `#ea580c` - Avisos, alertas
- **Error Red**: `#dc2626` - Erros, exclusões
- **Info Purple**: `#9333ea` - Informações, badges

### **Cores de Texto**
- **Text Dark**: `#111827` - Títulos, texto principal
- **Text Medium**: `#4b5563` - Texto secundário
- **Text Light**: `#9ca3af` - Texto auxiliar

## 🔤 Tipografia

### **Hierarquia de Títulos**
```css
.heading-1 { @apply text-4xl font-bold text-gray-900; }
.heading-2 { @apply text-3xl font-semibold text-gray-900; }
.heading-3 { @apply text-2xl font-semibold text-gray-900; }
.heading-4 { @apply text-xl font-semibold text-gray-900; }
.heading-5 { @apply text-lg font-semibold text-gray-900; }
.heading-6 { @apply text-base font-semibold text-gray-900; }
```

### **Texto do Corpo**
```css
.text-body { @apply text-base text-gray-900; }
.text-body-sm { @apply text-sm text-gray-600; }
.text-caption { @apply text-xs text-gray-500; }
.text-muted { @apply text-sm text-gray-500; }
```

## 🔘 Botões

### **Botões Primários**
```css
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### **Botões Secundários**
```css
.btn-secondary {
  @apply bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
```

### **Botões Outline**
```css
.btn-outline {
  @apply border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### **Botões Ghost**
```css
.btn-ghost {
  @apply text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}
```

## 📋 Formulários

### **Inputs**
```css
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200;
}
```

### **Textareas**
```css
.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200 resize-vertical;
}
```

### **Selects**
```css
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200;
}
```

### **Checkboxes e Radios**
```css
.form-checkbox {
  @apply h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50;
}

.form-radio {
  @apply h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50;
}
```

## 🃏 Cards

### **Card Padrão**
```css
.card {
  @apply bg-white shadow-sm rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200;
}
```

### **Card Compacto**
```css
.card-compact {
  @apply bg-white shadow-sm rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200;
}
```

### **Card Elevado**
```css
.card-elevated {
  @apply bg-white shadow-lg rounded-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200;
}
```

## 🏷️ Badges

### **Badge Base**
```css
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}
```

### **Badges de Status**
```css
.badge-success { @apply bg-green-100 text-green-800; }
.badge-error { @apply bg-red-100 text-red-800; }
.badge-warning { @apply bg-yellow-100 text-yellow-800; }
.badge-info { @apply bg-blue-100 text-blue-800; }
.badge-gray { @apply bg-gray-100 text-gray-800; }
```

## 🚨 Alertas

### **Alert Base**
```css
.alert {
  @apply border rounded-md p-4;
}
```

### **Alertas de Status**
```css
.alert-success { @apply bg-green-50 border-green-200 text-green-800; }
.alert-error { @apply bg-red-50 border-red-200 text-red-800; }
.alert-warning { @apply bg-yellow-50 border-yellow-200 text-yellow-800; }
.alert-info { @apply bg-blue-50 border-blue-200 text-blue-800; }
```

## 📊 Barras de Progresso

### **Progress Base**
```css
.progress {
  @apply w-full bg-gray-200 rounded-full h-2;
}
```

### **Progress Bars**
```css
.progress-bar { @apply bg-blue-600 h-2 rounded-full transition-all duration-300; }
.progress-success { @apply bg-green-600 h-2 rounded-full transition-all duration-300; }
.progress-warning { @apply bg-yellow-600 h-2 rounded-full transition-all duration-300; }
.progress-error { @apply bg-red-600 h-2 rounded-full transition-all duration-300; }
```

## 🧭 Navegação

### **Tabs**
```css
.tabs { @apply border-b border-gray-200; }
.tab { @apply py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200; }
.tab-active { @apply border-blue-500 text-blue-600; }
.tab-inactive { @apply border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300; }
```

### **Sidebar**
```css
.sidebar { @apply bg-gray-900 text-white w-64 min-h-screen; }
.sidebar-item { @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200; }
.sidebar-item-active { @apply bg-blue-600 text-white; }
.sidebar-item-inactive { @apply text-gray-300 hover:bg-gray-800 hover:text-white; }
```

## 📐 Layout

### **Containers**
```css
.container { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; }
.container-sm { @apply max-w-4xl mx-auto px-4 sm:px-6 lg:px-8; }
.container-xs { @apply max-w-2xl mx-auto px-4 sm:px-6 lg:px-8; }
```

### **Grid System**
```css
.grid-auto { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6; }
.grid-auto-sm { @apply grid grid-cols-1 md:grid-cols-2 gap-4; }
.grid-auto-lg { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6; }
```

### **Spacing**
```css
.space-section { @apply space-y-8; }
.space-content { @apply space-y-6; }
.space-items { @apply space-y-4; }
.space-compact { @apply space-y-2; }
```

## 🎭 Animações

### **Transições**
```css
.transition-smooth { @apply transition-all duration-200; }
.transition-medium { @apply transition-all duration-300; }
.transition-slow { @apply transition-all duration-500; }
```

### **Hover Effects**
```css
.hover-lift { @apply hover:shadow-lg hover:-translate-y-1 transition-all duration-200; }
.hover-scale { @apply hover:scale-105 transition-transform duration-200; }
.hover-glow { @apply hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-200; }
```

### **Loading States**
```css
.loading { @apply opacity-50 pointer-events-none; }
.spinner { @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600; }
```

## 🎯 Estados de Foco

```css
.focus-ring { @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2; }
.focus-ring-inset { @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset; }
```

## 📱 Responsividade

### **Breakpoints**
- **Mobile**: `sm:` (640px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Large Desktop**: `xl:` (1280px+)

### **Utility Classes**
```css
.mobile-only { @apply block sm:hidden; }
.tablet-up { @apply hidden sm:block; }
.desktop-up { @apply hidden lg:block; }
```

## 🎨 Gradientes

### **Gradientes Disponíveis**
```css
.gradient-blue-purple { @apply bg-gradient-to-r from-blue-500 to-purple-600; }
.gradient-green-blue { @apply bg-gradient-to-r from-green-500 to-blue-600; }
.gradient-orange-red { @apply bg-gradient-to-r from-orange-500 to-red-600; }
```

## 🔧 Como Usar

### **1. Importar o CSS**
```css
@import './design-system/styles.css';
```

### **2. Usar as Classes**
```html
<button class="btn-primary">Botão Primário</button>
<div class="card">Conteúdo do Card</div>
<input class="form-input" placeholder="Digite aqui..." />
```

### **3. Combinar Classes**
```html
<div class="card hover-lift transition-smooth">
  <h3 class="heading-4">Título</h3>
  <p class="text-body">Conteúdo</p>
  <button class="btn-primary">Ação</button>
</div>
```

## 📚 Exemplos Práticos

### **Card de Projeto**
```html
<div class="card hover-lift">
  <div class="flex items-center mb-4">
    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <svg class="w-6 h-6 text-blue-600">...</svg>
    </div>
    <div class="ml-3">
      <h3 class="heading-5">Nome do Projeto</h3>
      <p class="text-body-sm">Descrição breve</p>
    </div>
  </div>
  <div class="flex space-x-2">
    <button class="btn-primary">Doar</button>
    <button class="btn-secondary">Ver Detalhes</button>
  </div>
</div>
```

### **Formulário de Doação**
```html
<form class="space-y-6">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Valor da Doação
    </label>
    <input type="number" class="form-input" placeholder="R$ 0,00" />
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Nome Completo
    </label>
    <input type="text" class="form-input" placeholder="Seu nome" />
  </div>
  <div class="flex items-center">
    <input type="checkbox" class="form-checkbox" />
    <label class="ml-2 text-sm text-gray-700">Doação anônima</label>
  </div>
  <button type="submit" class="btn-primary w-full">
    Finalizar Doação
  </button>
</form>
```

## 🎯 Princípios do Design System

### **1. Consistência**
- Todas as interfaces seguem os mesmos padrões visuais
- Componentes reutilizáveis em todo o sistema
- Hierarquia visual clara e consistente

### **2. Acessibilidade**
- Contraste adequado em todos os elementos
- Estados de foco visíveis
- Suporte a leitores de tela

### **3. Responsividade**
- Design mobile-first
- Breakpoints bem definidos
- Componentes adaptáveis

### **4. Performance**
- CSS otimizado com Tailwind
- Transições suaves
- Carregamento rápido

## 🚀 Status

**✅ DESIGN SYSTEM COMPLETO E FUNCIONAL**

- ✅ Paleta de cores definida
- ✅ Tipografia hierárquica
- ✅ Componentes reutilizáveis
- ✅ Classes CSS organizadas
- ✅ Documentação completa
- ✅ Exemplos práticos
- ✅ Página de demonstração

**🎨 SISTEMA PRONTO PARA PRODUÇÃO!**


