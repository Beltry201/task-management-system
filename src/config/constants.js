/**
 * Application constants and enums
 */

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

module.exports = {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY
};
