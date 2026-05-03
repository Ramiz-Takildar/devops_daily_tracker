const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');
require('dotenv').config();

/**
 * Seed database with sample data
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create demo user
    console.log('Creating demo user...');
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role
       RETURNING id`,
      ['demo_user', 'demo@devopstracker.com', passwordHash, 'user']
    );

    const userId = userResult.rows[0].id;
    console.log(`✅ Demo user created with ID: ${userId}`);

    // Create admin user
    console.log('Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    
    const adminResult = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role
       RETURNING id`,
      ['admin', 'admin@devopstracker.com', adminPasswordHash, 'admin']
    );

    const adminId = adminResult.rows[0].id;
    console.log(`✅ Admin user created with ID: ${adminId}`);

    // Get tool IDs
    const toolsResult = await query('SELECT id, name FROM tools ORDER BY id');
    const tools = toolsResult.rows;
    console.log(`✅ Found ${tools.length} tools`);

    // Create sample daily entries (last 60 days)
    console.log('Creating sample daily entries...');
    const entries = [];
    const today = new Date();
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random chance of entry (80% chance)
      if (Math.random() > 0.2) {
        // 1-3 tools per day
        const numTools = Math.floor(Math.random() * 3) + 1;
        const selectedTools = [];
        
        for (let j = 0; j < numTools; j++) {
          const tool = tools[Math.floor(Math.random() * tools.length)];
          if (!selectedTools.includes(tool.id)) {
            selectedTools.push(tool.id);
            
            const hours = (Math.random() * 4 + 0.5).toFixed(2); // 0.5 to 4.5 hours
            const notes = generateNotes(tool.name);
            
            entries.push({
              userId,
              toolId: tool.id,
              date: dateStr,
              hours: parseFloat(hours),
              notes
            });
          }
        }
      }
    }

    // Insert entries
    for (const entry of entries) {
      await query(
        `INSERT INTO daily_entries (user_id, tool_id, date, hours_spent, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.userId, entry.toolId, entry.date, entry.hours, entry.notes]
      );
    }
    console.log(`✅ Created ${entries.length} daily entries`);

    // Create sample projects
    console.log('Creating sample projects...');
    const projects = [
      {
        name: 'CI/CD Pipeline Setup',
        description: 'Automated deployment pipeline using Jenkins and Docker for microservices architecture',
        techStack: ['Jenkins', 'Docker', 'Git', 'AWS', 'Kubernetes'],
        status: 'Completed',
        completion: 100,
        startDate: '2026-03-01',
        endDate: '2026-04-15'
      },
      {
        name: 'Kubernetes Cluster Deployment',
        description: 'Multi-node K8s cluster with monitoring using Prometheus and Grafana',
        techStack: ['Kubernetes', 'Docker', 'Prometheus', 'Grafana', 'Helm'],
        status: 'In Progress',
        completion: 65,
        startDate: '2026-04-01',
        endDate: null
      },
      {
        name: 'Infrastructure as Code with Terraform',
        description: 'AWS infrastructure provisioning using Terraform modules',
        techStack: ['Terraform', 'AWS', 'Git', 'Ansible'],
        status: 'In Progress',
        completion: 40,
        startDate: '2026-04-20',
        endDate: null
      },
      {
        name: 'Docker Containerization',
        description: 'Containerized legacy monolithic application into microservices',
        techStack: ['Docker', 'Docker Compose', 'Nginx', 'PostgreSQL'],
        status: 'Completed',
        completion: 100,
        startDate: '2026-02-15',
        endDate: '2026-03-20'
      },
      {
        name: 'Monitoring and Logging Setup',
        description: 'Centralized logging and monitoring solution for production environment',
        techStack: ['ELK Stack', 'Prometheus', 'Grafana', 'Kubernetes'],
        status: 'Not Started',
        completion: 0,
        startDate: '2026-05-15',
        endDate: null
      }
    ];

    for (const project of projects) {
      const projectResult = await query(
        `INSERT INTO projects (user_id, name, description, tech_stack, status, completion_percentage, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [userId, project.name, project.description, project.techStack, project.status, project.completion, project.startDate, project.endDate]
      );

      // Add project updates for in-progress and completed projects
      if (project.status !== 'Not Started') {
        const numUpdates = project.status === 'Completed' ? 5 : 3;
        for (let i = 0; i < numUpdates; i++) {
          const updateDate = new Date(project.startDate);
          updateDate.setDate(updateDate.getDate() + (i * 7));
          
          await query(
            `INSERT INTO project_updates (project_id, update_date, progress_note, hours_spent)
             VALUES ($1, $2, $3, $4)`,
            [
              projectResult.rows[0].id,
              updateDate.toISOString().split('T')[0],
              `Week ${i + 1} progress: ${generateProjectUpdate(project.name)}`,
              (Math.random() * 8 + 2).toFixed(2)
            ]
          );
        }
      }
    }
    console.log(`✅ Created ${projects.length} projects`);

    // Create sample goals
    console.log('Creating sample goals...');
    const goals = [
      {
        type: 'weekly_hours',
        title: 'Weekly Learning Goal',
        description: 'Complete 20 hours of learning this week',
        target: 20,
        startDate: getWeekStart(),
        endDate: getWeekEnd()
      },
      {
        type: 'tool_mastery',
        title: 'Master Docker',
        description: 'Reach 50 hours of Docker practice',
        target: 50,
        toolId: tools.find(t => t.name === 'Docker')?.id,
        startDate: '2026-04-01',
        endDate: '2026-06-30'
      },
      {
        type: 'streak',
        title: '30-Day Streak Challenge',
        description: 'Maintain a 30-day learning streak',
        target: 30,
        startDate: '2026-04-01',
        endDate: '2026-05-31'
      }
    ];

    for (const goal of goals) {
      await query(
        `INSERT INTO learning_goals (user_id, goal_type, title, description, target_value, tool_id, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, goal.type, goal.title, goal.description, goal.target, goal.toolId || null, goal.startDate, goal.endDate]
      );
    }
    console.log(`✅ Created ${goals.length} goals`);

    // Create sample notifications
    console.log('Creating sample notifications...');
    const notifications = [
      {
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: 'You\'ve earned the "First Steps" badge!'
      },
      {
        type: 'milestone',
        title: 'Milestone Reached! 🎉',
        message: 'Congratulations! You\'ve completed 50 hours of learning!'
      },
      {
        type: 'reminder',
        title: 'Daily Learning Reminder',
        message: 'Don\'t forget to log your learning today!'
      }
    ];

    for (const notification of notifications) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [userId, notification.type, notification.title, notification.message]
      );
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    // Update tool proficiency based on entries
    console.log('Updating tool proficiency...');
    for (const tool of tools) {
      const profResult = await query(
        `SELECT 
           SUM(hours_spent) as total_hours,
           COUNT(DISTINCT date) as practice_days,
           MAX(date) as last_practiced
         FROM daily_entries
         WHERE user_id = $1 AND tool_id = $2`,
        [userId, tool.id]
      );

      if (profResult.rows[0].total_hours > 0) {
        const totalHours = parseFloat(profResult.rows[0].total_hours);
        let proficiencyLevel = 'beginner';
        if (totalHours >= 100) proficiencyLevel = 'expert';
        else if (totalHours >= 50) proficiencyLevel = 'advanced';
        else if (totalHours >= 20) proficiencyLevel = 'intermediate';

        const consistencyScore = Math.min(100, Math.round((profResult.rows[0].practice_days / 60) * 100));

        await query(
          `INSERT INTO tool_proficiency (user_id, tool_id, total_hours, proficiency_level, consistency_score, practice_days, last_practiced)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id, tool_id) DO UPDATE
           SET total_hours = EXCLUDED.total_hours,
               proficiency_level = EXCLUDED.proficiency_level,
               consistency_score = EXCLUDED.consistency_score,
               practice_days = EXCLUDED.practice_days,
               last_practiced = EXCLUDED.last_practiced`,
          [userId, tool.id, totalHours, proficiencyLevel, consistencyScore, profResult.rows[0].practice_days, profResult.rows[0].last_practiced]
        );
      }
    }
    console.log('✅ Tool proficiency updated');

    // Update learning streak
    console.log('Calculating learning streak...');
    const datesResult = await query(
      'SELECT DISTINCT date FROM daily_entries WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );

    if (datesResult.rows.length > 0) {
      const dates = datesResult.rows.map(row => new Date(row.date));
      let currentStreak = 1;
      let longestStreak = 1;
      let tempStreak = 1;

      for (let i = 0; i < dates.length - 1; i++) {
        const daysDiff = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          if (i === 0) currentStreak++;
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      await query(
        `UPDATE learning_streaks
         SET current_streak = $1,
             longest_streak = $2,
             last_activity_date = $3,
             total_days_active = $4
         WHERE user_id = $5`,
        [currentStreak, longestStreak, dates[0], dates.length, userId]
      );
      console.log(`✅ Streak updated: Current ${currentStreak}, Longest ${longestStreak}`);
    }

    // Award some achievements
    console.log('Awarding achievements...');
    const achievementsToAward = ['First Steps', 'Week Warrior', 'Century Club', 'Project Pioneer'];
    
    for (const achievementName of achievementsToAward) {
      const achResult = await query(
        'SELECT id, points FROM achievements WHERE name = $1',
        [achievementName]
      );

      if (achResult.rows.length > 0) {
        await query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, achievement_id) DO NOTHING`,
          [userId, achResult.rows[0].id]
        );

        // Add points
        await query(
          `INSERT INTO user_points (user_id, total_points)
           VALUES ($1, $2)
           ON CONFLICT (user_id) 
           DO UPDATE SET total_points = user_points.total_points + $2`,
          [userId, achResult.rows[0].points]
        );
      }
    }

    // Update user level
    const pointsResult = await query(
      'SELECT total_points FROM user_points WHERE user_id = $1',
      [userId]
    );

    if (pointsResult.rows.length > 0) {
      const points = pointsResult.rows[0].total_points;
      const level = Math.floor(Math.sqrt(points / 100)) + 1;
      const pointsToNextLevel = Math.pow(level, 2) * 100 - points;

      await query(
        `UPDATE user_points 
         SET level = $1, points_to_next_level = $2
         WHERE user_id = $3`,
        [level, pointsToNextLevel, userId]
      );
      console.log(`✅ User level: ${level}, Points: ${points}`);
    }

    console.log('✅ Awarded achievements');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Demo User: demo@devopstracker.com / Demo123!`);
    console.log(`   - Daily Entries: ${entries.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Goals: ${goals.length}`);
    console.log(`   - Achievements Earned: ${achievementsToAward.length}`);
    console.log('\n🚀 You can now start the application!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Helper functions
function generateNotes(toolName) {
  const notes = {
    'Linux': [
      'Practiced shell scripting and automation',
      'Learned about process management and systemd',
      'Worked on file permissions and user management',
      'Studied networking commands and troubleshooting'
    ],
    'Git': [
      'Practiced branching and merging strategies',
      'Learned about rebasing and cherry-picking',
      'Worked on resolving merge conflicts',
      'Studied Git workflows and best practices'
    ],
    'Docker': [
      'Built multi-stage Dockerfiles',
      'Learned about Docker networking and volumes',
      'Practiced container orchestration basics',
      'Optimized Docker images for production'
    ],
    'Kubernetes': [
      'Deployed applications using kubectl',
      'Learned about pods, services, and deployments',
      'Practiced with ConfigMaps and Secrets',
      'Studied Kubernetes networking and ingress'
    ],
    'Jenkins': [
      'Created CI/CD pipelines',
      'Learned about Jenkins plugins and integrations',
      'Practiced with declarative pipelines',
      'Automated testing and deployment workflows'
    ],
    'Terraform': [
      'Wrote infrastructure as code for AWS',
      'Learned about Terraform modules and state management',
      'Practiced with variables and outputs',
      'Studied best practices for IaC'
    ],
    'AWS': [
      'Explored EC2 and S3 services',
      'Learned about IAM and security best practices',
      'Practiced with Lambda and serverless architecture',
      'Studied VPC and networking concepts'
    ],
    'Azure': [
      'Explored Azure services and portal',
      'Learned about Azure DevOps and pipelines',
      'Practiced with Azure Functions',
      'Studied Azure networking and security'
    ]
  };

  const toolNotes = notes[toolName] || ['Practiced and learned new concepts'];
  return toolNotes[Math.floor(Math.random() * toolNotes.length)];
}

function generateProjectUpdate(projectName) {
  const updates = [
    'Completed initial setup and configuration',
    'Implemented core functionality and testing',
    'Fixed bugs and improved performance',
    'Added documentation and examples',
    'Deployed to staging environment',
    'Conducted code review and refactoring',
    'Integrated with external services',
    'Optimized for production deployment'
  ];
  return updates[Math.floor(Math.random() * updates.length)];
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd() {
  const start = new Date(getWeekStart());
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0];
}

// Run seeding
seedDatabase();
