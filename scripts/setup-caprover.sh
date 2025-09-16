#!/bin/bash

# 🚀 Script de Configuração Automática do CapRover
# Portal Imagine - Deploy Automático

echo "🚀 Configurando Portal Imagine no CapRover..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o CapRover CLI está instalado
check_caprover_cli() {
    print_status "Verificando CapRover CLI..."
    
    if ! command -v caprover &> /dev/null; then
        print_error "CapRover CLI não encontrado!"
        print_status "Instalando CapRover CLI..."
        
        npm install -g caprover
        
        if [ $? -eq 0 ]; then
            print_success "CapRover CLI instalado com sucesso!"
        else
            print_error "Falha ao instalar CapRover CLI"
            exit 1
        fi
    else
        print_success "CapRover CLI já está instalado!"
    fi
}

# Configurar aplicação no CapRover
setup_app() {
    print_status "Configurando aplicação no CapRover..."
    
    # Nome da aplicação
    APP_NAME="portal-imagine"
    
    # Verificar se a aplicação já existe
    if caprover app -a $APP_NAME &> /dev/null; then
        print_warning "Aplicação $APP_NAME já existe!"
        read -p "Deseja reconfigurar? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Pulando configuração da aplicação..."
            return 0
        fi
    fi
    
    # Criar aplicação
    print_status "Criando aplicação $APP_NAME..."
    caprover app -a $APP_NAME --create
    
    if [ $? -eq 0 ]; then
        print_success "Aplicação $APP_NAME criada com sucesso!"
    else
        print_error "Falha ao criar aplicação $APP_NAME"
        exit 1
    fi
}

# Configurar domínio
setup_domain() {
    print_status "Configurando domínio..."
    
    read -p "Digite o domínio (ex: portal.imagineinstituto.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_warning "Domínio não informado, pulando configuração..."
        return 0
    fi
    
    print_status "Configurando domínio $DOMAIN..."
    caprover app -a portal-imagine --domain $DOMAIN
    
    if [ $? -eq 0 ]; then
        print_success "Domínio $DOMAIN configurado com sucesso!"
    else
        print_error "Falha ao configurar domínio $DOMAIN"
        exit 1
    fi
}

# Configurar variáveis de ambiente
setup_env_vars() {
    print_status "Configurando variáveis de ambiente..."
    
    # Lista de variáveis necessárias
    ENV_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "NEXT_PUBLIC_INSTITUTE_NAME"
        "NEXT_PUBLIC_INSTITUTE_URL"
        "NODE_ENV"
        "PORT"
    )
    
    print_status "Configurando variáveis de ambiente..."
    
    # Configurar variáveis básicas
    caprover env -a portal-imagine --set NODE_ENV=production
    caprover env -a portal-imagine --set PORT=3000
    caprover env -a portal-imagine --set NEXT_PUBLIC_INSTITUTE_NAME="Instituto Imagine"
    caprover env -a portal-imagine --set NEXT_PUBLIC_INSTITUTE_URL="https://imagineinstituto.com"
    
    print_success "Variáveis básicas configuradas!"
    
    # Solicitar variáveis sensíveis
    print_warning "Agora você precisa configurar as variáveis sensíveis manualmente:"
    echo
    for var in "${ENV_VARS[@]}"; do
        if [[ "$var" != "NODE_ENV" && "$var" != "PORT" && "$var" != "NEXT_PUBLIC_INSTITUTE_NAME" && "$var" != "NEXT_PUBLIC_INSTITUTE_URL" ]]; then
            echo "  - $var"
        fi
    done
    echo
    print_status "Use: caprover env -a portal-imagine --set VAR_NAME=value"
}

# Fazer deploy
deploy_app() {
    print_status "Fazendo deploy da aplicação..."
    
    # Verificar se estamos em um repositório Git
    if [ ! -d ".git" ]; then
        print_warning "Não é um repositório Git. Fazendo deploy via upload..."
        
        # Criar arquivo de deploy
        print_status "Criando arquivo de deploy..."
        tar -czf portal-imagine.tar.gz .
        
        if [ $? -eq 0 ]; then
            print_success "Arquivo de deploy criado: portal-imagine.tar.gz"
            print_status "Faça upload manual no painel do CapRover"
        else
            print_error "Falha ao criar arquivo de deploy"
            exit 1
        fi
    else
        print_status "Repositório Git encontrado. Configurando deploy automático..."
        
        # Configurar deploy automático
        caprover app -a portal-imagine --git-repo $(git remote get-url origin)
        caprover app -a portal-imagine --git-branch main
        
        if [ $? -eq 0 ]; then
            print_success "Deploy automático configurado!"
            print_status "Push para main = Deploy automático"
        else
            print_error "Falha ao configurar deploy automático"
            exit 1
        fi
    fi
}

# Verificar status da aplicação
check_app_status() {
    print_status "Verificando status da aplicação..."
    
    # Aguardar aplicação ficar online
    print_status "Aguardando aplicação ficar online..."
    
    for i in {1..30}; do
        if caprover app -a portal-imagine | grep -q "Running"; then
            print_success "Aplicação está online!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Timeout: Aplicação não ficou online em 5 minutos"
            exit 1
        fi
        
        print_status "Aguardando... ($i/30)"
        sleep 10
    done
}

# Testar health check
test_health_check() {
    print_status "Testando health check..."
    
    # Obter URL da aplicação
    APP_URL=$(caprover app -a portal-imagine | grep "App URL" | awk '{print $3}')
    
    if [ -z "$APP_URL" ]; then
        print_warning "URL da aplicação não encontrada"
        return 0
    fi
    
    print_status "Testando: $APP_URL/api/health"
    
    # Testar health check
    if curl -s "$APP_URL/api/health" | grep -q "ok"; then
        print_success "Health check passou!"
    else
        print_warning "Health check falhou ou não está disponível"
    fi
}

# Função principal
main() {
    echo "🚀 Portal Imagine - Configuração CapRover"
    echo "========================================"
    echo
    
    # Verificar pré-requisitos
    check_caprover_cli
    
    # Configurar aplicação
    setup_app
    
    # Configurar domínio
    setup_domain
    
    # Configurar variáveis de ambiente
    setup_env_vars
    
    # Fazer deploy
    deploy_app
    
    # Verificar status
    check_app_status
    
    # Testar health check
    test_health_check
    
    echo
    print_success "🎉 Configuração concluída com sucesso!"
    echo
    print_status "Próximos passos:"
    echo "  1. Configure as variáveis de ambiente sensíveis"
    echo "  2. Faça push para o repositório (se usando Git)"
    echo "  3. Acesse sua aplicação no CapRover"
    echo "  4. Teste todas as funcionalidades"
    echo
    print_status "Comandos úteis:"
    echo "  caprover logs -a portal-imagine"
    echo "  caprover env -a portal-imagine"
    echo "  caprover app -a portal-imagine"
    echo
}

# Executar função principal
main "$@"

