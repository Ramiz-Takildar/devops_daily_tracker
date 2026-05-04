# 🚀 Quick Start Guide - DevOps Daily Tracker

**Personalized for:** Ramiz-Takildar  
**Docker Hub:** ramiztakildar  
**Repository:** https://github.com/Ramiz-Takildar/devops_daily_tracker

---

## ✅ What's Already Done

All configuration files have been updated with your credentials:
- ✅ ArgoCD applications configured with your GitHub repository
- ✅ Kustomize overlays configured with your Docker Hub images
- ✅ GitHub Actions workflows ready for CI/CD
- ✅ Multi-environment setup (dev, staging, production)

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Docker Desktop with Kubernetes enabled
- [ ] kubectl installed and configured
- [ ] Git repository pushed to GitHub (Ramiz-Takildar/devops_daily_tracker)
- [ ] Docker Hub account (ramiztakildar)

---

## 🎯 Setup Steps (5 Minutes)

### Step 1: Setup GitHub Secrets (2 minutes)

1. Go to: https://github.com/Ramiz-Takildar/devops_daily_tracker/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:
   ```
   Name: DOCKER_USERNAME
   Value: ramiztakildar
   
   Name: DOCKER_PASSWORD
   Value: <your-docker-hub-access-token>
   ```

**Get Docker Hub Token:**
- Visit: https://hub.docker.com/settings/security
- Click "New Access Token"
- Name it "GitHub Actions"
- Copy the token and use it as DOCKER_PASSWORD

### Step 2: Create Git Branches (1 minute)

```bash
# Create develop branch
git checkout -b develop
git push origin develop

# Create staging branch
git checkout -b staging
git push origin staging

# Return to main
git checkout main
```

### Step 3: Install ArgoCD (2 minutes)

Run the automated setup script:

```bash
./setup-argocd.sh
```

This script will:
- ✅ Install ArgoCD on your cluster
- ✅ Display admin credentials
- ✅ Start port-forwarding to ArgoCD UI

**Alternative Manual Installation:**
```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Step 4: Deploy Applications (30 seconds)

```bash
# Deploy ArgoCD project
kubectl apply -f argocd/projects/devops-tracker.yaml

# Deploy all environments
kubectl apply -f argocd/applications/devops-tracker-dev.yaml
kubectl apply -f argocd/applications/devops-tracker-staging.yaml
kubectl apply -f argocd/applications/devops-tracker-prod.yaml
```

---

## 🌐 Access Your Applications

### ArgoCD UI
- **URL:** https://localhost:8080
- **Username:** admin
- **Password:** (from setup script output)

### Development Environment
```bash
# Port forward to access dev environment
kubectl port-forward -n devops-tracker-dev svc/frontend 3000:80
```
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001 (if port-forwarded)

### Staging Environment
```bash
kubectl port-forward -n devops-tracker-staging svc/frontend 3002:80
```
- **Frontend:** http://localhost:3002

### Production Environment
```bash
kubectl port-forward -n devops-tracker-prod svc/frontend 3003:80
```
- **Frontend:** http://localhost:3003

---

## 🔄 CI/CD Workflow

### Automatic Deployments

**Development (Auto-sync enabled):**
```bash
git checkout develop
# Make changes
git add .
git commit -m "feat: new feature"
git push origin develop
```
→ GitHub Actions builds → Pushes to `ramiztakildar/devops-tracker-*:dev-latest` → ArgoCD auto-deploys

**Staging:**
```bash
git checkout staging
git merge develop
git push origin staging
```
→ GitHub Actions builds → Pushes to `ramiztakildar/devops-tracker-*:staging-latest` → Manual sync in ArgoCD

**Production:**
```bash
git checkout main
git merge staging
git tag v1.0.0
git push origin main --tags
```
→ GitHub Actions builds → Pushes to `ramiztakildar/devops-tracker-*:v1.0.0` → Manual sync in ArgoCD

---

## 📊 Environment Configurations

| Environment | Namespace | Replicas | Auto-Sync | Features |
|------------|-----------|----------|-----------|----------|
| **Dev** | devops-tracker-dev | 1 | ✅ Yes | Fast iteration |
| **Staging** | devops-tracker-staging | 2 | ❌ Manual | Pre-production testing |
| **Production** | devops-tracker-prod | 3 | ❌ Manual | HPA, PDB, Network Policies |

---

## 🛠️ Useful Commands

### Check Application Status
```bash
# Via kubectl
kubectl get pods -n devops-tracker-dev
kubectl get pods -n devops-tracker-staging
kubectl get pods -n devops-tracker-prod

