# 🔄 Persistence & Restart Guide

## What Persists After Container Restart?

This document explains what data persists when you restart the DevOps Daily Tracker application using `docker-compose down && docker-compose up -d`.

---

## ✅ Data That ALWAYS Persists

### 1. **Database Data** (100% Persistent)
All data stored in PostgreSQL persists via Docker volumes:

- ✅ **User Accounts**
  - Username, email, password
  - Profile picture (avatar)
  - Bio and preferences
  - Registration date
  - Last login timestamp

- ✅ **Tool Entries**
  - All daily learning entries
  - Hours spent per tool
  - Notes and descriptions
  - Entry timestamps
  - Multiple entries per tool per day

- ✅ **Tool Proficiency**
  - Total hours per tool
  - Proficiency levels
  - Last practiced dates
  - Automatically synced via database triggers

- ✅ **Projects**
  - Project details and descriptions
  - Tech stack information
  - Status and completion percentage
  - Start and end dates
  - Project updates and notes

- ✅ **Goals**
  - Learning goals and targets
  - Target hours and deadlines
  - Progress tracking
  - Completion status

- ✅ **Achievements**
  - Unlocked badges
  - Achievement timestamps
  - Progress towards locked achievements

- ✅ **Notifications**
  - All notifications
  - Read/unread status
  - Notification timestamps

- ✅ **Learning Streaks**
  - Current streak count
  - Longest streak record
  - Last activity date

### 2. **Database Schema** (100% Persistent)
- All tables and relationships
- Indexes for performance
- Database triggers (e.g., `sync_tool_proficiency_trigger`)
- Constraints and validations

### 3. **Application Code** (100% Persistent)
- Frontend React application
- Backend Express API
- Nginx configuration
- All custom modifications

---

## ❌ Data That Does NOT Persist

### 1. **Session Data**
- ❌ Active JWT tokens (users need to login again)
- ❌ Frontend state (Redux/Context)
- ❌ Cached API responses

### 2. **Temporary Files**
- ❌ Container logs (unless volume mounted)
- ❌ Temporary uploads in `/tmp`
- ❌ In-memory caches

### 3. **Environment Variables**
- ⚠️ Persist only if defined in `.env` files
- ⚠️ Not persistent if set via `docker-compose run -e`

---

## 🔒 How Persistence Works

### Docker Volume
```yaml
volumes:
  postgres_data:
    driver: local
```

The `postgres_data` volume is stored on your host machine at:
- **Mac/Linux**: `/var/lib/docker/volumes/devops_daily_tracker_postgres_data/_data`
- **Windows**: `C:\ProgramData\docker\volumes\devops_daily_tracker_postgres_data\_data`

### Database Initialization
1. **First Run**: `init.sql` creates all tables and inserts default tools
2. **Subsequent Runs**: PostgreSQL detects existing data and skips initialization
3. **Data Integrity**: All foreign keys and constraints are preserved

### Automatic Sync
The `sync_tool_proficiency_trigger` ensures:
- Tool proficiency updates automatically when entries are added/modified/deleted
- No manual recalculation needed
- Works immediately after restart

---

## 🚀 Restart Scenarios

### Scenario 1: Normal Restart
```bash
docker-compose down
docker-compose up -d
```
**Result**: All data persists ✅

### Scenario 2: Rebuild Containers
```bash
docker-compose down
docker-compose up -d --build
```
**Result**: All data persists ✅ (only code changes applied)

### Scenario 3: Remove Containers
```bash
docker-compose down
docker rm -f $(docker ps -aq)
docker-compose up -d
```
**Result**: All data persists ✅ (volumes remain intact)

### Scenario 4: Nuclear Reset (⚠️ DANGER)
```bash
docker-compose down -v
docker-compose up -d
```
**Result**: ALL DATA LOST ❌ (volumes deleted)

---

## 🧪 Testing Persistence

