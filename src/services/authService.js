const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { generateUuid } = require('../utils/id');

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {Object} req - Express request object (optional)
 * @returns {Object} Created user and JWT token
 */
const register = async (userData, req = null) => {
  try {
    const { email, password } = userData;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      logger.logEvent('USER_REGISTRATION_FAILED', { reason: 'email_exists', email }, req);
      throw new AppError('Email already registered', 409);
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const id = generateUuid();

    const userForDB = {
      id,
      name: userData.name,
      email: userData.email,
      password_hash,
      phone_number: userData.phoneNumber || null,
      address_line1: userData.address?.addressLine1 || null,
      address_line2: userData.address?.addressLine2 || null,
      city: userData.address?.city || null,
      state_or_province: userData.address?.stateOrProvince || null,
      postal_code: userData.address?.postalCode || null,
      country: userData.address?.country || null,
      role: userData.role || 'user'
    };

    const createdUser = await userRepository.create(userForDB);

    const token = generateToken({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role
    });

    logger.logEvent('USER_REGISTERED', { userId: createdUser.id, email: createdUser.email }, req);

    return {
      user: createdUser,
      token
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} req - Express request object (optional)
 * @returns {Object} User data and JWT token
 */
const login = async (email, password, req = null) => {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.logEvent('LOGIN_FAILED', { reason: 'user_not_found', email }, req);
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logger.logEvent('LOGIN_FAILED', { reason: 'invalid_password', email }, req);
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const { password_hash, ...userWithoutPassword } = user;

    logger.logEvent('USER_LOGGED_IN', { userId: user.id, email: user.email }, req);

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn
    });
  } catch (error) {
    throw new AppError('Token generation failed', 500);
  }
};

module.exports = {
  register,
  login,
  generateToken
};
