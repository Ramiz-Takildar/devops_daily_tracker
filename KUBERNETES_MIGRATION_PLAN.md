# 🚀 Kubernetes Migration Plan - DevOps Daily Tracker

## 📋 Overview

This document outlines the complete migration strategy for converting the DevOps Daily Tracker from Docker Compose to Kubernetes, optimized for local development environments (Minikube/Kind).

---

## 🎯 Migration Goals

- ✅ Maintain all existing functionality
- ✅ Ensure data persistence across pod restarts
- ✅ Implement proper service discovery
- ✅ Add health checks and resource management
- ✅ Enable easy local development workflow
- ✅ Follow Kubernetes best practices

---

## 🏗️ Architecture Comparison

### Current Docker Compose Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                    │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │ │
│  │  (Port 3000) │    │  (Port 5000) │    │  (Port 5432) │ │
│  │   Nginx      │    │   Node.js    │    │   Database   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
│  Volume: postgres_data                                       │
│  Volume: ./backend/exports                                   │
└─────────────────────────────────────────────────────────────┘
```

### Target Kubernetes Architecture
```
┌─────────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (Namespace: devops-tracker) │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    LoadBalancer Service               │  │
│  │                    (frontend-service)                 │  │
│  │                      Port: 3000                       │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              Frontend Deployment (2 replicas)         │  │
│  │                    Nginx + React                      │  │
│  │              Resource Limits + Probes                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │                ClusterIP Service                      │  │
│  │                (backend-service)                      │  │
│  │                   Port: 5000                          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              Backend Deployment (2 replicas)          │  │
│  │                    Node.js + Express                  │  │
│  │              Resource Limits + Probes                 │  │
│  │              ConfigMap + Secret mounted               │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │                ClusterIP Service                      │  │
│  │                (postgres-service)                     │  │
│  │                   Port: 5432                          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │            PostgreSQL StatefulSet (1 replica)         │  │
│  │                  Database Server                      │  │
│  │              Resource Limits + Probes                 │  │
│  │              PVC: postgres-data (10Gi)                │  │
│  │              ConfigMap: init scripts                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PersistentVolumeClaim                     │  │
│  │              - postgres-data-pvc (10Gi)                │  │
│  │              - backend-exports-pvc (5Gi)               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ConfigMaps & Secrets                      │  │
│  │              - postgres-init-configmap                 │  │
│  │              - app-secrets (DB creds, JWT)             │  │
│  │              - app-config (non-sensitive config)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Required Kubernetes Resources

### 1. Namespace
**File**: `k8s/namespace.yaml`
- Creates isolated namespace: `devops-tracker`
- Enables resource organization and access control

### 2. Secrets
**File**: `k8s/secrets.yaml`
- Database credentials (username, password)
- JWT secret key
- Base64 encoded for security
- **Note**: Use external secrets manager in production

### 3. ConfigMaps
**File**: `k8s/configmaps.yaml`
- **app-config**: Non-sensitive application configuration
- **postgres-init-scripts**: Database initialization SQL scripts
- Environment-specific settings

### 4. PersistentVolumeClaims
**File**: `k8s/persistent-volumes.yaml`
- **postgres-data-pvc**: 10Gi for PostgreSQL data
- **backend-exports-pvc**: 5Gi for backend export files
- StorageClass: `standard` (default for Minikube/Kind)
- Access Mode: ReadWriteOnce

### 5. PostgreSQL StatefulSet
**File**: `k8s/postgres-statefulset.yaml`
- 1 replica (single instance for development)
- Image: `postgres:15-alpine`
- Persistent storage mounted at `/var/lib/postgresql/data`
- Init scripts mounted from ConfigMap
- Health checks: readiness and liveness probes
- Resource limits: 512Mi memory, 500m CPU

### 6. PostgreSQL Service
**File**: `k8s/postgres-service.yaml`
- Type: ClusterIP (internal only)
- Port: 5432
- Selector: `app=postgres`

### 7. Backend Deployment
**File**: `k8s/backend-deployment.yaml`
- 2 replicas for high availability
- Image: Built from `./backend/Dockerfile`
- Environment variables from ConfigMap and Secret
- Persistent volume for exports directory
- Health checks: `/health` endpoint
- Resource limits: 512Mi memory, 500m CPU
- Rolling update strategy

### 8. Backend Service
**File**: `k8s/backend-service.yaml`
- Type: ClusterIP (internal only)
- Port: 5000
- Selector: `app=backend`

### 9. Frontend Deployment
**File**: `k8s/frontend-deployment.yaml`
- 2 replicas for high availability
- Image: Built from `./frontend/Dockerfile`
- Environment variable: `VITE_API_URL` pointing to backend service
- Health checks: HTTP GET on port 80
- Resource limits: 256Mi memory, 250m CPU
- Rolling update strategy

