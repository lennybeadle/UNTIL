#!/usr/bin/env node

require('dotenv').config();
const { checkConnection, getConnectionStatus } = require('./connection');

async function main() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    // Check connection status
    const connectionInfo = getConnectionStatus();
    console.log('📊 Connection Pool Status:');
    console.log(`   Connected: ${connectionInfo.connected ? '✅ Yes' : '❌ No'}`);
    console.log(`   Total Connections: ${connectionInfo.totalCount}`);
    console.log(`   Idle Connections: ${connectionInfo.idleCount}`);
    console.log(`   Waiting Connections: ${connectionInfo.waitingCount}\n`);
    
    // Test actual connection
    const dbStatus = await checkConnection();
    
    if (dbStatus.connected) {
      console.log('✅ Database connection successful!');
      console.log(`   Timestamp: ${dbStatus.timestamp}`);
      console.log(`   Message: ${dbStatus.message}`);
      process.exit(0);
    } else {
      console.log('❌ Database connection failed!');
      console.log(`   Error: ${dbStatus.error}`);
      console.log(`   Message: ${dbStatus.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unexpected error during health check:', error.message);
    process.exit(1);
  }
}

// Run the health check
main(); 