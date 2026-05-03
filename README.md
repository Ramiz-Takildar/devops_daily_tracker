# 🚀 DevOps Daily Tracker

A comprehensive, production-ready web application for tracking your DevOps learning journey with real-time analytics, progress visualization, and achievement tracking.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Kubernetes](https://img.shields.io/badge/kubernetes-ready-brightgreen.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Development](#-development)

---

## 🎯 Overview

**DevOps Daily Tracker** is a modern, full-stack web application designed to help DevOps engineers, students, and professionals track their learning progress across various tools and technologies. Deployed on **Kubernetes** for production-grade reliability.

### Why DevOps Daily Tracker?

- **📊 Comprehensive Tracking**: Log daily hours spent on different DevOps tools
- **🎯 Goal Management**: Set and track learning goals with progress visualization
- **📈 Smart Analytics**: Get insights into your learning patterns and productivity
- **🏆 Achievements**: Unlock badges and milestones as you progress
- **📱 Modern UI**: Premium glassmorphism design with smooth animations
- **🔒 Secure**: JWT-based authentication with password encryption
- **☸️ Kubernetes Native**: Runs on any Kubernetes cluster
- **💾 Persistent**: All data survives pod restarts

---

## ✨ Features

### Core Features

- **Tool Tracking**: Log hours for 8+ DevOps tools (Linux, Git, Docker, Kubernetes, Jenkins, Terraform, AWS, Azure)
- **Dashboard**: Real-time statistics, weekly heatmap, proficiency overview
- **Analytics**: Interactive charts, time distribution, export as CSV/PDF
- **Project Tracking**: Manage DevOps projects with progress tracking
- **Goals & Achievements**: Set goals, unlock badges, track milestones
- **Profile Management**: Upload avatar, edit info, change password
- **Notifications**: Real-time alerts for goals and achievements

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** with Kubernetes enabled
- **kubectl** installed
- **8GB RAM** minimum

### Deploy in One Command

```bash
# Clone repository
git clone <repository-url>
cd devops_daily_tracker

# Start application
./start.sh
```

**Access:** http://localhost:3000

**Demo Account:**
- Email: `demo@devopstracker.com`
- Password: `Demo123!`

---

## 📝 Commands

### Start Application
```bash
./start.sh
```
Builds images, deploys to Kubernetes, creates demo user, and starts port-forwarding.

### Stop Application
```bash
./stop.sh
```
Stops all pods but **preserves data** in persistent volumes.

### Complete Cleanup
```bash
./cleanup.sh
```
**WARNING:** Removes everything including database. All data will be lost.

### View Logs
```bash
# Frontend logs
kubectl logs -n devops-tracker -l app=frontend -f

# Backend logs
kubectl logs -n devops-tracker -l app=backend -f

# Database logs
kubectl logs -n devops-tracker postgres-0 -f
```

### View Resources
```bash
kubectl get all -n devops-tracker
```

### Restart Port-Forward
```bash
kubectl port-forward -n devops-tracker svc/frontend-service 3000:3000
```

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication

### Infrastructure
- **Kubernetes** - Container orchestration
- **Docker** - Containerization
- **Nginx** - Reverse proxy

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │      │
│  │  (2 replicas)│  │  (2 replicas)│  │ (StatefulSet)│      │
│  │              │  │              │  │              │      │
│  │ Nginx+React  │  │ Node+Express │  │  PostgreSQL  │      │
│  │   Port 80    │  │  Port 5000   │  │  Port 5432   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                   │             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  │ LoadBalancer │  │  ClusterIP   │  │  ClusterIP   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                                     │             │
│         │                              ┌──────────────┐     │
│         │                              │     PVC      │     │
│         │                              │  (10GB Data) │     │
│         │                              └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
   Port-Forward
         │
         ▼
  http://localhost:3000
```

### Components

**Frontend (2 replicas)**
- Nginx serving React build
- Port 80 internally, 3000 externally
- LoadBalancer service

**Backend (2 replicas)**
- Node.js + Express API
- Port 5000
- ClusterIP service

**PostgreSQL (StatefulSet)**
- PostgreSQL 15 Alpine
- 10GB persistent volume
- Automatic initialization scripts

---

## 🔌 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Tool Tracking

#### Get All Tools
```http
GET /api/tools
Authorization: Bearer <token>
```

#### Create Entry
```http
POST /api/tools/entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "tool_id": 3,
  "date": "2026-05-02",
  "hours_spent": 2.5,
  "notes": "Learned Docker networking"
}
```

### Dashboard

#### Get Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

---

## 💻 Development

### Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Start database (Terminal 3)
kubectl port-forward -n devops-tracker svc/postgres-service 5432:5432
```

### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devops_tracker
DB_USER=devops_user
DB_PASSWORD=devops_pass
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n devops-tracker

# Check pod logs
kubectl logs <pod-name> -n devops-tracker

# Describe pod
kubectl describe pod <pod-name> -n devops-tracker
```

### Database Connection Failed
```bash
# Check PostgreSQL logs
kubectl logs postgres-0 -n devops-tracker

# Restart PostgreSQL
kubectl delete pod postgres-0 -n devops-tracker
```

### Reset Everything
```bash
./cleanup.sh
./start.sh
```

---

## 📊 Resource Requirements

- **CPU**: 2 cores minimum (4 recommended)
- **Memory**: 4GB minimum (8GB recommended)
- **Storage**: 15GB (10GB PostgreSQL + 5GB exports)
- **Kubernetes**: v1.20+ (Docker Desktop Kubernetes)

---

## 🔒 Security

- **Authentication**: JWT with 7-day expiration
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection**: Protected via parameterized queries
- **XSS Protection**: React's built-in escaping
- **CORS**: Configured for specific origins

---

## 📝 License

MIT License - Free to use for learning and portfolio purposes.

---

## 🎉 Acknowledgments

Built with ❤️ using modern web technologies and Kubernetes best practices.

**Happy Learning! 🚀**
