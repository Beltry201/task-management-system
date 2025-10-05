const taskRepository = require('../repositories/taskRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { generateUuid } = taskRepository;

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
 * Get tasks with filtering and pagination
 */
const getTasks = async ({ page, limit, status, priority, assignedTo, sortBy, order, userId, userRole }, req = null) => {
  try {
    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const safeOrder = (typeof order === 'string' && ['asc', 'desc'].includes(order.toLowerCase())) ? order.toUpperCase() : 'DESC';
    const offset = (safePage - 1) * safeLimit;

    let finalAssignedTo = assignedTo;
    if (userRole === 'user') {
      finalAssignedTo = undefined;
    }

    const filters = {
      limit: safeLimit,
      offset,
      status,
      priority,
      assignedTo: finalAssignedTo,
      sortBy,
      order: safeOrder
    };

    let tasks;
    let total;

    if (userRole === 'user') {
      const combinedQuery = `
        SELECT 
          tasks.*,
          assigned_user.name as assigned_to_name,
          creator.name as created_by_name
        FROM tasks
        LEFT JOIN users assigned_user ON tasks.assigned_to = assigned_user.id
        LEFT JOIN users creator ON tasks.created_by = creator.id
        WHERE (tasks.created_by = $1 OR tasks.assigned_to = $1)
        ORDER BY tasks.${mapSortField(sortBy)} ${safeOrder}
        LIMIT $2 OFFSET $3
      `;

      const pool = require('../config/database');
      const result = await pool.query(combinedQuery, [userId, safeLimit, offset]);
      tasks = result.rows;

      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM tasks WHERE (created_by = $1 OR assigned_to = $1)',
        [userId]
      );
      total = parseInt(countResult.rows[0].total, 10);
    } else {
      tasks = await taskRepository.findAll(filters);
      total = await taskRepository.count(filters);
    }

    const totalPages = Math.ceil(total / safeLimit);

    logger.logEvent('TASKS_RETRIEVED', {
      count: tasks.length,
      total,
      page: safePage,
      filters: { status, priority, assignedTo }
    }, req);

    return {
      tasks,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get task by ID with authorization check
 */
const getTaskById = async (taskId, userId, userRole, req = null) => {
  try {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (userRole === 'user') {
      const canAccess = task.created_by === userId || task.assigned_to === userId;
      if (!canAccess) {
        logger.logEvent('TASK_ACCESS_DENIED', { taskId, userId, reason: 'unauthorized_access' }, req);
        throw new AppError('Not authorized to view this task', 403);
      }
    }

    logger.logEvent('TASK_RETRIEVED', { taskId, userId }, req);

    return task;
  } catch (error) {
    throw error;
  }
};

/**
 * Create new task
 */
const createTask = async ({ title, description, status, priority, dueDate, assignedTo, createdBy }, req = null) => {
  try {
    if (dueDate && new Date(dueDate) <= new Date()) {
      throw new AppError('Due date must be in the future', 400);
    }

    if (assignedTo) {
      const assignedUser = await userRepository.findById(assignedTo);
      if (!assignedUser) {
        throw new AppError('Assigned user not found', 404);
      }
    }

    const taskId = generateUuid();
    const taskData = {
      id: taskId,
      title,
      description: description || null,
      status: status || 'pending',
      priority: priority || 'medium',
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
      created_by: createdBy
    };

    const createdTask = await taskRepository.create(taskData);

    logger.logEvent('TASK_CREATED', {
      taskId: createdTask.id,
      title: createdTask.title,
      createdBy,
      assignedTo: createdTask.assigned_to
    }, req);

    return createdTask;
  } catch (error) {
    throw error;
  }
};

/**
 * Update task with authorization and validation checks
 */
const updateTask = async (taskId, updateData, userId, userRole, req = null) => {
  try {
    const existingTask = await taskRepository.findById(taskId);

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    if (userRole === 'user') {
      const canUpdate = existingTask.created_by === userId || existingTask.assigned_to === userId;
      if (!canUpdate) {
        logger.logEvent('TASK_UPDATE_DENIED', { taskId, userId, reason: 'unauthorized_update' }, req);
        throw new AppError('Not authorized to update this task', 403);
      }

      const filteredUpdateData = {};
      if (updateData.status !== undefined) filteredUpdateData.status = updateData.status;
      if (updateData.description !== undefined) filteredUpdateData.description = updateData.description;

      updateData = filteredUpdateData;
    }

    if (updateData.assignedTo !== undefined) {
      if (updateData.assignedTo) {
        const assignedUser = await userRepository.findById(updateData.assignedTo);
        if (!assignedUser) {
          throw new AppError('Assigned user not found', 404);
        }
      }
    }

    if (updateData.dueDate !== undefined) {
      if (updateData.dueDate && new Date(updateData.dueDate) <= new Date()) {
        throw new AppError('Due date must be in the future', 400);
      }
    }

    const dbUpdateData = {};
    Object.keys(updateData).forEach(key => {
      const dbKey = key === 'assignedTo' ? 'assigned_to' :
        key === 'dueDate' ? 'due_date' : key;
      dbUpdateData[dbKey] = updateData[key];
    });

    const updatedTask = await taskRepository.update(taskId, dbUpdateData);

    logger.logEvent('TASK_UPDATED', {
      taskId,
      userId,
      updatedFields: Object.keys(updateData)
    }, req);

    return updatedTask;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete task with authorization check
 */
const deleteTask = async (taskId, userId, userRole, req = null) => {
  try {
    const existingTask = await taskRepository.findById(taskId);

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    if (userRole === 'user') {
      const canDelete = existingTask.created_by === userId;
      if (!canDelete) {
        logger.logEvent('TASK_DELETE_DENIED', { taskId, userId, reason: 'unauthorized_delete' }, req);
        throw new AppError('Not authorized to delete this task', 403);
      }
    }

    const deleted = await taskRepository.delete(taskId);

    logger.logEvent('TASK_DELETED', { taskId, userId }, req);

    return { success: deleted };
  } catch (error) {
    throw error;
  }
};

/**
 * Assign task to user
 */
const assignTask = async (taskId, userId, assignerId, assignerRole, req = null) => {
  try {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const assigneeUser = await userRepository.findById(userId);
    if (!assigneeUser) {
      throw new AppError('User not found', 404);
    }

    if (assignerRole === 'user') {
      const canAssign = task.created_by === assignerId;
      if (!canAssign) {
        logger.logEvent('TASK_ASSIGN_DENIED', { taskId, userId, assignerId, reason: 'unauthorized_assign' }, req);
        throw new AppError('Not authorized to assign this task', 403);
      }
    }

    const updatedTask = await taskRepository.update(taskId, { assigned_to: userId });

    logger.logEvent('TASK_ASSIGNED', {
      taskId,
      assignedTo: userId,
      assignerId
    }, req);

    return updatedTask;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask
};
