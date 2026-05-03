#!/bin/bash

# DevOps Daily Tracker - Start on Kubernetes (Docker Desktop)
# Single command to deploy everything

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DevOps Daily Tracker - Kubernetes Deployment          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Check if running from correct directory
if [ ! -d "k8s" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
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

echo -e "${BLUE}▶ Building Docker images...${NC}"
cd frontend && docker build -t devops-tracker-frontend:latest . > /dev/null 2>&1
cd ../backend && docker build -t devops-tracker-backend:latest . > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓ Images built${NC}"

echo -e "${BLUE}▶ Deploying to Kubernetes...${NC}"
cd k8s

kubectl apply -f namespace.yaml > /dev/null
kubectl apply -f secrets.yaml > /dev/null
kubectl apply -f configmaps.yaml > /dev/null
kubectl apply -f persistent-volumes.yaml > /dev/null
kubectl apply -f postgres-statefulset.yaml > /dev/null
kubectl apply -f postgres-service.yaml > /dev/null

echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
kubectl wait --for=condition=ready pod/postgres-0 -n devops-tracker --timeout=300s > /dev/null

kubectl apply -f backend-deployment.yaml > /dev/null
kubectl apply -f backend-service.yaml > /dev/null

# Force backend pods to restart with latest image
echo -e "${YELLOW}  Restarting backend with latest image...${NC}"
kubectl delete pods -n devops-tracker -l app=backend > /dev/null 2>&1 || true
kubectl wait --for=condition=available deployment/backend -n devops-tracker --timeout=300s > /dev/null

kubectl apply -f frontend-deployment.yaml > /dev/null
kubectl apply -f frontend-service.yaml > /dev/null

# Force frontend pods to restart with latest image
echo -e "${YELLOW}  Restarting frontend with latest image...${NC}"
kubectl delete pods -n devops-tracker -l app=frontend > /dev/null 2>&1 || true
kubectl wait --for=condition=available deployment/frontend -n devops-tracker --timeout=300s > /dev/null

cd ..

echo -e "${BLUE}▶ Setting up access...${NC}"
pkill -f "kubectl port-forward.*frontend-service" 2>/dev/null || true
sleep 2
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000 > /dev/null 2>&1 &
sleep 5

echo -e "${BLUE}▶ Seeding database with users and sample data...${NC}"
echo -e "${YELLOW}  Creating admin and demo users with sample data...${NC}"
BACKEND_POD=$(kubectl get pods -n devops-tracker -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n devops-tracker $BACKEND_POD -- node database/seed.js > /dev/null 2>&1
echo -e "${GREEN}✓ Database seeded (admin + demo users with sample data)${NC}"

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}🌐 Access:${NC} ${GREEN}http://localhost:3000${NC}\n"
echo -e "${BLUE}👤 Demo User:${NC}"
echo -e "   📧 Email: demo@devopstracker.com"
echo -e "   🔑 Pass:  Demo123!"
echo -e "\n${BLUE}🔐 Admin User:${NC}"
echo -e "   📧 Email: admin@devopstracker.com"
echo -e "   🔑 Pass:  Admin123!\n"

echo -e "${BLUE}📊 Status:${NC}"
kubectl get pods -n devops-tracker

echo -e "\n${YELLOW}💡 Commands:${NC}"
echo -e "   Stop:    ${GREEN}./stop.sh${NC}"
echo -e "   Cleanup: ${GREEN}./cleanup.sh${NC}"
echo -e "   Logs:    ${GREEN}kubectl logs -n devops-tracker -l app=frontend -f${NC}\n"