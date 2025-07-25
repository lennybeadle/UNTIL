const fp = require('fastify-plugin');
const pool = require('../database/connection');

async function databasePlugin(fastify, options) {
  fastify.decorate('db', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
}

module.exports = fp(databasePlugin); 