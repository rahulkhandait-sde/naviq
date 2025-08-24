// Navigation Workers for NaviQ Conductor Integration
import { worker } from '../config/conductor.config.js';

// Import existing NaviQ functions
// Note: These imports should point to your actual backend controllers
// import { gettypeofquery } from '../../Backend/controllers/BotControllers/gettypeofquery.controller.js';
// import { findBestMatchingNode } from '../../Backend/controllers/BotControllers/QueryMatchFinder.controller.js';
// import { dijkstraWithSteps } from '../../Backend/controllers/BotControllers/ShortestPathGenerator.js';

// For demonstration, we'll create simplified versions
// In production, integrate with your actual backend functions

/**
 * Validate User Query Task
 * Sanitizes and validates incoming user navigation queries
 */
export const validateUserQueryWorker = {
  taskDefName: 'validate_user_query',
  execute: async (taskData) => {
    try {
      const { userQuery, userId, adminId } = taskData.inputData;
      
      // Basic validation
      if (!userQuery || typeof userQuery !== 'string') {
        throw new Error('Invalid user query provided');
      }
      
      if (!userId || !adminId) {
        throw new Error('Missing required user or admin ID');
      }
      
      // Sanitize query
      const sanitizedQuery = userQuery.trim().toLowerCase();
      
      // Check for malicious content (basic implementation)
      const forbiddenPatterns = ['<script', 'javascript:', 'eval('];
      const hasForbiddenContent = forbiddenPatterns.some(pattern => 
        sanitizedQuery.includes(pattern)
      );
      
      if (hasForbiddenContent) {
        throw new Error('Query contains forbidden content');
      }
      
      return {
        sanitizedQuery,
        originalQuery: userQuery,
        userId,
        adminId,
        validationTimestamp: new Date().toISOString(),
        queryLength: sanitizedQuery.length
      };
    } catch (error) {
      console.error('Error in validateUserQueryWorker:', error);
      throw error;
    }
  }
};

/**
 * Classify Query Type Task
 * Determines if query is pathfinding (P) or normal (N)
 */
