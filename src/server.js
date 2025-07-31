// Load environment variables first
require('dotenv').config();

const fastify = require('fastify');
const databasePlugin = require('./plugins/database');
const profileRoutes = require('./routes/profiles');

// Create Fastify instance with structured logging
const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
server.register(databasePlugin);

// Register routes
server.register(profileRoutes, { prefix: '/api/v1' });

// Health check endpoint
server.get('/health', async (_request, _reply) => {
  const { checkConnection, getConnectionStatus } = require('./database/connection');
  
  try {
    const dbStatus = await checkConnection();
    const connectionInfo = getConnectionStatus();
    
    return {
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.connected,
        message: dbStatus.message,
        timestamp: dbStatus.timestamp,
        connectionPool: connectionInfo
      }
    };
  } catch (error) {
    server.log.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message
      }
    };
  }
});

// Root endpoint with API information
server.get('/', async (_request, _reply) => {
  return {
    message: 'User Profile Service API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      profiles: {
        getAll: 'GET /api/v1/profiles',
        getById: 'GET /api/v1/profiles/:id',
        create: 'POST /api/v1/profiles',
        update: 'PUT /api/v1/profiles/:id',
      },
    },
  };
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: error.validation,
    });
  }

  // Handle other errors
  return reply.status(500).send({
    success: false,
    error: 'Internal server error',
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  server.log.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await server.close();
    server.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';

    // Check database connection before starting server
    const { checkConnection } = require('./database/connection');
    server.log.info('Checking database connection...');
    
    const dbStatus = await checkConnection();
    if (!dbStatus.connected) {
      server.log.error('Database connection failed. Server will not start.');
      server.log.error(`Database error: ${dbStatus.error}`);
      process.exit(1);
    }
    
    server.log.info('Database connection verified successfully');
    await server.listen({ port, host });
    server.log.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    server.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start();
