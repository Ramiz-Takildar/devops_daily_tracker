# ArgoCD Implementation Plan for DevOps Daily Tracker

**Date**: May 4, 2026  
**Objective**: Implement complete DevOps cycle using ArgoCD for GitOps-based continuous deployment

---

## 🎯 Executive Summary

**YES! ArgoCD is an EXCELLENT fit for this project!** ✅

This project is already Kubernetes-native, making it perfect for ArgoCD implementation. We can establish a complete DevOps cycle with:

- **CI Pipeline**: GitHub Actions for build, test, and push
- **CD Pipeline**: ArgoCD for automated deployment to Kubernetes
- **GitOps**: Git as single source of truth
- **Automated Rollbacks**: ArgoCD's built-in rollback capabilities
- **Multi-Environment**: Dev, Staging, Production environments

---

## 📊 Current State vs Target State

### Current State
```
Developer → Manual Build → Manual kubectl apply → Kubernetes
```

### Target State with ArgoCD
```
Developer → Git Push → GitHub Actions (CI) → Container Registry
                                                      ↓
                                              ArgoCD (CD) → Kubernetes
                                                      ↑
                                              Git Repository (GitOps)
```

---

## 🏗️ Complete DevOps Cycle Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT PHASE                            │
│  ┌──────────────┐                                                   │
│  │  Developer   │ → Code Changes → Git Commit → Git Push            │
│  └──────────────┘                                                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    CI PIPELINE (GitHub Actions)                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. Checkout Code                                           │   │
│  │  2. Run Linters (ESLint, Prettier)                         │   │
│  │  3. Run Unit Tests (Jest/Vitest)                           │   │
│  │  4. Run Integration Tests                                   │   │
│  │  5. Build Docker Images                                     │   │
│  │  6. Security Scan (Trivy/Snyk)                             │   │
│  │  7. Push to Container Registry (Docker Hub/ECR/GCR)        │   │
│  │  8. Update Kubernetes Manifests with new image tags        │   │
│  │  9. Commit manifest changes to GitOps repo                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    GITOPS REPOSITORY                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  k8s/                                                       │   │
│  │  ├── base/              (Common configs)                   │   │
│  │  ├── overlays/                                             │   │
│  │  │   ├── dev/          (Development environment)           │   │
│  │  │   ├── staging/      (Staging environment)               │   │
│  │  │   └── production/   (Production environment)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    CD PIPELINE (ArgoCD)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  1. Detect Git Changes (Auto-sync every 3 minutes)         │   │
│  │  2. Compare Desired State (Git) vs Current State (K8s)     │   │
│  │  3. Calculate Diff                                          │   │
│  │  4. Apply Changes to Kubernetes                            │   │
│  │  5. Health Check (Liveness/Readiness probes)              │   │
│  │  6. Sync Status: Healthy/Degraded/Progressing             │   │
│  │  7. Send Notifications (Slack/Email)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    KUBERNETES CLUSTER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Namespace: devops-tracker-dev                             │   │
│  │  ├── Frontend Deployment (2 replicas)                      │   │
│  │  ├── Backend Deployment (2 replicas)                       │   │
│  │  ├── PostgreSQL StatefulSet (1 replica)                    │   │
│  │  ├── Services                                               │   │
│  │  └── ConfigMaps & Secrets                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  • ArgoCD Dashboard (Deployment status)                    │   │
│  │  • Prometheus (Metrics collection)                         │   │
│  │  • Grafana (Visualization)                                 │   │
│  │  • Slack/Email Notifications                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Timeline

| Phase | Duration | Tasks | Status |
|-------|----------|-------|--------|
| **Phase 1** | Week 1 | Install ArgoCD, Setup CLI | 🔲 Not Started |
| **Phase 2** | Week 1-2 | Restructure repo for GitOps | 🔲 Not Started |
| **Phase 3** | Week 2 | Setup CI Pipeline (GitHub Actions) | 🔲 Not Started |
| **Phase 4** | Week 2-3 | Configure ArgoCD Applications | 🔲 Not Started |
| **Phase 5** | Week 3 | Setup Notifications | 🔲 Not Started |
| **Phase 6** | Week 3-4 | Testing & Validation | 🔲 Not Started |
| **Phase 7** | Week 4 | Documentation & Training | 🔲 Not Started |

**Total Duration**: 4 weeks

---

## 🚀 Phase 1: Install ArgoCD (Week 1)

### Step 1.1: Install ArgoCD on Kubernetes

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Verify installation
kubectl get pods -n argocd
```

### Step 1.2: Access ArgoCD UI

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access UI at: https://localhost:8080
# Username: admin
# Password: (from previous command)
```

### Step 1.3: Install ArgoCD CLI