### 10. Frontend Service
**File**: `k8s/frontend-service.yaml`
- Type: LoadBalancer (for local access)
- Port: 3000 → 80
- Selector: `app=frontend`
- **Alternative**: NodePort for Minikube/Kind

---

## 🔧 Configuration Details

### Environment Variables Mapping

#### Backend Environment Variables
```yaml
# From ConfigMap (app-config)
- NODE_ENV: production
- PORT: "5000"
- DB_HOST: postgres-service
- DB_PORT: "5432"
- DB_NAME: devops_tracker
- JWT_EXPIRES_IN: 7d
- FRONTEND_URL: http://localhost:3000

# From Secret (app-secrets)
- DB_USER: <base64-encoded>
- DB_PASSWORD: <base64-encoded>
- JWT_SECRET: <base64-encoded>
```

#### Frontend Environment Variables
```yaml
- VITE_API_URL: http://localhost:3000/api
```

### Resource Limits & Requests

#### PostgreSQL
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

#### Backend
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

#### Frontend
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "250m"
```

### Health Checks

#### PostgreSQL
```yaml
livenessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - devops_user
      - -d
      - devops_tracker
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - devops_user
      - -d
      - devops_tracker
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

#### Backend
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

#### Frontend
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## 🚀 Migration Steps

### Phase 1: Preparation (Before Migration)

1. **Backup Current Data**
   ```bash
   # Export database
   docker exec devops-tracker-db pg_dump -U devops_user devops_tracker > backup.sql
   
   # Backup exports directory
   docker cp devops-tracker-backend:/app/exports ./exports-backup
   ```

2. **Build Docker Images**
   ```bash
   # Build backend image
   cd backend
   docker build -t devops-tracker-backend:1.0.0 .
   
   # Build frontend image
   cd ../frontend
   docker build -t devops-tracker-frontend:1.0.0 .
   ```

3. **Load Images to Kubernetes**
   ```bash
   # For Minikube
   minikube image load devops-tracker-backend:1.0.0
   minikube image load devops-tracker-frontend:1.0.0
   
   # For Kind
   kind load docker-image devops-tracker-backend:1.0.0
   kind load docker-image devops-tracker-frontend:1.0.0
   ```

### Phase 2: Deploy Infrastructure

1. **Create Namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Create Secrets**
   ```bash
   # Generate base64 encoded secrets
   echo -n "devops_user" | base64
   echo -n "devops_pass" | base64
   echo -n "your_super_secret_jwt_key_change_this_in_production_12345" | base64
   
   # Apply secrets
   kubectl apply -f k8s/secrets.yaml
   ```

3. **Create ConfigMaps**
   ```bash
   kubectl apply -f k8s/configmaps.yaml
   ```

4. **Create PersistentVolumeClaims**
   ```bash
   kubectl apply -f k8s/persistent-volumes.yaml
   
   # Verify PVCs are bound
   kubectl get pvc -n devops-tracker
   ```

### Phase 3: Deploy Database

1. **Deploy PostgreSQL StatefulSet**
   ```bash
   kubectl apply -f k8s/postgres-statefulset.yaml
   
   # Wait for PostgreSQL to be ready
   kubectl wait --for=condition=ready pod -l app=postgres -n devops-tracker --timeout=300s
   ```

2. **Deploy PostgreSQL Service**
   ```bash
   kubectl apply -f k8s/postgres-service.yaml
   ```

3. **Verify Database**
   ```bash
   # Check pod status
   kubectl get pods -n devops-tracker -l app=postgres
   
   # Check logs
   kubectl logs -n devops-tracker -l app=postgres
   
   # Test connection
   kubectl exec -it -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker -c "\dt"
   ```

4. **Restore Data (Optional)**
   ```bash
   # Copy backup to pod
   kubectl cp backup.sql devops-tracker/postgres-0:/tmp/backup.sql
   
   # Restore database
   kubectl exec -it -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker -f /tmp/backup.sql
   ```

### Phase 4: Deploy Backend

