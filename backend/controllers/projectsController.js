const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * Get all projects for user
 */
const getAllProjects = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*,
             (SELECT COUNT(*) FROM project_updates WHERE project_id = p.id) as update_count,
             (SELECT MAX(update_date) FROM project_updates WHERE project_id = p.id) as last_update
      FROM projects p
      WHERE p.user_id = $1
    `;

    const params = [req.user.userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      queryText += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    queryText += ` ORDER BY p.updated_at DESC`;

    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM projects WHERE user_id = $1';
    const countParams = [req.user.userId];
    
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      projects: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
};

/**
 * Get single project with details
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project
    const projectResult = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM project_updates WHERE project_id = p.id) as update_count
       FROM projects p
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.user.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get project updates
    const updatesResult = await query(
      `SELECT * FROM project_updates 
       WHERE project_id = $1 
       ORDER BY update_date DESC, created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      project: {
        ...projectResult.rows[0],
        updates: updatesResult.rows
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
};

/**
 * Create new project
 */
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, techStack, status, completionPercentage, startDate, endDate } = req.body;

    const result = await query(
      `INSERT INTO projects (user_id, name, description, tech_stack, status, completion_percentage, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.userId, name, description, techStack, status || 'Not Started', completionPercentage || 0, startDate, endDate]
    );

    // Check for project-related achievements
    await checkProjectAchievements(req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
};

/**
 * Update project
 */
const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, techStack, status, completionPercentage, startDate, endDate } = req.body;

    // Check if project exists and belongs to user
    const existing = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const result = await query(
      `UPDATE projects 
       SET name = $1, description = $2, tech_stack = $3, status = $4, 
           completion_percentage = $5, start_date = $6, end_date = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [name, description, techStack, status, completionPercentage, startDate, endDate, id, req.user.userId]
    );

    // Check if project was just completed
    if (status === 'Completed' && existing.rows[0].status !== 'Completed') {
      await checkProjectAchievements(req.user.userId);
      
      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'milestone', $2, $3, $4)`,
        [
          req.user.userId,
          'Project Completed! 🎉',
          `Congratulations! You've completed "${name}"`,
          JSON.stringify({ project_id: id })
        ]
      );
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
};

/**
 * Delete project
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to user
    const existing = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Delete project (cascade will delete updates)
    await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
};

/**
 * Add project update
 */
const addProjectUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { updateDate, progressNote, hoursSpent } = req.body;

    // Check if project exists and belongs to user
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Add update
    const result = await query(
      `INSERT INTO project_updates (project_id, update_date, progress_note, hours_spent)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, updateDate, progressNote, hoursSpent]
    );

    // Update project's updated_at timestamp
    await query(
      'UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.status(201).json({
      success: true,
      message: 'Project update added successfully',
      update: result.rows[0]
    });
  } catch (error) {
    console.error('Add project update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add project update'
    });
  }
};

/**
 * Get project updates
 */
const getProjectUpdates = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const result = await query(
      `SELECT * FROM project_updates 
       WHERE project_id = $1 
       ORDER BY update_date DESC, created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      updates: result.rows
    });
  } catch (error) {
    console.error('Get project updates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project updates'
    });
  }
};

/**
 * Helper: Check project-related achievements
 */
const checkProjectAchievements = async (userId) => {
  try {
    // Count completed projects
    const result = await query(
      `SELECT COUNT(*) as completed_count 
       FROM projects 
       WHERE user_id = $1 AND status = 'Completed'`,
      [userId]
    );

    const completedCount = parseInt(result.rows[0].completed_count);

    const achievements = [
      { name: 'Project Pioneer', condition: completedCount >= 1 },
      { name: 'Project Pro', condition: completedCount >= 5 }
    ];

    for (const achievement of achievements) {
      if (achievement.condition) {
        // Check if already earned
        const earned = await query(
          `SELECT ua.id FROM user_achievements ua
           JOIN achievements a ON ua.achievement_id = a.id
           WHERE ua.user_id = $1 AND a.name = $2`,
          [userId, achievement.name]
        );

        if (earned.rows.length === 0) {
          // Award achievement
          const achResult = await query(
            'SELECT id, points FROM achievements WHERE name = $1',
            [achievement.name]
          );

          if (achResult.rows.length > 0) {
            await query(
              'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
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

            // Update level
            await updateUserLevel(userId);

            // Create notification
            await query(
              `INSERT INTO notifications (user_id, type, title, message)
               VALUES ($1, 'achievement', $2, $3)`,
              [userId, 'Achievement Unlocked!', `You've earned the "${achievement.name}" badge!`]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Check project achievements error:', error);
  }
};

/**
 * Helper: Update user level based on points
 */
const updateUserLevel = async (userId) => {
  try {
    const result = await query(
      'SELECT total_points FROM user_points WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) return;

    const points = result.rows[0].total_points;
    
    // Level calculation: Level = floor(sqrt(points / 100)) + 1
    const level = Math.floor(Math.sqrt(points / 100)) + 1;
    const pointsToNextLevel = Math.pow(level, 2) * 100 - points;

    await query(
      `UPDATE user_points 
       SET level = $1, points_to_next_level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [level, pointsToNextLevel, userId]
    );
  } catch (error) {
    console.error('Update user level error:', error);
  }
};

/**
 * Validation rules
 */
const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('techStack')
    .optional()
    .isArray()
    .withMessage('Tech stack must be an array'),
  body('status')
    .optional()
    .isIn(['Not Started', 'In Progress', 'Completed', 'On Hold'])
    .withMessage('Invalid status'),
  body('completionPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Completion percentage must be between 0 and 100'),
  body('startDate')
    .optional()
    .isDate()
    .withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isDate()
    .withMessage('Invalid end date')
];

const projectUpdateValidation = [
  body('updateDate')
    .isDate()
    .withMessage('Valid update date is required'),
  body('progressNote')
    .trim()
    .notEmpty()
    .withMessage('Progress note is required')
    .isLength({ max: 1000 })
    .withMessage('Progress note must not exceed 1000 characters'),
  body('hoursSpent')
    .optional()
    .isFloat({ min: 0.1, max: 24 })
    .withMessage('Hours spent must be between 0.1 and 24')
];

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectUpdate,
  getProjectUpdates,
  projectValidation,
  projectUpdateValidation
};
