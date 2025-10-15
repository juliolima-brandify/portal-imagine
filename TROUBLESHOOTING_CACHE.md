# 🔧 Troubleshooting - Problemas de Cache Next.js

## 🚨 **Erro Recorrente de Chunks**

Se você está vendo esses erros repetidamente:
- `Error: Cannot find module './XXXX.js'`
- `Failed to load resource: 404 (Not Found)` para `layout.css`, `page.js`, `main-app.js`
- `ChunkLoadError: Loading chunk failed`

**Isso significa que o cache do Next.js está corrompido.**

---

## ✅ **Solução Rápida (1 minuto)**

### **Passo 1: Fechar tudo**
- Feche TODAS as abas do navegador com `localhost:3000` ou `localhost:3001`
- Não deixe nenhuma aba aberta

### **Passo 2: Limpar e reiniciar**
```bash
npm run dev:clean
```

### **Passo 3: Abrir em janela anônima**
- Abra uma janela anônima (Ctrl+Shift+N)
- Acesse: `http://localhost:3001`

### **Passo 4: Se ainda não funcionar**
```bash
# No navegador:
# 1. Ctrl+Shift+Del
# 2. Limpar cache e cookies
# 3. Recarregar (Ctrl+Shift+R)
```

---

## 🔍 **Por que isso acontece?**

O Next.js em desenvolvimento usa **webpack** para gerar chunks dinâmicos. Quando:
1. Você salva arquivos rapidamente
2. O HMR (Hot Module Replacement) fica ativo por muito tempo
3. O servidor reinicia durante uma compilação

O webpack pode gerar referências a chunks que:
- Ainda não foram escritos no disco
- Foram deletados durante rebuild
- Estão em cache corrompido

**Resultado:** O navegador tenta carregar `layout.css` ou `page.js` mas recebe 404 porque o arquivo mudou de nome/path.

---

## 🛠️ **Solução Definitiva Implementada**

### **1. Cache em Memória**
```javascript
// next.config.js
config.cache = {
  type: 'memory',  // Ao invés de filesystem
}
```
✅ Evita corrupção de arquivos no disco

### **2. Runtime Único**
```javascript
config.optimization = {
  runtimeChunk: 'single',
}
```
✅ Um único runtime para todos os chunks (mais consistente)

### **3. Split Chunks Simplificado**
```javascript
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    default: false,
    vendors: false,
  },
}
```
✅ Menos chunks = menos chance de erro

---

## 📋 **Checklist de Prevenção**

### **Durante Desenvolvimento:**
- [ ] Não salve múltiplos arquivos ao mesmo tempo
- [ ] Aguarde compilação terminar antes de testar
- [ ] Reinicie o servidor a cada 30-60 minutos
- [ ] Use `npm run dev:clean` ao iniciar o dia

### **Ao Encontrar Erro:**
- [ ] Feche todas as abas do navegador
- [ ] Execute `npm run dev:clean`
- [ ] Abra em janela anônima
- [ ] Se persistir, limpe cache do navegador

### **Antes de Commit:**
- [ ] Execute `npm run build` para validar
- [ ] Teste em janela anônima
- [ ] Verifique se não há erros no console

---

## 🔄 **Workflow Recomendado**

```bash
# Início do dia
npm run dev:clean

# Durante desenvolvimento (a cada 30-60 min)
# Ctrl+C no terminal
npm run dev:clean

# Antes de parar para almoço/café
# Ctrl+C no terminal
# (não deixe servidor rodando sem usar)

# Ao voltar
npm run dev:clean
```

---

## 🆘 **Solução de Emergência**

Se NADA funcionar:

```bash
# 1. Matar todos os processos Node
taskkill /f /im node.exe

# 2. Limpar TUDO
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache

# 3. Reinstalar dependências (último recurso)
npm install

# 4. Iniciar limpo
npm run dev -- -p 3001
```

---

## 📊 **Estatísticas**

### **Antes da Solução:**
- ❌ Erro a cada 10-15 minutos
- ❌ Necessário reiniciar manualmente
- ❌ Perda de produtividade

### **Depois da Solução:**
- ✅ Cache em memória mais estável
- ✅ Script automatizado
- ✅ Menos interrupções
- ⚠️ Ainda pode ocorrer (mas menos frequente)

---

## 💡 **Dicas Extras**

### **1. Use Janela Anônima**
- Cache do navegador não interfere
- Sempre limpo ao abrir
- Melhor para testar

### **2. Desabilite Cache no DevTools**
- F12 → Network → ☑️ Disable cache
- Evita cache de assets

### **3. Monitore o Terminal**
- Se ver muitos warnings de cache
- Reinicie preventivamente

### **4. Atualize Next.js**
```bash
# Verificar versão atual
npm list next

# Atualizar (quando estável)
npm install next@latest
```

---

## 📚 **Referências**

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Webpack Cache](https://webpack.js.org/configuration/cache/)
- [Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)

---

**📝 Última atualização:** 15/10/2025  
**🔄 Versão:** v2.1.7  
**👨‍💻 Portal Instituto Imagine**

