# Task Management System

A simple task management API built with Node.js, Express, and PostgreSQL, deployed on AWS Lambda.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env` file with:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### 3. Set up the database
```bash
npm run migrate
npm run seed
```

### 4. Run locally
```bash
npm run dev
```
Your API will be available at `http://localhost:3000`

### 5. Run tests
```bash
npm test
```

### 6. Deploy to AWS
```bash
serverless deploy
```

## What's included

- **Authentication**: JWT-based auth with user registration/login
- **Tasks**: CRUD operations for tasks with status management
- **Users**: User management and profiles
- **Database**: PostgreSQL with migrations and seeding
- **Testing**: Unit and integration tests with coverage reports

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/users/profile` - Get user profile
