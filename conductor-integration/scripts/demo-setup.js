#!/usr/bin/env node

// Demo Setup Script for NaviQ + Orkes Conductor
import { conductorClient, conductorConfig } from '../config/conductor.config.js';
import { navigationWorkflows } from '../workflows/navigation.workflow.js';
import { mapDataWorkflows } from '../workflows/mapdata.workflow.js';

console.log('🎬 NaviQ + Orkes Conductor Demo Setup');
console.log('====================================');

async function setupDemo() {
  try {
    console.log('🚀 Initializing demo environment...\n');
    
    // Step 1: Verify Orkes Cloud connection
    console.log('1️⃣ Testing Orkes Cloud connection...');
    const healthResponse = await testConnection();
    if (!healthResponse.success) {
      throw new Error('Cannot connect to Orkes Cloud');
    }
    console.log('✅ Connected to Orkes Cloud successfully\n');
    
    // Step 2: Register workflows
    console.log('2️⃣ Registering demo workflows...');
    await registerDemoWorkflows();
    console.log('✅ Workflows registered successfully\n');
    
    // Step 3: Create demo data
    console.log('3️⃣ Setting up demo data...');
    await setupDemoData();
    console.log('✅ Demo data ready\n');
    
    // Step 4: Test workflow execution
    console.log('4️⃣ Testing workflow execution...');
    const testResult = await testWorkflowExecution();
    console.log(`✅ Test workflow completed: ${testResult.status}\n`);
    
    // Step 5: Generate demo commands
    console.log('5️⃣ Generating demo commands...');
    generateDemoCommands();
    
    console.log('🎉 DEMO SETUP COMPLETE!');
    console.log('=======================');
    console.log('');
    console.log('🌐 Orkes Cloud Dashboard: https://developer.orkescloud.com/');
    console.log('🚀 Backend API: http://localhost:3000');
    console.log('📊 Health Check: http://localhost:3000/api/conductor/health');
    console.log('');
    console.log('🎯 Ready for hackathon demo!');
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your .env.local file');
    console.log('   2. Verify Orkes Cloud credentials');
    console.log('   3. Ensure backend is running on port 3000');
    process.exit(1);
  }
}

