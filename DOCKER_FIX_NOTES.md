# Docker Build Fix Notes

## Issue Encountered

When building the frontend Docker image, the following error occurred:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/node_modules/dist/node/cli.js' imported from /app/node_modules/.bin/vite
```

This was caused by corrupted or incompatible package-lock.json being copied into the Docker build context, leading to incorrect Vite installation.

## Root Cause

The issue had two components:
1. **Node.js Version**: Vite 5.x requires Node.js 20+ for optimal ES module support
2. **Package Lock Corruption**: The existing package-lock.json had dependency resolution issues that caused incorrect module paths

## Solution Applied

### 1. Updated Node.js Version

Changed both Dockerfiles to use **Node.js 20** instead of Node.js 18:

**Frontend Dockerfile:**
```dockerfile
# Before
FROM node:18-alpine AS builder

# After
FROM node:20-alpine AS builder
```

**Backend Dockerfile:**
```dockerfile
# Before
FROM node:18-alpine AS builder
FROM node:18-alpine

# After
FROM node:20-alpine AS builder
FROM node:20-alpine
```

### 2. Fixed Dependency Resolution

**Created `.dockerignore` file:**
```
node_modules
npm-debug.log
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
dist
build
.git
.gitignore
README.md
.DS_Store
package-lock.json  # Critical: Exclude corrupted lock file
```

**Updated Dockerfile to copy only package.json:**
```dockerfile
# Before
COPY package*.json ./

# After
COPY package.json ./
```

This forces npm to generate a fresh package-lock.json during the Docker build, ensuring clean dependency resolution.

### 3. Final Working Dockerfile

```dockerfile
# Multi-stage build for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (only package.json, not package-lock.json)
COPY package.json ./

# Install dependencies (generates fresh package-lock.json)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Build Results

✅ **Successful Build Output:**
```
✓ 2141 modules transformed.
✓ built in 3.56s
dist/index.html                           1.67 kB │ gzip:  0.72 kB
dist/assets/index-CaoOstD1.css           52.29 kB │ gzip:  9.81 kB
dist/assets/react-vendor-7Vy3ZY2k.js    162.22 kB │ gzip: 52.73 kB
dist/assets/chart-vendor-DzkPv78s.js    193.38 kB │ gzip: 66.01 kB
```

## Why This Works

1. **Node 20 Benefits**:
   - Better ES module support
   - Improved compatibility with Vite 5.x
   - LTS version with security updates

2. **Fresh Dependency Resolution**:
   - Excludes potentially corrupted package-lock.json
   - npm generates clean lock file during build
   - Ensures correct module paths and dependencies

3. **Clean Build Context**:
   - .dockerignore prevents local artifacts from affecting build
   - Reduces build context size
   - Improves build reproducibility

## Verification

Both images now build successfully:

```bash
# Build backend
docker build -t devops-tracker-backend:1.0.0 ./backend

# Build frontend (fixed)
docker build -t devops-tracker-frontend:1.0.0 ./frontend
```

## Impact on Kubernetes Deployment

✅ No changes needed to Kubernetes manifests. The deployment will work with the updated images once they are built and loaded to the cluster.

## Recommendations

1. **For Local Development**: Delete package-lock.json and regenerate it with Node 20
2. **For CI/CD**: Ensure build environments use Node 20+
3. **For Production**: Consider using specific npm versions in Dockerfile (e.g., `RUN npm install -g npm@10.8.2`)

---

**Date**: 2026-05-02  
**Status**: ✅ Fixed and Verified  
**Build Time**: ~23 seconds (frontend)