const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const validateQuery = require('../middleware/validateQuery');
const { createTaskSchema, updateTaskSchema, taskQuerySchema } = require('../validators/taskValidator');
const { assignTaskSchema } = require('../validators/userValidator');

/**
 * Task routes
 */

// All routes require authentication
router.use(authenticate);

// GET /tasks/summary?limit=10 - AI summary of newest tasks (define before :id routes)
router.get('/summary', taskController.getTasksSummary);

// GET /tasks - List all tasks with filtering and pagination
router.get('/', validateQuery(taskQuerySchema), taskController.getAllTasks);

// POST /tasks - Create new task
router.post('/', validateRequest(createTaskSchema), taskController.createTask);

// GET /tasks/:id - Get task by ID
router.get('/:id', taskController.getTaskById);

// PUT /tasks/:id - Update task
router.put('/:id', validateRequest(updateTaskSchema), taskController.updateTask);

// DELETE /tasks/:id - Delete task
router.delete('/:id', taskController.deleteTask);

// POST /tasks/:id/assign - Assign task to user
router.post('/:id/assign', validateRequest(assignTaskSchema), taskController.assignTask);

module.exports = router;