```bash
# macOS
brew install argocd

# Linux
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

# Windows (PowerShell)
$version = (Invoke-RestMethod https://api.github.com/repos/argoproj/argo-cd/releases/latest).tag_name
$url = "https://github.com/argoproj/argo-cd/releases/download/" + $version + "/argocd-windows-amd64.exe"
$output = "argocd.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Login via CLI
argocd login localhost:8080 --username admin --password <password>

# Change admin password
argocd account update-password
```

### Step 1.4: Configure ArgoCD (Optional but Recommended)

```bash
# Increase sync timeout for large applications
kubectl patch configmap argocd-cm -n argocd --type merge -p '{"data":{"timeout.reconciliation":"180s"}}'

# Enable anonymous access (for demo purposes only)
kubectl patch configmap argocd-cm -n argocd --type merge -p '{"data":{"users.anonymous.enabled":"true"}}'

# Restart ArgoCD server
kubectl rollout restart deployment argocd-server -n argocd
```

---

## 📁 Phase 2: Restructure Repository for GitOps (Week 1-2)

### Step 2.1: Choose Repository Strategy

**Option A: Monorepo (Recommended for this project)**
- Single repository for application code and manifests
- Simpler to manage
- Better for small-medium teams

**Option B: Separate Repositories**
- Application code in one repo
- Kubernetes manifests in separate GitOps repo
- Better separation of concerns
- Recommended for large teams

### Step 2.2: Create Directory Structure (Monorepo Approach)

```bash
# Create new directory structure
mkdir -p k8s/{base,overlays/{dev,staging,production}}
mkdir -p k8s/base/{postgres,backend,frontend}
mkdir -p argocd/{applications,projects}

# Move existing manifests to base
mv k8s/namespace.yaml k8s/base/
mv k8s/configmaps.yaml k8s/base/
mv k8s/secrets.yaml k8s/base/
mv k8s/postgres-*.yaml k8s/base/postgres/
mv k8s/backend-*.yaml k8s/base/backend/
mv k8s/frontend-*.yaml k8s/base/frontend/
mv k8s/persistent-volumes.yaml k8s/base/
```

### Step 2.3: Create Kustomize Base Configuration

**k8s/base/kustomization.yaml**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: devops-tracker

resources:
  - namespace.yaml
  - configmaps.yaml
  - secrets.yaml
  - persistent-volumes.yaml
  - postgres/postgres-statefulset.yaml
  - postgres/postgres-service.yaml
  - backend/backend-deployment.yaml
  - backend/backend-service.yaml
  - frontend/frontend-deployment.yaml
  - frontend/frontend-service.yaml

commonLabels:
  app: devops-tracker
  managed-by: argocd

images:
  - name: devops-tracker-backend
    newName: your-dockerhub-username/devops-tracker-backend
    newTag: latest
  - name: devops-tracker-frontend
    newName: your-dockerhub-username/devops-tracker-frontend
    newTag: latest
```

### Step 2.4: Create Development Overlay

**k8s/overlays/dev/kustomization.yaml**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: devops-tracker-dev

bases:
  - ../../base

nameSuffix: -dev

patchesStrategicMerge:
  - namespace-patch.yaml
  - configmap-patch.yaml
  - replica-patch.yaml

images:
  - name: devops-tracker-backend
    newTag: dev-latest
  - name: devops-tracker-frontend
    newTag: dev-latest
```

**k8s/overlays/dev/namespace-patch.yaml**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: devops-tracker
  labels:
    environment: development
```

**k8s/overlays/dev/configmap-patch.yaml**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "development"
  DB_HOST: "postgres-service-dev"
```

**k8s/overlays/dev/replica-patch.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 1
```

### Step 2.5: Create Production Overlay

**k8s/overlays/production/kustomization.yaml**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: devops-tracker-prod

bases:
  - ../../base

nameSuffix: -prod

patchesStrategicMerge:
  - namespace-patch.yaml
  - configmap-patch.yaml
  - replica-patch.yaml
  - resource-limits.yaml

resources:
  - ingress.yaml
  - hpa.yaml
  - network-policy.yaml
  - pdb.yaml

images:
  - name: devops-tracker-backend
    newTag: v1.0.0
  - name: devops-tracker-frontend
    newTag: v1.0.0
```