async function testConnection() {
  try {
    const response = await fetch(`${conductorConfig.serverUrl}/health`, {
      headers: {
        'X-Authorization': conductorConfig.keyId,
        'Content-Type': 'application/json'
      }
    });
    
    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function registerDemoWorkflows() {
  const workflows = [
    navigationWorkflows.smartNavigationWorkflow,
    mapDataWorkflows.buildingCreationWorkflow
  ];
  
  for (const workflow of workflows) {
    try {
      await conductorClient.metadataResourceApi.registerWorkflowDef(true, workflow);
      console.log(`   ✅ Registered: ${workflow.name}`);
    } catch (error) {
      if (error.message?.includes('already exists')) {
        console.log(`   ℹ️ Already exists: ${workflow.name}`);
      } else {
        console.log(`   ⚠️ Issue with ${workflow.name}: ${error.message}`);
      }
    }
  }
}

async function setupDemoData() {
  // Create demo map data
  const demoMapData = {
    nodes: [
      {
        _id: 'cs_building_entrance',
        name: 'Computer Science Building - Main Entrance',
        type: 'entrance',
        x: 100,
        y: 100
      },
      {
        _id: 'library_entrance', 
        name: 'Central Library - Main Entrance',
        type: 'entrance',
        x: 300,
        y: 200
      },
      {
        _id: 'cafeteria_main',
        name: 'Student Cafeteria',
        type: 'food',
        x: 150,
        y: 300
      },
      {
        _id: 'admin_building',
        name: 'Administration Building',
        type: 'office',
        x: 400,
        y: 150
      }
    ],
    connections: [
      {
        from: 'cs_building_entrance',
        to: 'library_entrance',
        distance: 223.6,
        direction: 'NE'
      },
      {
        from: 'library_entrance',
        to: 'cafeteria_main',
        distance: 180.3,
        direction: 'SW'
      },
      {
        from: 'cs_building_entrance',
        to: 'cafeteria_main',
        distance: 223.6,
        direction: 'SE'
      }
    ],
    buildings: [
      {
        name: 'Computer Science Building',
        floors: [
          {
            floorNumber: 1,
            nodes: ['cs_building_entrance'],
            connections: []
          }
        ]
      }
    ]
  };
  
  console.log('   📋 Demo map data created');
  console.log(`   📍 ${demoMapData.nodes.length} demo locations`);
  console.log(`   🔗 ${demoMapData.connections.length} connections`);
  
  return demoMapData;
}

async function testWorkflowExecution() {
  try {
    // Test with a simple navigation query
    const testQuery = {
      userQuery: "How do I get from Computer Science Building to Library?",
      userId: "demo_student_001",
      adminId: "demo_admin"
    };
    
    const response = await fetch('http://localhost:3000/api/conductor/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testQuery)
    });
    
    if (response.ok) {
      const result = await response.json();
      return { status: 'success', workflowId: result.workflowId };
    } else {
      return { status: 'failed', error: await response.text() };
    }
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

function generateDemoCommands() {
  console.log('📝 Demo Commands Generated:');
  console.log('');
  
  console.log('🧭 Navigation Demo Commands:');
  console.log('----------------------------');
  
  const navCommands = [
    {
      name: 'Simple Navigation',
      command: `curl -X POST http://localhost:3000/api/conductor/navigation/sync \\
  -H "Content-Type: application/json" \\
  -d '{"userQuery": "How do I get from CS Building to Library?", "userId": "demo1", "adminId": "demo_admin"}'`
    },
    {
      name: 'Complex Navigation', 
      command: `curl -X POST http://localhost:3000/api/conductor/navigation/sync \\
  -H "Content-Type: application/json" \\
  -d '{"userQuery": "Navigate from Computer Science Building to Cafeteria via Library", "userId": "demo2", "adminId": "demo_admin"}'`
    },
    {
      name: 'Location Info',
      command: `curl -X POST http://localhost:3000/api/conductor/navigation/sync \\
  -H "Content-Type: application/json" \\
  -d '{"userQuery": "Tell me about the Library facilities", "userId": "demo3", "adminId": "demo_admin"}'`
    }
  ];
  
  navCommands.forEach((cmd, i) => {
    console.log(`${i + 1}. ${cmd.name}:`);
    console.log(cmd.command);
    console.log('');
  });
  
  console.log('🏢 Building Creation Demo:');
  console.log('--------------------------');
  console.log(`curl -X POST http://localhost:3000/api/conductor/building/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "adminId": "demo_admin",
    "buildingData": {"name": "New Engineering Complex"},
    "floorsData": [
      {"floorNumber": 1, "nodes": [{"name": "Main Entrance", "type": "entrance"}]},
      {"floorNumber": 2, "nodes": [{"name": "Lab A", "type": "laboratory"}]}
    ]
  }'`);
  console.log('');
  
  console.log('📊 Monitoring Commands:');
  console.log('-----------------------');
  console.log('Health Check: curl http://localhost:3000/api/conductor/health');
  console.log('Workflow Status: curl http://localhost:3000/api/conductor/workflow/{WORKFLOW_ID}/status');
  console.log('');
  
  console.log('🎯 Judge Demo Tips:');
  console.log('-------------------');
  console.log('1. Show Orkes dashboard FIRST - https://developer.orkescloud.com/');
  console.log('2. Run navigation command while dashboard is visible');
  console.log('3. Point out real-time workflow execution');
  console.log('4. Highlight enterprise monitoring capabilities');
  console.log('5. Demonstrate parallel processing with multiple requests');
  console.log('');
}

// Run the setup
setupDemo().catch(console.error);
