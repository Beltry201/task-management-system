const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const app = require('../../src/app');
const pool = require('../../src/config/database');

describe('Authentication Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://macbookpro@localhost:5432/task_management';
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    try {
      await pool.query('DELETE FROM tasks WHERE created_by IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
      await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
    } catch (error) {
      console.error('Error cleaning test data:', error.message);
    }
  });

  afterEach(async () => {
    try {
      await pool.query('DELETE FROM tasks WHERE created_by IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
      await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
    } catch (error) {
      console.error('Error cleaning test data:', error.message);
    }
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phoneNumber: '+1234567890',
      address: {
        addressLine1: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      }
    };

    it('should register new user successfully (201)', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.name).toBe(validUserData.name);
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return user object and token', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject duplicate email (409)', async () => {
      await request(app)
        .post('/auth/register')
        .send(validUserData);

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email already registered');
    });

    it('should reject invalid email format (400)', async () => {
      const invalidUserData = {
        ...validUserData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject short password (400)', async () => {
      const invalidUserData = {
        ...validUserData,
        password: '123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      if (!response.body.success) {
        console.error('Registration failed:', response.body);
      }
    });

    it('should login with valid credentials (200)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password_hash).toBeUndefined();

      authToken = response.body.data.token;
    });

    it('should return user and token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid email (401)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject invalid password (401)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /auth/me', () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      if (loginResponse.body.success) {
        authToken = loginResponse.body.data.token;
      }
    });

    it('should return user data with valid token (200)', async () => {
      if (!authToken) {
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });

        if (!loginResponse.body.success) {
          throw new Error('Login failed for auth test');
        }

        authToken = loginResponse.body.data.token;
      }

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should reject without token (401)', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject with invalid token (401)', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should reject with malformed token (401)', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });
});
