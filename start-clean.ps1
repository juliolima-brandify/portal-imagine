# Script de inicializacao limpa do Next.js
# Evita problemas de cache e chunks ausentes

Write-Host "Limpando ambiente Next.js..." -ForegroundColor Cyan

# 1. Parar todos os processos Node
Write-Host "Parando processos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Limpar cache do Next.js
Write-Host "Removendo .next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Limpar cache do Node
Write-Host "Removendo cache do node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 4. Aguardar para garantir que arquivos foram liberados
Start-Sleep -Seconds 2

# 5. Iniciar servidor
Write-Host "Iniciando servidor Next.js..." -ForegroundColor Green
Write-Host ""
Write-Host "Servidor em: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

npm run dev -- -p 3001

