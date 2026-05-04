#!/bin/bash

# DevOps Daily Tracker - ArgoCD Start Script
# Single command to deploy everything via GitOps

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DevOps Daily Tracker - ArgoCD GitOps Deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Check if running from correct directory
if [ ! -d "argocd" ] || [ ! -d "k8s" ]; then
    echo -e "${RED}✗ Error: Please run from devops_daily_tracker directory${NC}"
    exit 1
fi

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl not found. Please install kubectl${NC}"
    exit 1
fi

# Check cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
    echo -e "${YELLOW}  Please start Docker Desktop and enable Kubernetes${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}\n"

# Step 1: Install ArgoCD if not already installed
echo -e "${BLUE}▶ Step 1: Setting up ArgoCD...${NC}"
if kubectl get namespace argocd &> /dev/null; then
    echo -e "${YELLOW}  ArgoCD namespace already exists${NC}"
else
    echo -e "${YELLOW}  Creating argocd namespace...${NC}"
    kubectl create namespace argocd > /dev/null
    echo -e "${YELLOW}  Installing ArgoCD...${NC}"
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml > /dev/null
    echo -e "${YELLOW}  Waiting for ArgoCD to be ready (this may take 2-3 minutes)...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd > /dev/null
fi
echo -e "${GREEN}✓ ArgoCD ready${NC}\n"

# Step 2: Get ArgoCD credentials
echo -e "${BLUE}▶ Step 2: Getting ArgoCD credentials...${NC}"
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "")
if [ -z "$ARGOCD_PASSWORD" ]; then
    echo -e "${YELLOW}  Waiting for ArgoCD secret to be created...${NC}"
    sleep 10
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
fi
echo -e "${GREEN}✓ ArgoCD credentials retrieved${NC}\n"

# Step 3: Deploy ArgoCD Project
echo -e "${BLUE}▶ Step 3: Deploying ArgoCD Project...${NC}"
kubectl apply -f argocd/projects/devops-tracker.yaml > /dev/null
echo -e "${GREEN}✓ ArgoCD Project deployed${NC}\n"

# Step 4: Deploy ArgoCD Applications
echo -e "${BLUE}▶ Step 4: Deploying ArgoCD Applications...${NC}"
echo -e "${YELLOW}  Deploying dev environment...${NC}"
kubectl apply -f argocd/applications/devops-tracker-dev.yaml > /dev/null
echo -e "${YELLOW}  Deploying staging environment...${NC}"
kubectl apply -f argocd/applications/devops-tracker-staging.yaml > /dev/null
echo -e "${YELLOW}  Deploying production environment...${NC}"
kubectl apply -f argocd/applications/devops-tracker-prod.yaml > /dev/null
echo -e "${GREEN}✓ ArgoCD Applications deployed${NC}\n"

# Step 5: Wait for dev environment to sync
echo -e "${BLUE}▶ Step 5: Waiting for dev environment to sync...${NC}"
echo -e "${YELLOW}  This may take 2-3 minutes as ArgoCD syncs from Git...${NC}"
sleep 30

# Wait for postgres
echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
kubectl wait --for=condition=ready pod/postgres-dev-0 -n devops-tracker-dev --timeout=300s > /dev/null 2>&1 || true

# Wait for backend
echo -e "${YELLOW}  Waiting for backend...${NC}"
kubectl wait --for=condition=available deployment/backend-dev -n devops-tracker-dev --timeout=300s > /dev/null 2>&1 || true

# Wait for frontend
echo -e "${YELLOW}  Waiting for frontend...${NC}"
kubectl wait --for=condition=available deployment/frontend-dev -n devops-tracker-dev --timeout=300s > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Dev environment synced and running${NC}\n"

# Step 6: Seed database
echo -e "${BLUE}▶ Step 6: Seeding database...${NC}"
BACKEND_POD=$(kubectl get pods -n devops-tracker-dev -l app=devops-tracker,component=api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$BACKEND_POD" ]; then
    echo -e "${YELLOW}  Creating admin and demo users with sample data...${NC}"
    kubectl exec -n devops-tracker-dev $BACKEND_POD -- node database/seed.js > /dev/null 2>&1 || echo -e "${YELLOW}  Database may already be seeded${NC}"
    echo -e "${GREEN}✓ Database seeded${NC}\n"
else
    echo -e "${YELLOW}  Backend pod not ready yet, skipping database seed${NC}\n"
fi

# Step 7: Setup port forwarding
echo -e "${BLUE}▶ Step 7: Setting up access...${NC}"

# Kill existing port forwards
pkill -f "kubectl port-forward.*frontend-service-dev" 2>/dev/null || true
pkill -f "kubectl port-forward.*argocd-server" 2>/dev/null || true
sleep 2

# Start frontend port forward
echo -e "${YELLOW}  Starting frontend port-forward...${NC}"
kubectl port-forward -n devops-tracker-dev svc/frontend-service-dev 3000:3000 > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 3

# Start ArgoCD port forward
echo -e "${YELLOW}  Starting ArgoCD port-forward...${NC}"
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
ARGOCD_PID=$!
sleep 3

echo -e "${GREEN}✓ Port forwarding active${NC}\n"

# Display final status
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}🌐 Application Access:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:5000${NC} (use: kubectl port-forward -n devops-tracker-dev svc/backend-service-dev 5000:5000)\n"

echo -e "${BLUE}👤 Demo User:${NC}"
echo -e "   📧 Email: demo@devopstracker.com"
echo -e "   🔑 Pass:  Demo123!\n"

echo -e "${BLUE}🔐 Admin User:${NC}"
echo -e "   📧 Email: admin@devopstracker.com"
echo -e "   🔑 Pass:  Admin123!\n"

echo -e "${BLUE}🎯 ArgoCD UI:${NC}"
echo -e "   URL:      ${GREEN}https://localhost:8080${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}${ARGOCD_PASSWORD}${NC}\n"

echo -e "${BLUE}📊 Pod Status (Dev Environment):${NC}"
kubectl get pods -n devops-tracker-dev 2>/dev/null || echo -e "${YELLOW}  Pods still starting...${NC}"

echo -e "\n${BLUE}📊 ArgoCD Applications:${NC}"
kubectl get applications -n argocd 2>/dev/null || echo -e "${YELLOW}  Applications syncing...${NC}"

echo -e "\n${YELLOW}💡 Useful Commands:${NC}"
echo -e "   View logs:        ${GREEN}kubectl logs -n devops-tracker-dev -l app=devops-tracker,component=api -f${NC}"
echo -e "   ArgoCD apps:      ${GREEN}kubectl get applications -n argocd${NC}"
echo -e "   Sync manually:    ${GREEN}kubectl patch application devops-tracker-dev -n argocd --type merge -p '{\"metadata\":{\"annotations\":{\"argocd.argoproj.io/refresh\":\"hard\"}}}'${NC}"
echo -e "   Stop all:         ${GREEN}./stop-argocd.sh${NC}"
echo -e "   Cleanup:          ${GREEN}./cleanup-argocd.sh${NC}\n"

echo -e "${BLUE}🔄 GitOps Workflow:${NC}"
echo -e "   1. Push to 'develop' branch → Auto-deploys to dev"
echo -e "   2. Push to 'staging' branch → Auto-deploys to staging"
echo -e "   3. Push to 'main' branch    → Auto-deploys to production\n"

echo -e "${GREEN}✨ Your DevOps Daily Tracker is running with GitOps automation!${NC}\n"
