# DevOps Daily Tracker - Architecture Documentation

## 🏗️ System Architecture Overview

DevOps Daily Tracker is a full-stack web application deployed using GitOps principles with ArgoCD on Kubernetes. The system follows a microservices architecture with automated CI/CD pipelines.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                           │
│                  github.com/Ramiz-Takildar/devops_daily_tracker     │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ Git Push (develop/staging/main)
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI/CD                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Lint & Test     │  │  Build Docker    │  │  Push to         │  │
│  │  (Node.js)       │  │  Images          │  │  Docker Hub      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ Push Images (dev-latest, staging-latest, prod-latest)
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Docker Hub                                 │
│              ramiztakildar/devops-tracker-frontend                  │
│              ramiztakildar/devops-tracker-backend                   │
└────────────┬────────────────────────────────────────────────────────┘
             │
             │ Pull Images
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (Docker Desktop)               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      ArgoCD (Namespace: argocd)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │ Dev App    │  │ Staging    │  │ Production │            │   │
│  │  │ (Auto-Sync)│  │ App        │  │ App        │            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Development Environment                         │   │
│  │              (Namespace: devops-tracker-dev)                 │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  Frontend    │  │  Backend     │  │  PostgreSQL  │      │   │
│  │  │  (Nginx +    │  │  (Node.js +  │  │  (StatefulSet│      │   │
│  │  │   React)     │  │   Express)   │  │   + PVC)     │      │   │
│  │  │  Port: 3000  │  │  Port: 5000  │  │  Port: 5432  │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Staging Environment                             │   │
│  │              (Namespace: devops-tracker-staging)             │   │
│  │              [Similar structure to Dev]                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Production Environment                          │   │
│  │              (Namespace: devops-tracker-prod)                │   │
│  │              [Similar structure with HPA, PDB, etc.]         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Web Server**: Nginx (in production)
- **Port**: 3000

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT (JSON Web Tokens)
- **API Style**: RESTful
- **Port**: 5000

### Database
- **Type**: PostgreSQL 15
- **Deployment**: StatefulSet with Persistent Volume
- **Port**: 5432
- **Storage**: 1Gi PVC per environment

### Infrastructure
- **Container Orchestration**: Kubernetes (Docker Desktop)
- **GitOps Tool**: ArgoCD
- **CI/CD**: GitHub Actions
- **Container Registry**: Docker Hub
- **Reverse Proxy**: Nginx (in frontend container)

## 🚀 Deployment Architecture

### GitOps Workflow

1. **Code Changes**: Developers push code to GitHub branches
   - `develop` → Development environment
   - `staging` → Staging environment
   - `main` → Production environment

2. **CI Pipeline** (GitHub Actions):
   - Runs linting and tests
   - Builds Docker images
   - Tags images with branch-specific tags
   - Pushes to Docker Hub

3. **GitOps Sync** (ArgoCD):
   - Monitors Git repository for changes
   - Detects new commits in k8s manifests
   - Automatically syncs to Kubernetes cluster
   - Pulls latest images from Docker Hub

### Kubernetes Resources

#### Namespaces
- `argocd`: ArgoCD control plane
- `devops-tracker-dev`: Development environment
- `devops-tracker-staging`: Staging environment
- `devops-tracker-prod`: Production environment

#### Deployments
- **Frontend Deployment**: 1-3 replicas (environment-dependent)
- **Backend Deployment**: 1-3 replicas (environment-dependent)
- **PostgreSQL StatefulSet**: 1 replica per environment

#### Services
- **frontend-service**: ClusterIP, exposes port 3000
- **backend-service**: ClusterIP, exposes port 5000
- **postgres-service**: ClusterIP, exposes port 5432

#### Storage
- **PersistentVolumeClaim**: 1Gi per PostgreSQL instance
- **StorageClass**: hostpath (Docker Desktop default)

#### Configuration
- **ConfigMaps**: Environment-specific configuration
- **Secrets**: Database credentials, JWT secrets

### Kustomize Structure

