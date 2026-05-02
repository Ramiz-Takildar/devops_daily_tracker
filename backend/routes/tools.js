const express = require('express');
const router = express.Router();
const {
  getAllTools,
  getEntries,
  getEntriesByDate,
  createEntry,
  updateEntry,
  deleteEntry,
  entryValidation,
  updateEntryValidation
} = require('../controllers/toolsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/tools
 * @desc    Get all tools
 * @access  Private
 */
router.get('/', getAllTools);

/**
 * @route   POST /api/tools
 * @desc    Create new tool
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, icon, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const { query } = require('../config/database');
    const result = await query(
      `INSERT INTO tools (name, category, icon, color, description) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, category || null, icon || null, color || '#6B7280', description || null]
    );

    res.json({
      success: true,
      message: 'Tool added successfully',
      tool: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding tool:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tool already exists' });
    }
    res.status(500).json({ error: 'Failed to add tool' });
  }
});

/**
 * @route   PUT /api/tools/:id
 * @desc    Update tool
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, icon, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const { query } = require('../config/database');
    const result = await query(
      `UPDATE tools 
       SET name = $1, category = $2, icon = $3, color = $4, description = $5
       WHERE id = $6
       RETURNING *`,
      [name, category || null, icon || null, color || '#6B7280', description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      success: true,
      message: 'Tool updated successfully',
      tool: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tool name already exists' });
    }
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

/**
 * @route   DELETE /api/tools/:id
 * @desc    Delete tool
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { query } = require('../config/database');
    const result = await query(
      'DELETE FROM tools WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({
      success: true,
      message: 'Tool deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

/**
 * @route   GET /api/entries
 * @desc    Get all entries with filters
 * @access  Private
 */
router.get('/entries', getEntries);

/**
 * @route   GET /api/entries/date/:date
 * @desc    Get entries by date
 * @access  Private
 */
router.get('/entries/date/:date', getEntriesByDate);

/**
 * @route   POST /api/entries
 * @desc    Create new entry
 * @access  Private
 */
router.post('/entries', entryValidation, createEntry);

/**
 * @route   PUT /api/entries/:id
 * @desc    Update entry
 * @access  Private
 */
router.put('/entries/:id', updateEntryValidation, updateEntry);

/**
 * @route   DELETE /api/entries/:id
 * @desc    Delete entry
 * @access  Private
 */
router.delete('/entries/:id', deleteEntry);

module.exports = router;
