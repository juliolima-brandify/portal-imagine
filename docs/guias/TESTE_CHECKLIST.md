# 🧪 Checklist de Testes - Portal Instituto Imagine

## 📋 **Visão Geral**

Este documento contém um checklist completo de testes para garantir que todas as funcionalidades do Portal Instituto Imagine estejam funcionando corretamente.

**URL de Produção:** `https://portal.imagineinstituto.com`  
**URL de Teste:** `https://portal.imagineinstituto.com?demo_email=demo@doador.com`

---

## 🎯 **1. Testes de Autenticação**

### ✅ **Login Demo**
- [ ] **Login Doador Demo**
  - [ ] Acessar `/auth`
  - [ ] Clicar em "Demo Doador"
  - [ ] Verificar redirecionamento para `/dashboard?demo_email=demo@doador.com`
  - [ ] Confirmar que aparece "Olá, Doador Demo" no header

- [ ] **Login Admin Demo**
  - [ ] Acessar `/auth`
  - [ ] Clicar em "Demo Admin"
  - [ ] Verificar redirecionamento para `/dashboard?demo_email=admin@institutoimagine.org`
  - [ ] Confirmar que aparece "Administrador" no header

### ✅ **Criação de Conta (se Supabase configurado)**
- [ ] **Registro de Novo Usuário**
  - [ ] Acessar `/auth`
  - [ ] Clicar em "Não tem conta? Criar uma"
  - [ ] Preencher: Nome, Email, Senha
  - [ ] Verificar mensagem de sucesso
  - [ ] Confirmar email de verificação

---

## 🏠 **2. Testes da Página Principal**

### ✅ **Navegação e Layout**
- [ ] **Header**
  - [ ] Logo aparece corretamente
  - [ ] Não há título "Instituto Imagine" (apenas logo)
  - [ ] Link "Voltar ao site principal" funciona
  - [ ] Botão "Entrar" redireciona para `/auth`

