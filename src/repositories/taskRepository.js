const pool = require('../config/database');
const { generateUuid } = require('../utils/id');

/**
 * Build dynamic WHERE clause for filtering
 */
function buildWhereClause(filters = {}) {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(filters.status);
    paramIndex++;
  }

  if (filters.priority) {
    conditions.push(`priority = $${paramIndex}`);
    values.push(filters.priority);
    paramIndex++;
  }

  if (filters.assignedTo) {
    conditions.push(`assigned_to = $${paramIndex}`);
    values.push(filters.assignedTo);
    paramIndex++;
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

/**
 * Map sort fields to database column names
 */
function mapSortField(sortBy) {
  const sortMap = {
    createdAt: 'created_at',
    dueDate: 'due_date',
    priority: 'priority',
    status: 'status'
  };
  return sortMap[sortBy] || 'created_at';
}

/**
 * Find all tasks with filtering and pagination
 */
const findAll = async ({ limit, offset, status, priority, assignedTo, sortBy = 'createdAt', order = 'desc' } = {}) => {
  try {
    const filters = { status, priority, assignedTo };
    const { whereClause, values } = buildWhereClause(filters);

    const sortField = mapSortField(sortBy);
    const safeOrder = (typeof order === 'string' && ['asc', 'desc'].includes(order.toLowerCase())) ? order.toUpperCase() : 'DESC';
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    let paramIndex = values.length + 1;

    const query = `
      SELECT 
        tasks.*,
        assigned_user.name as assigned_to_name,
        creator.name as created_by_name
      FROM tasks
      LEFT JOIN users assigned_user ON tasks.assigned_to = assigned_user.id
      LEFT JOIN users creator ON tasks.created_by = creator.id
      ${whereClause}
      ORDER BY tasks.${sortField} ${safeOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const allValues = [...values, safeLimit, safeOffset];
    const result = await pool.query(query, allValues);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Count total tasks with filters
 */
const count = async ({ status, priority, assignedTo } = {}) => {
  try {
    const filters = { status, priority, assignedTo };
    const { whereClause, values } = buildWhereClause(filters);

    const query = `
      SELECT COUNT(*) as total 
      FROM tasks 
      ${whereClause}
    `;

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  } catch (error) {
    throw error;
  }
};

/**
 * Find task by ID with user information
 */
const findById = async (id) => {
  try {
    const query = `
      SELECT 
        tasks.*,
        assigned_user.name as assigned_to_name,
        creator.name as created_by_name
      FROM tasks
      LEFT JOIN users assigned_user ON tasks.assigned_to = assigned_user.id
      LEFT JOIN users creator ON tasks.created_by = creator.id
      WHERE tasks.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new task
 */
const create = async (taskData) => {
  try {
    const {
      id,
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      created_by
    } = taskData;

    const query = `
      INSERT INTO tasks (
        id, title, description, status, priority, due_date, assigned_to, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, title, description, status, priority, due_date, assigned_to, created_by
    ]);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Update task
 */
const update = async (id, taskData) => {
  try {
    // Build dynamic SET clause
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (taskData.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(taskData.title);
      paramIndex++;
    }

    if (taskData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(taskData.description);
      paramIndex++;
    }

    if (taskData.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(taskData.status);
      paramIndex++;
    }

    if (taskData.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      values.push(taskData.priority);
      paramIndex++;
    }

    if (taskData.due_date !== undefined) {
      updateFields.push(`due_date = $${paramIndex}`);
      values.push(taskData.due_date);
      paramIndex++;
    }

    if (taskData.assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex}`);
      values.push(taskData.assigned_to);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id as the last parameter
    values.push(id);

    const query = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete task
 */
const deleteById = async (id) => {
  try {
    const query = 'DELETE FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Find tasks by user ID
 */
const findByUserId = async (userId, { limit, offset } = {}) => {
  try {
    const query = `
      SELECT 
        tasks.*,
        creator.name as created_by_name
      FROM tasks
      LEFT JOIN users creator ON tasks.created_by = creator.id
      WHERE tasks.assigned_to = $1
      ORDER BY tasks.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Count tasks by user ID
 */
const countByUserId = async (userId) => {
  try {
    const query = 'SELECT COUNT(*) as total FROM tasks WHERE assigned_to = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findAll,
  count,
  findById,
  create,
  update,
  delete: deleteById,
  findByUserId,
  countByUserId,
  generateUuid
};
