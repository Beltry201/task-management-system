const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../src/config/database');

// Generate UUID v4 using crypto
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * Seed script for creating sample data
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Sample users data
    const users = [
      {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        id: uuidv4(),
        name: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
        role: 'user'
      }
    ];

    // Hash passwords
    for (const user of users) {
      user.password_hash = await bcrypt.hash(user.password, 10);
      delete user.password;
    }

    // Insert users
    console.log('Creating sample users...');
    for (const user of users) {
      const query = `
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(query, [user.id, user.name, user.email, user.password_hash, user.role]);
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    // Sample tasks data
    const tasks = [
      {
        id: uuidv4(),
        title: 'Set up database schema',
        description: 'Create database tables and migrations for the task management system',
        status: 'completed',
        priority: 'high',
        assigned_to: users[1].id, // Regular user
        created_by: users[0].id // Admin user;
      },
      {
        id: uuidv4(),
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system with login/register endpoints',
        status: 'in_progress',
        priority: 'high',
        assigned_to: users[0].id, // Admin user
        created_by: users[0].id // Admin user
      },
      {
        id: uuidv4(),
        title: 'Build task CRUD operations',
        description: 'Create API endpoints for creating, reading, updating, and deleting tasks',
        status: 'pending',
        priority: 'medium',
        assigned_to: users[1].id, // Regular user
        created_by: users[0].id // Admin user
      },
      {
        id: uuidv4(),
        title: 'Design frontend interface',
        description: 'Create user-friendly interface for task management',
        status: 'pending',
        priority: 'low',
        assigned_to: null, // Unassigned
        created_by: users[1].id // Regular user
      },
      {
        id: uuidv4(),
        title: 'Add email notifications',
        description: 'Implement email notifications for task assignments and due dates',
        status: 'pending',
        priority: 'medium',
        assigned_to: users[0].id, // Admin user
        created_by: users[0].id // Admin user
      }
    ];

    // Insert tasks
    console.log('\nCreating sample tasks...');
    for (const task of tasks) {
      const query = `
        INSERT INTO tasks (id, title, description, status, priority, assigned_to, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(query, [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.assigned_to,
        task.created_by
      ]);
      console.log(`✅ Created task: ${task.title} (${task.status}, ${task.priority})`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Created ${users.length} users`);
    console.log(`- Created ${tasks.length} tasks`);
    console.log('\nSample login credentials:');
    users.forEach(user => {
      const password = user.email === 'admin@example.com' ? 'admin123' : 'user123';
      console.log(`  ${user.email} / ${password} (${user.role})`);
    });
    console.log('\nNote: Default passwords are for development only. Change them in production!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    // Close pool connection
    await pool.end();
  }
}

// Run seed if this script is executed directly
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
