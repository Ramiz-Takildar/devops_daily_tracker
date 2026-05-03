#!/bin/bash

# DevOps Daily Tracker - Stop (keeps data)
# Stops all pods but preserves data in persistent volumes

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        DevOps Daily Tracker - Stopping Application        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Stop port-forward
echo -e "${BLUE}▶ Stopping port-forward...${NC}"
pkill -f "kubectl port-forward.*frontend-service" 2>/dev/null || true
echo -e "${GREEN}✓ Port-forward stopped${NC}"

# Scale down deployments
echo -e "${BLUE}▶ Scaling down deployments...${NC}"
kubectl scale deployment frontend --replicas=0 -n devops-tracker > /dev/null 2>&1
kubectl scale deployment backend --replicas=0 -n devops-tracker > /dev/null 2>&1
kubectl scale statefulset postgres --replicas=0 -n devops-tracker > /dev/null 2>&1
echo -e "${GREEN}✓ All pods stopped${NC}"

echo -e "\n${GREEN}✓ Application stopped (data preserved)${NC}"
echo -e "${YELLOW}💡 To start again: ${GREEN}./start.sh${NC}"
echo -e "${YELLOW}💡 To remove all:  ${GREEN}./cleanup.sh${NC}\n"
