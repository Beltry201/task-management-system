const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const app = require('../../src/app');

describe('Users Integration Tests (Simple)', () => {
  let adminToken;
  let testUserId;

  beforeAll(async () => {
    // Clean up any existing test data first
    try {
      const pool = require('../../src/config/database');
      await pool.query('DELETE FROM users WHERE email LIKE \'%quicktest%\' OR email LIKE \'%duplicatetest%\' OR email LIKE \'%crudtest%\'');
    } catch (error) {
      console.error('Pre-cleanup error:', error.message);
    }

    // Login as admin to get token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });

    adminToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const pool = require('../../src/config/database');
      await pool.query('DELETE FROM users WHERE email LIKE \'%quicktest%\' OR email LIKE \'%duplicatetest%\' OR email LIKE \'%crudtest%\'');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  });

  beforeEach(async () => {
    // Clean up any partial test data before each test
    try {
      const pool = require('../../src/config/database');
      if (testUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        testUserId = undefined;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('User Creation', () => {
    beforeEach(async () => {
      // Ensure clean state for user creation tests
      if (testUserId) {
        try {
          const pool = require('../../src/config/database');
          await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
          testUserId = undefined;
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should create a new user successfully', async () => {
      const newUser = {
        name: 'Quick Test User',
        email: 'quicktest@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.role).toBe(newUser.role);

      testUserId = response.body.data.id;
    });

    it('should reject duplicate email', async () => {
      // Create a user first
      const newUser = {
        name: 'First User',
        email: 'duplicatetest@example.com',
        password: 'password123',
        role: 'user'
      };

      await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      // Try to create another user with same email
      const duplicateUser = {
        name: 'Another User',
        email: 'duplicatetest@example.com', // Same email
        password: 'password456',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser)
        .expect(409);

      expect(response.body.error).toBe('Email already registered');

      // Clean up the created user
      const pool = require('../../src/config/database');
      await pool.query('DELETE FROM users WHERE email = $1', ['duplicatetest@example.com']);
    });
  });

  describe('User Listing', () => {
    it('should list all users (admin only)', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();

      // All returned users should have 'user' role
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('user');
      });
    });
  });

  describe('User CRUD', () => {
    let crudTestUserId;

    beforeEach(async () => {
      try {
        const pool = require('../../src/config/database');
        await pool.query('DELETE FROM users WHERE email = $1', ['crudtest@example.com']);
      } catch (error) {
      }

      const newUser = {
        name: 'CRUD Test User',
        email: 'crudtest@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      crudTestUserId = response.body.data.id;
    });

    it('should get a specific user', async () => {
      const response = await request(app)
        .get(`/users/${crudTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(crudTestUserId);
      expect(response.body.data.email).toBe('crudtest@example.com');
    });

    it('should update user information', async () => {
      const updateData = {
        name: 'Updated CRUD Test User',
        phoneNumber: '555-0001'
      };

      const response = await request(app)
        .put(`/users/${crudTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone_number).toBe(updateData.phoneNumber);
    });

    it('should get user tasks', async () => {
      const response = await request(app)
        .get(`/users/${crudTestUserId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });

    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/users/${crudTestUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });
  });
});
