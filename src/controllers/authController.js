const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

/**
 * Register new user
 * @abstract {Object} req - Express request object
 * @abstract {Object} res - Express response object
 * @abstract {Function} next - Express next function
 */
const register = async (req, res, next) => {
  try {
    const userData = req.body;

    const result = await authService.register(userData);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @abstract {Object} req - Express request object
 * @abstract {Object} res - Express response object
 * @abstract {Function} next - Express next function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @abstract {Object} req - Express request object
 * @abstract {Object} res - Express response object
 * @abstract {Function} next - Express next function
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
