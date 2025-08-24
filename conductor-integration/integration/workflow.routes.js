// Express routes for Conductor workflow integration
import express from 'express';
import { naviQConductorService } from './conductor.service.js';

export const router = express.Router();

/**
 * Initialize Conductor Service
 * POST /api/conductor/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const result = await naviQConductorService.initialize();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initialize Conductor service',
      details: error.message
    });
  }
});

/**
 * Health Check
 * GET /api/conductor/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await naviQConductorService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Execute Navigation Workflow
 * POST /api/conductor/navigation
 * Enhanced version of your existing bot endpoint
 */
router.post('/navigation', async (req, res) => {
  try {
    const { userQuery, userId, adminId, mapData } = req.body;
    
    if (!userQuery || !userId || !adminId) {
      return res.status(400).json({
        error: 'Missing required parameters: userQuery, userId, adminId'
      });
    }
    
    // Start the workflow
    const workflowResult = await naviQConductorService.executeNavigationWorkflow(
      userQuery,
      userId,
      adminId,
      mapData
    );
    
    // For real-time response, you might want to wait for completion
    // or return the workflow ID for polling
    
    res.json({
      message: 'Navigation workflow started',
      workflowId: workflowResult.workflowId,
      status: workflowResult.status,
      pollUrl: `/api/conductor/workflow/${workflowResult.workflowId}/status`
    });
    
  } catch (error) {
    console.error('Error in navigation workflow:', error);
    res.status(500).json({
      error: 'Failed to process navigation request',
      details: error.message
    });
  }
});

/**
 * Execute Navigation Workflow (Synchronous)
 * POST /api/conductor/navigation/sync
 * Waits for workflow completion before responding
 */
router.post('/navigation/sync', async (req, res) => {
  try {
    const { userQuery, userId, adminId, mapData } = req.body;
    
    if (!userQuery || !userId || !adminId) {
      return res.status(400).json({
        error: 'Missing required parameters: userQuery, userId, adminId'
      });
    }
    
    // Start the workflow
    const workflowResult = await naviQConductorService.executeNavigationWorkflow(
      userQuery,
      userId,
      adminId,
      mapData
    );
    
    // Wait for completion (with timeout)
    const result = await naviQConductorService.getWorkflowResult(
      workflowResult.workflowId,
      30000 // 30 second timeout
    );
    
    if (result.success) {
      res.json({
        reply: result.result.response,
        workflowId: workflowResult.workflowId,
        executionTime: result.executionTime,
        navigationType: result.result.navigationType
      });
    } else {
      res.status(500).json({
        error: 'Navigation workflow failed',
        details: result.error,
        workflowId: workflowResult.workflowId
      });
    }
    
  } catch (error) {
    console.error('Error in synchronous navigation workflow:', error);
    res.status(500).json({
      error: 'Failed to process navigation request',
      details: error.message
    });
  }
});

/**
 * Execute Building Creation Workflow
 * POST /api/conductor/building/create
 */
router.post('/building/create', async (req, res) => {
  try {
    const { adminId, buildingData, floorsData } = req.body;
    
    if (!adminId || !buildingData || !floorsData) {
      return res.status(400).json({
        error: 'Missing required parameters: adminId, buildingData, floorsData'
      });
    }
    
    const workflowResult = await naviQConductorService.executeBuildingCreationWorkflow(
      adminId,
      buildingData,
      floorsData
    );
    
    res.json({
      message: 'Building creation workflow started',
      workflowId: workflowResult.workflowId,
      status: workflowResult.status,
      pollUrl: `/api/conductor/workflow/${workflowResult.workflowId}/status`
    });
    
  } catch (error) {
    console.error('Error in building creation workflow:', error);
    res.status(500).json({
      error: 'Failed to start building creation workflow',
      details: error.message
    });
  }
});

/**
 * Get Workflow Status
 * GET /api/conductor/workflow/:workflowId/status
 */
router.get('/workflow/:workflowId/status', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const status = await naviQConductorService.getWorkflowStatus(workflowId);
    res.json(status);
  } catch (error) {
    console.error(`Error getting workflow status for ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to get workflow status',
      details: error.message
    });
  }
});

/**
 * Get Workflow Result (with polling)
 * GET /api/conductor/workflow/:workflowId/result
 */
router.get('/workflow/:workflowId/result', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const timeout = parseInt(req.query.timeout) || 30000;
    
    const result = await naviQConductorService.getWorkflowResult(workflowId, timeout);
    res.json(result);
  } catch (error) {
    console.error(`Error getting workflow result for ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to get workflow result',
      details: error.message
    });
  }
});

/**
 * Get Workflow History
 * GET /api/conductor/workflow/:workflowId/history
 */
router.get('/workflow/:workflowId/history', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const history = await naviQConductorService.getWorkflowHistory(workflowId);
    res.json(history);
  } catch (error) {
    console.error(`Error getting workflow history for ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to get workflow history',
      details: error.message
    });
  }
});

/**
 * Pause Workflow
 * POST /api/conductor/workflow/:workflowId/pause
 */
router.post('/workflow/:workflowId/pause', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await naviQConductorService.pauseWorkflow(workflowId);
    res.json(result);
  } catch (error) {
    console.error(`Error pausing workflow ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to pause workflow',
      details: error.message
    });
  }
});

/**
 * Resume Workflow
 * POST /api/conductor/workflow/:workflowId/resume
 */
router.post('/workflow/:workflowId/resume', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await naviQConductorService.resumeWorkflow(workflowId);
    res.json(result);
  } catch (error) {
    console.error(`Error resuming workflow ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to resume workflow',
      details: error.message
    });
  }
});

/**
 * Terminate Workflow
 * POST /api/conductor/workflow/:workflowId/terminate
 */
router.post('/workflow/:workflowId/terminate', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { reason } = req.body;
    
    const result = await naviQConductorService.terminateWorkflow(
      workflowId,
      reason || 'User requested termination'
    );
    res.json(result);
  } catch (error) {
    console.error(`Error terminating workflow ${req.params.workflowId}:`, error);
    res.status(500).json({
      error: 'Failed to terminate workflow',
      details: error.message
    });
  }
});

/**
 * List Active Workflows
 * GET /api/conductor/workflows/active
 */
router.get('/workflows/active', async (req, res) => {
  try {
    // This would require additional implementation in the service
    // For now, return a placeholder
    res.json({
      message: 'Active workflows listing not yet implemented',
      suggestion: 'Use individual workflow status endpoints'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list active workflows',
      details: error.message
    });
  }
});

/**
 * Get Workflow Metrics
 * GET /api/conductor/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // This would require additional implementation
    // For now, return basic metrics
    res.json({
      message: 'Workflow metrics not yet implemented',
      suggestion: 'Check individual workflow histories for performance data'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

export default router;
