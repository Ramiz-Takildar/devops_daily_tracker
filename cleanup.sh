#!/bin/bash

# DevOps Daily Tracker - Complete Cleanup
# Removes everything including data

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║              WARNING: Complete Cleanup                     ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}This will delete:${NC}"
echo -e "  • All pods and deployments"
echo -e "  • All services"
echo -e "  • All persistent data (DATABASE WILL BE LOST)"
echo -e "  • The devops-tracker namespace\n"

read -p "Are you sure? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${BLUE}Cleanup cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}▶ Stopping port-forward...${NC}"
pkill -f "kubectl port-forward.*frontend-service" 2>/dev/null || true

echo -e "${BLUE}▶ Deleting namespace...${NC}"
kubectl delete namespace devops-tracker --timeout=60s

echo -e "\n${GREEN}✓ Complete cleanup done${NC}"
echo -e "${YELLOW}💡 To deploy again: ${GREEN}./start.sh${NC}\n"
