# NaviQ Backend Integration with Orkes Conductor

## Integration Steps

### 1. Add Conductor Routes to Your Backend

Add the following to your main `Backend/index.js` file:

```javascript
// Add this import at the top
import { router as conductorRoutes } from "../conductor-integration/integration/workflow.routes.js";

// Add this route registration after your existing routes
app.use("/api/conductor", conductorRoutes);
```

### 2. Enhanced Bot Controller Integration

Replace your existing bot endpoint with Conductor-powered workflow:

```javascript
// In Backend/routes/accessbot.routes.js

// Add new route for Conductor-powered navigation
router.post("/callbot-conductor/:adminid/:userid", async (req, res) => {
	try {
		const adminId = req.params.adminid;
		const userId = req.params.userid;
		const { userquery } = req.body;

		// Get map data (existing logic)
		const mapdata = await Mapdata.findOne({ appwriteId: adminId })
			.populate("nodes")
			.populate("connections")
			.populate("buildings")
			.populate({
				path: "buildings",
				populate: {
					path: "floors",
					populate: [{ path: "nodes" }, { path: "connections" }],
				},
			});

		// Use Conductor for orchestrated processing
		const response = await fetch(
			"http://localhost:3000/api/conductor/navigation/sync",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userQuery: userquery,
					userId,
					adminId,
					mapData: mapdata,
				}),
			}
		);

		const result = await response.json();

		if (result.error) {
			// Fallback to existing logic
			return callBotFallback(req, res, mapdata);
		}

		res.status(200).json({
			reply: result.reply,
			workflowId: result.workflowId,
			executionTime: result.executionTime,
			source: "conductor",
		});
	} catch (error) {
		console.error("Conductor integration error:", error);
		// Fallback to existing logic
		return callBotFallback(req, res);
	}
});

// Keep existing function as fallback
async function callBotFallback(req, res, mapdata = null) {
	// Your existing callbot logic here
}
```

### 3. Map Creation Workflow Integration

Enhance your building creation with Conductor orchestration:

```javascript
// In Backend/controllers/mapControllers/building.controller.js

export const createBuildingWithWorkflow = async (req, res) => {
	try {
		const { appwriteId, name, floorsData } = req.body;

		// Use Conductor for complex building creation
		const response = await fetch(
			"http://localhost:3000/api/conductor/building/create",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					adminId: appwriteId,
					buildingData: { name },
					floorsData,
				}),
			}
		);

		const result = await response.json();

		res.status(201).json({
			message: "Building creation workflow started",
			workflowId: result.workflowId,
			pollUrl: result.pollUrl,
		});
	} catch (error) {
		console.error("Building workflow error:", error);
		res.status(500).json({ error: error.message });
	}
};
```

### 4. Real-time Updates Integration

Add WebSocket support for real-time workflow updates:

```javascript
// In Backend/index.js (add WebSocket support)
import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Workflow status updates
io.on("connection", (socket) => {
	console.log("Client connected:", socket.id);

	socket.on("subscribe-workflow", (workflowId) => {
		socket.join(`workflow-${workflowId}`);
	});

	socket.on("unsubscribe-workflow", (workflowId) => {
		socket.leave(`workflow-${workflowId}`);
	});
});

// In your workflow status endpoint
router.get("/workflow/:workflowId/status", async (req, res) => {
	try {
		const status = await naviQConductorService.getWorkflowStatus(
			req.params.workflowId
		);

		// Emit real-time update
		io.to(`workflow-${req.params.workflowId}`).emit("workflow-status", status);

		res.json(status);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
```

### 5. Environment Setup

1. Copy `.env.example` to `.env` in the conductor-integration directory
2. Update the configuration values
3. Start Conductor services:

```bash
cd conductor-integration
npm install
npm run conductor:start
```

### 6. Frontend Integration (React)

Add Conductor workflow monitoring to your admin dashboard:

```javascript
// New component: AdminDashboard/WorkflowMonitor.jsx
import { useState, useEffect } from "react";
import io from "socket.io-client";

export function WorkflowMonitor() {
	const [workflows, setWorkflows] = useState([]);
	const [socket, setSocket] = useState(null);

	useEffect(() => {
		const newSocket = io("http://localhost:3000");
		setSocket(newSocket);

		return () => newSocket.close();
	}, []);

	const startNavigationWorkflow = async (query) => {
		try {
			const response = await fetch("/api/conductor/navigation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userQuery: query,
					userId: "current_user_id",
					adminId: "current_admin_id",
				}),
			});

			const result = await response.json();

			if (socket) {
				socket.emit("subscribe-workflow", result.workflowId);
				socket.on("workflow-status", (status) => {
					setWorkflows((prev) =>
						prev.map((w) => (w.workflowId === status.workflowId ? status : w))
					);
				});
			}

			setWorkflows((prev) => [...prev, result]);
		} catch (error) {
			console.error("Error starting workflow:", error);
		}
	};

	return (
		<div className='workflow-monitor'>
			<h3>Active Workflows</h3>
			{workflows.map((workflow) => (
				<div key={workflow.workflowId} className='workflow-item'>
					<span>{workflow.workflowId}</span>
					<span>{workflow.status}</span>
				</div>
			))}
		</div>
	);
}
```

## Benefits You'll See

### 1. **Enhanced Navigation Processing**

- Multi-step query processing with automatic retries
- Better error handling and recovery
- Detailed execution tracking

### 2. **Scalable Map Operations**

- Parallel processing of building creation
- Automated data validation
- Rollback capabilities for failed operations

### 3. **Real-time Monitoring**

- Visual workflow execution in Conductor UI
- Real-time status updates
- Performance metrics and analytics

### 4. **Professional Architecture**

- Enterprise-grade workflow orchestration
- Microservices-ready design
- Cloud deployment capabilities

## Testing Your Integration

1. Start your services:

```bash
# Terminal 1: Start Conductor
cd conductor-integration
npm run conductor:start

# Terminal 2: Setup and test
npm run setup

# Terminal 3: Start your backend
cd ../Backend
npm start
```

2. Test navigation endpoint:

```bash
curl -X POST http://localhost:3000/api/conductor/navigation/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userQuery": "How do I get from Library to Cafeteria?",
    "userId": "test_user",
    "adminId": "test_admin"
  }'
```

3. Monitor workflows at: http://localhost:5000

## Demo Points for Hackathon

✅ **Live Workflow Visualization** - Show real-time workflow execution in Conductor UI  
✅ **Scalability Demo** - Process multiple navigation requests simultaneously  
✅ **Error Recovery** - Demonstrate automatic retry and fallback mechanisms  
✅ **Performance Metrics** - Show execution times and throughput  
✅ **Enterprise Features** - Highlight monitoring, logging, and observability

This integration transforms NaviQ from a simple navigation app into a professional, enterprise-ready platform! 🚀
