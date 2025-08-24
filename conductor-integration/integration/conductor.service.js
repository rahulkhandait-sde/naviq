// Main Conductor Service Integration for NaviQ
import { conductorClient } from '../config/conductor.config.js';
import { registerNavigationWorkers } from '../workers/navigation.workers.js';
import { navigationWorkflows } from '../workflows/navigation.workflow.js';
import { mapDataWorkflows } from '../workflows/mapdata.workflow.js';

/**
 * NaviQ Conductor Service
 * Main service class for orchestrating workflows in the NaviQ platform
 */
export class NaviQConductorService {
  constructor() {
    this.client = conductorClient;
    this.isInitialized = false;
  }

  /**
   * Initialize the Conductor service
   */
  async initialize() {
    try {
      console.log('🚀 Initializing NaviQ Conductor Service...');
      
      // Register workflows
      await this.registerWorkflows();
      
      // Register workers
      await this.registerWorkers();
      
      // Start workers
      await this.startWorkers();
      
      this.isInitialized = true;
      console.log('✅ NaviQ Conductor Service initialized successfully');
      
      return { success: true, message: 'Conductor service initialized' };
    } catch (error) {
      console.error('❌ Failed to initialize Conductor service:', error);
      throw error;
    }
  }

  /**
   * Register all workflows with Conductor
   */
  async registerWorkflows() {
    try {
      console.log('📝 Registering workflows...');
      
      const workflowsToRegister = [
        ...Object.values(navigationWorkflows),
        ...Object.values(mapDataWorkflows)
      ];
      
      for (const workflow of workflowsToRegister) {
        try {
          await this.client.metadataResourceApi.registerWorkflowDef(true, workflow);
          console.log(`✅ Registered workflow: ${workflow.name} v${workflow.version}`);
        } catch (error) {
          if (error.message?.includes('already exists')) {
            console.log(`ℹ️ Workflow ${workflow.name} v${workflow.version} already exists`);
          } else {
            console.error(`❌ Failed to register workflow ${workflow.name}:`, error.message);
          }
        }
      }
      
      console.log('✅ All workflows registered');
    } catch (error) {
      console.error('❌ Error registering workflows:', error);
      throw error;
    }
  }

  /**
   * Register all workers
   */
  async registerWorkers() {
    try {
      console.log('👷 Registering workers...');
      registerNavigationWorkers();
      console.log('✅ All workers registered');
    } catch (error) {
      console.error('❌ Error registering workers:', error);
      throw error;
    }
  }

  /**
   * Start all workers
   */
  async startWorkers() {
    try {
      console.log('▶️ Starting workers...');
      // Workers are started automatically when registered
      console.log('✅ All workers started and polling for tasks');
    } catch (error) {
      console.error('❌ Error starting workers:', error);
      throw error;
    }
  }

  /**
   * Execute Smart Navigation Workflow
   * Main entry point for navigation queries
   */
  async executeNavigationWorkflow(userQuery, userId, adminId, mapData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Conductor service not initialized');
      }

      const workflowInput = {
        userQuery,
        userId,
        adminId,
        mapData
      };

      console.log(`🧭 Starting navigation workflow for user: ${userId}`);
      
      const workflowId = await this.client.workflowResourceApi.startWorkflow1(
        'NAVIQ_SMART_NAVIGATION',
        workflowInput,
        1, // version
        `nav_${userId}_${Date.now()}` // correlationId
      );

      console.log(`✅ Navigation workflow started with ID: ${workflowId}`);
      