1. **Deploy Backend**
   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   
   # Wait for backend to be ready
   kubectl wait --for=condition=ready pod -l app=backend -n devops-tracker --timeout=300s
   ```

2. **Deploy Backend Service**
   ```bash
   kubectl apply -f k8s/backend-service.yaml
   ```

3. **Verify Backend**
   ```bash
   # Check pod status
   kubectl get pods -n devops-tracker -l app=backend
   
   # Check logs
   kubectl logs -n devops-tracker -l app=backend
   
   # Test health endpoint
   kubectl port-forward -n devops-tracker svc/backend-service 5000:5000
   curl http://localhost:5000/health
   ```

### Phase 5: Deploy Frontend

1. **Deploy Frontend**
   ```bash
   kubectl apply -f k8s/frontend-deployment.yaml
   
   # Wait for frontend to be ready
   kubectl wait --for=condition=ready pod -l app=frontend -n devops-tracker --timeout=300s
   ```

2. **Deploy Frontend Service**
   ```bash
   kubectl apply -f k8s/frontend-service.yaml
   ```

3. **Verify Frontend**
   ```bash
   # Check pod status
   kubectl get pods -n devops-tracker -l app=frontend
   
   # Check logs
   kubectl logs -n devops-tracker -l app=frontend
   ```

### Phase 6: Access Application

#### For Minikube
```bash
# Get Minikube IP
minikube ip

# Get service URL
minikube service frontend-service -n devops-tracker --url

# Or use port-forward
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

#### For Kind
```bash
# Port forward to access
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000

# Access at http://localhost:3000
```

#### For Docker Desktop Kubernetes
```bash
# LoadBalancer will be available at localhost
# Access at http://localhost:3000
```

---

## 🔍 Verification Checklist

- [ ] All pods are running: `kubectl get pods -n devops-tracker`
- [ ] All services are created: `kubectl get svc -n devops-tracker`
- [ ] PVCs are bound: `kubectl get pvc -n devops-tracker`
- [ ] Database is accessible and initialized
- [ ] Backend health check passes: `curl http://localhost:5000/health`
- [ ] Frontend is accessible: `http://localhost:3000`
- [ ] User can register and login
- [ ] Data persists after pod restart
- [ ] All features work as expected

---

## 📊 Monitoring & Debugging

### View All Resources
```bash
kubectl get all -n devops-tracker
```

### Check Pod Logs
```bash
# Backend logs
kubectl logs -n devops-tracker -l app=backend -f

# Frontend logs
kubectl logs -n devops-tracker -l app=frontend -f

# PostgreSQL logs
kubectl logs -n devops-tracker -l app=postgres -f
```

### Describe Resources
```bash
# Describe pod
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
kubectl get events -n devops-tracker --sort-by='.lastTimestamp'
```

---

## 🔄 Update & Rollback

### Update Application
```bash
# Update backend image
kubectl set image deployment/backend -n devops-tracker backend=devops-tracker-backend:1.1.0

# Update frontend image
kubectl set image deployment/frontend -n devops-tracker frontend=devops-tracker-frontend:1.1.0

# Check rollout status
kubectl rollout status deployment/backend -n devops-tracker
kubectl rollout status deployment/frontend -n devops-tracker
```

### Rollback Deployment
```bash
# Rollback backend
kubectl rollout undo deployment/backend -n devops-tracker

# Rollback frontend
kubectl rollout undo deployment/frontend -n devops-tracker

# Rollback to specific revision
kubectl rollout undo deployment/backend -n devops-tracker --to-revision=2
```

### View Rollout History
```bash
kubectl rollout history deployment/backend -n devops-tracker
kubectl rollout history deployment/frontend -n devops-tracker
```

---

## 🧹 Cleanup

### Delete All Resources
```bash
# Delete all resources in namespace
kubectl delete namespace devops-tracker

# Or delete individually
kubectl delete -f k8s/frontend-service.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/backend-service.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/postgres-service.yaml
kubectl delete -f k8s/postgres-statefulset.yaml
kubectl delete -f k8s/persistent-volumes.yaml
kubectl delete -f k8s/configmaps.yaml
kubectl delete -f k8s/secrets.yaml
kubectl delete -f k8s/namespace.yaml
```

### Delete PersistentVolumes (if needed)
```bash
# List PVs
kubectl get pv

# Delete specific PV
kubectl delete pv <pv-name>
```

---

## 🚨 Troubleshooting

### Pod Not Starting

**Symptoms**: Pod stuck in `Pending`, `CrashLoopBackOff`, or `ImagePullBackOff`

**Solutions**:
```bash
# Check pod events
kubectl describe pod -n devops-tracker <pod-name>

# Check logs
kubectl logs -n devops-tracker <pod-name>

# Common issues:
# 1. Image not found - Load image to cluster
# 2. PVC not bound - Check storage class
# 3. Resource limits - Adjust limits or add more nodes
# 4. Config/Secret missing - Verify they exist
```

### Database Connection Failed

**Symptoms**: Backend logs show "Connection refused" or "ECONNREFUSED"

**Solutions**:
```bash
# Verify PostgreSQL is running
kubectl get pods -n devops-tracker -l app=postgres

# Check PostgreSQL logs
kubectl logs -n devops-tracker postgres-0

# Test connection from backend pod
kubectl exec -it -n devops-tracker <backend-pod> -- nc -zv postgres-service 5432

# Verify service DNS
kubectl exec -it -n devops-tracker <backend-pod> -- nslookup postgres-service
```

