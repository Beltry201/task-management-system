const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validators/authValidator');

/**
 * Authentication routes
 */

// POST /auth/register - Register new user
router.post('/register', validateRequest(registerSchema), authController.register);

// POST /auth/login - Login user
router.post('/login', validateRequest(loginSchema), authController.login);

// GET /auth/me - Get current user profile
router.get('/me', authenticate, authController.getMe);

module.exports = router;
