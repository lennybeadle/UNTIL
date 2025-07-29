const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  // Using process.stdout for logging in standalone scripts
  process.stdout.write('Connected to PostgreSQL database\n');
});

pool.on('error', (err) => {
  // Using process.stderr for error logging in standalone scripts
  process.stderr.write(`Unexpected error on idle client: ${err.message}\n`);
  process.exit(-1);
});

module.exports = pool;