```
k8s/
├── base/                          # Base manifests
│   ├── namespace.yaml
│   ├── configmaps.yaml
│   ├── secrets.yaml
│   ├── persistent-volumes.yaml
│   ├── backend/
│   │   ├── backend-deployment.yaml
│   │   └── backend-service.yaml
│   ├── frontend/
│   │   ├── frontend-deployment.yaml
│   │   └── frontend-service.yaml
│   └── postgres/
│       ├── postgres-statefulset.yaml
│       └── postgres-service.yaml
└── overlays/                      # Environment-specific overlays
    ├── dev/
    │   ├── kustomization.yaml
    │   ├── namespace-patch.yaml
    │   ├── configmap-patch.yaml
    │   └── replica-patch.yaml
    ├── staging/
    │   └── [similar structure]
    └── production/
        ├── kustomization.yaml
        ├── hpa.yaml              # Horizontal Pod Autoscaler
        ├── pdb.yaml              # Pod Disruption Budget
        ├── network-policy.yaml   # Network policies
        └── resource-limits.yaml  # Resource quotas
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT-based authentication**: Secure token-based auth
- **Password hashing**: bcrypt with salt rounds
- **Role-based access**: Admin and regular user roles
- **Session management**: Token expiration and refresh

### Network Security
- **Service-to-service communication**: Internal ClusterIP services
- **Network policies**: Restrict pod-to-pod communication (production)
- **TLS/SSL**: HTTPS for external access (production)

### Secrets Management
- **Kubernetes Secrets**: Base64-encoded sensitive data
- **Environment variables**: Injected at runtime
- **Database credentials**: Stored in secrets, not in code

### Container Security
- **Non-root users**: Containers run as non-root
- **Read-only root filesystem**: Where applicable
- **Security contexts**: Defined for all pods
- **Image scanning**: Automated vulnerability scanning

## 📈 Scalability & High Availability

### Development Environment
- **Frontend**: 1 replica
- **Backend**: 1 replica
- **Database**: 1 replica (StatefulSet)

### Staging Environment
- **Frontend**: 2 replicas
- **Backend**: 2 replicas
- **Database**: 1 replica (StatefulSet)

### Production Environment
- **Frontend**: 3 replicas with HPA (2-5 replicas)
- **Backend**: 3 replicas with HPA (2-5 replicas)
- **Database**: 1 replica with backup strategy
- **Pod Disruption Budget**: Ensures availability during updates
- **Resource limits**: CPU and memory constraints

### Auto-scaling
- **Horizontal Pod Autoscaler (HPA)**: CPU-based scaling
- **Target CPU utilization**: 70%
- **Min replicas**: 2
- **Max replicas**: 5

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### Frontend CI/CD (`.github/workflows/frontend-ci-cd.yaml`)
```yaml
Triggers: Push to develop, staging, main (frontend/** changes)
Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. Run linting
  5. Run tests
  6. Build Docker image
  7. Tag image (dev-latest, staging-latest, prod-latest)
  8. Push to Docker Hub
```

#### Backend CI/CD (`.github/workflows/backend-ci-cd.yaml`)
```yaml
Triggers: Push to develop, staging, main (backend/** changes)
Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies
  4. Run linting
  5. Run tests
  6. Build Docker image
  7. Tag image (dev-latest, staging-latest, prod-latest)
  8. Push to Docker Hub
```

### ArgoCD Applications

#### Development Application
- **Source**: Git repository (develop branch)
- **Path**: k8s/overlays/dev
- **Sync Policy**: Automated
- **Self-heal**: Enabled
- **Prune**: Enabled

#### Staging Application
- **Source**: Git repository (staging branch)
- **Path**: k8s/overlays/staging
- **Sync Policy**: Manual
- **Self-heal**: Disabled
- **Prune**: Enabled

#### Production Application
- **Source**: Git repository (main branch)
- **Path**: k8s/overlays/production
- **Sync Policy**: Manual
- **Self-heal**: Disabled
- **Prune**: Enabled

## 🗄️ Database Architecture

### Schema Design
- **Users**: User accounts and authentication
- **Tools**: DevOps tools and technologies
- **Entries**: Daily learning entries
- **Projects**: Project tracking
- **Goals**: Learning goals and milestones
- **Achievements**: Gamification and badges
- **Notifications**: User notifications

### Data Flow
1. Frontend sends API requests to Backend
2. Backend validates JWT token
3. Backend queries PostgreSQL database
4. Database returns results
5. Backend processes and returns JSON response
6. Frontend updates UI

### Backup Strategy (Production)
- **Automated backups**: Daily PostgreSQL dumps
- **Retention**: 7 days
- **Storage**: Persistent volumes with snapshots

## 🌐 Network Architecture

### Service Communication
```
User Browser
    ↓ (HTTP/HTTPS)
Frontend Service (ClusterIP:3000)
    ↓ (Internal)
Frontend Pod (Nginx + React)
    ↓ (HTTP - /api/*)
Backend Service (ClusterIP:5000)
    ↓ (Internal)
Backend Pod (Node.js + Express)
    ↓ (PostgreSQL Protocol)
PostgreSQL Service (ClusterIP:5432)
    ↓ (Internal)
PostgreSQL Pod (StatefulSet)
```

### Nginx Reverse Proxy Configuration
```nginx
location /api/ {
    resolver 10.96.0.10;  # Kubernetes DNS
    set $backend http://backend-service-dev.devops-tracker-dev.svc.cluster.local:5000/;
    proxy_pass $backend;
    # Headers, timeouts, etc.
}
```

## 📊 Monitoring & Observability

### Logging
- **Application logs**: stdout/stderr captured by Kubernetes
- **Log aggregation**: kubectl logs for debugging
- **Structured logging**: JSON format for parsing

### Health Checks
- **Liveness probes**: Ensures pods are running
- **Readiness probes**: Ensures pods are ready to serve traffic
- **Startup probes**: Handles slow-starting containers

### Metrics (Future Enhancement)
- Prometheus for metrics collection
- Grafana for visualization
- Custom application metrics

## 🔧 Development Workflow

### Local Development
1. Clone repository
2. Install dependencies (npm install)
3. Configure environment variables
4. Run development servers
   - Frontend: `npm run dev` (port 5173)
   - Backend: `npm start` (port 5000)

### Kubernetes Development
1. Make code changes
2. Commit and push to `develop` branch
3. GitHub Actions builds and pushes images
4. ArgoCD auto-syncs to dev environment
5. Test changes in Kubernetes
6. Promote to staging/production

### Deployment Process
1. **Development**: Auto-deployed on push to `develop`
2. **Staging**: Manual promotion from develop to `staging` branch
3. **Production**: Manual promotion from staging to `main` branch

## 🚦 Quick Start Commands

### Start ArgoCD and Deploy All Environments
```bash
./start-argocd.sh
```

### Stop Port-Forwarding (Keep Apps Running)
```bash
./stop-argocd.sh
```

### Cleanup Everything
```bash
./cleanup-argocd.sh
```

### Access Applications
- **Frontend (Dev)**: http://localhost:3000
- **ArgoCD UI**: https://localhost:8080
- **ArgoCD Credentials**: admin / bRa23aWpZvfEAAy0

### Demo Credentials
- **Demo User**: demo@devopstracker.com / Demo123!
- **Admin User**: admin@devopstracker.com / Admin123!

## 📝 Configuration Management

### Environment Variables

#### Frontend
- `VITE_API_URL`: Backend API URL
- `VITE_APP_NAME`: Application name
- `VITE_ENVIRONMENT`: Environment name

#### Backend
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port (5000)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port (5432)
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time

## 🎯 Best Practices Implemented

1. **GitOps**: Infrastructure as Code with Git as single source of truth
2. **Immutable Infrastructure**: Container images are immutable
3. **Environment Parity**: Dev, staging, and prod are similar
4. **Automated Testing**: CI pipeline runs tests before deployment
5. **Rolling Updates**: Zero-downtime deployments
6. **Health Checks**: Liveness and readiness probes
7. **Resource Limits**: CPU and memory constraints
8. **Secrets Management**: Sensitive data in Kubernetes secrets
9. **Namespace Isolation**: Separate namespaces per environment
10. **Declarative Configuration**: Kubernetes manifests in Git

## 🔮 Future Enhancements

- [ ] Implement Prometheus + Grafana monitoring
- [ ] Add distributed tracing (Jaeger/Zipkin)
- [ ] Implement service mesh (Istio/Linkerd)
- [ ] Add automated database backups
- [ ] Implement blue-green deployments
- [ ] Add canary deployments
- [ ] Implement external secrets management (Vault)
- [ ] Add API rate limiting
- [ ] Implement caching layer (Redis)
- [ ] Add CDN for static assets

## 📚 Additional Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated**: May 4, 2026
**Version**: 1.0.0
**Maintained By**: DevOps Team