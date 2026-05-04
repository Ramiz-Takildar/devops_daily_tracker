#!/bin/bash

# DevOps Daily Tracker - Initial Setup Script
# This script sets up the entire application on a new system

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    print_header "DevOps Daily Tracker - Initial Setup"
    
    # Step 1: Check prerequisites
    print_info "Step 1/5: Checking prerequisites..."
    
    local missing_deps=0
    
    # Check Docker
    if command_exists docker; then
        print_success "Docker is installed"
        docker --version
    else
        print_error "Docker is not installed"
        print_info "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        missing_deps=1
    fi
    
    # Check kubectl
    if command_exists kubectl; then
        print_success "kubectl is installed"
        kubectl version --client --short 2>/dev/null || kubectl version --client
    else
        print_error "kubectl is not installed"
        print_info "kubectl usually comes with Docker Desktop. Please enable Kubernetes in Docker Desktop settings."
        missing_deps=1
    fi
    
    # Check git
    if command_exists git; then
        print_success "git is installed"
        git --version
    else
        print_error "git is not installed"
        print_info "Please install git from: https://git-scm.com/downloads"
        missing_deps=1
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Missing required dependencies. Please install them and run this script again."
        exit 1
    fi
    
    # Step 2: Check Kubernetes cluster
    print_info "\nStep 2/5: Checking Kubernetes cluster..."
    
    if kubectl cluster-info >/dev/null 2>&1; then
        print_success "Kubernetes cluster is running"
        kubectl cluster-info | head -n 1
    else
        print_error "Kubernetes cluster is not running"
        print_info "Please start Kubernetes in Docker Desktop settings and try again."
        exit 1
    fi
    
    # Step 3: Check if ArgoCD is already installed
    print_info "\nStep 3/5: Checking ArgoCD installation..."
    
    if kubectl get namespace argocd >/dev/null 2>&1; then
        print_warning "ArgoCD namespace already exists"
        read -p "Do you want to reinstall ArgoCD? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up existing ArgoCD installation..."
            ./cleanup-argocd.sh
            sleep 5
        else
            print_info "Skipping ArgoCD installation"
        fi
    fi
    
    # Step 4: Deploy application
    print_info "\nStep 4/5: Deploying DevOps Daily Tracker..."
    
    if [ -f "./start-argocd.sh" ]; then
        print_info "Running deployment script..."
        chmod +x ./start-argocd.sh
        ./start-argocd.sh
    else
        print_error "start-argocd.sh not found in current directory"
        print_info "Please ensure you're in the project root directory"
        exit 1
    fi
    
    # Step 5: Verify deployment
    print_info "\nStep 5/5: Verifying deployment..."
    
    sleep 10
    
    # Check if pods are running
    print_info "Checking pod status..."
    kubectl get pods -n devops-tracker-dev
    
    # Check if services are accessible
    print_info "\nChecking services..."
    kubectl get svc -n devops-tracker-dev
    
    # Final success message
    print_header "Setup Complete!"
    
    echo -e "${GREEN}✓ DevOps Daily Tracker has been successfully deployed!${NC}\n"
    
    echo -e "${BLUE}Access Points:${NC}"
    echo -e "  • Frontend:  ${GREEN}http://localhost:3000${NC}"
    echo -e "  • ArgoCD UI: ${GREEN}https://localhost:8080${NC}"
    
    echo -e "\n${BLUE}Credentials:${NC}"
    echo -e "  • Demo User:  ${GREEN}demo@devopstracker.com${NC} / ${GREEN}Demo123!${NC}"
    echo -e "  • Admin User: ${GREEN}admin@devopstracker.com${NC} / ${GREEN}Admin123!${NC}"
    echo -e "  • ArgoCD:     ${GREEN}admin${NC} / ${GREEN}bRa23aWpZvfEAAy0${NC}"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "  1. Open ${GREEN}http://localhost:3000${NC} in your browser"
    echo -e "  2. Login with demo credentials"
    echo -e "  3. Explore the application"
    echo -e "  4. Check ArgoCD UI at ${GREEN}https://localhost:8080${NC}"
    
    echo -e "\n${BLUE}Management Commands:${NC}"
    echo -e "  • Stop port-forwarding:  ${GREEN}./stop-argocd.sh${NC}"
    echo -e "  • Restart deployment:    ${GREEN}./start-argocd.sh${NC}"
    echo -e "  • Cleanup everything:    ${GREEN}./cleanup-argocd.sh${NC}"
    
    echo -e "\n${BLUE}Documentation:${NC}"
    echo -e "  • Architecture: ${GREEN}ARCHITECTURE.md${NC}"
    echo -e "  • Quick Start:  ${GREEN}ARGOCD_QUICK_START.md${NC}"
    echo -e "  • README:       ${GREEN}README.md${NC}"
    
    echo -e "\n${GREEN}Happy tracking! 🚀${NC}\n"
}

# Run main function
main "$@"
