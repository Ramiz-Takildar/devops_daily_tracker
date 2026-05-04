#!/bin/bash

# DevOps Daily Tracker - ArgoCD Setup Script
# Personalized for: Ramiz-Takildar
# Docker Hub: ramiztakildar

set -e

echo "=========================================="
echo "DevOps Daily Tracker - ArgoCD Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
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

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_success "Connected to Kubernetes cluster"
echo ""

# Step 1: Install ArgoCD
echo "=========================================="
echo "Step 1: Installing ArgoCD"
echo "=========================================="
print_info "Creating argocd namespace..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

print_info "Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

print_info "Waiting for ArgoCD to be ready (this may take a few minutes)..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

print_success "ArgoCD installed successfully!"
echo ""

# Step 2: Get ArgoCD admin password
echo "=========================================="
echo "Step 2: ArgoCD Admin Credentials"
echo "=========================================="
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
print_info "ArgoCD Admin Username: admin"
print_info "ArgoCD Admin Password: ${ARGOCD_PASSWORD}"
echo ""
print_warning "IMPORTANT: Save this password! You'll need it to login to ArgoCD UI."
echo ""

# Step 3: Port forward ArgoCD UI
echo "=========================================="
echo "Step 3: Accessing ArgoCD UI"
echo "=========================================="
print_info "Starting port-forward to ArgoCD UI..."
print_info "ArgoCD UI will be available at: https://localhost:8080"
print_info "Username: admin"
print_info "Password: ${ARGOCD_PASSWORD}"
echo ""
print_warning "Press Ctrl+C to stop port-forwarding when done."
echo ""

# Ask user if they want to start port-forward now
read -p "Do you want to start port-forwarding now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting port-forward... (Press Ctrl+C to stop)"
    kubectl port-forward svc/argocd-server -n argocd 8080:443
else
    print_info "You can start port-forwarding later with:"
    echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
fi

echo ""
print_success "ArgoCD setup completed!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Login to ArgoCD UI at https://localhost:8080"
echo "   Username: admin"
echo "   Password: ${ARGOCD_PASSWORD}"
echo ""
echo "2. Deploy ArgoCD Project:"
echo "   kubectl apply -f argocd/projects/devops-tracker.yaml"
echo ""
echo "3. Deploy ArgoCD Applications:"
echo "   kubectl apply -f argocd/applications/devops-tracker-dev.yaml"
echo "   kubectl apply -f argocd/applications/devops-tracker-staging.yaml"
echo "   kubectl apply -f argocd/applications/devops-tracker-prod.yaml"
echo ""
echo "4. Setup GitHub Secrets (for CI/CD):"
echo "   - Go to: https://github.com/Ramiz-Takildar/devops_daily_tracker/settings/secrets/actions"
echo "   - Add secret: DOCKER_USERNAME = ramiztakildar"
echo "   - Add secret: DOCKER_PASSWORD = <your-docker-hub-token>"
echo ""
echo "5. Create Git branches:"
echo "   git checkout -b develop"
echo "   git push origin develop"
echo "   git checkout -b staging"
echo "   git push origin staging"
echo ""
echo "For detailed instructions, see: ARGOCD_SETUP_GUIDE.md"
echo "=========================================="
