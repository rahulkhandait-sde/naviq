// Navigation Workflow Definitions for NaviQ
export const navigationWorkflows = {
  // Main navigation workflow for pathfinding queries
  smartNavigationWorkflow: {
    name: 'NAVIQ_SMART_NAVIGATION',
    version: 1,
    description: 'Complete navigation workflow from user query to route response',
    timeoutSeconds: 300,
    tasks: [
      {
        name: 'validate_user_query',
        taskReferenceName: 'validate_user_query_ref',
        type: 'SIMPLE',
        inputParameters: {
          userQuery: '${workflow.input.userQuery}',
          userId: '${workflow.input.userId}',
          adminId: '${workflow.input.adminId}'
        }
      },
      {
        name: 'classify_query_type',
        taskReferenceName: 'classify_query_type_ref',
        type: 'SIMPLE',
        inputParameters: {
          userQuery: '${validate_user_query_ref.output.sanitizedQuery}',
          userId: '${workflow.input.userId}'
        }
      },
      {
        name: 'extract_locations',
        taskReferenceName: 'extract_locations_ref',
        type: 'SIMPLE',
        inputParameters: {
          userQuery: '${validate_user_query_ref.output.sanitizedQuery}',
          adminId: '${workflow.input.adminId}',
          mapData: '${workflow.input.mapData}'
        },
        optional: false
      },
      {
        name: 'decision_navigation_type',
        taskReferenceName: 'decision_navigation_type_ref',
        type: 'DECISION',
        caseValueParam: 'navigationType',
        inputParameters: {
          navigationType: '${extract_locations_ref.output.navigationType}'
        },
        decisionCases: {
          'PATHFINDING': [
            {
              name: 'calculate_optimal_path',
              taskReferenceName: 'calculate_optimal_path_ref',
              type: 'SIMPLE',
              inputParameters: {
                sourceNodeId: '${extract_locations_ref.output.sourceNode._id}',
                destinationNodeId: '${extract_locations_ref.output.destinationNode._id}',
                mapData: '${workflow.input.mapData}'
              }
            },
            {
              name: 'generate_directions',
              taskReferenceName: 'generate_directions_ref',
              type: 'SIMPLE',
              inputParameters: {
                pathResult: '${calculate_optimal_path_ref.output.pathResult}',
                sourceNode: '${extract_locations_ref.output.sourceNode}',
                destinationNode: '${extract_locations_ref.output.destinationNode}'
              }
            }
          ],
          'LOCATION_INFO': [
            {
              name: 'get_location_details',
              taskReferenceName: 'get_location_details_ref',
              type: 'SIMPLE',
              inputParameters: {
                locationNode: '${extract_locations_ref.output.sourceNode}',
                requestType: 'details'
              }
            }
          ],
          'CLARIFICATION_NEEDED': [
            {
              name: 'request_clarification',
              taskReferenceName: 'request_clarification_ref',
              type: 'SIMPLE',
              inputParameters: {
                missingInfo: '${extract_locations_ref.output.missingInfo}',
                foundNodes: '${extract_locations_ref.output.foundNodes}'
              }
            }
          ]
        },
        defaultCase: [
          {
            name: 'handle_unknown_query',
            taskReferenceName: 'handle_unknown_query_ref',
            type: 'SIMPLE',
            inputParameters: {
              originalQuery: '${workflow.input.userQuery}',
              errorType: 'UNKNOWN_NAVIGATION_TYPE'
            }
          }
        ]
      },
      {
        name: 'format_response',
        taskReferenceName: 'format_response_ref',
        type: 'SIMPLE',
        inputParameters: {
          navigationType: '${extract_locations_ref.output.navigationType}',
          pathResult: '${calculate_optimal_path_ref.output.pathResult}',
          directions: '${generate_directions_ref.output.directions}',
          locationDetails: '${get_location_details_ref.output.details}',
          clarificationRequest: '${request_clarification_ref.output.clarification}',
          errorInfo: '${handle_unknown_query_ref.output.errorInfo}'
        }
      }
    ],
    outputParameters: {
      response: '${format_response_ref.output.formattedResponse}',
      navigationType: '${extract_locations_ref.output.navigationType}',
      executionTime: '${workflow.endTime - workflow.startTime}',
      success: '${format_response_ref.output.success}'
    }
  },

  // Bulk navigation processing for multiple queries
  bulkNavigationWorkflow: {
    name: 'NAVIQ_BULK_NAVIGATION',
    version: 1,
    description: 'Process multiple navigation queries in parallel',
    timeoutSeconds: 600,
    tasks: [
      {
        name: 'validate_bulk_input',
        taskReferenceName: 'validate_bulk_input_ref',
        type: 'SIMPLE',
        inputParameters: {
          queries: '${workflow.input.queries}',
          adminId: '${workflow.input.adminId}'
        }
      },
      {
        name: 'process_navigation_queries',
        taskReferenceName: 'process_navigation_queries_ref',
        type: 'FORK_JOIN',
        forkTasks: [
          [
            {
              name: 'NAVIQ_SMART_NAVIGATION',
              taskReferenceName: 'navigation_query_${item.index}',
              type: 'SUB_WORKFLOW',
              inputParameters: {
                userQuery: '${item.query}',
                userId: '${item.userId}',
                adminId: '${workflow.input.adminId}',
                mapData: '${workflow.input.mapData}'
              }
            }
          ]
        ],
        dynamicForkTasksParam: 'navigationTasks',
        dynamicForkTasksInputParamName: 'navigationTaskInputs'
      },
      {
        name: 'aggregate_results',
        taskReferenceName: 'aggregate_results_ref',
        type: 'SIMPLE',
        inputParameters: {
          results: '${process_navigation_queries_ref.output}',
          totalQueries: '${validate_bulk_input_ref.output.totalQueries}'
        }
      }
    ],
    outputParameters: {
      bulkResults: '${aggregate_results_ref.output.aggregatedResults}',
      successCount: '${aggregate_results_ref.output.successCount}',
      failureCount: '${aggregate_results_ref.output.failureCount}',
      totalProcessingTime: '${workflow.endTime - workflow.startTime}'
    }
  },

  // Real-time navigation updates workflow
  realTimeNavigationWorkflow: {
    name: 'NAVIQ_REALTIME_NAVIGATION',
    version: 1,
    description: 'Handle real-time navigation updates and route adjustments',
    timeoutSeconds: 180,
    tasks: [
      {
        name: 'validate_current_position',
        taskReferenceName: 'validate_current_position_ref',
        type: 'SIMPLE',
        inputParameters: {
          userId: '${workflow.input.userId}',
          currentPosition: '${workflow.input.currentPosition}',
          originalRoute: '${workflow.input.originalRoute}'
        }
      },
      {
        name: 'check_route_deviation',
        taskReferenceName: 'check_route_deviation_ref',
        type: 'SIMPLE',
        inputParameters: {
          currentPosition: '${validate_current_position_ref.output.validatedPosition}',
          expectedPosition: '${workflow.input.expectedPosition}',
          toleranceMeters: 10
        }
      },
      {
        name: 'route_update_decision',
        taskReferenceName: 'route_update_decision_ref',
        type: 'DECISION',
        caseValueParam: 'updateAction',
        inputParameters: {
          updateAction: '${check_route_deviation_ref.output.updateAction}'
        },
        decisionCases: {
          'RECALCULATE': [
            {
              name: 'recalculate_route',
              taskReferenceName: 'recalculate_route_ref',
              type: 'SUB_WORKFLOW',
              subWorkflowParam: {
                name: 'NAVIQ_SMART_NAVIGATION',
                version: 1
              },
              inputParameters: {
                userQuery: 'Navigate from current position to ${workflow.input.destination}',
                userId: '${workflow.input.userId}',
                adminId: '${workflow.input.adminId}',
                mapData: '${workflow.input.mapData}',
                startPosition: '${validate_current_position_ref.output.validatedPosition}'
              }
            }
          ],
          'UPDATE_PROGRESS': [
            {
              name: 'update_navigation_progress',
              taskReferenceName: 'update_navigation_progress_ref',
              type: 'SIMPLE',
              inputParameters: {
                userId: '${workflow.input.userId}',
                currentPosition: '${validate_current_position_ref.output.validatedPosition}',
                remainingRoute: '${check_route_deviation_ref.output.remainingRoute}',
                progressPercentage: '${check_route_deviation_ref.output.progressPercentage}'
              }
            }
          ],
          'DESTINATION_REACHED': [
            {
              name: 'complete_navigation',
              taskReferenceName: 'complete_navigation_ref',
              type: 'SIMPLE',
              inputParameters: {
                userId: '${workflow.input.userId}',
                destinationNode: '${workflow.input.destination}',
                totalTravelTime: '${workflow.input.totalTravelTime}',
                routeEfficiency: '${check_route_deviation_ref.output.routeEfficiency}'
              }
            }
          ]
        },
        defaultCase: [
          {
            name: 'continue_current_route',
            taskReferenceName: 'continue_current_route_ref',
            type: 'SIMPLE',
            inputParameters: {
              message: 'Continue on current route',
              nextWaypoint: '${check_route_deviation_ref.output.nextWaypoint}'
            }
          }
        ]
      }
    ],
    outputParameters: {
      navigationUpdate: '${route_update_decision_ref.output}',
      currentStatus: '${check_route_deviation_ref.output.status}',
      recommendedAction: '${route_update_decision_ref.output.action}'
    }
  }
};

export default navigationWorkflows;
