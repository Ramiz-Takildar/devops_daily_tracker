#!/bin/bash

# DevOps Daily Tracker - Complete Deployment Script
# This script handles everything: build images, deploy to Kubernetes, create demo user
# Works on: Docker Desktop, Minikube, Kind, K3s

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

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Detect Kubernetes environment
detect_k8s_env() {
    local context=$(kubectl config current-context 2>/dev/null || echo "unknown")
    
    if [[ "$context" == *"docker-desktop"* ]]; then
        echo "docker-desktop"
    elif [[ "$context" == *"minikube"* ]]; then
        echo "minikube"
    elif [[ "$context" == *"kind"* ]]; then
        echo "kind"
    elif [[ "$context" == *"k3s"* ]] || [[ -f /etc/rancher/k3s/k3s.yaml ]]; then
        echo "k3s"
    else
        echo "unknown"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing=0
    
    # Check kubectl
    if command -v kubectl &> /dev/null; then
        print_success "kubectl found: $(kubectl version --client --short 2>/dev/null | head -1)"
    else
        print_error "kubectl not found. Please install kubectl."
        missing=1
    fi
    
    # Check docker
    if command -v docker &> /dev/null; then
        print_success "docker found: $(docker --version)"
    else
        print_error "docker not found. Please install Docker."
        missing=1
    fi
    
    # Check Kubernetes cluster
    if kubectl cluster-info &> /dev/null; then
        print_success "Kubernetes cluster is accessible"
        K8S_ENV=$(detect_k8s_env)
        print_info "Detected environment: $K8S_ENV"
    else
        print_error "Cannot connect to Kubernetes cluster. Please start your cluster."
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Prerequisites check failed. Please fix the issues above."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Build frontend
    print_info "Building frontend image..."
    cd "$script_dir/frontend"
    if docker build -t devops-tracker-frontend:1.0.0 . > /tmp/frontend-build.log 2>&1; then
        print_success "Frontend image built successfully"
    else
        print_error "Frontend build failed. Check /tmp/frontend-build.log for details"
        tail -20 /tmp/frontend-build.log
        exit 1
    fi
    
    # Build backend
    print_info "Building backend image..."
    cd "$script_dir/backend"
    if docker build -t devops-tracker-backend:1.0.0 . > /tmp/backend-build.log 2>&1; then
        print_success "Backend image built successfully"
    else
        print_error "Backend build failed. Check /tmp/backend-build.log for details"
        tail -20 /tmp/backend-build.log
        exit 1
    fi
    
    cd "$script_dir"
    
    # Verify images
    print_info "Verifying images..."
    docker images | grep devops-tracker
    print_success "Images built and verified"
}

# Load images into cluster (for Minikube/Kind)
load_images() {
    print_header "Loading Images into Cluster"
    
    case "$K8S_ENV" in
        minikube)
            print_info "Loading images into Minikube..."
            minikube image load devops-tracker-frontend:1.0.0
            minikube image load devops-tracker-backend:1.0.0
            print_success "Images loaded into Minikube"
            ;;
        kind)
            print_info "Loading images into Kind..."
            local cluster_name=$(kubectl config current-context | sed 's/kind-//')
            kind load docker-image devops-tracker-frontend:1.0.0 --name "$cluster_name"
            kind load docker-image devops-tracker-backend:1.0.0 --name "$cluster_name"
            print_success "Images loaded into Kind"
            ;;
        docker-desktop|k3s)
            print_info "Images available to cluster (no loading needed)"
            ;;
        *)
            print_info "Unknown environment, assuming images are available"
            ;;
    esac
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_header "Deploying to Kubernetes"
    
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$script_dir/k8s"
    
    # Create namespace
    print_info "Creating namespace..."
    kubectl apply -f namespace.yaml
    print_success "Namespace created"
    
    # Create secrets
    print_info "Creating secrets..."
    kubectl apply -f secrets.yaml
    print_success "Secrets created"
    
    # Create configmaps
    print_info "Creating configmaps..."
    kubectl apply -f configmaps.yaml
    print_success "ConfigMaps created"
    
    # Create PVCs
    print_info "Creating persistent volume claims..."
    kubectl apply -f persistent-volumes.yaml
    print_success "PVCs created"
    print_info "Note: PVCs will bind when pods start using them (WaitForFirstConsumer)"
    
    # Deploy PostgreSQL
    print_info "Deploying PostgreSQL..."
    kubectl apply -f postgres-statefulset.yaml
    kubectl apply -f postgres-service.yaml
    print_success "PostgreSQL deployed"
    
    # Wait for PostgreSQL
    print_info "Waiting for PostgreSQL to be ready (max 5 minutes)..."
    if kubectl wait --for=condition=ready pod/postgres-0 -n devops-tracker --timeout=300s; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL failed to start. Check logs: kubectl logs -n devops-tracker postgres-0"
        exit 1
    fi
    
    # Deploy Backend
    print_info "Deploying Backend..."
    kubectl apply -f backend-deployment.yaml
    kubectl apply -f backend-service.yaml
    print_success "Backend deployed"
    
    # Wait for Backend
    print_info "Waiting for Backend to be ready (max 5 minutes)..."
    if kubectl wait --for=condition=available deployment/backend -n devops-tracker --timeout=300s; then
        print_success "Backend is ready"
    else
        print_error "Backend failed to start. Check logs: kubectl logs -n devops-tracker -l app=backend"
        exit 1
    fi
    
    # Deploy Frontend
    print_info "Deploying Frontend..."
    kubectl apply -f frontend-deployment.yaml
    kubectl apply -f frontend-service.yaml
    print_success "Frontend deployed"
    
    # Wait for Frontend
    print_info "Waiting for Frontend to be ready (max 5 minutes)..."
    if kubectl wait --for=condition=available deployment/frontend -n devops-tracker --timeout=300s; then
        print_success "Frontend is ready"
    else
        print_error "Frontend failed to start. Check logs: kubectl logs -n devops-tracker -l app=frontend"
        exit 1
    fi
    
    cd "$script_dir"
}