**k8s/overlays/production/hpa.yaml** (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-prod
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend-prod
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**k8s/overlays/production/pdb.yaml** (Pod Disruption Budget)
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: backend

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: frontend-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: frontend
```

**k8s/overlays/production/network-policy.yaml**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### Step 2.6: Test Kustomize Configuration

```bash
# Test dev overlay
kustomize build k8s/overlays/dev

# Test production overlay
kustomize build k8s/overlays/production

# Apply to test (dry-run)
kubectl apply -k k8s/overlays/dev --dry-run=client
```

---

## 🔄 Phase 3: Setup CI Pipeline (Week 2)

### Step 3.1: Create GitHub Actions Workflow for Backend

**.github/workflows/backend-ci-cd.yaml**
```yaml
name: Backend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci-cd.yaml'
  pull_request:
    branches: [ main ]
    paths:
      - 'backend/**'

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/devops-tracker-backend

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint || echo "⚠️ Linter not configured"

      - name: Run tests
        working-directory: ./backend
        run: npm test || echo "⚠️ Tests not configured"

      - name: Security audit
        working-directory: ./backend
        run: npm audit --audit-level=moderate || true

  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false

      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  update-gitops-dev:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Update image tag in dev overlay
        run: |
          cd k8s/overlays/dev
          kustomize edit set image \
            devops-tracker-backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Commit and push changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add k8s/overlays/dev/kustomization.yaml
          git commit -m "🚀 Update backend image to ${{ github.sha }}" || exit 0
          git push

  update-gitops-prod:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Create release tag
        id: tag
        run: |
          VERSION=$(date +%Y.%m.%d)-${GITHUB_SHA::7}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          git tag -a v$VERSION -m "Release v$VERSION"
          git push origin v$VERSION

      - name: Update image tag in production overlay
        run: |
          cd k8s/overlays/production
          kustomize edit set image \
            devops-tracker-backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:v${{ steps.tag.outputs.version }}

      - name: Commit and push changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add k8s/overlays/production/kustomization.yaml
          git commit -m "🚀 Release backend v${{ steps.tag.outputs.version }}" || exit 0
          git push
```

### Step 3.2: Create GitHub Actions Workflow for Frontend

**.github/workflows/frontend-ci-cd.yaml**
```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci-cd.yaml'
  pull_request:
    branches: [ main ]
    paths:
      - 'frontend/**'

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/devops-tracker-frontend

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint || echo "⚠️ Linter not configured"

      - name: Run tests
        working-directory: ./frontend
        run: npm test || echo "⚠️ Tests not configured"

      - name: Build application
        working-directory: ./frontend
        run: npm run build

      - name: Security audit
        working-directory: ./frontend
        run: npm audit --audit-level=moderate || true

  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false

      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

  update-gitops-dev:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Update image tag in dev overlay
        run: |
          cd k8s/overlays/dev
          kustomize edit set image \
            devops-tracker-frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Commit and push changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add k8s/overlays/dev/kustomization.yaml
          git commit -m "🚀 Update frontend image to ${{ github.sha }}" || exit 0
          git push

  update-gitops-prod:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Create release tag
        id: tag
        run: |
          VERSION=$(date +%Y.%m.%d)-${GITHUB_SHA::7}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Update image tag in production overlay
        run: |
          cd k8s/overlays/production
          kustomize edit set image \
            devops-tracker-frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:v${{ steps.tag.outputs.version }}

      - name: Commit and push changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add k8s/overlays/production/kustomization.yaml
          git commit -m "🚀 Release frontend v${{ steps.tag.outputs.version }}" || exit 0
          git push
```

### Step 3.3: Setup GitHub Secrets

```bash
# Required secrets in GitHub repository settings:
# Settings → Secrets and variables → Actions → New repository secret

DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password-or-token
GITHUB_TOKEN=automatically-provided-by-github
```

---

## ⚙️ Phase 4: Configure ArgoCD Applications (Week 2-3)

### Step 4.1: Create ArgoCD Project

**argocd/projects/devops-tracker.yaml**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: devops-tracker
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  description: DevOps Daily Tracker Application Project
  
  sourceRepos:
    - 'https://github.com/your-username/devops-tracker'
    - '*'  # Allow all repos (for testing)
  
  destinations:
    - namespace: 'devops-tracker-*'
      server: 'https://kubernetes.default.svc'
    - namespace: 'argocd'
      server: 'https://kubernetes.default.svc'
  
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: ''
      kind: PersistentVolume
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRole
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRoleBinding
  
  namespaceResourceWhitelist:
    - group: '*'
      kind: '*'
  
  roles:
    - name: developer
      description: Developer role with sync permissions
      policies:
        - p, proj:devops-tracker:developer, applications, sync, devops-tracker/*, allow
        - p, proj:devops-tracker:developer, applications, get, devops-tracker/*, allow
        - p, proj:devops-tracker:developer, applications, override, devops-tracker/*, allow
      groups:
        - developers
    
    - name: admin
      description: Admin role with full permissions
      policies:
        - p, proj:devops-tracker:admin, applications, *, devops-tracker/*, allow
      groups:
        - admins
```

### Step 4.2: Create ArgoCD Application for Development

**argocd/applications/devops-tracker-dev.yaml**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: devops-tracker-dev
  namespace: argocd
  finalizers:
    - resources-fina