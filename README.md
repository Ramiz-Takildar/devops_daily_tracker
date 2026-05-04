# DevOps Daily Tracker

A comprehensive full-stack application for tracking daily DevOps learning, tools, projects, and achievements. Deployed using GitOps principles with ArgoCD on Kubernetes.

[![CI/CD](https://github.com/Ramiz-Takildar/devops_daily_tracker/actions/workflows/frontend-ci-cd.yaml/badge.svg)](https://github.com/Ramiz-Takildar/devops_daily_tracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop with Kubernetes enabled
- kubectl CLI tool
- Git

### Automated Setup (Recommended for New Systems)

Run the interactive setup script that checks prerequisites and deploys everything:

```bash
./setup.sh
```

This script will:
- ✅ Check all prerequisites (Docker, kubectl, git, Kubernetes)
- ✅ Verify Kubernetes cluster is running
- ✅ Install ArgoCD if not present
- ✅ Deploy all three environments
- ✅ Seed database with demo users
- ✅ Set up port-forwarding
- ✅ Display access information

### Manual Deployment

If you prefer manual deployment or already have prerequisites:

```bash
./start-argocd.sh
```

This script will:
1. Install ArgoCD in your Kubernetes cluster
2. Deploy all three environments (dev, staging, production)
3. Seed the database with demo users
4. Set up port-forwarding for easy access

### Access the Application

After deployment completes:

- **Frontend (Dev)**: http://localhost:3000
- **ArgoCD UI**: https://localhost:8080
- **ArgoCD Credentials**: `admin` / `bRa23aWpZvfEAAy0`

### Demo Credentials

- **Demo User**: `demo@devopstracker.com` / `Demo123!`
- **Admin User**: `admin@devopstracker.com` / `Admin123!`

## 📋 Features

### Core Functionality
- ✅ **Daily Learning Tracker**: Log daily DevOps learning activities
- ✅ **Tool Management**: Track DevOps tools and technologies
- ✅ **Project Tracking**: Monitor project progress and milestones
- ✅ **Goal Setting**: Set and track learning goals
- ✅ **Achievement System**: Gamification with badges and rewards
- ✅ **Analytics Dashboard**: Visualize learning progress
- ✅ **Smart Insights**: AI-powered learning recommendations
- ✅ **Export Functionality**: Export data to CSV/PDF

### Technical Features
- ✅ **GitOps Deployment**: Automated deployment with ArgoCD
- ✅ **Multi-Environment**: Dev, Staging, Production environments
- ✅ **CI/CD Pipeline**: Automated testing and deployment
- ✅ **Container Orchestration**: Kubernetes-native deployment
- ✅ **Auto-Scaling**: Horizontal Pod Autoscaler (production)
- ✅ **High Availability**: Multiple replicas with health checks
- ✅ **Persistent Storage**: StatefulSet for PostgreSQL
- ✅ **Security**: JWT authentication, RBAC, network policies

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 with Vite
- Tailwind CSS
- React Context API
- Axios for API calls
- Nginx reverse proxy

**Backend**
- Node.js 20
- Express.js
- PostgreSQL 15
- JWT authentication
- RESTful API

**Infrastructure**
- Kubernetes (Docker Desktop)
- ArgoCD for GitOps
- GitHub Actions for CI/CD
- Docker Hub for container registry
- Kustomize for configuration management

### Deployment Architecture

```
GitHub → GitHub Actions → Docker Hub → ArgoCD → Kubernetes
   ↓           ↓              ↓           ↓          ↓
 Code      Build/Test      Images     GitOps    Deployment
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🔧 Management Commands

### Start Everything
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

### Manual Operations

**Check Application Status**
```bash
kubectl get pods -n devops-tracker-dev
kubectl get pods -n devops-tracker-staging
kubectl get pods -n devops-tracker-prod
```

**View Logs**
```bash
# Frontend logs
kubectl logs -n devops-tracker-dev -l app=devops-tracker,component=web --tail=50

# Backend logs
kubectl logs -n devops-tracker-dev -l app=devops-tracker,component=api --tail=50

# Database logs
kubectl logs -n devops-tracker-dev postgres-dev-0 --tail=50
```

**Access ArgoCD CLI**
```bash
argocd login localhost:8080 --username admin --password bRa23aWpZvfEAAy0 --insecure
argocd app list
argocd app sync devops-tracker-dev
```

## 🔄 Development Workflow

### Making Changes

1. **Make code changes** in your local repository
2. **Commit and push** to the appropriate branch:
   - `develop` → Development environment (auto-deploys)
   - `staging` → Staging environment (manual sync)
   - `main` → Production environment (manual sync)

3. **GitHub Actions** automatically:
   - Runs tests and linting
   - Builds Docker images
   - Pushes to Docker Hub with appropriate tags

4. **ArgoCD** automatically (for dev) or manually (for staging/prod):
   - Detects changes in Git repository
   - Syncs Kubernetes manifests
   - Pulls latest images
   - Deploys to cluster

### Branch Strategy

- `develop` → Development environment (auto-sync enabled)
- `staging` → Staging environment (manual sync)
- `main` → Production environment (manual sync)

### CI/CD Pipeline

**On Push to Any Branch:**
1. Lint and test code
2. Build Docker images
3. Tag images appropriately:
   - `develop` → `dev-latest`
   - `staging` → `staging-latest`
   - `main` → `prod-latest`
4. Push to Docker Hub

**ArgoCD Sync:**
- Development: Automatic (every 3 minutes)
- Staging: Manual approval required
- Production: Manual approval required

## 📦 Project Structure

```
devops_daily_tracker/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD pipelines
├── argocd/
│   ├── applications/        # ArgoCD application definitions
│   └── projects/            # ArgoCD project definitions
├── backend/
│   ├── config/              # Database configuration
│   ├── controllers/         # API controllers
│   ├── database/            # Database migrations and seeds
│   ├── middleware/          # Authentication middleware
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── server.js            # Express server
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── nginx.conf           # Nginx configuration
├── k8s/
│   ├── base/                # Base Kubernetes manifests
│   └── overlays/            # Environment-specific overlays
│       ├── dev/
│       ├── staging/
│       └── production/
├── screenshots/             # Application screenshots
├── start-argocd.sh          # One-command deployment script
├── stop-argocd.sh           # Stop port-forwarding script
├── cleanup-argocd.sh        # Cleanup script
├── ARCHITECTURE.md          # Detailed architecture documentation
├── ARGOCD_QUICK_START.md    # ArgoCD quick reference
└── README.md                # This file
```

## 🔐 Security

### Authentication
- JWT-based authentication
- Bcrypt password hashing
- Token expiration and refresh
- Role-based access control (Admin/User)

### Network Security
- Internal ClusterIP services
- Network policies (production)
- TLS/SSL for external access (production)

### Secrets Management
- Kubernetes Secrets for sensitive data
- Environment-specific configurations
- No secrets in Git repository

## 📊 Monitoring & Observability

### Health Checks
- Liveness probes for all pods
- Readiness probes for traffic management
- Startup probes for slow-starting containers

### Logging
- Structured JSON logging
- Centralized log collection via kubectl
- Application and system logs

### Metrics (Future)
- Prometheus for metrics collection
- Grafana for visualization
- Custom application metrics

## 🎯 Environments

### Development
- **Namespace**: `devops-tracker-dev`
- **Replicas**: 1 per service
- **Auto-sync**: Enabled
- **Purpose**: Active development and testing

### Staging
- **Namespace**: `devops-tracker-staging`
- **Replicas**: 2 per service
- **Auto-sync**: Disabled (manual)
- **Purpose**: Pre-production testing

### Production
- **Namespace**: `devops-tracker-prod`
- **Replicas**: 3 per service
- **Auto-sync**: Disabled (manual)
- **Features**: HPA, PDB, Network Policies, Resource Limits
- **Purpose**: Live production environment

## 🐛 Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### ArgoCD Sync Issues
```bash
argocd app get devops-tracker-dev
argocd app sync devops-tracker-dev --force
```

### Database Connection Issues
```bash
kubectl exec -it postgres-dev-0 -n devops-tracker-dev -- psql -U devops_user -d devops_tracker
```

### Port-Forward Not Working
```bash
# Kill existing port-forwards
pkill -f "kubectl port-forward"

# Restart port-forwards
./start-argocd.sh
```

## 📚 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Detailed system architecture
- [ArgoCD Quick Start](./ARGOCD_QUICK_START.md) - ArgoCD reference guide
- [Quick Start Guide](./QUICK_START.md) - Getting started guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Ramiz Takildar** - [GitHub](https://github.com/Ramiz-Takildar)

## 🙏 Acknowledgments

- ArgoCD for GitOps automation
- Kubernetes community
- React and Node.js communities
- All contributors and users

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review ArgoCD logs and application status

## 🔮 Roadmap

- [ ] Implement Prometheus + Grafana monitoring
- [ ] Add distributed tracing
- [ ] Implement service mesh (Istio)
- [ ] Add automated database backups
- [ ] Implement blue-green deployments
- [ ] Add canary deployments
- [ ] External secrets management (Vault)
- [ ] API rate limiting
- [ ] Redis caching layer
- [ ] CDN for static assets

---

**Built with ❤️ using GitOps principles**

**Last Updated**: May 4, 2026