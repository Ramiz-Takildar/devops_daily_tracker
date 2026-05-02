#!/bin/bash

# DevOps Tracker - Kubernetes Deployment Script
# This script deploys the DevOps Daily Tracker application to Kubernetes

set -e  # Exit on error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists kubectl; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! command_exists docker; then
    print_error "docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Prerequisites check passed"

# Detect Kubernetes environment
print_info "Detecting Kubernetes environment..."

if kubectl config current-context | grep -q "minikube"; then
    K8S_ENV="minikube"
    print_info "Detected Minikube environment"
elif kubectl config current-context | grep -q "kind"; then
    K8S_ENV="kind"
    print_info "Detected Kind environment"
elif kubectl config current-context | grep -q "docker-desktop"; then
    K8S_ENV="docker-desktop"
    print_info "Detected Docker Desktop environment"
else
    K8S_ENV="unknown"
    print_warning "Unknown Kubernetes environment. Proceeding with default configuration."
fi

# Build Docker images
print_info "Building Docker images..."

cd ..
print_info "Building backend image..."
docker build -t devops-tracker-backend:1.0.0 ./backend
print_success "Backend image built successfully"

print_info "Building frontend image..."
docker build -t devops-tracker-frontend:1.0.0 ./frontend
print_success "Frontend image built successfully"

# Load images to Kubernetes cluster
if [ "$K8S_ENV" = "minikube" ]; then
    print_info "Loading images to Minikube..."
    minikube image load devops-tracker-backend:1.0.0
    minikube image load devops-tracker-frontend:1.0.0
    print_success "Images loaded to Minikube"
elif [ "$K8S_ENV" = "kind" ]; then
    print_info "Loading images to Kind..."
    kind load docker-image devops-tracker-backend:1.0.0
    kind load docker-image devops-tracker-frontend:1.0.0
    print_success "Images loaded to Kind"
else
    print_info "Skipping image load (not needed for Docker Desktop or cloud environments)"
fi

cd k8s

# Deploy to Kubernetes
print_info "Deploying to Kubernetes..."

# 1. Create namespace
print_info "Creating namespace..."
kubectl apply -f namespace.yaml
print_success "Namespace created"

# 2. Create secrets
print_info "Creating secrets..."
kubectl apply -f secrets.yaml
print_success "Secrets created"

# 3. Create configmaps
print_info "Creating configmaps..."
kubectl apply -f configmaps.yaml
print_success "ConfigMaps created"

# 4. Create persistent volume claims
print_info "Creating persistent volume claims..."
kubectl apply -f persistent-volumes.yaml
print_success "PVCs created"

# Note: PVCs will bind when pods start using them (WaitForFirstConsumer mode)
print_info "PVCs created (will bind when pods start using them)"
print_info "Note: PostgreSQL PVC will be created automatically by the StatefulSet"

# 5. Deploy PostgreSQL
print_info "Deploying PostgreSQL..."
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml
print_success "PostgreSQL deployed"

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready (this may take a few minutes)..."
kubectl wait --for=condition=ready pod -l app=postgres -n devops-tracker --timeout=300s
print_success "PostgreSQL is ready"

# 6. Deploy Backend
print_info "Deploying Backend..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
print_success "Backend deployed"

# Wait for Backend to be ready
print_info "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n devops-tracker --timeout=300s
print_success "Backend is ready"

# 7. Deploy Frontend
print_info "Deploying Frontend..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
print_success "Frontend deployed"

# Wait for Frontend to be ready
print_info "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n devops-tracker --timeout=300s
print_success "Frontend is ready"

# Display deployment status
echo ""
print_success "=========================================="
print_success "Deployment completed successfully!"
print_success "=========================================="
echo ""

print_info "Checking deployment status..."
kubectl get all -n devops-tracker

echo ""
print_info "=========================================="
print_info "Access Information"
print_info "=========================================="

if [ "$K8S_ENV" = "minikube" ]; then
    echo ""
    print_info "To access the application, run:"
    echo "  minikube service frontend-service -n devops-tracker"
    echo ""
    print_info "Or use port-forward:"
    echo "  kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000"
    echo "  Then open: http://localhost:3000"
elif [ "$K8S_ENV" = "kind" ]; then
    echo ""
    print_info "To access the application, use port-forward:"
    echo "  kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000"
    echo "  Then open: http://localhost:3000"
elif [ "$K8S_ENV" = "docker-desktop" ]; then
    echo ""
    print_info "Application is accessible at:"
    echo "  http://localhost:3000"
else
    echo ""
    print_info "To access the application, use port-forward:"
    echo "  kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000"
    echo "  Then open: http://localhost:3000"
fi

echo ""
print_info "To view logs:"
echo "  kubectl logs -n devops-tracker -l app=backend -f"
echo "  kubectl logs -n devops-tracker -l app=frontend -f"
echo "  kubectl logs -n devops-tracker -l app=postgres -f"

echo ""
print_info "To check pod status:"
echo "  kubectl get pods -n devops-tracker"

echo ""
print_success "Deployment script completed!"
