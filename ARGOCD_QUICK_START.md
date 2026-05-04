# ArgoCD Quick Start Guide

## 🚀 One-Command Deployment

Deploy the entire DevOps Daily Tracker with GitOps automation using a single command:

```bash
./start-argocd.sh
```

This script will:
1. ✅ Install ArgoCD (if not already installed)
2. ✅ Deploy ArgoCD project and applications
3. ✅ Sync all environments (dev, staging, prod)
4. ✅ Seed database with demo users
5. ✅ Setup port-forwarding for easy access
6. ✅ Display all credentials and access information

## 📋 Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl installed and configured
- Git repository pushed to GitHub
- Docker Hub account configured in GitHub Secrets

## 🎯 Quick Commands

### Start Everything
```bash
./start-argocd.sh
```

### Stop Port Forwarding (keeps apps running)
```bash
./stop-argocd.sh
```

### Complete Cleanup
```bash
./cleanup-argocd.sh
```

## 🌐 Access Points

After running `./start-argocd.sh`, you'll have access to:

### Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000 (manual port-forward needed)

### Demo Credentials
- **Email**: demo@devopstracker.com
- **Password**: Demo123!

### Admin Credentials
- **Email**: admin@devopstracker.com
- **Password**: Admin123!

### ArgoCD UI
- **URL**: https://localhost:8080
- **Username**: admin
- **Password**: (displayed by start-argocd.sh)

## 🔄 GitOps Workflow

The deployment follows a complete GitOps workflow:

```
┌─────────────┐
│   develop   │ ──push──> GitHub Actions ──build──> Docker Hub ──sync──> Dev Environment
└─────────────┘

┌─────────────┐
│   staging   │ ──push──> GitHub Actions ──build──> Docker Hub ──sync──> Staging Environment
└─────────────┘

┌─────────────┐
│     main    │ ──push──> GitHub Actions ──build──> Docker Hub ──sync──> Production Environment
└─────────────┘
```

### Deploy to Different Environments

**Development (automatic on push to develop):**
```bash
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
# ArgoCD auto-syncs within 3 minutes
```

**Staging:**
```bash
git checkout staging
git merge develop
git push origin staging
# ArgoCD auto-syncs within 3 minutes
```

**Production:**
```bash
git checkout main
git merge staging
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
# ArgoCD auto-syncs within 3 minutes
```

## 📊 Monitoring

### Check Application Status
```bash
# View all ArgoCD applications
kubectl get applications -n argocd

# Check pods in dev environment
kubectl get pods -n devops-tracker-dev

# View application logs
kubectl logs -n devops-tracker-dev -l app=devops-tracker,component=api -f
```

### Force Manual Sync
```bash
# Force ArgoCD to sync immediately
kubectl patch application devops-tracker-dev -n argocd \
  --type merge \
  -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'
```

## 🛠️ Troubleshooting

### Application Not Syncing
```bash
# Check ArgoCD application status
kubectl get application devops-tracker-dev -n argocd -o yaml

# View sync status
kubectl describe application devops-tracker-dev -n argocd
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n devops-tracker-dev

# View pod logs
kubectl logs -n devops-tracker-dev <pod-name>

# Describe pod for events
kubectl describe pod -n devops-tracker-dev <pod-name>
```

### Port Forward Issues
```bash
# Kill all port forwards
pkill -f "kubectl port-forward"

# Restart port forwards
kubectl port-forward -n devops-tracker-dev svc/frontend-service-dev 3000:3000 &
kubectl port-forward -n devops-tracker-dev svc/backend-service-dev 5000:5000 &
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
```

### Database Issues
```bash
# Connect to postgres pod
kubectl exec -it postgres-dev-0 -n devops-tracker-dev -- psql -U devops_user -d devops_tracker

# Re-seed database
BACKEND_POD=$(kubectl get pods -n devops-tracker-dev -l app=devops-tracker,component=api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n devops-tracker-dev $BACKEND_POD -- node database/seed.js
```

## 🔐 Security Notes

1. **ArgoCD Password**: Save the initial admin password displayed by `start-argocd.sh`
2. **GitHub Secrets**: Ensure DOCKER_USERNAME and DOCKER_PASSWORD are set
3. **Database Credentials**: Stored in Kubernetes secrets
4. **Production**: Use proper secrets management (e.g., Sealed Secrets, External Secrets)

## 📚 Additional Resources

- **Full Setup Guide**: [ARGOCD_SETUP_GUIDE.md](ARGOCD_SETUP_GUIDE.md)
- **Implementation Plan**: [ARGOCD_IMPLEMENTATION_PLAN.md](ARGOCD_IMPLEMENTATION_PLAN.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Main README**: [README.md](README.md)

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ All pods show `Running` status
- ✅ ArgoCD applications show `Synced` and `Healthy`
- ✅ Frontend accessible at http://localhost:3000
- ✅ You can login with demo credentials
- ✅ ArgoCD UI accessible at https://localhost:8080

## 💡 Tips

1. **First Time Setup**: The initial deployment takes 5-10 minutes
2. **Subsequent Deploys**: Auto-sync happens within 3 minutes of git push
3. **Local Development**: Use the original `start.sh` for local Docker Desktop deployment
4. **Production Ready**: This setup is production-ready with proper secrets management

---

**Need Help?** Check the troubleshooting section or refer to the full documentation.