### PVC Not Binding

**Symptoms**: PVC stuck in `Pending` state

**Solutions**:
```bash
# Check PVC status
kubectl describe pvc -n devops-tracker <pvc-name>

# Check available storage classes
kubectl get storageclass

# For Minikube, ensure storage provisioner is enabled
minikube addons enable storage-provisioner

# For Kind, PVs are automatically provisioned
```

### Service Not Accessible

**Symptoms**: Cannot access frontend or backend

**Solutions**:
```bash
# Check service endpoints
kubectl get endpoints -n devops-tracker

# Verify service selector matches pod labels
kubectl get pods -n devops-tracker --show-labels

# Test service from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -n devops-tracker -- wget -O- http://backend-service:5000/health

# For LoadBalancer on Minikube
minikube tunnel
```

### Data Not Persisting

**Symptoms**: Data lost after pod restart

**Solutions**:
```bash
# Verify PVC is mounted
kubectl describe pod -n devops-tracker postgres-0 | grep -A 5 Mounts

# Check PV status
kubectl get pv

# Verify data directory
kubectl exec -it -n devops-tracker postgres-0 -- ls -la /var/lib/postgresql/data
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
# Create HPA for backend (requires metrics-server)
kubectl autoscale deployment backend -n devops-tracker --cpu-percent=70 --min=2 --max=5

# Create HPA for frontend
kubectl autoscale deployment frontend -n devops-tracker --cpu-percent=70 --min=2 --max=5

# Check HPA status
kubectl get hpa -n devops-tracker
```

---

## 🔐 Security Best Practices

### 1. Use External Secrets Manager
- For production, use AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault
- Integrate with External Secrets Operator

### 2. Network Policies
- Implement network policies to restrict pod-to-pod communication
- Only allow necessary traffic

### 3. RBAC
- Create service accounts with minimal permissions
- Use RBAC for access control

### 4. Pod Security Standards
- Enforce pod security standards (restricted, baseline)
- Run containers as non-root user

### 5. Image Security
- Use official base images
- Scan images for vulnerabilities
- Use image pull secrets for private registries

---

## 🎯 Next Steps

### Immediate (Development)
1. ✅ Create all Kubernetes manifest files
2. ✅ Test deployment on local Kubernetes
3. ✅ Verify all features work correctly
4. ✅ Document any issues and solutions

### Short-term (Production Preparation)
1. 🔄 Set up Helm charts for easier deployment
2. 🔄 Implement proper secrets management
3. 🔄 Add monitoring (Prometheus + Grafana)
4. 🔄 Set up logging (ELK or Loki)
5. 🔄 Configure Ingress with TLS
6. 🔄 Implement backup strategy

### Long-term (Production)
1. 🔄 Set up CI/CD pipeline
2. 🔄 Implement GitOps (ArgoCD/Flux)
3. 🔄 Add service mesh (Istio/Linkerd)
4. 🔄 Implement disaster recovery
5. 🔄 Set up multi-environment deployments
6. 🔄 Performance testing and optimization

---

## 📚 Additional Resources

### Kubernetes Documentation
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [ConfigMaps and Secrets](https://kubernetes.io/docs/concepts/configuration/)

### Local Kubernetes
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

### Best Practices
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [12-Factor App](https://12factor.net/)
- [Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)

---

## 📝 Notes

- This plan is optimized for **local development** using Minikube or Kind
- For **production deployment**, additional considerations are needed:
  - High availability (multiple replicas, pod disruption budgets)
  - Ingress controller with TLS
  - External secrets management
  - Monitoring and alerting
  - Backup and disaster recovery
  - Network policies and security hardening
  
- **Database Considerations**:
  - For production, consider using managed database services (RDS, Cloud SQL, Azure Database)
  - Or use PostgreSQL operators (Zalando, Crunchy Data)
  - Implement proper backup strategies

- **Storage Considerations**:
  - Local development uses `hostPath` or default storage class
  - Production should use cloud provider storage (EBS, Persistent Disk, Azure Disk)
  - Consider using StatefulSets for stateful applications

---

## ✅ Success Criteria

Migration is successful when:
- ✅ All pods are running and healthy
- ✅ Application is accessible via browser
- ✅ Users can register, login, and use all features
- ✅ Data persists across pod restarts
- ✅ Database maintains data integrity
- ✅ Health checks pass for all services
- ✅ Resource limits are respected
- ✅ Logs are accessible and meaningful

---

**Last Updated**: 2026-05-02  
**Version**: 1.0.0  
**Status**: Ready for Implementation

---

🎉 **Ready to migrate to Kubernetes!** Follow the steps in order and verify each phase before proceeding to the next.
