# DevOps Daily Tracker - Deployment Guide for Other Systems

This guide helps you deploy the DevOps Daily Tracker application on **any local Kubernetes setup** (different from the original development machine).

## 📋 Prerequisites

### Required Software
- **Kubernetes cluster** (one of):
  - Docker Desktop with Kubernetes enabled
  - Minikube
  - Kind (Kubernetes in Docker)
  - K3s
- **kubectl** CLI tool (v1.20+)
- **Docker** (for building images)
- **Git** (to clone the repository)

### System Requirements
- **CPU**: 4 cores minimum
- **Memory**: 8GB RAM minimum
- **Storage**: 20GB free disk space
- **OS**: macOS, Windows (with WSL2), or Linux

## 🚀 Quick Start (3 Steps)

### Step 1: Get the Code
```bash
# Clone or copy the project
git clone <your-repo-url>
cd devops_daily_tracker

# Or if copying manually, ensure you have:
# - k8s/ directory (all manifests)
# - frontend/ directory (with Dockerfile, nginx.conf, .dockerignore, src/)
# - backend/ directory (with Dockerfile, all source files)
```

### Step 2: Build Docker Images
```bash
# Build frontend image
cd frontend
docker build -t devops-tracker-frontend:1.0.0 .

# Build backend image
cd ../backend
docker build -t devops-tracker-backend:1.0.0 .

# Verify images
docker images | grep devops-tracker
```

### Step 3: Deploy to Kubernetes
```bash
cd ../k8s
chmod +x deploy.sh
./deploy.sh
```

## 🎯 Platform-Specific Instructions

### Docker Desktop (Mac/Windows/Linux)

**Setup:**
```bash
# Enable Kubernetes in Docker Desktop
# Settings → Kubernetes → Enable Kubernetes → Apply & Restart

# Verify
kubectl cluster-info
kubectl get nodes
```

**Deploy:**
```bash
# Build images (Step 2 above)
# Deploy (Step 3 above)

# Access application
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000

# Open browser: http://localhost:3000
```

**Cleanup:**
```bash
cd k8s
./cleanup.sh
```

---

### Minikube (Mac/Windows/Linux)

**Setup:**
```bash
# Start Minikube
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Verify
kubectl get nodes
```

**Deploy:**
```bash
# Build images
cd frontend
docker build -t devops-tracker-frontend:1.0.0 .
cd ../backend
docker build -t devops-tracker-backend:1.0.0 .

# Load images into Minikube
minikube image load devops-tracker-frontend:1.0.0
minikube image load devops-tracker-backend:1.0.0

# Deploy
cd ../k8s
./deploy.sh

# Access application (Option 1: Port forward)
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000

# Access application (Option 2: Minikube service)
minikube service frontend-service -n devops-tracker
```

**Cleanup:**
```bash
cd k8s
./cleanup.sh
minikube stop
```

---

### Kind (Kubernetes in Docker)

**Setup:**
```bash
# Create cluster
kind create cluster --name devops-tracker

# Verify
kubectl cluster-info --context kind-devops-tracker
```

**Deploy:**
```bash
# Build images
cd frontend
docker build -t devops-tracker-frontend:1.0.0 .
cd ../backend
docker build -t devops-tracker-backend:1.0.0 .

# Load images into Kind
kind load docker-image devops-tracker-frontend:1.0.0 --name devops-tracker
kind load docker-image devops-tracker-backend:1.0.0 --name devops-tracker

# Deploy
cd ../k8s
./deploy.sh

# Access application
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000

# Open browser: http://localhost:3000
```

**Cleanup:**
```bash
cd k8s
./cleanup.sh
kind delete cluster --name devops-tracker
```

---

### K3s (Linux Only)

**Setup:**
```bash
# Install K3s
curl -sfL https://get.k3s.io | sh -

# Verify
sudo k3s kubectl get nodes

# Setup kubectl access
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER ~/.kube/config
```

**Deploy:**
```bash
# Build images (Step 2 above)
# Deploy (Step 3 above)

# Access application
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

**Cleanup:**
```bash
cd k8s
./cleanup.sh
```

---

## 🔧 Manual Deployment (If deploy.sh Fails)

### Step-by-Step Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/secrets.yaml

# 3. Create configmaps
kubectl apply -f k8s/configmaps.yaml

# 4. Create PVCs
kubectl apply -f k8s/persistent-volumes.yaml

# 5. Deploy PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod/postgres-0 -n devops-tracker --timeout=300s

# 6. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Wait for backend to be ready
kubectl wait --for=condition=available deployment/backend -n devops-tracker --timeout=300s

# 7. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=available deployment/frontend -n devops-tracker --timeout=300s

# 8. Verify deployment
kubectl get all -n devops-tracker

# 9. Access application
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

---

## 🐛 Troubleshooting

### Images Not Found

**Problem:** Pods show `ImagePullBackOff` or `ErrImagePull`

**Solution:**
```bash
# For Minikube
minikube image load devops-tracker-frontend:1.0.0
minikube image load devops-tracker-backend:1.0.0

# For Kind
kind load docker-image devops-tracker-frontend:1.0.0 --name <cluster-name>
kind load docker-image devops-tracker-backend:1.0.0 --name <cluster-name>

# Verify images are loaded
# Minikube:
minikube image ls | grep devops-tracker

