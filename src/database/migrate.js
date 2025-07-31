const { Pool } = require('pg');

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your .env file or environment variables.');
  console.error('Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/user_profiles');
  process.exit(1);
}

async function migrate() {
  let adminPool = null;
  let appPool = null;
  
  try {
    process.stdout.write('Starting database migration...\n');

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL || typeof process.env.DATABASE_URL !== 'string') {
      throw new Error('DATABASE_URL environment variable is not set or is invalid');
    }

    // Parse the DATABASE_URL to get connection details
    let url;
    try {
      url = new URL(process.env.DATABASE_URL);
    } catch (urlError) {
      throw new Error(`Invalid DATABASE_URL format: ${process.env.DATABASE_URL}. Error: ${urlError.message}`);
    }

    const databaseName = url.pathname.substring(1); // Remove leading slash
    if (!databaseName) {
      throw new Error('Database name is missing from DATABASE_URL');
    }

    const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port || 5432}/postgres`;

    // Connect to default postgres database to create our database
    adminPool = new Pool({
      connectionString: adminUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Create database if it doesn't exist
    try {
      await adminPool.query(`CREATE DATABASE "${databaseName}"`);
      process.stdout.write(`Database "${databaseName}" created successfully.\n`);
    } catch (error) {
      if (error.code === '42P04') {
        // Database already exists
        process.stdout.write(`Database "${databaseName}" already exists.\n`);
      } else {
        throw error;
      }
    }

    // Close admin connection
    await adminPool.end();

    // Connect to the actual database
    appPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Create user_profiles table
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_name ON user_profiles(first_name, last_name);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
    `);

    // Create function to update the updated_at timestamp
    await appPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger to automatically update updated_at
    await appPool.query(`
      DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
      CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);

    process.stdout.write('Database migration completed successfully!\n');
  } catch (error) {
    process.stderr.write(`Migration failed: ${error.message}\n`);
    if (error.message.includes('DATABASE_URL')) {
      process.stderr.write('\nTo fix this issue:\n');
      process.stderr.write('1. Create a .env file in the project root\n');
      process.stderr.write('2. Add the following line to your .env file:\n');
      process.stderr.write('   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/user_profiles\n');
      process.stderr.write('3. Make sure PostgreSQL is running on localhost:5432\n');
    }
    process.exit(1);
  } finally {
    if (adminPool && !adminPool.ended) await adminPool.end();
    if (appPool && !appPool.ended) await appPool.end();
  }
}

migrate();
