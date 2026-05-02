const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectUpdate,
  getProjectUpdates,
  projectValidation,
  projectUpdateValidation
} = require('../controllers/projectsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get('/', getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:id', getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/', projectValidation, createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put('/:id', projectValidation, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/:id', deleteProject);

/**
 * @route   POST /api/projects/:id/updates
 * @desc    Add project update
 * @access  Private
 */
router.post('/:id/updates', projectUpdateValidation, addProjectUpdate);

/**
 * @route   GET /api/projects/:id/updates
 * @desc    Get project updates
 * @access  Private
 */
router.get('/:id/updates', getProjectUpdates);

module.exports = router;
