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
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root endpoint with API information
server.get('/', async (request, reply) => {
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
    
    await server.listen({ port, host });
    server.log.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    server.log.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 