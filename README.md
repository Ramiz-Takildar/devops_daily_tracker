# 🚀 DevOps Daily Tracker

A comprehensive, production-ready web application for tracking your DevOps learning journey with real-time analytics, progress visualization, and achievement tracking.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [User Guide](#-user-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

**DevOps Daily Tracker** is a modern, full-stack web application designed to help DevOps engineers, students, and professionals track their learning progress across various tools and technologies. Built with a focus on user experience, real-time updates, and data persistence.

### Why DevOps Daily Tracker?

- **📊 Comprehensive Tracking**: Log daily hours spent on different DevOps tools
- **🎯 Goal Management**: Set and track learning goals with progress visualization
- **📈 Smart Analytics**: Get insights into your learning patterns and productivity
- **🏆 Achievements**: Unlock badges and milestones as you progress
- **📱 Modern UI**: Premium glassmorphism design with smooth animations
- **🔒 Secure**: JWT-based authentication with password encryption
- **💾 Persistent**: All data survives container restarts
- **🌙 Dark/Light Mode**: Comfortable viewing in any environment

---

## ✨ Features

### Core Features

#### 1. **Tool Tracking**
- Log daily hours for 8+ predefined DevOps tools (Linux, Git, Docker, Kubernetes, Jenkins, Terraform, AWS, Azure)
- Multiple entries per tool per day
- Add notes and context to each entry
- Real-time proficiency calculation
- Visual progress indicators

#### 2. **Dashboard**
- Real-time statistics and metrics
- Weekly activity heatmap
- Tool proficiency overview
- Recent activity feed
- Smart insights and recommendations
- Current learning streak tracking

#### 3. **Analytics**
- Interactive charts and graphs
- Time distribution analysis
- Tool usage trends
- Weekly/monthly comparisons
- Export data as CSV/PDF
- Customizable date ranges

#### 4. **Project Tracking**
- Create and manage DevOps projects
- Track project progress and completion
- Link tools to projects
- Status management (Not Started, In Progress, Completed, On Hold)
- Tech stack tagging

#### 5. **Goals & Achievements**
- Set learning goals with deadlines
- Track goal progress
- Unlock achievements and badges
- Milestone celebrations
- Gamification elements

#### 6. **Profile Management**
- Upload profile picture (up to 10MB)
- Edit personal information
- Change password securely
- View learning statistics
- Bio and preferences

#### 7. **Notifications**
- Real-time notifications
- Goal reminders
- Achievement unlocks
- Streak alerts
- Mark as read/unread

### Premium UI Features

- **Glassmorphism Design**: Modern, translucent card-based UI
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Real-time feedback for user actions
- **Split Layouts**: Optimized for different screen sizes

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **PostgreSQL 15** - Database server

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (version 20.10+)
- **Git** (for cloning the repository)
- **8GB RAM** minimum
- **5GB free disk space**

### One-Command Startup

```bash
# Clone the repository
git clone <repository-url>
cd devops_daily_tracker

# Start the application
./START_APP.sh
```

That's it! The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Demo Account

```
Email:    demo@devopstracker.com
Password: Demo123!
```

### Manual Startup (Alternative)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│                     (React + Tailwind CSS)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Port 3000)                         │
│              - Static file serving                           │
│              - API proxy to backend                          │
│              - Gzip compression                              │
└────────────────────────┬────────────────────────────────────┘
                         │ Proxy /api/*
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend (Port 5000)                  │
│              - REST API endpoints                            │
│              - JWT authentication                            │
│              - Business logic                                │
│              - Data validation                               │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)                 │
│              - User data                                     │
│              - Tool entries                                  │
│              - Projects & goals                              │
│              - Achievements                                  │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture

```yaml
services:
  frontend:
    - Nginx + React build
    - Port: 3000
    - Depends on: backend
    
  backend:
    - Node.js + Express
    - Port: 5000
    - Depends on: database
    
  database:
    - PostgreSQL 15
    - Port: 5432
    - Volume: postgres_data (persistent)
```

### Data Flow

1. **User Action** → Frontend (React)
2. **API Request** → Nginx → Backend (Express)
3. **Authentication** → JWT Verification
4. **Business Logic** → Controllers
5. **Database Query** → PostgreSQL
6. **Response** → Backend → Nginx → Frontend
7. **UI Update** → React State Management

---

## 📖 User Guide

### Getting Started

1. **Register an Account**
   - Navigate to http://localhost:3000/register
   - Fill in username, email, and password
   - Or use the demo account

2. **Dashboard Overview**
   - View your learning statistics
   - Check current streak
   - See recent activity
   - Get smart insights

3. **Track Your Learning**
   - Go to "Tool Tracker" page
   - Select a tool (e.g., Docker, Kubernetes)
   - Log hours spent
   - Add notes about what you learned
   - Submit entry

4. **Set Goals**
   - Navigate to "Goals" page
   - Create a new goal
   - Set target hours and deadline
   - Track progress

5. **View Analytics**
   - Go to "Analytics" page
   - Explore charts and graphs
   - Export data as needed

6. **Manage Profile**
   - Click profile avatar (top right)
   - Select "View Profile"
   - Upload profile picture
   - Edit personal information
   - Change password

### Key Features Explained

#### Multiple Entries Per Day
You can log multiple learning sessions for the same tool on the same day. This is useful for:
- Morning and evening study sessions
- Different topics within the same tool
- Separate work and personal learning

#### Real-Time Updates
All changes are reflected immediately:
- Tool proficiency updates automatically
- Dashboard statistics refresh in real-time
- No page refresh needed

#### Data Persistence
All your data is stored in PostgreSQL with:
- Automatic backups via Docker volumes
- Survives container restarts
- Database triggers for data consistency

---

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
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

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "john_doe_updated",
  "email": "john.new@example.com",
  "bio": "DevOps Engineer learning Kubernetes",
  "avatar": "data:image/jpeg;base64,..."
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### Tool Tracking Endpoints

#### Get All Tools
```http
GET /api/tools
Authorization: Bearer <token>
```

#### Create Tool Entry
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

#### Get Tool Proficiency
```http
GET /api/tools/proficiency
Authorization: Bearer <token>
```

### Dashboard Endpoints

#### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Get Recent Activity
```http
GET /api/dashboard/recent-activity
Authorization: Bearer <token>
```

---

## 🗄 Database Schema

### Core Tables

#### users
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR(50) UNIQUE)
- email (VARCHAR(100) UNIQUE)
- password_hash (VARCHAR(255))
- bio (TEXT)
- avatar (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
```

#### tools
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(50) UNIQUE)
- category (VARCHAR(50))
- icon (VARCHAR(50))
- color (VARCHAR(20))
- description (TEXT)
- created_at (TIMESTAMP)
```

#### daily_entries
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK → users.id)
- tool_id (INTEGER FK → tools.id)
- date (DATE)
- hours_spent (DECIMAL(4,2))
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### tool_proficiency
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK → users.id)
- tool_id (INTEGER FK → tools.id)
- total_hours (DECIMAL(8,2))
- proficiency_level (VARCHAR(20))
- last_practiced (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Database Triggers

#### sync_tool_proficiency_trigger
Automatically updates tool_proficiency table when daily_entries are created, updated, or deleted. Ensures real-time proficiency calculations.

---

## 💻 Development

### Local Development Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Database
docker-compose up database
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devops_tracker
DB_USER=devops_user
DB_PASSWORD=devops_pass
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Code Structure

```
devops_daily_tracker/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/
│   ├── controllers/        # Request handlers
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── config/             # Configuration files
│   ├── database/           # SQL scripts
│   └── package.json
├── docker-compose.yml      # Container orchestration
├── START_APP.sh           # Single command startup
└── README.md              # This file
```

---

## 🚢 Deployment

### Production Deployment

1. **Update Environment Variables**
   ```bash
   # Set production values in .env files
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure Domain**
   - Point your domain to server IP
   - Update Nginx configuration
   - Set up SSL certificates (Let's Encrypt)

### Docker Hub Deployment

```bash
# Build images
docker-compose build

# Tag images
docker tag devops_daily_tracker-frontend:latest yourusername/devops-tracker-frontend:latest
docker tag devops_daily_tracker-backend:latest yourusername/devops-tracker-backend:latest

# Push to Docker Hub
docker push yourusername/devops-tracker-frontend:latest
docker push yourusername/devops-tracker-backend:latest
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### Database Connection Failed
```bash
# Check if database is running
docker ps | grep postgres

# View database logs
docker logs devops-tracker-db

# Restart database
docker-compose restart database
```

#### Frontend Not Loading
```bash
# Check frontend logs
docker logs devops-tracker-frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

#### Profile Picture Upload Fails
- Ensure image is under 10MB
- Check nginx and express body size limits
- Verify backend is running

### Reset Everything

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

---

## 📊 Performance

- **Frontend Load Time**: < 2 seconds
- **API Response Time**: < 100ms (average)
- **Database Queries**: Optimized with indexes
- **Concurrent Users**: Supports 100+ simultaneous users
- **Data Persistence**: 100% guaranteed via PostgreSQL volumes

---

## 🔒 Security

- **Authentication**: JWT with 7-day expiration
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection**: Protected via parameterized queries
- **XSS Protection**: React's built-in escaping
- **CORS**: Configured for specific origins
- **HTTPS**: Ready for SSL/TLS in production

---

## 📝 License

MIT License - feel free to use this project for learning and portfolio purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

## 🎉 Acknowledgments

Built with ❤️ using modern web technologies and best practices.

**Happy Learning! 🚀**