      return {
        workflowId,
        status: 'STARTED',
        message: 'Navigation workflow initiated'
      };
    } catch (error) {
      console.error('❌ Error executing navigation workflow:', error);
      throw error;
    }
  }

  /**
   * Execute Building Creation Workflow
   * For creating complex building structures
   */
  async executeBuildingCreationWorkflow(adminId, buildingData, floorsData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Conductor service not initialized');
      }

      const workflowInput = {
        adminId,
        buildingData,
        floorsData,
        organizationId: adminId, // Assuming adminId is also the org ID
        expectedNodeCount: this.calculateExpectedNodes(floorsData),
        expectedConnectionCount: this.calculateExpectedConnections(floorsData)
      };

      console.log(`🏢 Starting building creation workflow for admin: ${adminId}`);
      
      const workflowId = await this.client.workflowResourceApi.startWorkflow1(
        'NAVIQ_BUILDING_CREATION',
        workflowInput,
        1,
        `building_${adminId}_${Date.now()}`
      );

      console.log(`✅ Building creation workflow started with ID: ${workflowId}`);
      
      return {
        workflowId,
        status: 'STARTED',
        message: 'Building creation workflow initiated'
      };
    } catch (error) {
      console.error('❌ Error executing building creation workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(workflowId) {
    try {
      const workflow = await this.client.workflowResourceApi.getExecutionStatus(
        workflowId,
        true // includeTasks
      );
      
      return {
        workflowId: workflow.workflowId,
        status: workflow.status,
        startTime: workflow.startTime,
        endTime: workflow.endTime,
        output: workflow.output,
        tasks: workflow.tasks?.map(task => ({
          taskType: task.taskType,
          status: task.status,
          startTime: task.startTime,
          endTime: task.endTime,
          taskDefName: task.taskDefName
        }))
      };
    } catch (error) {
      console.error(`❌ Error getting workflow status for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow result (blocking until completion)
   */
  async getWorkflowResult(workflowId, timeoutMs = 30000) {
    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeoutMs) {
        const status = await this.getWorkflowStatus(workflowId);
        
        if (status.status === 'COMPLETED') {
          return {
            success: true,
            result: status.output,
            executionTime: status.endTime - status.startTime
          };
        } else if (status.status === 'FAILED' || status.status === 'TERMINATED') {
          return {
            success: false,
            error: status.output || 'Workflow failed',
            status: status.status
          };
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      throw new Error(`Workflow ${workflowId} timed out after ${timeoutMs}ms`);
    } catch (error) {
      console.error(`❌ Error getting workflow result for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Pause a running workflow
   */
  async pauseWorkflow(workflowId) {
    try {
      await this.client.workflowResourceApi.pauseWorkflow1(workflowId);
      return { success: true, message: 'Workflow paused' };
    } catch (error) {
      console.error(`❌ Error pausing workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowId) {
    try {
      await this.client.workflowResourceApi.resumeWorkflow1(workflowId);
      return { success: true, message: 'Workflow resumed' };
    } catch (error) {
      console.error(`❌ Error resuming workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Terminate a workflow
   */
  async terminateWorkflow(workflowId, reason = 'User requested termination') {
    try {
      await this.client.workflowResourceApi.terminate1(workflowId, reason);
      return { success: true, message: 'Workflow terminated' };
    } catch (error) {
      console.error(`❌ Error terminating workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowHistory(workflowId) {
    try {
      const workflow = await this.client.workflowResourceApi.getExecutionStatus(
        workflowId,
        true
      );
      
      return {
        workflowId: workflow.workflowId,
        workflowName: workflow.workflowName,
        version: workflow.workflowVersion,
        status: workflow.status,
        input: workflow.input,
        output: workflow.output,
        startTime: workflow.startTime,
        endTime: workflow.endTime,
        tasks: workflow.tasks?.map(task => ({
          taskId: task.taskId,
          taskType: task.taskType,
          taskDefName: task.taskDefName,
          status: task.status,
          startTime: task.startTime,
          endTime: task.endTime,
          inputData: task.inputData,
          outputData: task.outputData,
          reasonForIncompletion: task.reasonForIncompletion
        }))
      };
    } catch (error) {
      console.error(`❌ Error getting workflow history for ${workflowId}:`, error);
      throw error;
    }
  }

  // Helper methods

  calculateExpectedNodes(floorsData) {
    return floorsData.reduce((total, floor) => total + (floor.nodes?.length || 0), 0);
  }

  calculateExpectedConnections(floorsData) {
    return floorsData.reduce((total, floor) => total + (floor.connections?.length || 0), 0);
  }

  /**
   * Health check for the Conductor service
   */
  async healthCheck() {
    try {
      // Try to get health status from Conductor
      const response = await fetch(`${this.client.serverUrl}/health`);
      const isHealthy = response.ok;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        conductorConnection: isHealthy,
        serviceInitialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        conductorConnection: false,
        serviceInitialized: this.isInitialized,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
export const naviQConductorService = new NaviQConductorService();

export default naviQConductorService;
