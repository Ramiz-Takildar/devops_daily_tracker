-- DevOps Learning Tracker Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- TOOLS
-- ============================================

CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined DevOps tools
INSERT INTO tools (name, category, icon, color, description) VALUES
    ('Linux', 'Operating System', 'terminal', '#FCC624', 'Linux system administration and shell scripting'),
    ('Git', 'Version Control', 'git-branch', '#F05032', 'Version control and collaboration'),
    ('Docker', 'Containerization', 'docker', '#2496ED', 'Container platform for building and deploying applications'),
    ('Kubernetes', 'Orchestration', 'kubernetes', '#326CE5', 'Container orchestration and management'),
    ('Jenkins', 'CI/CD', 'jenkins', '#D24939', 'Continuous integration and deployment automation'),
    ('Terraform', 'IaC', 'terraform', '#7B42BC', 'Infrastructure as Code tool'),
    ('AWS', 'Cloud', 'aws', '#FF9900', 'Amazon Web Services cloud platform'),
    ('Azure', 'Cloud', 'azure', '#0078D4', 'Microsoft Azure cloud platform');

-- ============================================
-- DAILY ENTRIES (Tool Tracking)
-- ============================================

CREATE TABLE daily_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL CHECK (hours_spent > 0 AND hours_spent <= 24),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- UNIQUE constraint removed to allow multiple entries per tool per day
    -- This enables users to log multiple learning sessions for the same tool on the same day
);

CREATE INDEX idx_daily_entries_user_date ON daily_entries(user_id, date DESC);
CREATE INDEX idx_daily_entries_tool ON daily_entries(tool_id);
CREATE INDEX idx_daily_entries_user_tool ON daily_entries(user_id, tool_id);

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tech_stack TEXT[], -- Array of technologies
    status VARCHAR(20) DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_projects_user_date ON projects(user_id, created_at DESC);

-- ============================================
-- PROJECT UPDATES
-- ============================================

CREATE TABLE project_updates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    update_date DATE NOT NULL,
    progress_note TEXT NOT NULL,
    hours_spent DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_updates_project ON project_updates(project_id, update_date DESC);

-- ============================================
-- LEARNING STREAKS
-- ============================================

CREATE TABLE learning_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_days_active INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    daily_reminder_enabled BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '20:00:00',
    achievement_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    browser_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'reminder', 'achievement', 'milestone', 'goal', 'streak'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB, -- Additional data like achievement_id, goal_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================

CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50), -- 'streak', 'hours', 'project', 'tool', 'consistency'
    points INTEGER DEFAULT 0,
    criteria JSONB, -- Flexible criteria definition
    tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined achievements
INSERT INTO achievements (name, description, icon, category, points, criteria, tier) VALUES
    ('First Steps', 'Log your first learning entry', '🎯', 'milestone', 10, '{"type": "first_entry"}', 'bronze'),
    ('Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 50, '{"type": "streak", "days": 7}', 'silver'),
    ('Month Master', 'Maintain a 30-day learning streak', '💪', 'streak', 200, '{"type": "streak", "days": 30}', 'gold'),
    ('Century Club', 'Complete 100 hours of learning', '💯', 'hours', 100, '{"type": "total_hours", "hours": 100}', 'silver'),
    ('Half Millennium', 'Complete 500 hours of learning', '🏆', 'hours', 500, '{"type": "total_hours", "hours": 500}', 'platinum'),
    ('Tool Master', 'Spend 50+ hours on a single tool', '🎓', 'tool', 75, '{"type": "tool_hours", "hours": 50}', 'gold'),
    ('Project Pioneer', 'Complete your first project', '🚀', 'project', 30, '{"type": "project_complete", "count": 1}', 'bronze'),
    ('Project Pro', 'Complete 5 projects', '⭐', 'project', 150, '{"type": "project_complete", "count": 5}', 'gold'),
    ('Early Bird', 'Log an entry before 9 AM', '🌅', 'consistency', 20, '{"type": "time_of_day", "before": "09:00"}', 'bronze'),
    ('Night Owl', 'Log an entry after 10 PM', '🦉', 'consistency', 20, '{"type": "time_of_day", "after": "22:00"}', 'bronze'),
    ('Consistent Learner', 'Log entries for 5 consecutive days', '📚', 'consistency', 40, '{"type": "consecutive_days", "days": 5}', 'silver'),
    ('Goal Getter', 'Complete your first learning goal', '🎯', 'goal', 60, '{"type": "goal_complete", "count": 1}', 'silver');

CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, earned_at DESC);

CREATE TABLE user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    points_to_next_level INTEGER DEFAULT 100,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- GOALS
-- ============================================

CREATE TABLE learning_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'weekly_hours', 'monthly_hours', 'tool_mastery', 'project_completion', 'streak'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    tool_id INTEGER REFERENCES tools(id) ON DELETE SET NULL, -- For tool-specific goals
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_goals_user_status ON learning_goals(user_id, status, end_date);

-- ============================================
-- TOOL PROFICIENCY
-- ============================================

CREATE TABLE tool_proficiency (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    total_hours DECIMAL(10,2) DEFAULT 0,
    consistency_score INTEGER DEFAULT 0 CHECK (consistency_score >= 0 AND consistency_score <= 100),
    proficiency_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
    last_practiced DATE,
    practice_days INTEGER DEFAULT 0, -- Number of days practiced
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tool_id)
);

CREATE INDEX idx_tool_proficiency_user ON tool_proficiency(user_id);

-- ============================================
-- LEARNING SESSIONS (for time-of-day analytics)
-- ============================================

CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_hours DECIMAL(4,2),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    mood VARCHAR(20), -- 'focused', 'distracted', 'energetic', 'tired', 'motivated'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_sessions_user_date ON learning_sessions(user_id, session_date DESC);

-- ============================================
-- JOURNAL ENTRIES
-- ============================================

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL, -- Markdown format
    tags TEXT[],
    mood VARCHAR(20),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- ============================================
-- RESOURCES LIBRARY
-- ============================================

CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    url TEXT,
    description TEXT,
    resource_type VARCHAR(50), -- 'link', 'snippet', 'note', 'video', 'article'
    content TEXT, -- For code snippets or notes
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_user ON resources(user_id, created_at DESC);
CREATE INDEX idx_resources_tags ON resources USING GIN(tags);

-- ============================================
-- ANALYTICS CACHE (for performance)
-- ============================================

CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    cache_key VARCHAR(100) NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cache_key)
);

CREATE INDEX idx_analytics_cache_expiry ON analytics_cache(expires_at);

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON daily_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_goals_updated_at BEFORE UPDATE ON learning_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    COALESCE(SUM(de.hours_spent), 0) as total_hours,
    COUNT(DISTINCT de.date) as total_days_active,
    COUNT(DISTINCT de.tool_id) as tools_used,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT CASE WHEN p.status = 'Completed' THEN p.id END) as completed_projects,
    COALESCE(ls.current_streak, 0) as current_streak,
    COALESCE(ls.longest_streak, 0) as longest_streak,
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.level, 1) as user_level
FROM users u
LEFT JOIN daily_entries de ON u.id = de.user_id
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN learning_streaks ls ON u.id = ls.user_id
LEFT JOIN user_points up ON u.id = up.user_id
GROUP BY u.id, u.username, ls.current_streak, ls.longest_streak, up.total_points, up.level;

-- Tool usage summary view
CREATE OR REPLACE VIEW tool_usage_summary AS
SELECT 
    de.user_id,
    t.id as tool_id,
    t.name as tool_name,
    t.category,
    t.color,
    COUNT(DISTINCT de.date) as days_practiced,
    SUM(de.hours_spent) as total_hours,
    AVG(de.hours_spent) as avg_hours_per_session,
    MAX(de.date) as last_practiced,
    tp.proficiency_level
FROM daily_entries de
JOIN tools t ON de.tool_id = t.id
LEFT JOIN tool_proficiency tp ON de.user_id = tp.user_id AND de.tool_id = tp.tool_id
GROUP BY de.user_id, t.id, t.name, t.category, t.color, tp.proficiency_level;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'entry' as activity_type,
    de.id,
    de.user_id,
    t.name as title,
    CONCAT(de.hours_spent, ' hours on ', t.name) as description,
    de.date as activity_date,
    de.created_at
FROM daily_entries de
JOIN tools t ON de.tool_id = t.id
UNION ALL
SELECT 
    'project' as activity_type,
    p.id,
    p.user_id,
    p.name as title,
    CONCAT('Project status: ', p.status) as description,
    p.updated_at::date as activity_date,
    p.updated_at as created_at
FROM projects p
UNION ALL
SELECT 
    'achievement' as activity_type,
    ua.id,
    ua.user_id,
    a.name as title,
    a.description,
    ua.earned_at::date as activity_date,
    ua.earned_at as created_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
ORDER BY created_at DESC;

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Create default notification settings for new users (handled by trigger)
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id) VALUES (NEW.id);
    INSERT INTO learning_streaks (user_id) VALUES (NEW.id);
    INSERT INTO user_points (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_defaults AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_user_settings();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant all privileges to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO devops_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO devops_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO devops_user;

-- ============================================
-- DATABASE INITIALIZATION COMPLETE
-- ============================================

-- Log completion
-- ============================================
-- DATABASE TRIGGER FOR AUTO-SYNC
-- ============================================

-- Create function to automatically sync tool_proficiency with daily_entries
CREATE OR REPLACE FUNCTION sync_tool_proficiency()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tool_proficiency with actual sum from daily_entries
    UPDATE tool_proficiency tp
    SET 
        total_hours = (
            SELECT COALESCE(SUM(de.hours_spent), 0)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        last_practiced = (
            SELECT MAX(de.date)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        practice_days = (
            SELECT COUNT(DISTINCT de.date)
            FROM daily_entries de
            WHERE de.user_id = tp.user_id AND de.tool_id = tp.tool_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE tp.user_id = COALESCE(NEW.user_id, OLD.user_id) 
      AND tp.tool_id = COALESCE(NEW.tool_id, OLD.tool_id);
    
    -- Create proficiency record if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO tool_proficiency (user_id, tool_id, total_hours, last_practiced, practice_days)
        SELECT 
            COALESCE(NEW.user_id, OLD.user_id),
            COALESCE(NEW.tool_id, OLD.tool_id),
            COALESCE(SUM(de.hours_spent), 0),
            MAX(de.date),
            COUNT(DISTINCT de.date)
        FROM daily_entries de
        WHERE de.user_id = COALESCE(NEW.user_id, OLD.user_id)
          AND de.tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
        ON CONFLICT (user_id, tool_id) DO NOTHING;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_tool_proficiency_trigger ON daily_entries;

-- Create trigger on INSERT, UPDATE, DELETE
CREATE TRIGGER sync_tool_proficiency_trigger
AFTER INSERT OR UPDATE OR DELETE ON daily_entries
FOR EACH ROW
EXECUTE FUNCTION sync_tool_proficiency();

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'DevOps Learning Tracker database schema initialized successfully!';
    RAISE NOTICE 'Total tables created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Total views created: %', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public');
    RAISE NOTICE 'Database trigger sync_tool_proficiency_trigger installed successfully!';
END $$;