# Create demo user
create_demo_user() {
    print_header "Creating Demo User"
    
    print_info "Starting port-forward to access API..."
    kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000 > /dev/null 2>&1 &
    local pf_pid=$!
    
    # Wait for port-forward to be ready
    sleep 5
    
    print_info "Creating demo user account..."
    local response=$(curl -s -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "username": "demo",
            "email": "demo@devopstracker.com",
            "password": "Demo123!",
            "full_name": "Demo User"
        }' 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Demo user created successfully"
        print_info "Email: demo@devopstracker.com"
        print_info "Password: Demo123!"
    else
        print_info "Demo user may already exist or creation skipped"
    fi
    
    # Keep port-forward running
    print_info "Port-forward running (PID: $pf_pid)"
}

# Display access information
show_access_info() {
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}✓ All components deployed successfully${NC}\n"
    
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    kubectl get all -n devops-tracker
    
    echo -e "\n${BLUE}🌐 Access Your Application:${NC}"
    echo -e "  URL: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Port-forward is already running in background"
    
    echo -e "\n${BLUE}🔐 Demo Account Credentials:${NC}"
    echo -e "  Email:    ${GREEN}demo@devopstracker.com${NC}"
    echo -e "  Password: ${GREEN}Demo123!${NC}"
    
    echo -e "\n${BLUE}📝 Useful Commands:${NC}"
    echo -e "  View all resources:  ${YELLOW}kubectl get all -n devops-tracker${NC}"
    echo -e "  View logs (backend): ${YELLOW}kubectl logs -n devops-tracker -l app=backend -f${NC}"
    echo -e "  View logs (frontend):${YELLOW}kubectl logs -n devops-tracker -l app=frontend -f${NC}"
    echo -e "  View logs (database):${YELLOW}kubectl logs -n devops-tracker postgres-0 -f${NC}"
    echo -e "  Stop port-forward:   ${YELLOW}pkill -f 'kubectl port-forward.*frontend-service'${NC}"
    echo -e "  Restart port-forward:${YELLOW}kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000${NC}"
    echo -e "  Cleanup deployment:  ${YELLOW}cd k8s && ./cleanup.sh${NC}"
    
    echo -e "\n${GREEN}🎉 Your DevOps Daily Tracker is ready to use!${NC}\n"
}

# Main execution
main() {
    print_header "DevOps Daily Tracker - Complete Deployment"
    echo -e "This script will:"
    echo -e "  1. Check prerequisites"
    echo -e "  2. Build Docker images"
    echo -e "  3. Load images into cluster (if needed)"
    echo -e "  4. Deploy to Kubernetes"
    echo -e "  5. Create demo user"
    echo -e "  6. Start port-forward"
    echo ""
    
    # Check if running from correct directory
    if [ ! -d "k8s" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the devops_daily_tracker directory"
        print_info "Current directory: $(pwd)"
        exit 1
    fi
    
    # Execute deployment steps
    check_prerequisites
    build_images
    load_images
    deploy_to_kubernetes
    create_demo_user
    show_access_info
}

# Run main function
main "$@"
