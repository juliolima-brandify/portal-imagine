# 📁 Checkouts Desativados

Esta pasta contém os modelos de checkout que foram desativados em favor do **One Page Checkout** como modelo principal.

## 🚫 Checkouts Desativados:

### 1. **Checkout Tradicional** (`doar/`)
- **Arquivo**: `doar/[id]/page.tsx`
- **Motivo**: Substituído pelo One Page Checkout
- **Características**: Com sidebar, experiência completa

### 2. **Embed Checkout** (`embed/`)
- **Arquivo**: `embed/checkout/[id]/page.tsx`
- **Motivo**: Substituído pelo One Page Checkout
- **Características**: Versão embeddable, minimalista

### 3. **Prototype Embed** (`prototype-embed/`)
- **Arquivo**: `prototype-embed/[id]/page.tsx`
- **Motivo**: Substituído pelo One Page Checkout
- **Características**: Versão embed do prototype

### 4. **Demo Checkout** (`prototype-demo/`)
- **Arquivo**: `prototype-demo/page.tsx`
- **Motivo**: Substituído pelo One Page Checkout
- **Características**: Página de demonstração

## 🚀 **Modelo Ativo:**

**One Page Checkout** (`src/app/prototype/checkout/[id]/page.tsx`)
- ✅ **MODELO PRINCIPAL**
- ✅ Sem sidebar, layout limpo
- ✅ Campos completos: Nome, Email, CPF, Celular (WhatsApp)
- ✅ Máscaras automáticas
- ✅ Otimizado para conversão

## 📍 **URL Ativa:**
- **Local**: `http://localhost:3000/prototype/checkout/1`
- **Dev**: `https://portal-imagine-of.vercel.app/prototype/checkout/1`
- **Prod**: `https://portal.imagineinstituto.com/prototype/checkout/1`

## 🔄 **Como Reativar (se necessário):**

Para reativar qualquer checkout desativado:
1. Mova o arquivo de volta para `src/app/`
2. Atualize as rotas no sistema
3. Teste a funcionalidade

**Data de Desativação**: 02/10/2025
**Motivo**: Centralização no One Page Checkout como modelo principal
