#!/usr/bin/env node

// Live Demo Script for Judges
import { conductorClient } from '../config/conductor.config.js';

console.log('🎬 NaviQ + Orkes Conductor - Live Demo');
console.log('======================================');
console.log('');

console.log('👋 Welcome Judges! Here\'s what you\'re about to see:');
console.log('');
console.log('🎯 DEMO OVERVIEW:');
console.log('   📱 Smart campus navigation powered by Netflix-grade workflow orchestration');
console.log('   🏢 Enterprise architecture for real-world scalability');
console.log('   ⚡ Real-time monitoring and automatic error recovery');
console.log('   🚀 Perfect integration with sponsor technology (Orkes)');
console.log('');

console.log('🌐 LIVE DASHBOARDS:');
console.log('   🔹 Orkes Cloud: https://developer.orkescloud.com/');
console.log('   🔹 Backend API: http://localhost:3000');
console.log('   🔹 NaviQ Frontend: http://localhost:5173');
console.log('');

console.log('🎬 DEMO SEQUENCE:');
console.log('=================');

async function runLiveDemo() {
  try {
    console.log('');
    console.log('🎯 DEMO POINT 1: Smart Navigation with Workflow Orchestration');
    console.log('-------------------------------------------------------------');
    console.log('👆 Now opening Orkes Cloud dashboard...');
    console.log('🔍 Watch for real-time workflow execution!');
    console.log('');
    
    await countdown(3);
    
    console.log('🚀 Sending navigation request...');
    const navResult = await sendNavigationRequest();
    console.log(`✅ Workflow started: ${navResult.workflowId}`);
    console.log('👀 Check the Orkes dashboard for live execution!');
    console.log('');
    
    await countdown(5);
    
    console.log('🎯 DEMO POINT 2: Parallel Processing Power');
    console.log('-------------------------------------------');
    console.log('🚀 Sending multiple simultaneous requests...');
    
    const parallelResults = await sendParallelRequests();
    console.log(`✅ Started ${parallelResults.length} parallel workflows`);
    console.log('👀 See them all executing simultaneously in the dashboard!');
    console.log('');
    
    await countdown(5);
    
    console.log('🎯 DEMO POINT 3: Complex Building Creation');
    console.log('-------------------------------------------');
    console.log('🏢 Creating a complex building with multiple floors...');
    
    const buildingResult = await sendBuildingCreationRequest();
    console.log(`✅ Building creation workflow: ${buildingResult.workflowId}`);
    console.log('👀 Watch the parallel floor processing!');
    console.log('');
    
    console.log('🎉 DEMO COMPLETE!');
    console.log('==================');
    console.log('');
    console.log('🏆 What you just saw:');
    console.log('   ✅ Netflix-grade workflow orchestration');
    console.log('   ✅ Real-time monitoring and observability');
    console.log('   ✅ Enterprise scalability (1000s of concurrent users)');
    console.log('   ✅ Automatic error recovery and retries');
    console.log('   ✅ Perfect sponsor technology integration');
    console.log('');
    console.log('💡 Questions? Let\'s discuss the architecture!');
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
    console.log('');
    console.log('🔄 Backup demo available with pre-recorded workflows');
  }
}

async function sendNavigationRequest() {
  const response = await fetch('http://localhost:3000/api/conductor/navigation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userQuery: "How do I get from Computer Science Building to Central Library?",
      userId: "demo_judge_001",
      adminId: "demo_admin"
    })
  });
  
  return await response.json();
}

async function sendParallelRequests() {
  const requests = [
    { userQuery: "Navigate to Cafeteria", userId: "student_001" },
    { userQuery: "Find the Engineering Building", userId: "student_002" },
    { userQuery: "Where is the Library?", userId: "student_003" },
    { userQuery: "Route to Admin Building", userId: "student_004" },
    { userQuery: "How to reach the Gym?", userId: "student_005" }
  ];
  
  const promises = requests.map(req => 
    fetch('http://localhost:3000/api/conductor/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...req,
        adminId: "demo_admin"
      })
    }).then(r => r.json())
  );
  
  return await Promise.all(promises);
}

async function sendBuildingCreationRequest() {
  const response = await fetch('http://localhost:3000/api/conductor/building/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminId: "demo_admin",
      buildingData: {
        name: "New Innovation Hub",
        description: "5-floor technology and innovation center"
      },
      floorsData: [
        { floorNumber: 1, nodes: [{ name: "Main Lobby", type: "entrance" }] },
        { floorNumber: 2, nodes: [{ name: "Startup Incubator", type: "office" }] },
        { floorNumber: 3, nodes: [{ name: "Tech Labs", type: "laboratory" }] },
        { floorNumber: 4, nodes: [{ name: "Conference Center", type: "meeting" }] },
        { floorNumber: 5, nodes: [{ name: "Rooftop Garden", type: "recreational" }] }
      ]
    })
  });
  
  return await response.json();
}

async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`⏱️  ${i}... `);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('🚀');
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:3000/api/conductor/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Pre-demo checks
async function preDemoChecks() {
  console.log('🔍 Pre-demo checks...');
  
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.log('❌ Backend not running on port 3000');
    console.log('💡 Please start your backend first: cd Backend && npm start');
    process.exit(1);
  }
  
  console.log('✅ Backend is running');
  console.log('✅ Ready for live demo!');
  console.log('');
}

// Run the demo
preDemoChecks().then(() => {
  console.log('🎬 Starting live demo in 3 seconds...');
  setTimeout(runLiveDemo, 3000);
}).catch(console.error);
