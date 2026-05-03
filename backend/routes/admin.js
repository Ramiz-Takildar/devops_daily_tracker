const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM tools) as total_tools,
        (SELECT COALESCE(SUM(hours_spent), 0) FROM daily_entries) as total_hours,
        (SELECT COUNT(*) FROM daily_entries) as total_entries
    `);

    // Get most used tool
    const mostUsedTool = await pool.query(`
      SELECT t.name, COUNT(de.id) as usage_count
      FROM tools t
      LEFT JOIN daily_entries de ON t.id = de.tool_id
      GROUP BY t.id, t.name
      ORDER BY usage_count DESC
      LIMIT 1
    `);

    // Get user growth (last 30 days)
    const userGrowth = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get daily activity (last 7 days)
    const dailyActivity = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as entries,
        COALESCE(SUM(hours_spent), 0) as hours
      FROM daily_entries
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      stats: stats.rows[0],
      mostUsedTool: mostUsedTool.rows[0] || { name: 'N/A', usage_count: 0 },
      userGrowth: userGrowth.rows,
      dailyActivity: dailyActivity.rows
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /admin/users
 * Get all users with pagination and filters
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(status === 'active');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    );

    // Get users
    const users = await pool.query(
      `SELECT 
        id, username, email, role, bio, avatar, 
        created_at, last_login, is_active
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      users: users.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /admin/users/:id
 * Get user details with stats
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      `SELECT 
        id, username, email, role, bio, avatar, 
        created_at, last_login, is_active
      FROM users WHERE id = $1`,
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM daily_entries WHERE user_id = $1) as total_entries,
        (SELECT COALESCE(SUM(hours_spent), 0) FROM daily_entries WHERE user_id = $1) as total_hours,
        (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
        (SELECT COUNT(*) FROM goals WHERE user_id = $1) as total_goals
    `, [id]);

    res.json({
      user: user.rows[0],
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * PUT /admin/users/:id
 * Update user (role, status)
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    // Prevent admin from demoting themselves
    if (parseInt(id) === req.user.userId && role === 'user') {
      return res.status(400).json({ error: 'Cannot demote yourself from admin' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, username, email, role, is_active`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /admin/users/:id
 * Delete user and all related data
 */
router.delete('/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await client.query('BEGIN');

    // Delete user and cascade will handle related data
    const result = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.json({ 
      message: 'User deleted successfully',
      username: result.rows[0].username
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

/**
 * GET /admin/projects
 * Get all projects with owner info
 */
router.get('/projects', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`p.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`p.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM projects p ${whereClause}`,
      queryParams
    );

    const projects = await pool.query(
      `SELECT 
        p.id, p.name, p.description, p.status, p.start_date, p.end_date,
        p.created_at, u.username as owner_name, u.email as owner_email
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      projects: projects.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * DELETE /admin/projects/:id
 * Delete project
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ 
      message: 'Project deleted successfully',
      name: result.rows[0].name
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/**
 * GET /admin/tools
 * Get all tools with usage statistics
 */
router.get('/tools', async (req, res) => {
  try {
    const tools = await pool.query(`
      SELECT 
        t.id, t.name, t.category, t.description, t.icon,
        COUNT(de.id) as usage_count,
        COUNT(DISTINCT de.user_id) as unique_users,
        COALESCE(SUM(de.hours_spent), 0) as total_hours
      FROM tools t
      LEFT JOIN daily_entries de ON t.id = de.tool_id
      GROUP BY t.id, t.name, t.category, t.description, t.icon
      ORDER BY usage_count DESC
    `);

    res.json({ tools: tools.rows });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

/**
 * POST /admin/tools
 * Create new tool
 */
router.post('/tools', async (req, res) => {
  try {
    const { name, category, description, icon } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const result = await pool.query(
      `INSERT INTO tools (name, category, description, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, category, description, icon]
    );

    res.status(201).json({ 
      message: 'Tool created successfully',
      tool: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Tool with this name already exists' });
    }
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

/**
 * PUT /admin/tools/:id
 * Update tool
 */
router.put('/tools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, icon } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (category) {
      updates.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex}`);
      values.push(icon);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE tools 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ 
      message: 'Tool updated successfully',
      tool: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

/**
 * DELETE /admin/tools/:id
 * Delete tool
 */
router.delete('/tools/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tool is being used
    const usage = await pool.query(
      'SELECT COUNT(*) FROM daily_entries WHERE tool_id = $1',
      [id]
    );

    if (parseInt(usage.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete tool that is being used in entries',
        usageCount: parseInt(usage.rows[0].count)
      });
    }

    const result = await pool.query(
      'DELETE FROM tools WHERE id = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ 
      message: 'Tool deleted successfully',
      name: result.rows[0].name
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

/**
 * GET /admin/entries
 * Get all entries with filters
 */
router.get('/entries', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      user_id = '', 
      tool_id = '',
      start_date = '',
      end_date = ''
    } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (user_id) {
      whereConditions.push(`de.user_id = $${paramIndex}`);
      queryParams.push(user_id);
      paramIndex++;
    }

    if (tool_id) {
      whereConditions.push(`de.tool_id = $${paramIndex}`);
      queryParams.push(tool_id);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`de.date >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`de.date <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) 
       FROM daily_entries de
       JOIN users u ON de.user_id = u.id
       JOIN tools t ON de.tool_id = t.id
       ${whereClause}`,
      queryParams
    );

    const entries = await pool.query(
      `SELECT 
        de.id, de.date as entry_date, de.hours_spent, de.notes,
        u.username, u.email,
        t.name as tool_name, t.category as tool_category
      FROM daily_entries de
      JOIN users u ON de.user_id = u.id
      JOIN tools t ON de.tool_id = t.id
      ${whereClause}
      ORDER BY de.date DESC, de.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    res.json({
      entries: entries.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

/**
 * DELETE /admin/entries/:id
 * Delete entry
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM daily_entries WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

/**
 * GET /admin/analytics
 * Get advanced analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    // Tool usage distribution
    const toolDistribution = await pool.query(`
      SELECT 
        t.name,
        t.category,
        COUNT(de.id) as usage_count,
        COALESCE(SUM(de.hours_spent), 0) as total_hours
      FROM tools t
      LEFT JOIN daily_entries de ON t.id = de.tool_id
      GROUP BY t.id, t.name, t.category
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // User activity trends (last 30 days)
    const activityTrends = await pool.query(`
      SELECT 
        DATE(de.date) as date,
        COUNT(DISTINCT de.user_id) as active_users,
        COUNT(*) as total_entries,
        COALESCE(SUM(de.hours_spent), 0) as total_hours
      FROM daily_entries de
      WHERE de.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(de.date)
      ORDER BY date ASC
    `);

    // Top performing users
    const topUsers = await pool.query(`
      SELECT 
        u.username,
        u.email,
        COUNT(de.id) as total_entries,
        COALESCE(SUM(de.hours_spent), 0) as total_hours,
        COUNT(DISTINCT de.tool_id) as tools_used
      FROM users u
      LEFT JOIN daily_entries de ON u.id = de.user_id
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.email
      ORDER BY total_hours DESC
      LIMIT 10
    `);

    // Category distribution
    const categoryDistribution = await pool.query(`
      SELECT 
        t.category,
        COUNT(de.id) as usage_count,
        COALESCE(SUM(de.hours_spent), 0) as total_hours
      FROM tools t
      LEFT JOIN daily_entries de ON t.id = de.tool_id
      GROUP BY t.category
      ORDER BY usage_count DESC
    `);

    res.json({
      toolDistribution: toolDistribution.rows,
      activityTrends: activityTrends.rows,
      topUsers: topUsers.rows,
      categoryDistribution: categoryDistribution.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