# Kind:
docker exec -it <kind-node-name> crictl images | grep devops-tracker
```

### PVCs Stuck in Pending

**Problem:** PersistentVolumeClaims remain in `Pending` state

**Solution:**
This is **normal** with `WaitForFirstConsumer` storage class. PVCs bind when pods start using them.

```bash
# Check PVC status
kubectl get pvc -n devops-tracker

# Check storage class
kubectl get storageclass

# If PVCs don't bind after pods start, check events
kubectl describe pvc -n devops-tracker
```

### Pods CrashLoopBackOff

**Problem:** Pods keep restarting

**Solution:**
```bash
# Check pod logs
kubectl logs -n devops-tracker <pod-name>

# Check pod events
kubectl describe pod -n devops-tracker <pod-name>

# Common issues:
# 1. Database not ready - wait longer
# 2. Environment variables missing - check secrets/configmaps
# 3. Image issues - rebuild and reload images
```

### Cannot Access Application

**Problem:** Port-forward works but can't access http://localhost:3000

**Solution:**
```bash
# Check if port-forward is running
ps aux | grep "kubectl port-forward"

# Kill existing port-forwards
pkill -f "kubectl port-forward"

# Start fresh port-forward
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000

# Test with curl
curl http://localhost:3000

# Check frontend logs
kubectl logs -n devops-tracker -l app=frontend
```

### Database Connection Issues

**Problem:** Backend can't connect to database

**Solution:**
```bash
# Check PostgreSQL is running
kubectl get pods -n devops-tracker | grep postgres

# Check PostgreSQL logs
kubectl logs -n devops-tracker postgres-0

# Test database connection
kubectl exec -it -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker -c "SELECT 1;"

# Check backend logs for connection errors
kubectl logs -n devops-tracker -l app=backend
```

---

## 📊 Verify Deployment

### Check All Resources
```bash
kubectl get all -n devops-tracker
```

**Expected output:**
```
NAME                           READY   STATUS    RESTARTS   AGE
pod/backend-xxx-xxx            1/1     Running   0          5m
pod/backend-xxx-xxx            1/1     Running   0          5m
pod/frontend-xxx-xxx           1/1     Running   0          5m
pod/frontend-xxx-xxx           1/1     Running   0          5m
pod/postgres-0                 1/1     Running   0          5m

NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
service/backend-service    ClusterIP   10.x.x.x        <none>        5000/TCP
service/frontend-service   ClusterIP   10.x.x.x        <none>        3000/TCP
service/postgres-service   ClusterIP   10.x.x.x        <none>        5432/TCP

NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/backend    2/2     2            2           5m
deployment.apps/frontend   2/2     2            2           5m

NAME                        READY   AGE
statefulset.apps/postgres   1/1     5m
```

### Test Application
```bash
# Start port-forward
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000 &

# Test frontend
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Test backend API
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Test database
kubectl exec -it -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker -c "SELECT COUNT(*) FROM users;"
```

### Create Test User
```bash
# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User"
  }'

# Login with test user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

---

## 🔐 Default Credentials

After deployment, you can create a demo account:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "email": "demo@devopstracker.com",
    "password": "Demo123!",
    "full_name": "Demo User"
  }'
```

**Login:**
- Email: demo@devopstracker.com
- Password: Demo123!

---

## 🧹 Cleanup

### Remove Application
```bash
cd k8s
./cleanup.sh
```

### Manual Cleanup
```bash
# Delete all resources
kubectl delete namespace devops-tracker

# Verify deletion
kubectl get all -n devops-tracker
# Expected: No resources found
```

### Stop Kubernetes Cluster

**Docker Desktop:**
- Settings → Kubernetes → Disable Kubernetes

**Minikube:**
```bash
minikube stop
minikube delete
```

**Kind:**
```bash
kind delete cluster --name devops-tracker
```

**K3s:**
```bash
sudo /usr/local/bin/k3s-uninstall.sh
```

---

## 📦 Files Required for Deployment

Ensure you have these files before deploying:

```
devops_daily_tracker/
├── k8s/
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmaps.yaml
│   ├── persistent-volumes.yaml
│   ├── postgres-statefulset.yaml
│   ├── postgres-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── deploy.sh
│   └── cleanup.sh
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.js
│   └── src/ (all source files)
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── config/
    ├── controllers/
    ├── database/
    ├── middleware/
    ├── models/
    ├── routes/
    └── services/
```

---

## 🎯 Success Checklist

- [ ] Kubernetes cluster running
- [ ] Docker images built successfully
- [ ] Images loaded into cluster (Minikube/Kind)
- [ ] All pods in `Running` state
- [ ] PVCs bound (or pending with WaitForFirstConsumer)
- [ ] Port-forward working
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API responding
- [ ] Database initialized
- [ ] Test user created and can login

---

## 📚 Additional Resources

- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Docker Desktop**: https://docs.docker.com/desktop/
- **Minikube**: https://minikube.sigs.k8s.io/docs/
- **Kind**: https://kind.sigs.k8s.io/
- **K3s**: https://k3s.io/

---

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review pod logs: `kubectl logs -n devops-tracker <pod-name>`
3. Check pod events: `kubectl describe pod -n devops-tracker <pod-name>`
4. Verify all prerequisites are met
5. Ensure images are built and loaded correctly

---

**Last Updated**: 2026-05-02  
**Version**: 1.0.0  
**Tested On**: Docker Desktop (macOS), Minikube (macOS/Linux), Kind (macOS/Linux)
