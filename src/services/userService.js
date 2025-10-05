const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const userRepository = require('../repositories/userRepository');
const taskRepository = require('../repositories/taskRepository');

/**
 * Get users with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {string} requesterId - ID of the user making the request
 * @param {string} requesterRole - Role of the user making the request
 * @returns {Object} Object with paginated users and pagination info
 */
const getUsers = async ({ page, limit, role, sortBy, order }, requesterId, requesterRole, req = null) => {
  if (requesterRole !== 'admin') {
    throw new AppError('Not authorized to list users', 403);
  }

  const offset = (page - 1) * limit;
  const users = await userRepository.findAll({ limit, offset, role, sortBy, order });
  const total = await userRepository.count({ role });
  const totalPages = Math.ceil(total / limit);

  logger.logEvent('USERS_RETRIEVED', {
    count: users.length,
    total,
    page,
    filters: { role }
  }, req);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

/**
 * Get user by ID
 * @param {string} userId - Target user ID
 * @param {string} requesterId - ID of the user making the request
 * @param {string} requesterRole - Role of the user making the request
 * @returns {Object} User object without password
 */
const getUserById = async (userId, requesterId, requesterRole, req = null) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (requesterRole === 'user' && userId !== requesterId) {
    logger.logEvent('USER_ACCESS_DENIED', { userId, requesterId, reason: 'unauthorized_access' }, req);
    throw new AppError('Not authorized to view this user', 403);
  }

  const { password_hash, ...userWithoutPassword } = user;

  logger.logEvent('USER_RETRIEVED', { userId, requesterId }, req);

  return userWithoutPassword;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} creatorRole - Role of the user creating the new user
 * @returns {Object} Created user without password
 */
const createUser = async ({ name, email, password, phoneNumber, address, role }, creatorRole, req = null) => {
  if (creatorRole !== 'admin') {
    throw new AppError('Not authorized to create users', 403);
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    logger.logEvent('USER_CREATION_FAILED', { reason: 'email_exists', email }, req);
    throw new AppError('Email already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const id = crypto.randomUUID();

  const {
    addressLine1 = null,
    addressLine2 = null,
    city = null,
    stateOrProvince = null,
    postalCode = null,
    country = null
  } = address || {};

  const userData = {
    id,
    name,
    email,
    password_hash,
    phone_number: phoneNumber || null,
    address_line1: addressLine1 || null,
    address_line2: addressLine2 || null,
    city: city || null,
    state_or_province: stateOrProvince || null,
    postal_code: postalCode || null,
    country: country || null,
    role: role || 'user'
  };

  const createdUser = await userRepository.create(userData);

  logger.logEvent('USER_CREATED', {
    userId: createdUser.id,
    email: createdUser.email,
    role: createdUser.role
  }, req);

  return createdUser;
};

/**
 * Update user
 * @param {string} userId - Target user ID
 * @param {Object} updateData - Update data
 * @param {string} requesterId - ID of the user making the request
 * @param {string} requesterRole - Role of the user making the request
 * @returns {Object} Updated user without password
 */
const updateUser = async (userId, updateData, requesterId, requesterRole, req = null) => {
  const existingUser = await userRepository.findById(userId);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  };

  if (requesterRole === 'user' && userId !== requesterId) {
    logger.logEvent('USER_UPDATE_DENIED', { userId, requesterId, reason: 'unauthorized_update' }, req);
    throw new AppError('Not authorized to update this user', 403);
  }

  if (requesterRole === 'user' && 'role' in updateData) {
    delete updateData.role;
  }

  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await userRepository.findByEmail(updateData.email);
    if (emailExists) {
      logger.logEvent('USER_UPDATE_FAILED', { userId, reason: 'email_exists', email: updateData.email }, req);
      throw new AppError('Email already in use', 409);
    }
  }

  if (updateData.address) {
    const {
      addressLine1,
      addressLine2,
      city,
      stateOrProvince,
      postalCode,
      country
    } = updateData.address;

    updateData.address_line1 = addressLine1 || null;
    updateData.address_line2 = addressLine2 || null;
    updateData.city = city || null;
    updateData.state_or_province = stateOrProvince || null;
    updateData.postal_code = postalCode || null;
    updateData.country = country || null;

    delete updateData.address;
  }

  if (updateData.phoneNumber !== undefined) {
    updateData.phone_number = updateData.phoneNumber || null;
    delete updateData.phoneNumber;
  }

  const updatedUser = await userRepository.update(userId, updateData);

  logger.logEvent('USER_UPDATED', {
    userId,
    requesterId,
    updatedFields: Object.keys(updateData)
  }, req);

  return updatedUser;
};

/**
 * Delete user
 * @param {string} userId - Target user ID
 * @param {string} requesterId - ID of the user making the request
 * @param {string} requesterRole - Role of the user making the request
 * @returns {string} Success message
 */
const deleteUser = async (userId, requesterId, requesterRole, req = null) => {
  if (requesterRole !== 'admin') {
    throw new AppError('Not authorized to delete users', 403);
  }

  if (userId === requesterId) {
    logger.logEvent('USER_DELETE_FAILED', { userId, reason: 'self_deletion' }, req);
    throw new AppError('Cannot delete your own account', 400);
  }

  const existingUser = await userRepository.findById(userId);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  await userRepository.deleteById(userId);

  logger.logEvent('USER_DELETED', { userId, deletedBy: requesterId }, req);

  return 'User deleted successfully';
};

/**
 * Get tasks for a specific user
 * @param {string} userId - Target user ID
 * @param {Object} params - Pagination parameters
 * @param {string} requesterId - ID of the user making the request
 * @param {string} requesterRole - Role of the user making the request
 * @returns {Object} Object with paginated tasks and pagination info
 */
const getUserTasks = async (userId, { page, limit }, requesterId, requesterRole, req = null) => {
  if (requesterRole === 'user' && userId !== requesterId) {
    throw new AppError('Not authorized to view this user\'s tasks', 403);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const offset = (page - 1) * limit;
  const tasks = await taskRepository.findByUserId(userId, { limit, offset });
  const total = await taskRepository.countByUserId(userId);
  const totalPages = Math.ceil(total / limit);

  logger.logEvent('USER_TASKS_RETRIEVED', {
    userId,
    requesterId,
    count: tasks.length,
    total
  }, req);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTasks
};
