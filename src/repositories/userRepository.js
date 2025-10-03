const pool = require('../config/database');

/**
 * Find user by email
 * @abstract {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
const findByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Find user by ID
 * @abstract {string} id - User ID
 * @returns {Object|null} User object or null if not found
 */
const findById = async (id) => {
  try {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new user
 * @abstract {Object} userData - User data object
 * @returns {Object} Created user without password_hash
 */
const create = async (userData) => {
  try {
    const {
      id,
      name,
      email,
      password_hash,
      phone_number,
      address_line1,
      address_line2,
      city,
      state_or_province,
      postal_code,
      country,
      role
    } = userData;

    const query = `
      INSERT INTO users (
        id, name, email, password_hash, phone_number,
        address_line1, address_line2, city, state_or_province,
        postal_code, country, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        id, name, email, phone_number, address_line1, address_line2,
        city, state_or_province, postal_code, country, role,
        created_at, updated_at
    `;

    const result = await pool.query(query, [
      id, name, email, password_hash, phone_number,
      address_line1, address_line2, city, state_or_province,
      postal_code, country, role
    ]);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Find all users with pagination
 * @abstract {Object} options - Pagination options
 * @abstract {number} options.limit - Number of users to return
 * @abstract {number} options.offset - Number of users to skip
 * @returns {Array} Array of users without password_hash
 */
const findAll = async ({ limit = 10, offset = 0 } = {}) => {
  try {
    const query = `
      SELECT 
        id, name, email, phone_number, address_line1, address_line2,
        city, state_or_province, postal_code, country, role,
        created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Count total number of users
 * @abstract {number} Total count of users
 */
const count = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findByEmail,
  findById,
  create,
  findAll,
  count
};
