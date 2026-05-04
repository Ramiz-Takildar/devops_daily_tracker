#!/bin/bash

# DevOps Daily Tracker - Cleanup ArgoCD Deployment
# Removes all ArgoCD applications and optionally ArgoCD itself

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DevOps Daily Tracker - ArgoCD Cleanup                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl not found${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠ This will remove:${NC}"
echo -e "   • All DevOps Tracker applications (dev, staging, prod)"
echo -e "   • All application namespaces and resources"
echo -e "   • ArgoCD project"
echo -e ""
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cleanup cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}▶ Step 1: Stopping port-forwarding...${NC}"
pkill -f "kubectl port-forward.*frontend-service" 2>/dev/null || true
pkill -f "kubectl port-forward.*backend-service" 2>/dev/null || true
pkill -f "kubectl port-forward.*argocd-server" 2>/dev/null || true
echo -e "${GREEN}✓ Port forwarding stopped${NC}\n"

echo -e "${BLUE}▶ Step 2: Deleting ArgoCD applications...${NC}"
kubectl delete application devops-tracker-dev -n argocd 2>/dev/null && echo -e "${GREEN}✓ Dev application deleted${NC}" || echo -e "${YELLOW}  Dev application not found${NC}"
kubectl delete application devops-tracker-staging -n argocd 2>/dev/null && echo -e "${GREEN}✓ Staging application deleted${NC}" || echo -e "${YELLOW}  Staging application not found${NC}"
kubectl delete application devops-tracker-prod -n argocd 2>/dev/null && echo -e "${GREEN}✓ Production application deleted${NC}" || echo -e "${YELLOW}  Production application not found${NC}"
echo ""

echo -e "${BLUE}▶ Step 3: Deleting ArgoCD project...${NC}"
kubectl delete appproject devops-tracker -n argocd 2>/dev/null && echo -e "${GREEN}✓ Project deleted${NC}" || echo -e "${YELLOW}  Project not found${NC}"
echo ""

echo -e "${BLUE}▶ Step 4: Deleting application namespaces...${NC}"
kubectl delete namespace devops-tracker-dev 2>/dev/null && echo -e "${GREEN}✓ Dev namespace deleted${NC}" || echo -e "${YELLOW}  Dev namespace not found${NC}"
kubectl delete namespace devops-tracker-staging 2>/dev/null && echo -e "${GREEN}✓ Staging namespace deleted${NC}" || echo -e "${YELLOW}  Staging namespace not found${NC}"
kubectl delete namespace devops-tracker-prod 2>/dev/null && echo -e "${GREEN}✓ Production namespace deleted${NC}" || echo -e "${YELLOW}  Production namespace not found${NC}"
echo ""

echo -e "${YELLOW}Do you want to remove ArgoCD itself? (y/n): ${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}▶ Step 5: Removing ArgoCD...${NC}"
    kubectl delete namespace argocd 2>/dev/null && echo -e "${GREEN}✓ ArgoCD removed${NC}" || echo -e "${YELLOW}  ArgoCD not found${NC}"
else
    echo -e "${BLUE}ℹ ArgoCD kept (you can remove it later with: kubectl delete namespace argocd)${NC}"
fi

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Cleanup Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}💡 To redeploy:${NC}"
echo -e "   ${GREEN}./start-argocd.sh${NC}\n"
