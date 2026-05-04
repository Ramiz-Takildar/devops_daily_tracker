#!/bin/bash

# DevOps Daily Tracker - Stop ArgoCD Deployment
# Stops port-forwarding but keeps applications running

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DevOps Daily Tracker - Stop Port Forwarding           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}▶ Stopping port-forwarding...${NC}"

# Kill port forwards
pkill -f "kubectl port-forward.*frontend-service-dev" 2>/dev/null && echo -e "${GREEN}✓ Frontend port-forward stopped${NC}" || echo -e "${YELLOW}  No frontend port-forward running${NC}"
pkill -f "kubectl port-forward.*backend-service-dev" 2>/dev/null && echo -e "${GREEN}✓ Backend port-forward stopped${NC}" || echo -e "${YELLOW}  No backend port-forward running${NC}"
pkill -f "kubectl port-forward.*argocd-server" 2>/dev/null && echo -e "${GREEN}✓ ArgoCD port-forward stopped${NC}" || echo -e "${YELLOW}  No ArgoCD port-forward running${NC}"

echo -e "\n${GREEN}✓ Port forwarding stopped${NC}"
echo -e "${BLUE}ℹ Applications are still running in Kubernetes${NC}\n"

echo -e "${YELLOW}💡 To restart port-forwarding:${NC}"
echo -e "   Frontend: ${GREEN}kubectl port-forward -n devops-tracker-dev svc/frontend-service-dev 3000:3000${NC}"
echo -e "   Backend:  ${GREEN}kubectl port-forward -n devops-tracker-dev svc/backend-service-dev 5000:5000${NC}"
echo -e "   ArgoCD:   ${GREEN}kubectl port-forward svc/argocd-server -n argocd 8080:443${NC}\n"

echo -e "${YELLOW}💡 To completely remove everything:${NC}"
echo -e "   ${GREEN}./cleanup-argocd.sh${NC}\n"
