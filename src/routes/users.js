const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const validateQuery = require('../middleware/validateQuery');

const {
  createUserSchema,
  updateUserSchema,
  userQuerySchema
} = require('../validators/userValidator');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTasks
} = require('../controllers/userController');


// GET /users - List users (admin only)
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  validateQuery(userQuerySchema),
  getAllUsers
);

// POST /users - Create user (admin only)
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validateRequest(createUserSchema),
  createUser
);

// GET /users/:id - Get user by ID
router.get(
  '/:id',
  authenticate,
  getUserById
);

// PUT /users/:id - Update user
router.put(
  '/:id',
  authenticate,
  validateRequest(updateUserSchema),
  updateUser
);

// DELETE /users/:id - Delete user (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  deleteUser
);

// GET /users/:id/tasks - Get user's tasks
router.get(
  '/:id/tasks',
  authenticate,
  getUserTasks
);

module.exports = router;
