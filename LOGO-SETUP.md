# 🎨 Configuração do Logo - Instituto Imagine

## 📁 **Como adicionar o logo:**

### **1. Salve o logo na pasta correta:**
- **Localização:** `public/images/logo.png`
- **Formato:** PNG (recomendado) ou JPG
- **Tamanho:** Idealmente 200x200px ou maior (será redimensionado automaticamente)

### **2. O logo já está integrado em todas as páginas:**
- ✅ **Página de Login** (`/`)
- ✅ **Página de Auth** (`/auth`)
- ✅ **Dashboard** (`/dashboard`)
- ✅ **Minhas Doações** (`/doacoes`)
- ✅ **Detalhes de Doação** (`/doacoes/[id]`)
- ✅ **Admin - Projetos** (`/admin/projetos`)
- ✅ **Admin - Usuários** (`/admin/usuarios`)
- ✅ **Admin - Relatórios** (`/admin/relatorios`)
- ✅ **Admin - Doações** (`/admin/doacoes`)

### **3. Fallback automático:**
- Se o logo não estiver disponível, o sistema mostra o texto "Instituto Imagine"
- Não há erro visual se o arquivo não existir

### **4. Padrão Padronizado:**
- **Altura do header:** `py-4` (16px padding vertical)
- **Tamanho do logo:** `h-10` (40px) - **PADRONIZADO EM TODO SISTEMA**
- **Responsivo:** Se adapta automaticamente

### **5. Componente reutilizável:**
- Criado `src/components/Logo.tsx` para facilitar manutenção
- Pode ser usado em novas páginas facilmente

## 🚀 **Para testar:**

1. **Adicione o logo** em `public/images/logo.png`
2. **Acesse qualquer página** do portal
3. **Verifique** se o logo aparece no header
4. **Teste o fallback** removendo temporariamente o arquivo

## 📝 **Exemplo de uso do componente:**

```tsx
import Logo from '@/components/Logo'

// Logo simples
<Logo />

// Logo com link
<Logo href="/dashboard" />

// Logo grande com texto
<Logo size="lg" showText={true} />

// Logo pequeno
<Logo size="sm" />
```

## 📏 **Tamanhos Atualizados:**

### **Classes Tailwind CSS:**
```css
/* PADRÃO PADRONIZADO EM TODO SISTEMA */
py-4 = 16px padding vertical (altura do header)
h-10 = 40px de altura (tamanho do logo)
w-auto = Largura proporcional à altura

/* Componente Logo (tamanhos disponíveis) */
h-8  = 32px (pequeno)
h-10 = 40px (médio - PADRÃO)
h-12 = 48px (grande)
```

### **Onde são usados:**
- **TODAS as páginas:** `py-4` (altura do header) + `h-10` (logo)
- **Login/Auth:** Padrão padronizado
- **Dashboard/Admin:** Padrão padronizado
- **Doações:** Padrão padronizado

## ✨ **Benefícios:**

- **Identidade visual** consistente em todo o portal
- **Fallback automático** se o logo não estiver disponível
- **Componente reutilizável** para fácil manutenção
- **Responsivo** e otimizado para diferentes tamanhos
- **Acessibilidade** com alt text apropriado
- **Padrão padronizado** em todo o sistema
- **Consistência visual** garantida

---

**O logo está pronto para ser usado! Basta adicionar o arquivo em `public/images/logo.png`** 🎯
