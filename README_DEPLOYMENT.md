# DevOps Daily Tracker - One-Command Deployment

## 🚀 Quick Start (Single Command)

Deploy the entire application with one command:

```bash
./deploy-all.sh
```

That's it! The script will:
1. ✅ Check prerequisites (kubectl, docker, kubernetes cluster)
2. ✅ Build Docker images (frontend & backend)
3. ✅ Load images into cluster (Minikube/Kind)
4. ✅ Deploy all Kubernetes resources
5. ✅ Create demo user account
6. ✅ Start port-forward automatically

## 📋 Prerequisites

Before running the script, ensure you have:

- **Kubernetes cluster** running (one of):
  - Docker Desktop with Kubernetes enabled
  - Minikube (`minikube start`)
  - Kind (`kind create cluster`)
  - K3s
  
- **kubectl** installed and configured
- **Docker** installed and running

## 🎯 What Gets Deployed

### Application Components
- **Frontend**: React + Vite + Nginx (2 replicas)
- **Backend**: Node.js + Express (2 replicas)
- **Database**: PostgreSQL 15 (StatefulSet with persistent storage)

### Kubernetes Resources
- 1 Namespace (devops-tracker)
- 3 Services (frontend, backend, postgres)
- 2 Deployments (frontend, backend)
- 1 StatefulSet (postgres)
- 2 ConfigMaps (app config, database init)
- 1 Secret (credentials)
- 2 PersistentVolumeClaims (postgres data, backend exports)

## 🌐 Access Application

After deployment completes:

**URL**: http://localhost:3000

**Demo Account**:
- Email: demo@devopstracker.com
- Password: Demo123!

## 📊 Verify Deployment

```bash
# Check all resources
kubectl get all -n devops-tracker

# Expected output: All pods Running, all deployments Available
```

## 🔧 Troubleshooting

### Script Fails at Prerequisites
```bash
# Check kubectl
kubectl version --client

# Check docker
docker --version

# Check cluster
kubectl cluster-info
```

### Images Build Failed
```bash
# Check build logs
cat /tmp/frontend-build.log
cat /tmp/backend-build.log

# Rebuild manually
cd frontend && docker build -t devops-tracker-frontend:1.0.0 .
cd ../backend && docker build -t devops-tracker-backend:1.0.0 .
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n devops-tracker

# Check pod logs
kubectl logs -n devops-tracker <pod-name>

# Check pod events
kubectl describe pod -n devops-tracker <pod-name>
```

### Cannot Access Application
```bash
# Check if port-forward is running
ps aux | grep "kubectl port-forward"

# Restart port-forward
pkill -f "kubectl port-forward.*frontend-service"
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

## 🧹 Cleanup

Remove all deployed resources:

```bash
cd k8s
./cleanup.sh
```

Or manually:
```bash
kubectl delete namespace devops-tracker
```

## 📚 Additional Documentation

- **Detailed Deployment Guide**: `k8s/DEPLOYMENT_GUIDE_OTHER_SYSTEMS.md`
- **Kubernetes Migration Plan**: `KUBERNETES_MIGRATION_PLAN.md`
- **Docker Fix Notes**: `DOCKER_FIX_NOTES.md`
- **Storage Class Notes**: `k8s/STORAGE_CLASS_NOTES.md`

## 🎯 Platform-Specific Notes

### Docker Desktop
- Works out of the box
- LoadBalancer service type supported
- No additional steps needed

### Minikube
- Images loaded automatically by script
- Use `minikube service frontend-service -n devops-tracker` as alternative access method
- Or use port-forward (already started by script)

### Kind
- Images loaded automatically by script
- Port-forward is the recommended access method (already started by script)
- LoadBalancer requires MetalLB (optional)

### K3s
- Works out of the box
- Images available directly
- Port-forward recommended for access

## 🔄 Redeployment

To redeploy after making changes:

```bash
# Clean up existing deployment
cd k8s && ./cleanup.sh

# Run deployment script again
cd .. && ./deploy-all.sh
```

## ⚡ Manual Deployment

If you prefer manual control, see `k8s/DEPLOYMENT_GUIDE_OTHER_SYSTEMS.md` for step-by-step instructions.

## 📊 Resource Requirements

- **CPU**: 2 cores minimum (4 recommended)
- **Memory**: 4GB minimum (8GB recommended)
- **Storage**: 15GB (10GB PostgreSQL + 5GB exports)

## ✅ Success Indicators

After running `./deploy-all.sh`, you should see:

```
✓ All prerequisites met!
✓ Frontend image built successfully
✓ Backend image built successfully
✓ Images loaded into cluster
✓ PostgreSQL is ready
✓ Backend is ready
✓ Frontend is ready
✓ Demo user created successfully

🎉 Your DevOps Daily Tracker is ready to use!
```

---

**Last Updated**: 2026-05-02  
**Version**: 1.0.0  
**Tested On**: Docker Desktop (macOS), Minikube, Kind
