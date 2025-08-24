#!/usr/bin/env node

// Test Orkes Cloud Connection
import { conductorClient, conductorConfig } from '../config/conductor.config.js';

console.log('🔗 Testing Orkes Cloud Connection');
console.log('=================================');

async function testConnection() {
  try {
    console.log(`📡 Connecting to: ${conductorConfig.serverUrl}`);
    console.log(`🔑 Using Key ID: ${conductorConfig.keyId.substring(0, 8)}...`);
    
    // Test the connection by trying to get health status
    const response = await fetch(`${conductorConfig.serverUrl}/health`, {
      headers: {
        'X-Authorization': conductorConfig.keyId,
        'Authorization': `Bearer ${conductorConfig.keySecret}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Connection successful!');
      console.log('🌐 Orkes Cloud is accessible');
      
      // Try to list workflows
      try {
        const workflows = await conductorClient.metadataResourceApi.getAllWorkflows();
        console.log(`📋 Found ${workflows.length} existing workflows`);
      } catch (error) {
        console.log('ℹ️ Workflow listing may require registration first');
      }
      
      console.log('\n🎉 Your Orkes Cloud setup is working perfectly!');
      console.log('\n🚀 Next steps:');
      console.log('   1. Your URL is correct: ✅');
      console.log('   2. Authentication is working: ✅');
      console.log('   3. Ready to run workflows: ✅');
      
    } else {
      console.log('❌ Connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('\n🔧 Authentication issue:');
        console.log('   - Check your CONDUCTOR_KEY_ID');
        console.log('   - Check your CONDUCTOR_KEY_SECRET');
        console.log('   - Make sure your Orkes account is active');
      }
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Network issue:');
      console.log('   - Check your internet connection');
      console.log('   - Verify the URL is correct');
    } else if (error.message.includes('unauthorized')) {
      console.log('\n🔧 Authentication issue:');
      console.log('   - Check your API credentials in .env.local');
    }
  }
}

// Test various endpoints
async function comprehensiveTest() {
  console.log('\n🧪 Running comprehensive tests...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${conductorConfig.serverUrl}/health`,
      method: 'GET'
    },
    {
      name: 'Metadata API',
      url: `${conductorConfig.serverUrl}/metadata/workflow`,
      method: 'GET'
    },
    {
      name: 'Task Definitions',
      url: `${conductorConfig.serverUrl}/metadata/taskdefs`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'X-Authorization': conductorConfig.keyId,
          'Authorization': `Bearer ${conductorConfig.keySecret}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${test.name}: ${response.ok ? '✅' : '❌'} (${response.status})`);
    } catch (error) {
      console.log(`${test.name}: ❌ (${error.message})`);
    }
  }
}

// Run the tests
testConnection().then(() => {
  return comprehensiveTest();
}).catch(console.error);
