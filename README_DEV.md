# 🛠️ Guia de Desenvolvimento - Portal Instituto Imagine

> 📍 **Estado atual do projeto: [docs/ESTADO_ATUAL.md](./docs/ESTADO_ATUAL.md) (07/07/2026).** O dev local está conectado ao banco real `zzxtethlsdjjfjjrqmlk` (chave pública `sb_publishable_...`, credenciais no `.env.local`). Para recriar o banco, use `docs/SETUP-COMPLETO.sql`. Há pendências críticas de produção/segurança descritas no doc canônico.

## 🚀 **Inicialização Rápida**

### **Método 1: Inicialização Limpa (Recomendado)**
```powershell
npm run dev:clean
```
Este comando:
- ✅ Para todos os processos Node.js
- ✅ Remove cache do Next.js (`.next`)
- ✅ Remove cache do Node (`node_modules/.cache`)
- ✅ Inicia o servidor na porta 3001

### **Método 2: Inicialização Normal**
```bash
npm run dev
```

### **Método 3: Limpeza Manual**
```bash
# Limpar cache
npm run clean

# Depois iniciar
npm run dev
```

---

## ❓ **Por que usar `dev:clean`?**

O Next.js em modo desenvolvimento pode ter problemas de cache quando:
- Você salva múltiplos arquivos rapidamente
- O Hot Module Replacement (HMR) fica ativo por muito tempo
- Há mudanças em dependências ou configurações
- O servidor fica rodando por muito tempo (> 30 minutos)

**Sintomas comuns:**
- ❌ `Error: Cannot find module './vendor-chunks/...'`
- ❌ `Error: Cannot find module './1638.js'` (ou qualquer número)
- ❌ `Failed to load resource: 404 (Not Found)` para chunks JS/CSS
- ❌ `MIME type 'text/html' is not executable`
- ❌ `ChunkLoadError: Loading chunk failed`
- ❌ `layout.css:1 Failed to load resource: 404`

**Solução:** Use `npm run dev:clean` sempre que encontrar esses erros.

**⚠️ IMPORTANTE:** Se o erro aparecer mais de 2 vezes seguidas:
1. Feche TODAS as abas do navegador (localhost:3000 e localhost:3001)
2. Execute `npm run dev:clean`
3. Abra em janela anônima
4. Limpe cache do navegador (Ctrl+Shift+Del)

---

## 🔧 **Configurações Aplicadas**

### **next.config.js**
```javascript
webpack: (config, { dev }) => {
  if (dev) {
    config.cache = {
      type: 'memory',                 // Cache em memória (mais estável)
    }
    config.resolve.symlinks = false   // Melhora resolução de módulos
    config.optimization = {
      moduleIds: 'named',             // IDs previsíveis
      chunkIds: 'named',              // Chunks nomeados
      runtimeChunk: 'single',         // Runtime único
      splitChunks: {
        chunks: 'all',                // Split otimizado
        cacheGroups: {
          default: false,
          vendors: false,
        },
      },
    }
  }
  return config
}
```

Essas configurações:
- ✅ Cache em memória (evita corrupção de arquivos)
- ✅ Melhoram estabilidade do HMR
- ✅ Facilitam debug (IDs nomeados)
- ✅ Runtime único para melhor consistência

---

## 📝 **Scripts Disponíveis**

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor desenvolvimento (porta 3000) |
| `npm run dev:clean` | Inicia com limpeza de cache (porta 3001) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run clean` | Limpa apenas o cache |
| `npm run lint` | Executa linter |

---

## 🌐 **URLs de Desenvolvimento**

- **Local:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **Admin:** http://localhost:3001/admin/dashboard
- **Auth:** http://localhost:3001/auth

### **Modo Demo:**
- Admin: `?demo_email=admin@institutoimagine.org`
- Doador: `?demo_email=demo@doador.com`
- Voluntário: `?demo_email=volunteer@institutoimagine.org`

---

## 🐛 **Troubleshooting**

### **Problema: Erro de módulo não encontrado**
```
Error: Cannot find module './vendor-chunks/...'
```
**Solução:**
```bash
npm run dev:clean
```

### **Problema: 404 em arquivos CSS/JS**
```
Failed to load resource: 404 (Not Found)
```
**Solução:**
1. Feche todas as abas do navegador
2. Execute `npm run dev:clean`
3. Limpe cache do navegador (Ctrl+Shift+Del)
4. Abra em janela anônima

### **Problema: MIME type error**
```
Refused to apply style... MIME type 'text/html' is not a supported stylesheet
```
**Solução:**
1. `npm run dev:clean`
2. Hard refresh no navegador (Ctrl+Shift+R)
3. Se persistir, limpe storage do site (DevTools > Application > Clear storage)

### **Problema: Servidor não inicia**
```bash
# Verificar se porta está em uso
netstat -ano | findstr :3001

# Matar processo específico
taskkill /PID [número_do_pid] /F

# Ou matar todos os Node
taskkill /f /im node.exe
```

---

## 📦 **Estrutura de Cache**

```
portal-imagine/
├── .next/                    # Cache do Next.js (limpar sempre)
│   ├── cache/               # Cache de build
│   ├── server/              # Código server-side
│   └── static/              # Assets estáticos
├── node_modules/
│   └── .cache/              # Cache de dependências (limpar sempre)
└── .vercel/                 # Cache do Vercel (não tocar)
```

---

## ⚡ **Boas Práticas**

### **Durante Desenvolvimento:**
1. ✅ Use `npm run dev:clean` ao iniciar o dia
2. ✅ Se encontrar erros de cache, reinicie com `dev:clean`
3. ✅ Não salve múltiplos arquivos simultaneamente
4. ✅ Aguarde compilação terminar antes de testar no navegador

### **Antes de Commit:**
1. ✅ Execute `npm run build` para validar
2. ✅ Teste em janela anônima
3. ✅ Verifique se não há erros de lint

### **Antes de Deploy:**
1. ✅ Build local sem erros
2. ✅ Teste todas as funcionalidades principais
3. ✅ Verifique variáveis de ambiente

---

## 🔄 **Workflow Recomendado**

```bash
# 1. Início do dia
npm run dev:clean

# 2. Durante desenvolvimento
# (salvar arquivos normalmente)

# 3. Se encontrar erro de cache
npm run dev:clean

# 4. Antes de commit
npm run build
npm run lint

# 5. Commit
git add .
git commit -m "feat: nova funcionalidade"
git push
```

---

## 📚 **Documentação Adicional**

- **Funcionalidades:** `docs/FUNCIONALIDADES_IMPLEMENTADAS.md`
- **Changelog:** `docs/CHANGELOG_COMPLETO.md`
- **Deploy:** `docs/GUIA_DEPLOY_PRODUCAO.md`
- **Jornada:** `JORNADA_USUARIO_GLOBAL.md`

---

**📝 Última atualização:** 14/10/2025  
**🔄 Versão:** v2.1.7  
**👨‍💻 Portal Instituto Imagine**

