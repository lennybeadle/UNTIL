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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isConnected = false;

// Test the connection
pool.on('connect', () => {
  isConnected = true;
  // Using process.stdout for logging in standalone scripts
  process.stdout.write('Connected to PostgreSQL database\n');
});

pool.on('error', (err) => {
  isConnected = false;
  // Using process.stderr for error logging in standalone scripts
  process.stderr.write(`Unexpected error on idle client: ${err.message}\n`);
  process.exit(-1);
});

// Function to check database connection status
const checkConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return {
      connected: true,
      timestamp: result.rows[0].now,
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      message: 'Database connection failed'
    };
  }
};

// Function to get connection status without querying
const getConnectionStatus = () => {
  return {
    connected: isConnected,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

module.exports = {
  pool,
  checkConnection,
  getConnectionStatus
};
