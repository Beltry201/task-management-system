const taskService = require('../services/taskService');

/**
 * Get all tasks with filtering and pagination
 */
const getAllTasks = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const { id: userId, role: userRole } = req.user;

    const result = await taskService.getTasks({
      page: queryParams.page,
      limit: queryParams.limit,
      status: queryParams.status,
      priority: queryParams.priority,
      assignedTo: queryParams.assignedTo,
      sortBy: queryParams.sortBy,
      order: queryParams.order,
      userId,
      userRole
    }, req);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.tasks,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { id: userId, role: userRole } = req.user;

    const task = await taskService.getTaskById(taskId, userId, userRole, req);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new task
 */
const createTask = async (req, res, next) => {
  try {
    const taskData = req.body;
    const { id: userId } = req.user;

    taskData.createdBy = userId;

    const task = await taskService.createTask(taskData, req);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 */
const updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const updateData = req.body;
    const { id: userId, role: userRole } = req.user;

    const task = await taskService.updateTask(taskId, updateData, userId, userRole, req);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { id: userId, role: userRole } = req.user;

    await taskService.deleteTask(taskId, userId, userRole, req);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign task to user
 */
const assignTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { userId } = req.body;
    const { id: assignerId, role: assignerRole } = req.user;

    const task = await taskService.assignTask(taskId, userId, assignerId, assignerRole, req);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask
};
