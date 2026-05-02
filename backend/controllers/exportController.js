const { query } = require('../config/database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;

/**
 * Export daily entries as CSV
 */
const exportEntries = async (req, res) => {
  try {
    const { startDate, endDate, toolId } = req.query;
    const userId = req.user.userId;

    let queryText = `
      SELECT de.date, t.name as tool, de.hours_spent, de.notes, de.created_at
      FROM daily_entries de
      JOIN tools t ON de.tool_id = t.id
      WHERE de.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      queryText += ` AND de.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND de.date <= $${paramCount}`;
      params.push(endDate);
    }

    if (toolId) {
      paramCount++;
      queryText += ` AND de.tool_id = $${paramCount}`;
      params.push(toolId);
    }

    queryText += ' ORDER BY de.date DESC, de.created_at DESC';

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No entries found for the specified criteria'
      });
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    try {
      await fs.access(exportsDir);
    } catch {
      await fs.mkdir(exportsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `entries_${userId}_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'tool', title: 'Tool' },
        { id: 'hours_spent', title: 'Hours Spent' },
        { id: 'notes', title: 'Notes' },
        { id: 'created_at', title: 'Created At' }
      ]
    });

    // Format data
    const records = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      tool: row.tool,
      hours_spent: row.hours_spent,
      notes: row.notes || '',
      created_at: row.created_at.toISOString()
    }));

    // Write CSV
    await csvWriter.writeRecords(records);

    // Send file
    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export entries'
    });
  }
};

/**
 * Export projects as CSV
 */
const exportProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let queryText = `
      SELECT p.name, p.description, p.tech_stack, p.status, 
             p.completion_percentage, p.start_date, p.end_date,
             p.created_at, p.updated_at
      FROM projects p
      WHERE p.user_id = $1
    `;

    const params = [userId];

    if (status) {
      queryText += ' AND p.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY p.updated_at DESC';

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No projects found'
      });
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    try {
      await fs.access(exportsDir);
    } catch {
      await fs.mkdir(exportsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `projects_${userId}_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'name', title: 'Project Name' },
        { id: 'description', title: 'Description' },
        { id: 'tech_stack', title: 'Tech Stack' },
        { id: 'status', title: 'Status' },
        { id: 'completion_percentage', title: 'Completion %' },
        { id: 'start_date', title: 'Start Date' },
        { id: 'end_date', title: 'End Date' },
        { id: 'created_at', title: 'Created At' },
        { id: 'updated_at', title: 'Updated At' }
      ]
    });

    // Format data
    const records = result.rows.map(row => ({
      name: row.name,
      description: row.description || '',
      tech_stack: row.tech_stack ? row.tech_stack.join(', ') : '',
      status: row.status,
      completion_percentage: row.completion_percentage,
      start_date: row.start_date ? row.start_date.toISOString().split('T')[0] : '',
      end_date: row.end_date ? row.end_date.toISOString().split('T')[0] : '',
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString()
    }));

    // Write CSV
    await csvWriter.writeRecords(records);

    // Send file
    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export projects'
    });
  }
};

/**
 * Export analytics summary as CSV
 */
const exportAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // Get tool usage data
    let queryText = `
      SELECT t.name as tool, t.category,
             SUM(de.hours_spent) as total_hours,
             COUNT(DISTINCT de.date) as days_practiced,
             AVG(de.hours_spent) as avg_hours_per_session
      FROM daily_entries de
      JOIN tools t ON de.tool_id = t.id
      WHERE de.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      queryText += ` AND de.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryText += ` AND de.date <= $${paramCount}`;
      params.push(endDate);
    }

    queryText += ' GROUP BY t.id, t.name, t.category ORDER BY total_hours DESC';

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No analytics data found'
      });
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    try {
      await fs.access(exportsDir);
    } catch {
      await fs.mkdir(exportsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics_${userId}_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'tool', title: 'Tool' },
        { id: 'category', title: 'Category' },
        { id: 'total_hours', title: 'Total Hours' },
        { id: 'days_practiced', title: 'Days Practiced' },
        { id: 'avg_hours_per_session', title: 'Avg Hours/Session' }
      ]
    });

    // Format data
    const records = result.rows.map(row => ({
      tool: row.tool,
      category: row.category,
      total_hours: parseFloat(row.total_hours).toFixed(2),
      days_practiced: row.days_practiced,
      avg_hours_per_session: parseFloat(row.avg_hours_per_session).toFixed(2)
    }));

    // Write CSV
    await csvWriter.writeRecords(records);

    // Send file
    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics'
    });
  }
};

/**
 * Export complete learning report
 */
const exportCompleteReport = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const userResult = await query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );

    // Get summary stats
    const statsResult = await query(
      `SELECT 
         COALESCE(SUM(de.hours_spent), 0) as total_hours,
         COUNT(DISTINCT de.date) as total_days,
         COUNT(DISTINCT de.tool_id) as tools_used,
         ls.current_streak,
         ls.longest_streak,
         (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
         (SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'Completed') as completed_projects
       FROM users u
       LEFT JOIN daily_entries de ON u.id = de.user_id
       LEFT JOIN learning_streaks ls ON u.id = ls.user_id
       WHERE u.id = $1
       GROUP BY u.id, ls.current_streak, ls.longest_streak`,
      [userId]
    );

    // Get tool breakdown
    const toolsResult = await query(
      `SELECT t.name, SUM(de.hours_spent) as hours
       FROM daily_entries de
       JOIN tools t ON de.tool_id = t.id
       WHERE de.user_id = $1
       GROUP BY t.name
       ORDER BY hours DESC`,
      [userId]
    );

    // Create exports directory
    const exportsDir = path.join(__dirname, '..', 'exports');
    try {
      await fs.access(exportsDir);
    } catch {
      await fs.mkdir(exportsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `complete_report_${userId}_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    const user = userResult.rows[0];
    const stats = statsResult.rows[0];

    // Create report data
    const reportData = [
      { section: 'User Information', key: 'Username', value: user.username },
      { section: 'User Information', key: 'Email', value: user.email },
      { section: 'User Information', key: 'Report Date', value: new Date().toISOString().split('T')[0] },
      { section: '', key: '', value: '' },
      { section: 'Learning Summary', key: 'Total Hours', value: parseFloat(stats.total_hours).toFixed(2) },
      { section: 'Learning Summary', key: 'Total Days Active', value: stats.total_days },
      { section: 'Learning Summary', key: 'Tools Used', value: stats.tools_used },
      { section: 'Learning Summary', key: 'Current Streak', value: stats.current_streak || 0 },
      { section: 'Learning Summary', key: 'Longest Streak', value: stats.longest_streak || 0 },
      { section: 'Learning Summary', key: 'Total Projects', value: stats.total_projects },
      { section: 'Learning Summary', key: 'Completed Projects', value: stats.completed_projects },
      { section: '', key: '', value: '' },
      { section: 'Tool Breakdown', key: 'Tool', value: 'Hours' }
    ];

    // Add tool breakdown
    toolsResult.rows.forEach(tool => {
      reportData.push({
        section: 'Tool Breakdown',
        key: tool.name,
        value: parseFloat(tool.hours).toFixed(2)
      });
    });

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'section', title: 'Section' },
        { id: 'key', title: 'Metric' },
        { id: 'value', title: 'Value' }
      ]
    });

    // Write CSV
    await csvWriter.writeRecords(reportData);

    // Send file
    res.download(filepath, filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      try {
        await fs.unlink(filepath);
      } catch (unlinkErr) {
        console.error('File cleanup error:', unlinkErr);
      }
    });
  } catch (error) {
    console.error('Export complete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export complete report'
    });
  }
};

module.exports = {
  exportEntries,
  exportProjects,
  exportAnalytics,
  exportCompleteReport
};
