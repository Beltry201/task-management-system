const userService = require('../services/userService');

/**
 * Get all users with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, sortBy = 'createdAt', order = 'desc' } = req.query;
    const { id: requesterId, role: requesterRole } = req.user;

    const result = await userService.getUsers(
      { page: parseInt(page), limit: parseInt(limit), role, sortBy, order },
      requesterId,
      requesterRole,
      req
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserById = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const { id: requesterId, role: requesterRole } = req.user;

    const user = await userService.getUserById(userId, requesterId, requesterRole, req);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const { role: creatorRole } = req.user;

    const user = await userService.createUser(userData, creatorRole, req);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const updateData = req.body;
    const { id: requesterId, role: requesterRole } = req.user;

    const user = await userService.updateUser(userId, updateData, requesterId, requesterRole, req);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const { id: requesterId, role: requesterRole } = req.user;

    const message = await userService.deleteUser(userId, requesterId, requesterRole, req);

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's tasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next -Express next function
 */
const getUserTasks = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { id: requesterId, role: requesterRole } = req.user;

    const result = await userService.getUserTasks(
      userId,
      { page: parseInt(page), limit: parseInt(limit) },
      requesterId,
      requesterRole,
      req
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTasks
};
