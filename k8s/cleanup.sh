#!/bin/bash

# DevOps Tracker - Kubernetes Cleanup Script
# This script removes all Kubernetes resources for the DevOps Daily Tracker application

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

# Confirmation prompt
echo ""
print_warning "=========================================="
print_warning "WARNING: This will delete all resources"
print_warning "=========================================="
echo ""
print_warning "This script will delete:"
echo "  - All pods, deployments, and services"
echo "  - All ConfigMaps and Secrets"
echo "  - All PersistentVolumeClaims (DATA WILL BE LOST)"
echo "  - The devops-tracker namespace"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Cleanup cancelled"
    exit 0
fi

print_info "Starting cleanup..."

# Check if namespace exists
if ! kubectl get namespace devops-tracker >/dev/null 2>&1; then
    print_warning "Namespace 'devops-tracker' does not exist. Nothing to clean up."
    exit 0
fi

# Delete resources in order
print_info "Deleting Frontend resources..."
kubectl delete -f frontend-service.yaml --ignore-not-found=true
kubectl delete -f frontend-deployment.yaml --ignore-not-found=true
print_success "Frontend resources deleted"

print_info "Deleting Backend resources..."
kubectl delete -f backend-service.yaml --ignore-not-found=true
kubectl delete -f backend-deployment.yaml --ignore-not-found=true
print_success "Backend resources deleted"

print_info "Deleting PostgreSQL resources..."
kubectl delete -f postgres-service.yaml --ignore-not-found=true
kubectl delete -f postgres-statefulset.yaml --ignore-not-found=true
print_success "PostgreSQL resources deleted"

print_info "Deleting PersistentVolumeClaims..."
kubectl delete -f persistent-volumes.yaml --ignore-not-found=true
print_success "PVCs deleted"

print_info "Deleting ConfigMaps..."
kubectl delete -f configmaps.yaml --ignore-not-found=true
print_success "ConfigMaps deleted"

print_info "Deleting Secrets..."
kubectl delete -f secrets.yaml --ignore-not-found=true
print_success "Secrets deleted"

print_info "Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true
print_success "Namespace deleted"

# Wait for namespace to be fully deleted
print_info "Waiting for namespace to be fully deleted..."
kubectl wait --for=delete namespace/devops-tracker --timeout=120s 2>/dev/null || true

echo ""
print_success "=========================================="
print_success "Cleanup completed successfully!"
print_success "=========================================="
echo ""

print_info "Checking for any remaining resources..."
if kubectl get namespace devops-tracker >/dev/null 2>&1; then
    print_warning "Namespace still exists (may take a few more seconds to fully delete)"
    kubectl get all -n devops-tracker 2>/dev/null || true
else
    print_success "All resources have been removed"
fi

echo ""
print_info "To redeploy the application, run:"
echo "  ./deploy.sh"
echo ""