# Via ArgoCD CLI (if installed)
argocd app list
argocd app get devops-tracker-dev
```

### View Logs
```bash
# Backend logs
kubectl logs -n devops-tracker-dev deployment/backend -f

# Frontend logs
kubectl logs -n devops-tracker-dev deployment/frontend -f

# PostgreSQL logs
kubectl logs -n devops-tracker-dev statefulset/postgres -f
```

### Sync Applications Manually
```bash
# Via ArgoCD UI
# Click on application → Click "Sync" button

# Via kubectl
kubectl patch application devops-tracker-staging -n argocd --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Rollback
```bash
# Via ArgoCD UI
# Click on application → History → Select previous version → Rollback

# Via kubectl (restore to previous commit)
kubectl patch application devops-tracker-prod -n argocd --type merge -p '{"spec":{"source":{"targetRevision":"<previous-commit-sha>"}}}'
```

---

## 🐛 Troubleshooting

### ArgoCD Application Not Syncing
```bash
# Check application status
kubectl get application -n argocd

# Check application details
kubectl describe application devops-tracker-dev -n argocd

# Force refresh
kubectl patch application devops-tracker-dev -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n devops-tracker-dev

# Describe pod for events
kubectl describe pod <pod-name> -n devops-tracker-dev

# Check logs
kubectl logs <pod-name> -n devops-tracker-dev
```

### Image Pull Errors
```bash
# Verify image exists on Docker Hub
# Visit: https://hub.docker.com/r/ramiztakildar/devops-tracker-backend/tags

# Check if GitHub Actions workflow succeeded
# Visit: https://github.com/Ramiz-Takildar/devops_daily_tracker/actions
```

---

## 📚 Additional Resources

- **Detailed Setup Guide:** [ARGOCD_SETUP_GUIDE.md](./ARGOCD_SETUP_GUIDE.md)
- **Implementation Summary:** [ARGOCD_IMPLEMENTATION_SUMMARY.md](./ARGOCD_IMPLEMENTATION_SUMMARY.md)
- **Architecture Overview:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Code Review:** [CODE_REVIEW.md](./CODE_REVIEW.md)

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ ArgoCD UI shows all 3 applications as "Healthy" and "Synced"
- ✅ `kubectl get pods -n devops-tracker-dev` shows all pods "Running"
- ✅ Frontend accessible at http://localhost:3000 (after port-forward)
- ✅ GitHub Actions workflows complete successfully
- ✅ New commits to develop branch auto-deploy to dev environment

---

## 💡 Pro Tips

1. **Use ArgoCD CLI for faster operations:**
   ```bash
   brew install argocd  # macOS
   argocd login localhost:8080
   argocd app sync devops-tracker-dev
   ```

2. **Monitor all environments at once:**
   ```bash
   watch -n 2 'kubectl get pods -A | grep devops-tracker'
   ```

3. **Quick environment switch:**
   ```bash
   alias k-dev='kubectl config set-context --current --namespace=devops-tracker-dev'
   alias k-staging='kubectl config set-context --current --namespace=devops-tracker-staging'
   alias k-prod='kubectl config set-context --current --namespace=devops-tracker-prod'
   ```

---

**Need Help?** Check the detailed guides or review the configuration files in:
- `argocd/` - ArgoCD configurations
- `k8s/` - Kubernetes manifests
- `.github/workflows/` - CI/CD pipelines

**Happy Deploying! 🚀**