### Test Steps:
1. **Create Test Data**
   ```bash
   # Login and create some entries
   # Add a project
   # Set a goal
   # Upload profile picture
   ```

2. **Restart Application**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Verify Data**
   ```bash
   # Login with same credentials
   # Check all entries are present
   # Verify profile picture is still there
   # Confirm projects and goals exist
   ```

### Database Verification
```bash
# Connect to database
docker exec -it devops-tracker-db psql -U devops_user -d devops_tracker

# Check user count
SELECT COUNT(*) FROM users;

# Check entries count
SELECT COUNT(*) FROM daily_entries;

# Check tool proficiency
SELECT * FROM tool_proficiency;

# Exit
\q
```

---

## 📊 Data Backup

### Manual Backup
```bash
# Backup database
docker exec devops-tracker-db pg_dump -U devops_user devops_tracker > backup.sql

# Restore database
docker exec -i devops-tracker-db psql -U devops_user devops_tracker < backup.sql
```

### Automated Backup (Recommended)
Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * docker exec devops-tracker-db pg_dump -U devops_user devops_tracker > /backups/devops_tracker_$(date +\%Y\%m\%d).sql
```

---

## 🔧 Troubleshooting Persistence Issues

### Issue: Data Lost After Restart
**Possible Causes**:
1. Used `docker-compose down -v` (removes volumes)
2. Volume mount path changed
3. Database container name changed

**Solution**:
```bash
# Check if volume exists
docker volume ls | grep postgres_data

# Inspect volume
docker volume inspect devops_daily_tracker_postgres_data

# If volume is missing, restore from backup
docker exec -i devops-tracker-db psql -U devops_user devops_tracker < backup.sql
```

### Issue: Old Data Showing
**Possible Causes**:
1. Browser cache
2. Frontend not rebuilt

**Solution**:
```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or rebuild frontend
docker-compose up -d --build frontend
```

### Issue: Database Connection Failed
**Possible Causes**:
1. Database not fully started
2. Port conflict

**Solution**:
```bash
# Wait for database to be ready
docker-compose logs database

# Check database health
docker exec devops-tracker-db pg_isready -U devops_user
```

---

## 📝 Best Practices

### DO ✅
- Use `docker-compose down && docker-compose up -d` for normal restarts
- Regularly backup your database
- Keep `.env` files in version control (without sensitive data)
- Test persistence after major changes

### DON'T ❌
- Never use `docker-compose down -v` in production
- Don't modify data directly in volumes
- Don't change volume names without migration
- Don't delete volumes manually

---

## 🎯 Summary

| Data Type | Persists? | Storage Location |
|-----------|-----------|------------------|
| User accounts | ✅ Yes | PostgreSQL volume |
| Tool entries | ✅ Yes | PostgreSQL volume |
| Projects | ✅ Yes | PostgreSQL volume |
| Goals | ✅ Yes | PostgreSQL volume |
| Achievements | ✅ Yes | PostgreSQL volume |
| Profile pictures | ✅ Yes | PostgreSQL (base64) |
| Database schema | ✅ Yes | PostgreSQL volume |
| JWT tokens | ❌ No | Client-side (expires) |
| Frontend state | ❌ No | Browser memory |
| Container logs | ❌ No | Container filesystem |

---

## 🚀 Quick Commands

```bash
# Normal restart (data persists)
docker-compose down && docker-compose up -d

# Rebuild with data persistence
docker-compose up -d --build

# View logs
docker-compose logs -f

# Backup database
docker exec devops-tracker-db pg_dump -U devops_user devops_tracker > backup_$(date +%Y%m%d).sql

# Check volume
docker volume inspect devops_daily_tracker_postgres_data

# Database shell
docker exec -it devops-tracker-db psql -U devops_user -d devops_tracker
```

---

**Remember**: As long as you don't use the `-v` flag with `docker-compose down`, your data is safe! 🔒
