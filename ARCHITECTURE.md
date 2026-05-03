# DevOps Daily Tracker - Complete Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Service Components](#service-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Kubernetes Architecture](#kubernetes-architecture)
9. [Deployment Workflow](#deployment-workflow)
10. [Security Architecture](#security-architecture)
11. [Monitoring & Health Checks](#monitoring--health-checks)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 System Overview

**DevOps Daily Tracker** is a full-stack Kubernetes-native application designed to help DevOps engineers track their daily activities, tools usage, projects, and goals.

### Key Features
- ✅ User authentication & authorization (JWT-based)
- ✅ Daily time tracking for tools and activities
- ✅ Project management with status tracking
- ✅ Goal setting and achievement tracking
- ✅ Analytics and insights dashboard
- ✅ Admin portal for system management
- ✅ Real-time notifications
- ✅ Data export (CSV/PDF)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │   Mobile     │  │   Desktop    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                    HTTP/HTTPS (Port 3000)                       │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    KUBERNETES CLUSTER                            │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │              FRONTEND SERVICE                       │         │
│  │         (LoadBalancer - Port 3000)                  │         │
│  └─────────────────────────┬──────────────────────────┘         │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │           FRONTEND DEPLOYMENT (2 Replicas)          │         │
│  │  ┌──────────────────┐    ┌──────────────────┐     │         │
│  │  │  Frontend Pod 1  │    │  Frontend Pod 2  │     │         │
│  │  │  ┌────────────┐  │    │  ┌────────────┐  │     │         │
│  │  │  │   Nginx    │  │    │  │   Nginx    │  │     │         │
│  │  │  │  (Port 80) │  │    │  │  (Port 80) │  │     │         │
│  │  │  └────────────┘  │    │  └────────────┘  │     │         │
│  │  │  React + Vite    │    │  React + Vite    │     │         │
│  │  └────────┬─────────┘    └────────┬─────────┘     │         │
│  └───────────┼──────────────────────┼────────────────┘         │
│              │                      │                            │
│              └──────────┬───────────┘                            │
│                         │ API Calls (Port 5000)                  │
│  ┌─────────────────────▼──────────────────────────┐             │
│  │              BACKEND SERVICE                    │             │
│  │          (ClusterIP - Port 5000)                │             │
│  └─────────────────────┬──────────────────────────┘             │
│                        │                                         │
│  ┌─────────────────────▼──────────────────────────┐             │
│  │           BACKEND DEPLOYMENT (2 Replicas)       │             │
│  │  ┌──────────────────┐    ┌──────────────────┐  │             │
│  │  │  Backend Pod 1   │    │  Backend Pod 2   │  │             │
│  │  │  ┌────────────┐  │    │  ┌────────────┐  │  │             │
│  │  │  │  Node.js   │  │    │  │  Node.js   │  │  │             │
│  │  │  │  Express   │  │    │  │  Express   │  │  │             │
│  │  │  │ (Port 5000)│  │    │  │ (Port 5000)│  │  │             │
│  │  │  └────────────┘  │    │  └────────────┘  │  │             │
│  │  └────────┬─────────┘    └────────┬─────────┘  │             │
│  └───────────┼──────────────────────┼─────────────┘             │
│              │                      │                            │
│              └──────────┬───────────┘                            │
│                         │ SQL Queries (Port 5432)                │
│  ┌─────────────────────▼──────────────────────────┐             │
│  │            POSTGRES SERVICE                     │             │
│  │          (ClusterIP - Port 5432)                │             │
│  └─────────────────────┬──────────────────────────┘             │
│                        │                                         │
│  ┌─────────────────────▼──────────────────────────┐             │
│  │         POSTGRES STATEFULSET (1 Replica)        │             │
│  │  ┌──────────────────────────────────────────┐  │             │
│  │  │         PostgreSQL Pod                   │  │             │
│  │  │  ┌────────────────────────────────────┐  │  │             │
│  │  │  │      PostgreSQL 15                 │  │  │             │
│  │  │  │      (Port 5432)                   │  │  │             │
│  │  │  └────────────────────────────────────┘  │  │             │
│  │  │  Database: devops_tracker                │  │             │
│  │  │  ┌────────────────────────────────────┐  │  │             │
│  │  │  │   Persistent Volume (10Gi)         │  │  │             │
│  │  │  └────────────────────────────────────┘  │  │             │
│  │  └──────────────────────────────────────────┘  │             │
│  └─────────────────────────────────────────────────┘             │
└───────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **HTTP Client**: Axios 1.7.7
- **Routing**: React Router DOM 6.26.2
- **State Management**: React Context API
- **Charts**: Recharts 2.12.7
- **Icons**: Lucide React 0.441.0
- **Web Server**: Nginx (Alpine)

### Backend
- **Runtime**: Node.js 20-alpine
- **Framework**: Express 4.19.2
- **Database Driver**: pg (PostgreSQL) 8.12.0
- **Authentication**: jsonwebtoken 9.0.2, bcryptjs 2.4.3
- **Validation**: express-validator 7.2.0
- **Security**: helmet 7.1.0, cors 2.8.5
- **File Processing**: csv-writer 1.6.0, pdfkit 0.15.0

### Database
- **DBMS**: PostgreSQL 15
- **Storage**: Persistent Volumes (10Gi)

### Infrastructure
- **Container Runtime**: Docker 24+
- **Orchestration**: Kubernetes (Docker Desktop)
- **Namespace**: devops-tracker

---

## 🔧 Service Components

### 1. Frontend Service (React + Nginx)

**Purpose**: Serves the user interface

**Configuration**:
```yaml
Type: LoadBalancer
Port: 3000 → 80
Replicas: 2
Image: devops-tracker-frontend:latest
```

**Key Features**:
- Single Page Application (SPA)
- JWT token management
- Responsive design
- Theme support (light/dark)

### 2. Backend Service (Node.js + Express)

**Purpose**: REST API server

**Configuration**:
```yaml
Type: ClusterIP
Port: 5000
Replicas: 2
Image: devops-tracker-backend:latest
```

**Key Features**:
- RESTful API
- JWT authentication
- Role-based access control
- Database connection pooling
- Health check endpoint

### 3. PostgreSQL Service

**Purpose**: Persistent data storage

**Configuration**:
```yaml
Type: StatefulSet
Replicas: 1
Port: 5432
Storage: 10Gi PersistentVolume
```

---

## 🔄 Data Flow

### 1. User Authentication Flow

```
Browser → Frontend → Backend → Database
   │         │          │          │
   │ Login   │          │          │
   ├────────>│          │          │
   │         │ POST     │          │
   │         ├─────────>│          │
   │         │          │ Query    │
   │         │          ├─────────>│
   │         │          │ User     │
   │         │          │<─────────┤
   │         │          │ Verify   │
   │         │          │ Generate │
   │         │          │ JWT      │
   │         │ Token    │          │
   │         │<─────────┤          │
   │ Store   │          │          │
   │<────────┤          │          │
```

### 2. Daily Entry Creation

```
Browser → Frontend → Backend → Database
   │         │          │          │
   │ Submit  │          │          │
   ├────────>│          │          │
   │         │ POST     │          │
   │         │ +JWT     │          │
   │         ├─────────>│          │
   │         │          │ Verify   │
   │         │          │ Validate │
   │         │          │ INSERT   │
   │         │          ├─────────>│
   │         │          │ Trigger  │
   │         │          │ Sync     │
   │         │ Success  │          │
   │         │<─────────┤          │
   │ Update  │          │          │
   │<────────┤          │          │
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tools
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true
);

-- Daily Entries
CREATE TABLE daily_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tool_id INTEGER REFERENCES tools(id),
    date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE,
    end_date DATE
);
```

### Relationships

```
users (1) ──────< (N) daily_entries
users (1) ──────< (N) projects
users (1) ──────< (N) goals
tools (1) ──────< (N) daily_entries
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user
PUT    /api/auth/profile     - Update profile
```

### Tools & Entries
```
GET    /api/tools            - List tools
POST   /api/tools/entry      - Create entry
GET    /api/tools/entries    - Get entries
PUT    /api/tools/entries/:id - Update entry
DELETE /api/tools/entries/:id - Delete entry
```

### Projects
```
GET    /api/projects         - List projects
POST   /api/projects         - Create project
GET    /api/projects/:id     - Get project
PUT    /api/projects/:id     - Update project
DELETE /api/projects/:id     - Delete project
```

### Admin
```
GET    /api/admin/stats      - System stats
GET    /api/admin/users      - List users
GET    /api/admin/entries    - List all entries
GET    /api/admin/analytics  - Analytics data
POST   /api/admin/tools      - Create tool
PUT    /api/admin/tools/:id  - Update tool
DELETE /api/admin/tools/:id  - Delete tool
```

---

## ☸️ Kubernetes Architecture

### Resource Hierarchy

```
Namespace: devops-tracker
├── ConfigMaps
│   └── app-config (DB_HOST, DB_PORT, NODE_ENV)
├── Secrets
│   └── app-secrets (DB_PASSWORD, JWT_SECRET)
├── PersistentVolumes
│   ├── postgres-pv (10Gi)
│   └── backend-exports-pv (5Gi)
├── StatefulSets
│   └── postgres (1 replica)
├── Deployments
│   ├── backend (2 replicas)
│   └── frontend (2 replicas)
└── Services
    ├── frontend-service (LoadBalancer:3000)
    ├── backend-service (ClusterIP:5000)
    └── postgres-service (ClusterIP:5432)
```

### Pod Communication

```
Frontend Pod → Backend Service → Backend Pod
                                      ↓
                              Postgres Service
                                      ↓
                                Postgres Pod
```

---

## 🚀 Deployment Workflow

### Automated Deployment (start.sh)

```bash
#!/bin/bash

# 1. Build Docker Images
docker build -t devops-tracker-frontend:latest ./frontend
docker build -t devops-tracker-backend:latest ./backend

# 2. Apply Kubernetes Resources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/persistent-volumes.yaml

# 3. Deploy Database
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl wait --for=condition=ready pod/postgres-0 -n devops-tracker

# 4. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl delete pods -n devops-tracker -l app=backend  # Force restart
kubectl wait --for=condition=available deployment/backend -n devops-tracker

# 5. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl delete pods -n devops-tracker -l app=frontend  # Force restart
kubectl wait --for=condition=available deployment/frontend -n devops-tracker

# 6. Setup Access
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000 &

# 7. Seed Database
BACKEND_POD=$(kubectl get pods -n devops-tracker -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n devops-tracker $BACKEND_POD -- node database/seed.js
```

### Rolling Update Strategy

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # Create 1 extra pod during update
    maxUnavailable: 0  # Keep all pods running during update
```

**Update Process**:
1. Create new pod with updated image
2. Wait for new pod to be ready
3. Terminate old pod
4. Repeat for remaining pods

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Backend hashes password with bcrypt
3. Compare with stored hash
4. Generate JWT token:
   {
     userId: 123,
     email: "user@example.com",
     role: "user",
     exp: 1234567890
   }
5. Return token to client
6. Client stores in localStorage
7. Client sends token in Authorization header
8. Backend verifies token on each request
```

### Role-Based Access Control

```
User Roles:
├── user (default)
│   ├── View own data
│   ├── Create entries
│   ├── Manage own projects
│   └── Update profile
└── admin
    ├── All user permissions
    ├── View all users
    ├── Manage all entries
    ├── Manage tools
    └── View analytics
```

### Security Middleware

```javascript
// 1. Helmet - Security headers
app.use(helmet());

// 2. CORS - Cross-origin requests
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 3. JWT Verification
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 4. Admin Authorization
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### Secrets Management

```yaml
# Kubernetes Secrets (Base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: devops-tracker
type: Opaque
data:
  DB_USER: ZGV2b3BzX3VzZXI=
  DB_PASSWORD: ZGV2b3BzX3Bhc3M=
  JWT_SECRET: c3VwZXJfc2VjcmV0X2tleQ==
```

---

## 📊 Monitoring & Health Checks

### Health Probes

#### Liveness Probe
**Purpose**: Detect if application is alive
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

**Action**: Restart pod if fails 3 times

#### Readiness Probe
**Purpose**: Detect if application is ready for traffic
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Action**: Remove from service endpoints if fails

#### Startup Probe
**Purpose**: Give extra time for initial startup
```yaml
startupProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 30
```

**Action**: Wait up to 300s for startup

### Health Check Endpoint

```javascript
// Backend: /health
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Monitoring Commands

```bash
# Check pod status
kubectl get pods -n devops-tracker

# View pod logs
kubectl logs -n devops-tracker -l app=backend -f

# Check pod health
kubectl describe pod <pod-name> -n devops-tracker

# View events
kubectl get events -n devops-tracker --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n devops-tracker
```

---

## 🔧 Troubleshooting Guide

### Common Issues

#### 1. Pods Not Starting

**Symptoms**:
```
NAME                      READY   STATUS             RESTARTS
backend-xxx-yyy           0/1     CrashLoopBackOff   5
```

**Diagnosis**:
```bash
# Check pod logs
kubectl logs -n devops-tracker backend-xxx-yyy

# Check pod events
kubectl describe pod backend-xxx-yyy -n devops-tracker
```

**Common Causes**:
- Database connection failure
- Missing environment variables
- Image pull errors
- Port conflicts

**Solutions**:
```bash
# Verify database is running
kubectl get pods -n devops-tracker -l app=postgres

# Check secrets and configmaps
kubectl get secrets -n devops-tracker
kubectl get configmaps -n devops-tracker

# Restart deployment
kubectl rollout restart deployment/backend -n devops-tracker
```

#### 2. Database Connection Errors

**Symptoms**:
```
Error: connect ECONNREFUSED postgres-service:5432
```

**Diagnosis**:
```bash
# Check postgres pod
kubectl get pods -n devops-tracker -l app=postgres

# Check postgres logs
kubectl logs -n devops-tracker postgres-0

# Test connection from backend pod
kubectl exec -n devops-tracker deployment/backend -- nc -zv postgres-service 5432
```

**Solutions**:
```bash
# Verify service exists
kubectl get svc -n devops-tracker postgres-service

# Check environment variables
kubectl exec -n devops-tracker deployment/backend -- env | grep DB_

# Restart postgres
kubectl delete pod postgres-0 -n devops-tracker
```

#### 3. Frontend Not Loading

**Symptoms**:
- Blank page
- 404 errors
- API calls failing

**Diagnosis**:
```bash
# Check frontend pods
kubectl get pods -n devops-tracker -l app=frontend

# Check frontend logs
kubectl logs -n devops-tracker -l app=frontend

# Test port forwarding
curl http://localhost:3000
```

**Solutions**:
```bash
# Restart port forwarding
pkill -f "kubectl port-forward.*frontend-service"
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000 &

# Rebuild and redeploy
docker build -t devops-tracker-frontend:latest ./frontend
kubectl delete pods -n devops-tracker -l app=frontend
```

#### 4. SQL Errors (Column Not Found)

**Symptoms**:
```
Error: column "entry_date" does not exist
```

**Root Cause**:
- Database schema uses `date` column
- Code references `entry_date`

**Solution**:
```bash
# Check database schema
kubectl exec -n devops-tracker postgres-0 -- psql -U devops_user -d devops_tracker -c "\d daily_entries"

# Fix: Update SQL queries to use correct column name
# Example: Change de.entry_date → de.date
```

#### 5. Authentication Failures

**Symptoms**:
```
401 Unauthorized
Invalid token
```

**Diagnosis**:
```bash
# Check JWT secret
kubectl get secret app-secrets -n devops-tracker -o jsonpath='{.data.JWT_SECRET}' | base64 -d

# Check token in browser console
localStorage.getItem('token')
```

**Solutions**:
```bash
# Clear browser storage
localStorage.clear()

# Regenerate JWT secret
kubectl delete secret app-secrets -n devops-tracker
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart deployment/backend -n devops-tracker
```

### Debugging Commands

```bash
# Get all resources
kubectl get all -n devops-tracker

# Describe deployment
kubectl describe deployment backend -n devops-tracker

# Execute command in pod
kubectl exec -it -n devops-tracker deployment/backend -- /bin/sh

# Port forward to backend
kubectl port-forward -n devops-tracker svc/backend-service 5000:5000

# View persistent volume claims
kubectl get pvc -n devops-tracker

# Check resource usage
kubectl top pods -n devops-tracker
kubectl top nodes
```

### Log Analysis

```bash
# Backend logs (last 100 lines)
kubectl logs -n devops-tracker -l app=backend --tail=100

# Frontend logs (follow)
kubectl logs -n devops-tracker -l app=frontend -f

# Postgres logs
kubectl logs -n devops-tracker postgres-0

# Filter logs for errors
kubectl logs -n devops-tracker -l app=backend | grep -i error

# Export logs to file
kubectl logs -n devops-tracker -l app=backend > backend-logs.txt
```

---

## 📝 Quick Reference

### Access URLs
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000 (via port-forward)
Database:  postgres-service:5432 (internal)
```

### Default Credentials
```
Admin:
  Email: admin@devopstracker.com
  Password: Admin123!

Demo User:
  Email: demo@devopstracker.com
  Password: Demo123!
```

### Management Scripts
```bash
./start.sh    # Deploy application
./stop.sh     # Stop port forwarding
./cleanup.sh  # Delete everything (WARNING: destructive)
```

### Useful Commands
```bash
# Check status
kubectl get pods -n devops-tracker

# View logs
kubectl logs -n devops-tracker -l app=backend -f

# Restart deployment
kubectl rollout restart deployment/backend -n devops-tracker

# Scale deployment
kubectl scale deployment/backend --replicas=3 -n devops-tracker

# Delete pod (will auto-recreate)
kubectl delete pod <pod-name> -n devops-tracker

# Access database
kubectl exec -it postgres-0 -n devops-tracker -- psql -U devops_user -d devops_tracker
```

---

## 🎯 Best Practices

### Development Workflow
1. Make code changes
2. Run `./stop.sh`
3. Run `./start.sh` (rebuilds images, forces pod restart)
4. Test changes at http://localhost:3000

### Production Considerations
1. Use versioned image tags (not `latest`)
2. Implement proper secrets management (e.g., Vault)
3. Add ingress controller for external access
4. Configure resource limits and requests
5. Set up monitoring (Prometheus/Grafana)
6. Implement backup strategy for database
7. Use managed database service
8. Add horizontal pod autoscaling
9. Implement CI/CD pipeline
10. Add SSL/TLS certificates

---

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)

---

**Last Updated**: 2026-05-03
**Version**: 1.0.0
**Maintainer**: DevOps Team
