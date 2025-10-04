const fs = require('fs').promises;
const path = require('path');
const pool = require('../src/config/database');

/**
 * Migration runner script
 * Runs all SQL migration files in the migrations directory
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Read migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);

    // Filter SQL files and sort them
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    console.log(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`\nRunning migration: ${file}`);

      try {
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');

        await pool.query(sql);
        console.log(`✅ Successfully executed: ${file}`);

      } catch (error) {
        console.error(`❌ Error executing migration ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close pool connection
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
