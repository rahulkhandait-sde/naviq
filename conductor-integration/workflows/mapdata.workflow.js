// Map Data Management Workflow Definitions for NaviQ
export const mapDataWorkflows = {
  // Complete building creation workflow
  buildingCreationWorkflow: {
    name: 'NAVIQ_BUILDING_CREATION',
    version: 1,
    description: 'Complete workflow for creating buildings with floors, nodes, and connections',
    timeoutSeconds: 1800, // 30 minutes for complex buildings
    tasks: [
      {
        name: 'validate_admin_permissions',
        taskReferenceName: 'validate_admin_permissions_ref',
        type: 'SIMPLE',
        inputParameters: {
          adminId: '${workflow.input.adminId}',
          organizationId: '${workflow.input.organizationId}',
          requiredPermission: 'MAP_EDIT'
        }
      },
      {
        name: 'validate_building_data',
        taskReferenceName: 'validate_building_data_ref',
        type: 'SIMPLE',
        inputParameters: {
          buildingData: '${workflow.input.buildingData}',
          floorsData: '${workflow.input.floorsData}'
        }
      },
      {
        name: 'create_building_entity',
        taskReferenceName: 'create_building_entity_ref',
        type: 'SIMPLE',
        inputParameters: {
          appwriteId: '${workflow.input.adminId}',
          buildingName: '${workflow.input.buildingData.name}',
          buildingDescription: '${workflow.input.buildingData.description}'
        }
      },
      {
        name: 'process_floors_parallel',
        taskReferenceName: 'process_floors_parallel_ref',
        type: 'FORK_JOIN',
        forkTasks: [
          [
            {
              name: 'create_floor',
              taskReferenceName: 'create_floor_${item.floorNumber}',
              type: 'SIMPLE',
              inputParameters: {
                parentBuildingId: '${create_building_entity_ref.output.buildingId}',
                floorData: '${item}'
              }
            },
            {
              name: 'process_floor_nodes',
              taskReferenceName: 'process_floor_nodes_${item.floorNumber}',
              type: 'SIMPLE',
              inputParameters: {
                floorId: '${create_floor_${item.floorNumber}.output.floorId}',
                nodesData: '${item.nodes}'
              }
            },
            {
              name: 'process_floor_connections',
              taskReferenceName: 'process_floor_connections_${item.floorNumber}',
              type: 'SIMPLE',
              inputParameters: {
                floorId: '${create_floor_${item.floorNumber}.output.floorId}',
                connectionsData: '${item.connections}',
                createdNodes: '${process_floor_nodes_${item.floorNumber}.output.nodes}'
              }
            }
          ]
        ],
        dynamicForkTasksParam: 'floorTasks',
        dynamicForkTasksInputParamName: 'floorTaskInputs'
      },
      {
        name: 'create_inter_floor_connections',
        taskReferenceName: 'create_inter_floor_connections_ref',
        type: 'SIMPLE',
        inputParameters: {
          buildingId: '${create_building_entity_ref.output.buildingId}',
          floorResults: '${process_floors_parallel_ref.output}',
          interFloorConnections: '${workflow.input.interFloorConnections}'
        }
      },
      {
        name: 'validate_building_integrity',
        taskReferenceName: 'validate_building_integrity_ref',
        type: 'SIMPLE',
        inputParameters: {
          buildingId: '${create_building_entity_ref.output.buildingId}',
          expectedNodes: '${workflow.input.expectedNodeCount}',
          expectedConnections: '${workflow.input.expectedConnectionCount}'
        }
      },
      {
        name: 'update_map_metadata',
        taskReferenceName: 'update_map_metadata_ref',
        type: 'SIMPLE',
        inputParameters: {
          adminId: '${workflow.input.adminId}',
          buildingId: '${create_building_entity_ref.output.buildingId}',
          buildingStats: '${validate_building_integrity_ref.output.stats}'
        }
      },
      {
        name: 'send_completion_notification',
        taskReferenceName: 'send_completion_notification_ref',
        type: 'SIMPLE',
        inputParameters: {
          adminId: '${workflow.input.adminId}',
          buildingName: '${workflow.input.buildingData.name}',
          creationStats: '${validate_building_integrity_ref.output.stats}',
          notificationChannels: ['email', 'dashboard']
        }
      }
    ],
    outputParameters: {
      buildingId: '${create_building_entity_ref.output.buildingId}',
      totalFloors: '${validate_building_integrity_ref.output.stats.totalFloors}',
      totalNodes: '${validate_building_integrity_ref.output.stats.totalNodes}',
      totalConnections: '${validate_building_integrity_ref.output.stats.totalConnections}',
      creationTime: '${workflow.endTime - workflow.startTime}',
      success: '${validate_building_integrity_ref.output.success}'
    }
  },

  // Bulk map data import workflow
  bulkMapImportWorkflow: {
    name: 'NAVIQ_BULK_MAP_IMPORT',
    version: 1,
    description: 'Import large-scale map data from external sources',
    timeoutSeconds: 3600, // 1 hour for large imports
    tasks: [
      {
        name: 'validate_import_data',
        taskReferenceName: 'validate_import_data_ref',
        type: 'SIMPLE',
        inputParameters: {
          importData: '${workflow.input.importData}',
          dataFormat: '${workflow.input.dataFormat}',
          adminId: '${workflow.input.adminId}'
        }
      },
      {
        name: 'backup_existing_data',
        taskReferenceName: 'backup_existing_data_ref',
        type: 'SIMPLE',
        inputParameters: {
          adminId: '${workflow.input.adminId}',
          backupName: 'pre_import_${workflow.startTime}'
        }
      },
      {
        name: 'transform_import_data',
        taskReferenceName: 'transform_import_data_ref',
        type: 'SIMPLE',
        inputParameters: {
          rawData: '${validate_import_data_ref.output.validatedData}',
          targetFormat: 'naviq_standard',
          transformationRules: '${workflow.input.transformationRules}'
        }
      },
      {
        name: 'import_buildings_batch',
        taskReferenceName: 'import_buildings_batch_ref',
        type: 'SIMPLE',
        inputParameters: {
          buildingsData: '${transform_import_data_ref.output.buildings}',
          adminId: '${workflow.input.adminId}',
          batchSize: 5
        }
      },
      {
        name: 'import_nodes_batch',
        taskReferenceName: 'import_nodes_batch_ref',
        type: 'SIMPLE',
        inputParameters: {
          nodesData: '${transform_import_data_ref.output.nodes}',
          buildingMappings: '${import_buildings_batch_ref.output.buildingMappings}',
          batchSize: 100
        }
      },
      {
        name: 'import_connections_batch',
        taskReferenceName: 'import_connections_batch_ref',
        type: 'SIMPLE',
        inputParameters: {
          connectionsData: '${transform_import_data_ref.output.connections}',
          nodeMappings: '${import_nodes_batch_ref.output.nodeMappings}',
          batchSize: 200
        }
      },
      {
        name: 'validate_imported_data',
        taskReferenceName: 'validate_imported_data_ref',
        type: 'SIMPLE',
        inputParameters: {
          adminId: '${workflow.input.adminId}',
          expectedCounts: '${transform_import_data_ref.output.expectedCounts}',
          importedData: {
            buildings: '${import_buildings_batch_ref.output.importedBuildings}',
            nodes: '${import_nodes_batch_ref.output.importedNodes}',
            connections: '${import_connections_batch_ref.output.importedConnections}'
          }
        }
      },
      {
        name: 'import_completion_decision',
        taskReferenceName: 'import_completion_decision_ref',
        type: 'DECISION',
        caseValueParam: 'validationResult',
        inputParameters: {
          validationResult: '${validate_imported_data_ref.output.validationStatus}'
        },
        decisionCases: {
          'SUCCESS': [
            {
              name: 'finalize_import',
              taskReferenceName: 'finalize_import_ref',
              type: 'SIMPLE',
              inputParameters: {
                adminId: '${workflow.input.adminId}',
                importStats: '${validate_imported_data_ref.output.importStats}',
                backupId: '${backup_existing_data_ref.output.backupId}'
              }
            }
          ],
          'VALIDATION_FAILED': [
            {
              name: 'rollback_import',
              taskReferenceName: 'rollback_import_ref',
              type: 'SIMPLE',
              inputParameters: {
                adminId: '${workflow.input.adminId}',
                backupId: '${backup_existing_data_ref.output.backupId}',
                importedData: '${validate_imported_data_ref.output.importedData}',
                failureReason: '${validate_imported_data_ref.output.failureReason}'
              }
            }
          ]
        }
      }
    ],
    outputParameters: {
      importStatus: '${import_completion_decision_ref.output.status}',
      importedCounts: '${validate_imported_data_ref.output.importStats}',
      processingTime: '${workflow.endTime - workflow.startTime}',
      backupId: '${backup_existing_data_ref.output.backupId}'
    }
  },

  // Map data synchronization workflow
  mapDataSyncWorkflow: {
    name: 'NAVIQ_MAP_DATA_SYNC',
    version: 1,
    description: 'Synchronize map data across multiple environments',
    timeoutSeconds: 900, // 15 minutes
    tasks: [
      {
        name: 'identify_sync_changes',
        taskReferenceName: 'identify_sync_changes_ref',
        type: 'SIMPLE',
        inputParameters: {
          sourceAdminId: '${workflow.input.sourceAdminId}',
          targetAdminId: '${workflow.input.targetAdminId}',
          syncType: '${workflow.input.syncType}', // 'full', 'incremental', 'selective'
          lastSyncTimestamp: '${workflow.input.lastSyncTimestamp}'
        }
      },
      {
        name: 'validate_sync_permissions',
        taskReferenceName: 'validate_sync_permissions_ref',
        type: 'SIMPLE',
        inputParameters: {
          sourceAdminId: '${workflow.input.sourceAdminId}',
          targetAdminId: '${workflow.input.targetAdminId}',
          requestedChanges: '${identify_sync_changes_ref.output.changes}'
        }
      },
      {
        name: 'sync_changes_parallel',
        taskReferenceName: 'sync_changes_parallel_ref',
        type: 'FORK_JOIN',
        forkTasks: [
          [
            {
              name: 'sync_buildings',
              taskReferenceName: 'sync_buildings_ref',
              type: 'SIMPLE',
              inputParameters: {
                buildingChanges: '${identify_sync_changes_ref.output.changes.buildings}',
                targetAdminId: '${workflow.input.targetAdminId}'
              }
            }
          ],
          [
            {
              name: 'sync_nodes',
              taskReferenceName: 'sync_nodes_ref',
              type: 'SIMPLE',
              inputParameters: {
                nodeChanges: '${identify_sync_changes_ref.output.changes.nodes}',
                targetAdminId: '${workflow.input.targetAdminId}'
              }
            }
          ],
          [
            {
              name: 'sync_connections',
              taskReferenceName: 'sync_connections_ref',
              type: 'SIMPLE',
              inputParameters: {
                connectionChanges: '${identify_sync_changes_ref.output.changes.connections}',
                targetAdminId: '${workflow.input.targetAdminId}'
              }
            }
          ]
        ]
      },
      {
        name: 'validate_sync_integrity',
        taskReferenceName: 'validate_sync_integrity_ref',
        type: 'SIMPLE',
        inputParameters: {
          targetAdminId: '${workflow.input.targetAdminId}',
          syncResults: '${sync_changes_parallel_ref.output}',
          expectedChanges: '${identify_sync_changes_ref.output.changes}'
        }
      },
      {
        name: 'update_sync_metadata',
        taskReferenceName: 'update_sync_metadata_ref',
        type: 'SIMPLE',
        inputParameters: {
          sourceAdminId: '${workflow.input.sourceAdminId}',
          targetAdminId: '${workflow.input.targetAdminId}',
          syncTimestamp: '${workflow.startTime}',
          syncResults: '${validate_sync_integrity_ref.output.results}'
        }
      }
    ],
    outputParameters: {
      syncStatus: '${validate_sync_integrity_ref.output.status}',
      syncedCounts: '${validate_sync_integrity_ref.output.syncedCounts}',
      syncDuration: '${workflow.endTime - workflow.startTime}',
      nextSyncRecommendation: '${update_sync_metadata_ref.output.nextSyncTime}'
    }
  }
};

export default mapDataWorkflows;
