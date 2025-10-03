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
 * Find all users with pagination and filtering
 * @abstract {Object} options - Query options
 * @abstract {number} options.limit - Number of users to return
 * @abstract {number} options.offset - Number of users to skip
 * @abstract {string} options.role - Filter by role
 * @abstract {string} options.sortBy - Sort field
 * @abstract {string} options.order - Sort order (ASC/DESC)
 * @returns {Array} Array of users without password_hash
 */
const findAll = async ({ limit, offset, role, sortBy, order } = {}) => {
  try {
    let query = `
      SELECT 
        id, name, email, phone_number, address_line1, address_line2,
        city, state_or_province, postal_code, country, role,
        created_at, updated_at
      FROM users
    `;

    const values = [];
    let paramIndex = 1;

    if (role) {
      query += ` WHERE role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }
    const sortFieldMap = {
      'createdAt': 'created_at',
      'name': 'name',
      'email': 'email'
    };
    const sortField = sortFieldMap[sortBy] || 'created_at';

    query += ` ORDER BY ${sortField} ${order}`;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Count total number of users with optional role filter
 * @abstract {Object} options - Query options
 * @abstract {string} options.role - Filter by role
 * @returns {number} Total count of users
 */
const count = async ({ role } = {}) => {
  try {
    let query = 'SELECT COUNT(*) as total FROM users';
    const values = [];

    if (role) {
      query += ' WHERE role = $1';
      values.push(role);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  } catch (error) {
    throw error;
  }
};

/**
 * Update user by ID
 * @abstract {string} id - User ID
 * @abstract {Object} userData - Update data object
 * @returns {Object} Updated user without password_hash
 */
const update = async (id, userData) => {
  try {
    const updates = [];
    const values = [id];
    let paramIndex = 2;

    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        const snakeCaseKey = camelToSnakeCase(key);
        updates.push(`${snakeCaseKey} = $${paramIndex}`);
        values.push(userData[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING 
        id, name, email, phone_number, address_line1, address_line2,
        city, state_or_province, postal_code, country, role,
        created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user by ID
 * @abstract {string} id - User ID
 * @returns {boolean} Success indicator
 */
const deleteById = async (id) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Helper function to convert camelCase to snake_case
 * @abstract {string} str - CamelCase string
 * @returns {string} snake_case string
 */
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = {
  findByEmail,
  findById,
  create,
  findAll,
  count,
  update,
  deleteById
};
