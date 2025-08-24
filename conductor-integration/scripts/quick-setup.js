#!/usr/bin/env node

// Quick setup script for NaviQ Conductor Integration
import { naviQConductorService } from '../integration/conductor.service.js';

console.log('🚀 NaviQ Conductor Quick Setup');
console.log('================================');

async function quickSetup() {
  try {
    // Step 1: Health check
    console.log('\n1️⃣ Checking Conductor connection...');
    const health = await naviQConductorService.healthCheck();
    
    if (health.status === 'healthy') {
      console.log('✅ Conductor server is running and accessible');
    } else {
      console.log('❌ Conductor server is not accessible');
      console.log('💡 Make sure to run: npm run conductor:start');
      process.exit(1);
    }
    
    // Step 2: Initialize service
    console.log('\n2️⃣ Initializing Conductor service...');
    await naviQConductorService.initialize();
    console.log('✅ Service initialized successfully');
    
    // Step 3: Test navigation workflow
    console.log('\n3️⃣ Testing navigation workflow...');
    const testResult = await testNavigationWorkflow();
    
    if (testResult.success) {
      console.log('✅ Navigation workflow test passed');
    } else {
      console.log('❌ Navigation workflow test failed:', testResult.error);
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Visit http://localhost:5000 for Conductor UI');
    console.log('   2. Check http://localhost:8080/health for API health');
    console.log('   3. Integrate with your backend using the provided routes');
    
    console.log('\n🔗 Integration endpoints:');
    console.log('   POST /api/conductor/navigation/sync - Synchronous navigation');
    console.log('   POST /api/conductor/building/create - Building creation workflow');
    console.log('   GET  /api/conductor/health - Service health check');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Docker is running');
    console.log('   2. Run: npm run conductor:start');
    console.log('   3. Wait for all services to be healthy');
    console.log('   4. Try running this setup script again');
    process.exit(1);
  }
}

async function testNavigationWorkflow() {
  try {
    const mockMapData = {
      nodes: [
        { _id: 'node1', name: 'Library', type: 'building', x: 100, y: 200 },
        { _id: 'node2', name: 'Cafeteria', type: 'building', x: 300, y: 400 }
      ],
      connections: [
        { from: 'node1', to: 'node2', distance: 250 }
      ]
    };
    
    const workflowResult = await naviQConductorService.executeNavigationWorkflow(
      'How do I get from Library to Cafeteria?',
      'test_user',
      'test_admin',
      mockMapData
    );
    
    // Wait a moment for the workflow to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await naviQConductorService.getWorkflowResult(
      workflowResult.workflowId,
      10000
    );
    
    return { success: result.success, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the setup
quickSetup().catch(console.error);
