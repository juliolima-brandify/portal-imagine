#!/bin/bash

# 🌐 Script para Verificar Configuração DNS do CapRover
# Portal Imagine - Verificação de Domínio Raiz

echo "🌐 Verificando Configuração DNS do CapRover..."

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

# Solicitar domínio raiz
read -p "Digite o domínio raiz do CapRover (ex: captain.imagineinstituto.com): " ROOT_DOMAIN

if [ -z "$ROOT_DOMAIN" ]; then
    print_error "Domínio raiz não informado!"
    exit 1
fi

print_status "Verificando domínio: $ROOT_DOMAIN"

# Verificar se o domínio resolve
check_dns_resolution() {
    print_status "Verificando resolução DNS..."
    
    # Verificar domínio principal
    if nslookup $ROOT_DOMAIN > /dev/null 2>&1; then
        print_success "Domínio principal resolve: $ROOT_DOMAIN"
    else
        print_error "Domínio principal não resolve: $ROOT_DOMAIN"
        return 1
    fi
    
    # Verificar subdomínios
    SUBDOMAINS=("test-app" "portal-imagine" "admin" "api")
    
    for subdomain in "${SUBDOMAINS[@]}"; do
        FULL_DOMAIN="$subdomain.$ROOT_DOMAIN"
        
        if nslookup $FULL_DOMAIN > /dev/null 2>&1; then
            print_success "Subdomínio resolve: $FULL_DOMAIN"
        else
            print_warning "Subdomínio não resolve: $FULL_DOMAIN"
        fi
    done
}

# Verificar conectividade HTTP/HTTPS
check_http_connectivity() {
    print_status "Verificando conectividade HTTP/HTTPS..."
    
    # Verificar HTTP
    if curl -s --connect-timeout 10 http://$ROOT_DOMAIN:3000 > /dev/null 2>&1; then
        print_success "HTTP acessível: http://$ROOT_DOMAIN:3000"
    else
        print_warning "HTTP não acessível: http://$ROOT_DOMAIN:3000"
    fi
    
    # Verificar HTTPS
    if curl -s --connect-timeout 10 https://$ROOT_DOMAIN > /dev/null 2>&1; then
        print_success "HTTPS acessível: https://$ROOT_DOMAIN"
    else
        print_warning "HTTPS não acessível: https://$ROOT_DOMAIN"
    fi
}

# Verificar SSL
check_ssl() {
    print_status "Verificando certificado SSL..."
    
    if openssl s_client -connect $ROOT_DOMAIN:443 -servername $ROOT_DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        print_success "Certificado SSL válido"
    else
        print_warning "Certificado SSL inválido ou não encontrado"
    fi
}

# Verificar CapRover
check_caprover() {
    print_status "Verificando CapRover..."
    
    # Verificar se o CapRover responde
    if curl -s --connect-timeout 10 http://$ROOT_DOMAIN:3000 | grep -q "CapRover"; then
        print_success "CapRover está respondendo"
    else
        print_warning "CapRover não está respondendo ou não está configurado"
    fi
}

# Verificar portas
check_ports() {
    print_status "Verificando portas..."
    
    # Verificar porta 3000 (CapRover)
    if nc -z $ROOT_DOMAIN 3000 2>/dev/null; then
        print_success "Porta 3000 (CapRover) está aberta"
    else
        print_warning "Porta 3000 (CapRover) não está acessível"
    fi
    
    # Verificar porta 443 (HTTPS)
    if nc -z $ROOT_DOMAIN 443 2>/dev/null; then
        print_success "Porta 443 (HTTPS) está aberta"
    else
        print_warning "Porta 443 (HTTPS) não está acessível"
    fi
    
    # Verificar porta 80 (HTTP)
    if nc -z $ROOT_DOMAIN 80 2>/dev/null; then
        print_success "Porta 80 (HTTP) está aberta"
    else
        print_warning "Porta 80 (HTTP) não está acessível"
    fi
}

# Verificar configuração DNS
check_dns_config() {
    print_status "Verificando configuração DNS..."
    
    # Verificar se há entrada A coringa
    if dig +short $ROOT_DOMAIN | grep -q "A"; then
        print_success "Entrada A encontrada para $ROOT_DOMAIN"
        
        # Mostrar IPs
        IPs=$(dig +short $ROOT_DOMAIN)
        print_status "IPs resolvidos: $IPs"
    else
        print_error "Nenhuma entrada A encontrada para $ROOT_DOMAIN"
    fi
    
    # Verificar subdomínios
    SUBDOMAINS=("test-app" "portal-imagine" "admin" "api")
    
    for subdomain in "${SUBDOMAINS[@]}"; do
        FULL_DOMAIN="$subdomain.$ROOT_DOMAIN"
        
        if dig +short $FULL_DOMAIN | grep -q "A"; then
            print_success "Subdomínio $FULL_DOMAIN resolve"
        else
            print_warning "Subdomínio $FULL_DOMAIN não resolve"
        fi
    done
}

# Gerar relatório
generate_report() {
    print_status "Gerando relatório..."
    
    REPORT_FILE="dns-check-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "🌐 Relatório de Verificação DNS - CapRover"
        echo "=========================================="
        echo "Data: $(date)"
        echo "Domínio: $ROOT_DOMAIN"
        echo ""
        
        echo "📊 Resolução DNS:"
        dig +short $ROOT_DOMAIN
        echo ""
        
        echo "🔍 Verificação de Subdomínios:"
        for subdomain in "test-app" "portal-imagine" "admin" "api"; do
            echo "$subdomain.$ROOT_DOMAIN: $(dig +short $subdomain.$ROOT_DOMAIN)"
        done
        echo ""
        
        echo "🌐 Conectividade:"
        echo "HTTP: $(curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" http://$ROOT_DOMAIN:3000)"
        echo "HTTPS: $(curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" https://$ROOT_DOMAIN)"
        echo ""
        
        echo "🔒 SSL:"
        openssl s_client -connect $ROOT_DOMAIN:443 -servername $ROOT_DOMAIN < /dev/null 2>/dev/null | grep "Verify return code"
        echo ""
        
    } > $REPORT_FILE
    
    print_success "Relatório salvo em: $REPORT_FILE"
}

# Função principal
main() {
    echo "🌐 Verificação de Configuração DNS - CapRover"
    echo "============================================="
    echo
    
    # Verificar DNS
    check_dns_resolution
    
    # Verificar conectividade
    check_http_connectivity
    
    # Verificar SSL
    check_ssl
    
    # Verificar CapRover
    check_caprover
    
    # Verificar portas
    check_ports
    
    # Verificar configuração DNS
    check_dns_config
    
    # Gerar relatório
    generate_report
    
    echo
    print_status "Verificação concluída!"
    echo
    print_status "Próximos passos:"
    echo "  1. Se DNS não resolve, aguarde propagação (até 48h)"
    echo "  2. Se CapRover não responde, verifique se está rodando"
    echo "  3. Se SSL não funciona, configure no CapRover"
    echo "  4. Se tudo OK, prossiga com o deploy do Portal Imagine"
    echo
}

# Executar função principal
main "$@"

