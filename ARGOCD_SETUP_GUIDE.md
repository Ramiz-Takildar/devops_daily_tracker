# ArgoCD Setup Guide - DevOps Daily Tracker

**Quick Start Guide for Implementing GitOps with ArgoCD**

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Kubernetes cluster running (Docker Desktop with K8s enabled)
- ✅ `kubectl` installed and configured
- ✅ Docker Hub account (or other container registry)
- ✅ GitHub account with repository access
- ✅ `kustomize` installed (optional, for testing)

---

## 🚀 Step 1: Install ArgoCD

### 1.1 Create ArgoCD Namespace and Install

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready (this may take 2-3 minutes)
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Verify installation
kubectl get pods -n argocd
```

Expected output: All pods should be in `Running` state.

### 1.2 Access ArgoCD UI

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

**Access ArgoCD UI:**
- URL: https://localhost:8080
- Username: `admin`
- Password: (from the command above)

⚠️ **Note**: You may see a certificate warning in your browser. This is expected for local development. Click "Advanced" and proceed.

### 1.3 Install ArgoCD CLI (Optional but Recommended)

**macOS:**
```bash
brew install argocd
```

**Linux:**
```bash
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```

**Windows (PowerShell):**
```powershell
$version = (Invoke-RestMethod https://api.github.com/repos/argoproj/argo-cd/releases/latest).tag_name
$url = "https://github.com/argoproj/argo-cd/releases/download/" + $version + "/argocd-windows-amd64.exe"
Invoke-WebRequest -Uri $url -OutFile argocd.exe
```

**Login via CLI:**
```bash
argocd login localhost:8080 --username admin --password <your-password>

# Change admin password (recommended)
argocd account update-password
```

---

## 🔧 Step 2: Setup GitHub Repository

### 2.1 Update Repository URLs

Update the following files with your GitHub username:

**argocd/applications/devops-tracker-dev.yaml:**
```yaml
source:
  repoURL: 'https://github.com/YOUR-USERNAME/devops-tracker'  # ← Update this
```

**argocd/applications/devops-tracker-staging.yaml:**
```yaml
source:
  repoURL: 'https://github.com/YOUR-USERNAME/devops-tracker'  # ← Update this
```

**argocd/applications/devops-tracker-prod.yaml:**
```yaml
source:
  repoURL: 'https://github.com/YOUR-USERNAME/devops-tracker'  # ← Update this
```

### 2.2 Setup GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKER_USERNAME` | your-dockerhub-username | Docker Hub username |
| `DOCKER_PASSWORD` | your-dockerhub-token | Docker Hub access token (not password!) |

**How to create Docker Hub token:**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token and save it as `DOCKER_PASSWORD` secret

### 2.3 Update Docker Image Names

Update the image names in Kustomize overlays:

**k8s/base/kustomization.yaml:**
```yaml
images:
  - name: devops-tracker-backend
    newName: YOUR-DOCKERHUB-USERNAME/devops-tracker-backend  # ← Update
    newTag: latest
  - name: devops-tracker-frontend
    newName: YOUR-DOCKERHUB-USERNAME/devops-tracker-frontend  # ← Update
    newTag: latest
```

Do the same for:
- `k8s/overlays/dev/kustomization.yaml`
- `k8s/overlays/staging/kustomization.yaml`
- `k8s/overlays/production/kustomization.yaml`

### 2.4 Create Branches

```bash
# Create develop branch for dev environment
git checkout -b develop
git push -u origin develop

# Create staging branch for staging environment
git checkout -b staging
git push -u origin staging

# Go back to main
git checkout main
```

---

## 📦 Step 3: Deploy ArgoCD Project and Applications

### 3.1 Apply ArgoCD Project

```bash
# Apply the project definition
kubectl apply -f argocd/projects/devops-tracker.yaml

# Verify project creation
kubectl get appproject -n argocd
```

### 3.2 Deploy Development Environment

```bash
# Apply dev application
kubectl apply -f argocd/applications/devops-tracker-dev.yaml

# Check application status
kubectl get application -n argocd

# Watch the sync progress
argocd app get devops-tracker-dev --watch
```

**Expected behavior:**
- ArgoCD will detect the Git repository
- It will apply all manifests from `k8s/overlays/dev/`
- Pods will be created in `devops-tracker-dev` namespace
- Status should show "Healthy" and "Synced"

### 3.3 Verify Deployment

```bash
# Check all resources in dev namespace
kubectl get all -n devops-tracker-dev

# Check pods are running
kubectl get pods -n devops-tracker-dev

# Check services
kubectl get svc -n devops-tracker-dev
```

### 3.4 Access the Application

```bash
# Port forward to frontend service
kubectl port-forward -n devops-tracker-dev svc/frontend-service-dev 3000:3000
```

Open browser: http://localhost:3000

---

## 🔄 Step 4: Test CI/CD Pipeline

### 4.1 Make a Code Change

```bash
# Make a small change to backend
echo "// Test change" >> backend/server.js

# Commit and push to develop branch
git checkout develop
git add backend/server.js
git commit -m "test: trigger CI/CD pipeline"
git push origin develop
```

### 4.2 Watch GitHub Actions

1. Go to your GitHub repository
2. Click on "Actions" tab
3. You should see "Backend CI/CD" workflow running

**Pipeline stages:**
1. ✅ Lint and Test
2. ✅ Build and Push Docker Image
3. ✅ Security Scan (Trivy)
4. ✅ Update GitOps Manifests

### 4.3 Watch ArgoCD Sync

```bash
# Watch ArgoCD detect and sync changes
argocd app get devops-tracker-dev --watch
```

**What happens:**
1. GitHub Actions builds new Docker image
2. GitHub Actions updates `k8s/overlays/dev/kustomization.yaml` with new image tag
3. ArgoCD detects Git change (within 3 minutes)
4. ArgoCD applies changes to Kubernetes
5. New pods are rolled out with zero downtime

---

## 🎯 Step 5: Deploy to Production

### 5.1 Apply Production Application

```bash
# Apply production application
kubectl apply -f argocd/applications/devops-tracker-prod.yaml

# Check status
argocd app get devops-tracker-prod
```

⚠️ **Note**: Production is configured with:
- Manual sync (no auto-sync)
- Sync windows (only Mon-Fri, 9 AM - 5 PM)
- Higher replica count (3 replicas)
- Resource limits
- Network policies
- Pod Disruption Budgets

### 5.2 Manual Sync to Production

```bash
# Sync production application
argocd app sync devops-tracker-prod

# Or use UI: Click "Sync" button in ArgoCD dashboard
```

### 5.3 Rollback if Needed

```bash
# View history
argocd app history devops-tracker-prod

# Rollback to previous version
argocd app rollback devops-tracker-prod <revision-number>
```

---

## 📊 Step 6: Monitor and Manage

### 6.1 ArgoCD Dashboard

Access: https://localhost:8080

**Features:**
- Visual representation of all resources
- Real-time sync status
- Health status of each component
- Diff view (Git vs Cluster)
- Manual sync/rollback buttons
- Resource tree view

### 6.2 Useful ArgoCD CLI Commands

```bash
# List all applications
argocd app list

# Get application details
argocd app get devops-tracker-dev

# View application logs
argocd app logs devops-tracker-dev

# Sync application
argocd app sync devops-tracker-dev

# Refresh application (force check Git)
argocd app refresh devops-tracker-dev

# View sync history
argocd app history devops-tracker-dev

# Rollback to previous version
argocd app rollback devops-tracker-dev 1

# Delete application (keeps resources)
argocd app delete devops-tracker-dev --cascade=false

# Delete application (removes all resources)
argocd app delete devops-tracker-dev --cascade=true
```

### 6.3 Useful Kubectl Commands

```bash
# View all ArgoCD applications
kubectl get applications -n argocd

# View application details
kubectl describe application devops-tracker-dev -n argocd

# View ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f

# View application controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f
```

---

## 🔍 Step 7: Test Kustomize Builds (Optional)

Before deploying, you can test Kustomize builds locally:

```bash
# Install kustomize
brew install kustomize  # macOS
# or
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

# Test dev overlay
kustomize build k8s/overlays/dev

# Test staging overlay
kustomize build k8s/overlays/staging

# Test production overlay
kustomize build k8s/overlays/production

# Apply locally (dry-run)
kustomize build k8s/overlays/dev | kubectl apply --dry-run=client -f -
```

---

## 🎨 Customization Options

### Change Sync Frequency

Edit ArgoCD ConfigMap:

```bash
kubectl edit configmap argocd-cm -n argocd
```

Add:
```yaml
data:
  timeout.reconciliation: "60s"  # Default is 180s (3 minutes)
```

### Enable Auto-Sync for Production

Edit `argocd/applications/devops-tracker-prod.yaml`:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true  # Change from false to true
```

### Add Slack Notifications

See `ARGOCD_IMPLEMENTATION_PLAN.md` Phase 5 for detailed Slack integration.

---

## 🐛 Troubleshooting

### Application Not Syncing

```bash
# Check application status
argocd app get devops-tracker-dev

# Check for errors
kubectl describe application devops-tracker-dev -n argocd

# Force refresh
argocd app refresh devops-tracker-dev

# Manual sync
argocd app sync devops-tracker-dev
```

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n devops-tracker-dev

# Check pod logs
kubectl logs <pod-name> -n devops-tracker-dev

# Describe pod for events
kubectl describe pod <pod-name> -n devops-tracker-dev
```

### Image Pull Errors

```bash
# Check if images exist in Docker Hub
docker pull YOUR-USERNAME/devops-tracker-backend:latest

# Verify image names in kustomization.yaml
cat k8s/overlays/dev/kustomization.yaml
```

### ArgoCD UI Not Accessible

```bash
# Check ArgoCD pods
kubectl get pods -n argocd

# Restart port-forward
pkill -f "kubectl port-forward.*argocd"
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### GitHub Actions Failing

1. Check GitHub Actions logs in repository
2. Verify secrets are set correctly
3. Ensure Docker Hub credentials are valid
4. Check if branches exist (develop, staging, main)

---

## 📚 Next Steps

1. ✅ **Setup Monitoring**: Integrate Prometheus and Grafana
2. ✅ **Add Notifications**: Configure Slack/Email alerts
3. ✅ **Implement Testing**: Add unit and integration tests
4. ✅ **Setup Ingress**: Configure external access with TLS
5. ✅ **Database Backups**: Implement automated backup strategy
6. ✅ **Documentation**: Document your specific workflows

---

## 🎯 Success Criteria

Your ArgoCD setup is successful when:

- ✅ ArgoCD UI is accessible at https://localhost:8080
- ✅ All three applications (dev/staging/prod) are visible in ArgoCD
- ✅ Dev application shows "Healthy" and "Synced" status
- ✅ Pods are running in `devops-tracker-dev` namespace
- ✅ Application is accessible at http://localhost:3000
- ✅ Code changes trigger GitHub Actions pipeline
- ✅ ArgoCD automatically syncs changes to dev environment
- ✅ Manual sync works for production environment

---

## 📖 Additional Resources

- **ArgoCD Documentation**: https://argo-cd.readthedocs.io/
- **Kustomize Documentation**: https://kustomize.io/
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Kubernetes Documentation**: https://kubernetes.io/docs/

---

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review ArgoCD logs: `kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server`
3. Check application events: `kubectl describe application devops-tracker-dev -n argocd`
4. Refer to `ARGOCD_IMPLEMENTATION_PLAN.md` for detailed explanations

---

**Happy GitOps! 🚀**