export const classifyQueryTypeWorker = {
  taskDefName: 'classify_query_type',
  execute: async (taskData) => {
    try {
      const { userQuery, userId } = taskData.inputData;
      
      // Simplified version of your gettypeofquery function
      // In production, use: const queryType = await gettypeofquery(userId, userQuery);
      
      // Navigation-related keywords that indicate pathfinding queries
      const pathfindingKeywords = [
        'navigate', 'directions', 'route', 'path', 'way to', 'how to get',
        'where is', 'find', 'locate', 'go to', 'reach', 'from', 'to'
      ];
      
      const normalKeywords = [
        'what is', 'tell me about', 'information', 'help', 'explain'
      ];
      
      const queryLower = userQuery.toLowerCase();
      
      let queryType = 'N'; // Default to normal
      
      // Check for pathfinding indicators
      if (pathfindingKeywords.some(keyword => queryLower.includes(keyword))) {
        queryType = 'P';
      }
      
      // Override with normal if explicitly informational
      if (normalKeywords.some(keyword => queryLower.includes(keyword))) {
        queryType = 'N';
      }
      
      return {
        queryType,
        confidence: queryType === 'P' ? 0.8 : 0.6,
        detectedKeywords: pathfindingKeywords.filter(keyword => 
          queryLower.includes(keyword)
        ),
        classificationTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in classifyQueryTypeWorker:', error);
      throw error;
    }
  }
};

/**
 * Extract Locations Task
 * Finds source and destination nodes from the query
 */
export const extractLocationsWorker = {
  taskDefName: 'extract_locations',
  execute: async (taskData) => {
    try {
      const { userQuery, adminId, mapData } = taskData.inputData;
      
      // Simplified version of your findBestMatchingNode function
      // In production, use: const result = await findBestMatchingNode(mapData, userQuery);
      
      // Mock implementation for demonstration
      const mockResult = await simulateFindBestMatchingNode(mapData, userQuery);
      
      let navigationType;
      if (mockResult.source && mockResult.destination) {
        navigationType = 'PATHFINDING';
      } else if (mockResult.source && !mockResult.destination) {
        navigationType = 'CLARIFICATION_NEEDED';
      } else if (!mockResult.source && mockResult.destination) {
        navigationType = 'CLARIFICATION_NEEDED';
      } else {
        navigationType = 'LOCATION_INFO';
      }
      
      return {
        sourceNode: mockResult.source,
        destinationNode: mockResult.destination,
        navigationType,
        matchScore: mockResult.matchScore || 0.7,
        missingInfo: mockResult.missingInfo || null,
        foundNodes: mockResult.foundNodes || [],
        extractionTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in extractLocationsWorker:', error);
      throw error;
    }
  }
};

/**
 * Calculate Optimal Path Task
 * Computes the shortest path between two nodes
 */
export const calculateOptimalPathWorker = {
  taskDefName: 'calculate_optimal_path',
  execute: async (taskData) => {
    try {
      const { sourceNodeId, destinationNodeId, mapData } = taskData.inputData;
      
      // Simplified version of your dijkstraWithSteps function
      // In production, use: const pathResult = dijkstraWithSteps(mapData, sourceNodeId, destinationNodeId);
      
      const pathResult = await simulateDijkstraWithSteps(mapData, sourceNodeId, destinationNodeId);
      
      return {
        pathResult,
        calculationTimestamp: new Date().toISOString(),
        algorithmUsed: 'dijkstra',
        computationTime: Math.random() * 100 // Simulated computation time in ms
      };
    } catch (error) {
      console.error('Error in calculateOptimalPathWorker:', error);
      throw error;
    }
  }
};

/**
 * Generate Directions Task
 * Creates human-readable directions from path result
 */
export const generateDirectionsWorker = {
  taskDefName: 'generate_directions',
  execute: async (taskData) => {
    try {
      const { pathResult, sourceNode, destinationNode } = taskData.inputData;
      
      if (!pathResult || !pathResult.path) {
        throw new Error('Invalid path result provided');
      }
      
      const directions = generateHumanReadableDirections(pathResult, sourceNode, destinationNode);
      
      return {
        directions,
        totalDistance: pathResult.totalDistance || 0,
        estimatedTime: calculateEstimatedTime(pathResult.totalDistance || 0),
        stepCount: pathResult.path.length || 0,
        generationTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in generateDirectionsWorker:', error);
      throw error;
    }
  }
};

/**
 * Format Response Task
 * Creates the final formatted response for the user
 */
export const formatResponseWorker = {
  taskDefName: 'format_response',
  execute: async (taskData) => {
    try {
      const {
        navigationType,
        pathResult,
        directions,
        locationDetails,
        clarificationRequest,
        errorInfo
      } = taskData.inputData;
      
      let formattedResponse = '';
      let success = false;
      
      switch (navigationType) {
        case 'PATHFINDING':
          if (pathResult && directions) {
            formattedResponse = `🗺️ **Route Found!**\n\n${directions.directions}\n\n📏 **Distance:** ${directions.totalDistance}m\n⏱️ **Estimated Time:** ${directions.estimatedTime}\n📍 **Steps:** ${directions.stepCount}`;
            success = true;
          }
          break;
          
        case 'LOCATION_INFO':
          if (locationDetails) {
            formattedResponse = `📍 **Location Information**\n\n${locationDetails.details}`;
            success = true;
          }
          break;
          
        case 'CLARIFICATION_NEEDED':
          if (clarificationRequest) {
            formattedResponse = `❓ **Need More Information**\n\n${clarificationRequest.clarification}`;
            success = true;
          }
          break;
          
        default:
          formattedResponse = errorInfo?.errorInfo || 'I couldn\'t understand your request. Please try rephrasing.';
          success = false;
      }
      
      return {
        formattedResponse,
        success,
        responseType: navigationType,
        formattingTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in formatResponseWorker:', error);
      throw error;
    }
  }
};

// Helper functions (mock implementations for demonstration)

async function simulateFindBestMatchingNode(mapData, query) {
  // This is a simplified mock - replace with your actual implementation
  return {
    source: {
      _id: 'mock_source_id',
      name: 'Library',
      type: 'building',
      x: 100,
      y: 200
    },
    destination: {
      _id: 'mock_dest_id',
      name: 'Cafeteria',
      type: 'building',
      x: 300,
      y: 400
    },
    matchScore: 0.85
  };
}

async function simulateDijkstraWithSteps(mapData, sourceId, destId) {
  // This is a simplified mock - replace with your actual implementation
  return {
    path: [
      { nodeId: sourceId, name: 'Library' },
      { nodeId: 'intermediate_node', name: 'Corridor' },
      { nodeId: destId, name: 'Cafeteria' }
    ],
    totalDistance: 250,
    steps: [
      'Start at Library',
      'Walk 100m east to Corridor',
      'Turn right and walk 150m south to Cafeteria'
    ]
  };
}

function generateHumanReadableDirections(pathResult, sourceNode, destinationNode) {
  const steps = pathResult.steps || [
    `Start at ${sourceNode?.name || 'your location'}`,
    `Navigate through ${pathResult.path?.length || 0} waypoints`,
    `Arrive at ${destinationNode?.name || 'your destination'}`
  ];
  
  return {
    directions: steps.join('\n'),
    summary: `Navigate from ${sourceNode?.name || 'start'} to ${destinationNode?.name || 'destination'}`
  };
}

function calculateEstimatedTime(distance) {
  // Assume walking speed of 1.4 m/s (5 km/h)
  const walkingSpeed = 1.4;
  const timeInSeconds = distance / walkingSpeed;
  const minutes = Math.ceil(timeInSeconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// Register all workers
export function registerNavigationWorkers() {
  worker.registerWorker(validateUserQueryWorker);
  worker.registerWorker(classifyQueryTypeWorker);
  worker.registerWorker(extractLocationsWorker);
  worker.registerWorker(calculateOptimalPathWorker);
  worker.registerWorker(generateDirectionsWorker);
  worker.registerWorker(formatResponseWorker);
  
  console.log('✅ Navigation workers registered successfully');
}

export default {
  validateUserQueryWorker,
  classifyQueryTypeWorker,
  extractLocationsWorker,
  calculateOptimalPathWorker,
  generateDirectionsWorker,
  formatResponseWorker,
  registerNavigationWorkers
};
