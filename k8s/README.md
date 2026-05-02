# 🚀 Kubernetes Deployment Guide - DevOps Daily Tracker

Complete guide for deploying the DevOps Daily Tracker application to Kubernetes.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Manual Deployment](#-manual-deployment)
- [Accessing the Application](#-accessing-the-application)
- [Verification](#-verification)
- [Monitoring & Debugging](#-monitoring--debugging)
- [Scaling](#-scaling)
- [Updates & Rollbacks](#-updates--rollbacks)
- [Cleanup](#-cleanup)
- [Troubleshooting](#-troubleshooting)

---

## 📦 Prerequisites

### Required Tools

1. **kubectl** (v1.24+)
   ```bash
   # macOS
   brew install kubectl
   
   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl
   sudo mv kubectl /usr/local/bin/
   
   # Verify
   kubectl version --client
   ```

2. **Docker** (v20.10+)
   ```bash
   # Download from https://www.docker.com/products/docker-desktop
   
   # Verify
   docker --version
   ```

3. **Kubernetes Cluster** (choose one):
   - **Minikube** (recommended for local development)
     ```bash
     # macOS
     brew install minikube
     
     # Linux
     curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
     sudo install minikube-linux-amd64 /usr/local/bin/minikube
     
     # Start Minikube
     minikube start --cpus=4 --memory=8192
     
     # Enable addons
     minikube addons enable storage-provisioner
     minikube addons enable metrics-server
     ```
   
   - **Kind** (Kubernetes in Docker)
     ```bash
     # macOS/Linux
     brew install kind
     # or
     curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
     chmod +x ./kind
     sudo mv ./kind /usr/local/bin/kind
     
     # Create cluster
     kind create cluster --name devops-tracker
     ```
   
   - **Docker Desktop Kubernetes**
     - Enable Kubernetes in Docker Desktop settings
     - Wait for Kubernetes to start

### System Requirements

- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum
- **Disk**: 20GB free space
- **OS**: macOS, Linux, or Windows with WSL2

---

## 🚀 Quick Start

### Automated Deployment (Recommended)

```bash
# Navigate to k8s directory
cd k8s

# Run deployment script
./deploy.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Build Docker images
3. ✅ Load images to Kubernetes
4. ✅ Deploy all resources
5. ✅ Wait for pods to be ready
6. ✅ Display access information

**Estimated time**: 5-10 minutes

---

## 📝 Manual Deployment

If you prefer manual deployment or need more control:

### Step 1: Build Docker Images

```bash
# Navigate to project root
cd ..

# Build backend image
docker build -t devops-tracker-backend:1.0.0 ./backend

# Build frontend image
docker build -t devops-tracker-frontend:1.0.0 ./frontend
```

### Step 2: Load Images to Kubernetes

**For Minikube:**
```bash
minikube image load devops-tracker-backend:1.0.0
minikube image load devops-tracker-frontend:1.0.0
```

**For Kind:**
```bash
kind load docker-image devops-tracker-backend:1.0.0
kind load docker-image devops-tracker-frontend:1.0.0
```

**For Docker Desktop:**
```bash
# Images are automatically available
```

### Step 3: Deploy Resources

```bash
# Navigate to k8s directory
cd k8s

# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets (IMPORTANT: Update secrets.yaml with your own values first!)
kubectl apply -f secrets.yaml

# 3. Create configmaps
kubectl apply -f configmaps.yaml

# 4. Create persistent volume claims
kubectl apply -f persistent-volumes.yaml

# Wait for PVCs to be bound
kubectl wait --for=condition=Bound pvc/postgres-data-pvc -n devops-tracker --timeout=120s
kubectl wait --for=condition=Bound pvc/backend-exports-pvc -n devops-tracker --timeout=120s

# 5. Deploy PostgreSQL
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n devops-tracker --timeout=300s

# 6. Deploy Backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Wait for Backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n devops-tracker --timeout=300s

# 7. Deploy Frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Wait for Frontend to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n devops-tracker --timeout=300s
```

---

## 🌐 Accessing the Application

### Minikube

**Option 1: Service URL (Recommended)**
```bash
minikube service frontend-service -n devops-tracker
```
This will automatically open the application in your browser.

**Option 2: Port Forward**
```bash
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```
Then open: http://localhost:3000

**Option 3: Minikube Tunnel**
```bash
# In a separate terminal
minikube tunnel

# Get the external IP
kubectl get svc frontend-service -n devops-tracker
```

### Kind

**Port Forward (Only Option)**
```bash
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```
Then open: http://localhost:3000

### Docker Desktop

**Direct Access**
```bash
# Application is automatically available at
http://localhost:3000
```

**Or use Port Forward**
```bash
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

---

## ✅ Verification

### Check All Resources

```bash
# View all resources
kubectl get all -n devops-tracker

# Expected output:
# - 1 postgres pod (Running)
# - 2 backend pods (Running)
# - 2 frontend pods (Running)
# - 3 services
# - 2 deployments
# - 1 statefulset
```

### Check Pod Status

```bash
kubectl get pods -n devops-tracker

# All pods should show STATUS: Running
# READY should show 1/1 or 2/2
```

### Check Services

```bash
kubectl get svc -n devops-tracker

# Should show:
# - postgres-service (ClusterIP)
# - backend-service (ClusterIP)
# - frontend-service (LoadBalancer or NodePort)
```

### Check PVCs

```bash
kubectl get pvc -n devops-tracker

# Both PVCs should show STATUS: Bound
```

### Test Health Endpoints

```bash
# Test backend health
kubectl port-forward -n devops-tracker svc/backend-service 5000:5000 &
curl http://localhost:5000/health

# Expected: {"status":"ok"}
```

### Test Application

1. Open the application in your browser
2. Register a new account
3. Login with your credentials
4. Log a learning entry
5. Verify data persists after pod restart:
   ```bash
   kubectl delete pod -n devops-tracker -l app=backend
   # Wait for new pod to start, then check if data is still there
   ```

---

## 📊 Monitoring & Debugging

### View Logs

```bash
# Backend logs
kubectl logs -n devops-tracker -l app=backend -f

# Frontend logs
kubectl logs -n devops-tracker -l app=frontend -f

# PostgreSQL logs
kubectl logs -n devops-tracker -l app=postgres -f

# Logs from specific pod
kubectl logs -n devops-tracker <pod-name> -f

# Previous pod logs (if pod crashed)
kubectl logs -n devops-tracker <pod-name> --previous
```

### Describe Resources

```bash
# Describe pod (shows events and status)
kubectl describe pod -n devops-tracker <pod-name>

# Describe service
kubectl describe svc -n devops-tracker <service-name>

# Describe PVC
kubectl describe pvc -n devops-tracker <pvc-name>
```

### Execute Commands in Pods

```bash
# Access PostgreSQL
kubectl exec -it -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker

# Access backend shell
kubectl exec -it -n devops-tracker <backend-pod-name> -- sh

# Access frontend shell
kubectl exec -it -n devops-tracker <frontend-pod-name> -- sh
```

### Check Events

```bash
# View recent events
kubectl get events -n devops-tracker --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n devops-tracker --watch
```

### Resource Usage

```bash
# View resource usage (requires metrics-server)
kubectl top pods -n devops-tracker
kubectl top nodes
```

---

## 📈 Scaling

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment backend -n devops-tracker --replicas=3

# Scale frontend
kubectl scale deployment frontend -n devops-tracker --replicas=3

# Verify scaling
kubectl get pods -n devops-tracker
```

### Horizontal Pod Autoscaler (HPA)

```bash
# Enable metrics-server (if not already enabled)
# For Minikube:
minikube addons enable metrics-server

# Create HPA for backend
kubectl autoscale deployment backend -n devops-tracker \
  --cpu-percent=70 \
  --min=2 \
  --max=5

# Create HPA for frontend
kubectl autoscale deployment frontend -n devops-tracker \
  --cpu-percent=70 \
  --min=2 \
  --max=5

# Check HPA status
kubectl get hpa -n devops-tracker

# Describe HPA
kubectl describe hpa backend -n devops-tracker
```

---

## 🔄 Updates & Rollbacks

### Update Application

```bash
# Build new image version
docker build -t devops-tracker-backend:1.1.0 ./backend

# Load to cluster (Minikube/Kind)
minikube image load devops-tracker-backend:1.1.0
# or
kind load docker-image devops-tracker-backend:1.1.0

# Update deployment
kubectl set image deployment/backend -n devops-tracker \
  backend=devops-tracker-backend:1.1.0

# Check rollout status
kubectl rollout status deployment/backend -n devops-tracker
```

### Rollback Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n devops-tracker

# Rollback to specific revision
kubectl rollout history deployment/backend -n devops-tracker
kubectl rollout undo deployment/backend -n devops-tracker --to-revision=2

# Check rollout status
kubectl rollout status deployment/backend -n devops-tracker
```

### View Rollout History

```bash
kubectl rollout history deployment/backend -n devops-tracker
kubectl rollout history deployment/frontend -n devops-tracker
```

---

## 🧹 Cleanup

### Automated Cleanup (Recommended)

```bash
# Run cleanup script
./cleanup.sh
```

This will delete all resources including data (PVCs).

### Manual Cleanup

```bash
# Delete all resources
kubectl delete -f frontend-service.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f backend-service.yaml
kubectl delete -f backend-deployment.yaml
kubectl delete -f postgres-service.yaml
kubectl delete -f postgres-statefulset.yaml
kubectl delete -f persistent-volumes.yaml
kubectl delete -f configmaps.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml

# Or delete entire namespace (faster)
kubectl delete namespace devops-tracker
```

### Delete Cluster (if needed)

```bash
# Minikube
minikube delete

# Kind
kind delete cluster --name devops-tracker
```

---

## 🔧 Troubleshooting

### Pod Not Starting

**Symptoms**: Pod stuck in `Pending`, `CrashLoopBackOff`, or `ImagePullBackOff`

**Solutions**:

1. **Check pod events**:
   ```bash
   kubectl describe pod -n devops-tracker <pod-name>
   ```

2. **Check logs**:
   ```bash
   kubectl logs -n devops-tracker <pod-name>
   kubectl logs -n devops-tracker <pod-name> --previous
   ```

3. **Common issues**:
   - **ImagePullBackOff**: Image not loaded to cluster
     ```bash
     # For Minikube
     minikube image load devops-tracker-backend:1.0.0
     
     # For Kind
     kind load docker-image devops-tracker-backend:1.0.0
     ```
   
   - **Pending (PVC not bound)**: Check storage class
     ```bash
     kubectl get pvc -n devops-tracker
     kubectl describe pvc -n devops-tracker <pvc-name>
     
     # For Minikube, enable storage provisioner
     minikube addons enable storage-provisioner
     ```
   
   - **CrashLoopBackOff**: Check application logs
     ```bash
     kubectl logs -n devops-tracker <pod-name>
     ```

### Database Connection Failed

**Symptoms**: Backend logs show "Connection refused" or "ECONNREFUSED"

**Solutions**:

1. **Verify PostgreSQL is running**:
   ```bash
   kubectl get pods -n devops-tracker -l app=postgres
   ```

2. **Check PostgreSQL logs**:
   ```bash
   kubectl logs -n devops-tracker postgres-0
   ```

3. **Test connection from backend pod**:
   ```bash
   kubectl exec -it -n devops-tracker <backend-pod> -- nc -zv postgres-service 5432
   ```

4. **Verify service DNS**:
   ```bash
   kubectl exec -it -n devops-tracker <backend-pod> -- nslookup postgres-service
   ```

5. **Check environment variables**:
   ```bash
   kubectl exec -it -n devops-tracker <backend-pod> -- env | grep DB_
   ```

### Service Not Accessible

**Symptoms**: Cannot access frontend or backend

**Solutions**:

1. **Check service endpoints**:
   ```bash
   kubectl get endpoints -n devops-tracker
   ```

2. **Verify service selector matches pod labels**:
   ```bash
   kubectl get pods -n devops-tracker --show-labels
   kubectl describe svc -n devops-tracker frontend-service
   ```

3. **Test service from within cluster**:
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -n devops-tracker \
     -- wget -O- http://backend-service:5000/health
   ```

4. **For Minikube LoadBalancer**:
   ```bash
   # Run in separate terminal
   minikube tunnel
   ```

### Data Not Persisting

**Symptoms**: Data lost after pod restart

**Solutions**:

1. **Verify PVC is mounted**:
   ```bash
   kubectl describe pod -n devops-tracker postgres-0 | grep -A 5 Mounts
   ```

2. **Check PV status**:
   ```bash
   kubectl get pv
   kubectl describe pv <pv-name>
   ```

3. **Verify data directory**:
   ```bash
   kubectl exec -it -n devops-tracker postgres-0 -- ls -la /var/lib/postgresql/data
   ```

### Resource Limits Exceeded

**Symptoms**: Pods being evicted or OOMKilled

**Solutions**:

1. **Check resource usage**:
   ```bash
   kubectl top pods -n devops-tracker
   kubectl top nodes
   ```

2. **Increase resource limits** in deployment YAML:
   ```yaml
   resources:
     limits:
       memory: "1Gi"  # Increase from 512Mi
       cpu: "1000m"   # Increase from 500m
   ```

3. **Apply changes**:
   ```bash
   kubectl apply -f backend-deployment.yaml
   ```

### Secrets Not Working

**Symptoms**: Authentication errors, missing environment variables

**Solutions**:

1. **Verify secrets exist**:
   ```bash
   kubectl get secrets -n devops-tracker
   ```

2. **Check secret data**:
   ```bash
   kubectl describe secret app-secrets -n devops-tracker
   ```

3. **Decode secret values** (for debugging):
   ```bash
   kubectl get secret app-secrets -n devops-tracker -o jsonpath='{.data.DB_USER}' | base64 -d
   ```

4. **Recreate secrets**:
   ```bash
   kubectl delete secret app-secrets -n devops-tracker
   kubectl apply -f secrets.yaml
   kubectl rollout restart deployment/backend -n devops-tracker
   ```

---

## 📚 Additional Resources

### Kubernetes Documentation
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

### Local Kubernetes
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

### Best Practices
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)

---

## 📋 Resource Summary

### Created Resources

| Resource Type | Name | Purpose |
|--------------|------|---------|
| Namespace | devops-tracker | Isolated environment |
| Secret | app-secrets | Database credentials, JWT secret |
| ConfigMap | app-config | Application configuration |
| ConfigMap | postgres-init-scripts | Database initialization |
| PVC | postgres-data-pvc | PostgreSQL data storage (10Gi) |
| PVC | backend-exports-pvc | Backend exports storage (5Gi) |
| StatefulSet | postgres | PostgreSQL database (1 replica) |
| Service | postgres-service | Database access (ClusterIP) |
| Deployment | backend | Backend API (2 replicas) |
| Service | backend-service | API access (ClusterIP) |
| Deployment | frontend | Frontend web (2 replicas) |
| Service | frontend-service | Web access (LoadBalancer) |

### Resource Requirements

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| PostgreSQL | 250m | 500m | 256Mi | 512Mi |
| Backend | 250m | 500m | 256Mi | 512Mi |
| Frontend | 100m | 250m | 128Mi | 256Mi |
| **Total** | **600m** | **1250m** | **640Mi** | **1280Mi** |

---

## 🎯 Next Steps

### For Development
- ✅ Application is running on Kubernetes
- ✅ Data persists across pod restarts
- ✅ All features are working

### For Production
Consider implementing:
- [ ] Ingress controller with TLS
- [ ] External secrets management (Vault, AWS Secrets Manager)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Logging (ELK or Loki)
- [ ] Backup strategy for PostgreSQL
- [ ] CI/CD pipeline
- [ ] Network policies
- [ ] Pod security policies
- [ ] Resource quotas
- [ ] Horizontal Pod Autoscaler

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review Kubernetes logs
- Consult the main [README.md](../README.md)

---

**Last Updated**: 2026-05-02  
**Version**: 1.0.0  
**Kubernetes Version**: 1.24+

---

🎉 **Your DevOps Daily Tracker is now running on Kubernetes!**