- [ ] **Design e Fonte**
  - [ ] Fonte Instrument Sans aplicada em todos os elementos
  - [ ] Botões com bordas arredondadas (`rounded-full`)
  - [ ] Cores verdes nos botões principais (#22C55E)
  - [ ] Efeitos hover funcionando

---

## 📊 **3. Testes do Dashboard**

### ✅ **Dashboard Doador** (`/dashboard?demo_email=demo@doador.com`)
- [ ] **Informações do Usuário**
  - [ ] Nome "Doador Demo" aparece no header
  - [ ] Badge "Doador" visível
  - [ ] Badge "Demo" amarelo visível

- [ ] **Estatísticas**
  - [ ] Total de doações exibido
  - [ ] Valor total doado exibido
  - [ ] Projetos favoritos contados
  - [ ] Gráficos renderizando corretamente

- [ ] **Navegação**
  - [ ] Link "Meu Perfil" funciona
  - [ ] Link "Histórico" funciona
  - [ ] Link "Favoritos" funciona
  - [ ] Botão "Sair" funciona

### ✅ **Dashboard Admin** (`/dashboard?demo_email=admin@institutoimagine.org`)
- [ ] **Informações do Usuário**
  - [ ] Nome "Admin Demo" aparece no header
  - [ ] Badge "Administrador" cinza visível
  - [ ] Badge "Demo" amarelo visível

- [ ] **Estatísticas Administrativas**
  - [ ] Total de doações recebidas
  - [ ] Valor total arrecadado
  - [ ] Número de doadores únicos
  - [ ] Gráficos de receita funcionando

- [ ] **Links Administrativos**
  - [ ] "Gestão de Projetos" funciona
  - [ ] "Relatórios" funciona
  - [ ] "Usuários" funciona
  - [ ] "Doações" funciona

---

## 🎯 **4. Testes de Projetos**

### ✅ **Listagem de Projetos** (`/projetos`)
- [ ] **Layout e Design**
  - [ ] Cards de projetos exibidos corretamente
  - [ ] Imagens carregando
  - [ ] Progresso visual das barras
  - [ ] Botões "Ver Detalhes" funcionando

- [ ] **Funcionalidades**
  - [ ] Filtros por categoria funcionando
  - [ ] Busca por texto funcionando
  - [ ] Ordenação funcionando
  - [ ] Paginação funcionando (se aplicável)

### ✅ **Detalhes do Projeto** (`/projetos/[id]`)
- [ ] **Informações do Projeto**
  - [ ] Título, descrição e imagem exibidos
  - [ ] Meta e valor arrecadado corretos
  - [ ] Barra de progresso funcionando
  - [ ] Impacto (estudantes, escolas, etc.) exibido

- [ ] **Botão de Doação**
  - [ ] Botão "Fazer Doação" verde e arredondado
  - [ ] Redirecionamento para `/doar/[id]` funcionando
  - [ ] Efeito hover funcionando

---

## 💰 **5. Testes de Doação**

### ✅ **Página de Doação** (`/doar/[id]`)
- [ ] **Step 1 - Escolha do Valor**
  - [ ] Botões de valor verde e arredondados
  - [ ] Seleção de valores funcionando
  - [ ] Input personalizado com bordas arredondadas
  - [ ] Checkbox "Doação recorrente" funcionando
  - [ ] Select de frequência (se recorrente) funcionando
  - [ ] Botão "Continuar" verde funcionando

- [ ] **Step 2 - Detalhes**
  - [ ] Inputs com bordas arredondadas e foco verde
  - [ ] Campos obrigatórios validando
  - [ ] Checkbox "Doação anônima" funcionando
  - [ ] Textarea de mensagem funcionando
  - [ ] Botões "Voltar" e "Continuar" funcionando

- [ ] **Step 3 - Pagamento**
  - [ ] Resumo da doação exibido corretamente
  - [ ] Formulário Stripe carregando
  - [ ] Campos de pagamento funcionando
  - [ ] Botão "Voltar" funcionando

### ✅ **Embed de Doação** (`/embed/checkout/[id]`)
- [ ] **Design Consistente**
  - [ ] Fonte Instrument Sans aplicada
  - [ ] Botões verdes e arredondados
  - [ ] Input com bordas arredondadas
  - [ ] Efeitos hover funcionando

- [ ] **Funcionalidade**
  - [ ] Seleção de valores funcionando
  - [ ] Input personalizado funcionando
  - [ ] Botão "Continuar Doação" funcionando
  - [ ] Redirecionamento para checkout funcionando

---

## 📧 **6. Testes de Pagamento (Stripe)**

### ✅ **Processamento de Pagamento**
- [ ] **Cartão de Crédito**
  - [ ] Campos Stripe carregando
  - [ ] Validação de cartão funcionando
  - [ ] Processamento de pagamento funcionando
  - [ ] Redirecionamento para sucesso funcionando

- [ ] **PIX**
  - [ ] Opção PIX disponível
  - [ ] QR Code gerando
  - [ ] Processamento funcionando

- [ ] **Boleto**
  - [ ] Opção boleto disponível
  - [ ] Geração de boleto funcionando
  - [ ] Processamento funcionando

### ✅ **Página de Sucesso** (`/doacao-sucesso`)
- [ ] **Confirmação**
  - [ ] Mensagem de sucesso exibida
  - [ ] Detalhes da doação exibidos
  - [ ] Botões de navegação funcionando

---

## 👤 **7. Testes de Perfil**

### ✅ **Página de Perfil** (`/perfil`)
- [ ] **Informações do Usuário**
  - [ ] Dados pessoais exibidos
  - [ ] Histórico de doações listado
  - [ ] Projetos favoritos exibidos

- [ ] **Funcionalidades**
  - [ ] Edição de perfil funcionando
  - [ ] Upload de foto funcionando
  - [ ] Alteração de senha funcionando

---

## 🔔 **8. Testes de Notificações**

### ✅ **Sistema de Notificações**
- [ ] **Bell de Notificações**
  - [ ] Ícone de sino visível no header
  - [ ] Contador de notificações funcionando
  - [ ] Dropdown de notificações abrindo

- [ ] **Centro de Notificações**
  - [ ] Lista de notificações exibida
  - [ ] Marcar como lida funcionando
  - [ ] Links de notificações funcionando

---

## 📱 **9. Testes de Responsividade**

### ✅ **Mobile (320px - 768px)**
- [ ] **Layout Mobile**
  - [ ] Header responsivo
  - [ ] Cards de projetos empilhados
  - [ ] Botões com tamanho adequado
  - [ ] Formulários adaptados

- [ ] **Navegação Mobile**
  - [ ] Menu hambúrguer funcionando (se aplicável)
  - [ ] Links de navegação funcionando
  - [ ] Botões de ação acessíveis

### ✅ **Tablet (768px - 1024px)**
- [ ] **Layout Tablet**
  - [ ] Grid de projetos adaptado
  - [ ] Formulários com layout adequado
  - [ ] Dashboard com colunas responsivas

### ✅ **Desktop (1024px+)**
- [ ] **Layout Desktop**
  - [ ] Grid completo funcionando
  - [ ] Sidebar visível (se aplicável)
  - [ ] Hover effects funcionando

---

## ♿ **10. Testes de Acessibilidade**

### ✅ **Navegação por Teclado**
- [ ] **Tab Navigation**
  - [ ] Todos os elementos focáveis
  - [ ] Ordem lógica de tabulação
  - [ ] Indicadores de foco visíveis

- [ ] **Atalhos de Teclado**
  - [ ] Enter ativando botões
  - [ ] Escape fechando modais
  - [ ] Setas navegando em listas

### ✅ **Screen Reader**
- [ ] **Labels e ARIA**
  - [ ] Labels associados aos inputs
  - [ ] ARIA labels em botões
  - [ ] Textos alternativos em imagens

### ✅ **Contraste e Visibilidade**
- [ ] **Contraste de Cores**
  - [ ] Texto legível em fundos
  - [ ] Botões com contraste adequado
  - [ ] Links visíveis e diferenciados

---

## 🚀 **11. Testes de Performance**

### ✅ **Carregamento**
- [ ] **Tempo de Carregamento**
  - [ ] Página inicial carrega em < 3s
  - [ ] Imagens otimizadas
  - [ ] CSS e JS minificados

- [ ] **Lazy Loading**
  - [ ] Imagens carregando sob demanda
  - [ ] Componentes carregando quando necessário

### ✅ **Funcionalidade**
- [ ] **Interações**
  - [ ] Cliques respondem rapidamente
  - [ ] Formulários submetem sem delay
  - [ ] Navegação fluida

---

## 🔧 **12. Testes de Integração**

### ✅ **Stripe Integration**
- [ ] **Webhooks**
  - [ ] Webhook de pagamento funcionando
  - [ ] Atualização de status funcionando
  - [ ] Emails de confirmação enviando

### ✅ **Supabase Integration**
- [ ] **Database**
  - [ ] Dados salvando corretamente
  - [ ] Queries funcionando
  - [ ] Real-time updates funcionando

### ✅ **Resend Integration**
- [ ] **Emails**
  - [ ] Emails de confirmação enviando
  - [ ] Templates renderizando corretamente
  - [ ] Links nos emails funcionando

---

## 🌐 **13. Testes de Deploy**

### ✅ **Produção**
- [ ] **URL Principal**
  - [ ] `https://portal.imagineinstituto.com` acessível
  - [ ] HTTPS funcionando
  - [ ] Certificado SSL válido

- [ ] **Funcionalidades em Produção**
  - [ ] Login demo funcionando
  - [ ] Doações processando
  - [ ] Emails enviando
  - [ ] Database conectado

### ✅ **Domínio e DNS**
- [ ] **Configuração**
  - [ ] Domínio apontando corretamente
  - [ ] Subdomínios funcionando
  - [ ] Redirecionamentos funcionando

---

## 📝 **14. Testes de Dados**

### ✅ **Dados Demo**
- [ ] **Projetos Mock**
  - [ ] 3 projetos exibidos
  - [ ] Dados consistentes
  - [ ] Imagens carregando

- [ ] **Usuários Demo**
  - [ ] Doador demo funcionando
  - [ ] Admin demo funcionando
  - [ ] Dados de perfil corretos

---

## 🐛 **15. Testes de Erro**

### ✅ **Tratamento de Erros**
- [ ] **Erros de Rede**
  - [ ] Mensagens de erro amigáveis
  - [ ] Fallbacks funcionando
  - [ ] Retry automático (se aplicável)

- [ ] **Erros de Validação**
  - [ ] Mensagens de validação claras
  - [ ] Campos obrigatórios marcados
  - [ ] Formatação de dados validada

---

## 📊 **16. Relatório de Testes**

### ✅ **Checklist de Conclusão**
- [ ] **Todos os testes executados**
- [ ] **Bugs encontrados documentados**
- [ ] **Issues críticas resolvidas**
- [ ] **Performance validada**
- [ ] **Acessibilidade verificada**

---

## 🎯 **Como Usar Este Checklist**

1. **Antes de cada deploy:** Execute todos os testes críticos
2. **Após mudanças:** Teste as funcionalidades afetadas
3. **Testes regulares:** Execute testes completos semanalmente
4. **Documente bugs:** Use este checklist para reportar problemas

---

## 📞 **Contatos para Suporte**

- **Desenvolvimento:** [Seu contato]
- **Infraestrutura:** [Contato infra]
- **Design:** [Contato design]

---

**Última atualização:** $(date)  
**Versão:** 1.0  
**Status:** ✅ Ativo
