function filterJsonByShortestPath(rawJson, shortestPathNodeIds) {
  // Extract node IDs from the shortest path array
  // Format: "nodeId1 → nodeId2 (distance)"
  const pathNodeIds = new Set()

  shortestPathNodeIds.forEach((pathSegment) => {
    // Extract both source and destination node IDs from each path segment
    const match = pathSegment.match(/^([a-f0-9]+)\s*→\s*([a-f0-9]+)/)
    if (match) {
      pathNodeIds.add(match[1]) // source node
      pathNodeIds.add(match[2]) // destination node
    }
  })

  console.log(`Extracted ${pathNodeIds.size} unique node IDs from path`)

  const filteredResult = {
    // Exclude nodes array entirely
    connections: rawJson.connections.filter((connection) => {
      const fromIncluded = pathNodeIds.has(connection.from._id)
      const toIncluded = pathNodeIds.has(connection.to._id)
      const shouldInclude = fromIncluded && toIncluded

      if (shouldInclude) {
        console.log(`Including main connection: ${connection.from.name} → ${connection.to.name}`)
      }

      return shouldInclude
    }),
    buildings: rawJson.buildings.map((building) => ({
      ...building,
      floors: building.floors.map((floor) => ({
        ...floor,
        // Exclude nodes array from floors
        connections: floor.connections.filter((connection) => {
          const fromIncluded = pathNodeIds.has(connection.from._id)
          const toIncluded = pathNodeIds.has(connection.to._id)
          const shouldInclude = fromIncluded && toIncluded

          if (shouldInclude) {
            console.log(
              `Including floor connection: ${connection.from.name} → ${connection.to.name} in ${building.name} floor ${floor.floorNumber}`,
            )
          }

          return shouldInclude
        }),
      })),
    })),
  }

  const totalConnections =
    filteredResult.connections.length +
    filteredResult.buildings.reduce(
      (sum, building) => sum + building.floors.reduce((floorSum, floor) => floorSum + floor.connections.length, 0),
      0,
    )

  console.log(`Filtered result: ${totalConnections} connections total, maintaining original structure`)

  return filteredResult
}

// Example usage:
// const shortestPath = ["68a5aeb11c52e725b8dc9f2d → 68a5ae831c52e725b8dc9f1e (109.46 m)", ...]
// const edgesOnly = filterJsonByShortestPath(rawJsonData, shortestPath)
// console.log(edgesOnly) // Array of connection objects only


const rawJson = {
    "_id": "68a5ae231c52e725b8dc9f15",
    "appwriteId": "68a2173370f999d92b7b",
    "mapImage": "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a5ae19002f3d5a9b17/view?project=689b5787003b4e752196",
    "width": 980,
    "height": 757,
    "nodes": [
        {
            "_id": "68a5ae661c52e725b8dc9f19",
            "name": "street1-01",
            "type": "other",
            "description": "",
            "x": 309,
            "y": 502.93055534362793,
            "createdAt": "2025-08-20T11:15:50.286Z",
            "updatedAt": "2025-08-20T11:15:50.286Z",
            "__v": 0
        },
        {
            "_id": "68a5ae831c52e725b8dc9f1e",
            "name": "street1-02",
            "type": "road_turn",
            "description": "",
            "x": 331,
            "y": 503.4861145019531,
            "createdAt": "2025-08-20T11:16:19.657Z",
            "updatedAt": "2025-08-20T11:16:19.657Z",
            "__v": 0
        },
        {
            "_id": "68a5ae831c52e725b8dc9f23",
            "name": "street1-01",
            "type": "other",
            "description": "",
            "x": 309,
            "y": 502.93055534362793,
            "createdAt": "2025-08-20T11:16:19.899Z",
            "updatedAt": "2025-08-20T11:16:19.899Z",
            "__v": 0
        },
        {
            "_id": "68a5ae981c52e725b8dc9f28",
            "name": "street1-03",
            "type": "road_turn",
            "description": "",
            "x": 337,
            "y": 390.93055534362793,
            "createdAt": "2025-08-20T11:16:40.799Z",
            "updatedAt": "2025-08-20T11:16:40.799Z",
            "__v": 0
        },
        {
            "_id": "68a5aeb11c52e725b8dc9f2d",
            "name": "street1-04",
            "type": "road_turn",
            "description": "",
            "x": 333,
            "y": 612.9305553436279,
            "createdAt": "2025-08-20T11:17:05.887Z",
            "updatedAt": "2025-08-20T11:17:05.887Z",
            "__v": 0
        },
        {
            "_id": "68a5afbb1c52e725b8dc9f52",
            "name": "street1-05",
            "type": "other",
            "description": "",
            "x": 385,
            "y": 382.93055534362793,
            "createdAt": "2025-08-20T11:21:31.470Z",
            "updatedAt": "2025-08-20T11:21:31.470Z",
            "__v": 0
        },
        {
            "_id": "68a5b3b6e20f26b232fe478a",
            "name": "b1-entrance connector ",
            "type": "other",
            "description": "",
            "x": 534,
            "y": 371.26388931274414,
            "createdAt": "2025-08-20T11:38:30.338Z",
            "updatedAt": "2025-08-20T11:38:30.338Z",
            "__v": 0
        },
        {
            "_id": "68a5ba96e20f26b232fe47df",
            "name": "street1-06",
            "type": "other",
            "description": "",
            "x": 423,
            "y": 380.70833587646484,
            "createdAt": "2025-08-20T12:07:50.890Z",
            "updatedAt": "2025-08-20T12:07:50.890Z",
            "__v": 0
        },
        {
            "_id": "68a5bacce20f26b232fe47ed",
            "name": "street1-07",
            "type": "road_turn",
            "description": "",
            "x": 453,
            "y": 365.1527786254883,
            "createdAt": "2025-08-20T12:08:44.544Z",
            "updatedAt": "2025-08-20T12:08:44.544Z",
            "__v": 0
        },
        {
            "_id": "68a5bb49e20f26b232fe4826",
            "name": "street1-08",
            "type": "road_turn",
            "description": "",
            "x": 454,
            "y": 396.7083339691162,
            "createdAt": "2025-08-20T12:10:49.622Z",
            "updatedAt": "2025-08-20T12:10:49.622Z",
            "__v": 0
        },
        {
            "_id": "68a5bb62e20f26b232fe4834",
            "name": "street1-09",
            "type": "road_turn",
            "description": "",
            "x": 428,
            "y": 400.4861068725586,
            "createdAt": "2025-08-20T12:11:14.647Z",
            "updatedAt": "2025-08-20T12:11:14.647Z",
            "__v": 0
        },
        {
            "_id": "68a5c49fe20f26b232fe4893",
            "name": "street1-10",
            "type": "other",
            "description": "",
            "x": 474,
            "y": 411.7083339691162,
            "createdAt": "2025-08-20T12:50:39.030Z",
            "updatedAt": "2025-08-20T12:50:39.030Z",
            "__v": 0
        },
        {
            "_id": "68a5c4bfe20f26b232fe48ac",
            "name": "street1-11",
            "type": "road_turn",
            "description": "",
            "x": 533,
            "y": 414.26388931274414,
            "createdAt": "2025-08-20T12:51:11.144Z",
            "updatedAt": "2025-08-20T12:51:11.144Z",
            "__v": 0
        },
        {
            "_id": "68a609bde5f5a762fbaf82c8",
            "name": "street1-12",
            "type": "other",
            "description": "",
            "x": 534,
            "y": 483.81944274902344,
            "createdAt": "2025-08-20T17:45:33.596Z",
            "updatedAt": "2025-08-20T17:45:33.596Z",
            "__v": 0
        },
        {
            "_id": "68a60a03e5f5a762fbaf82e6",
            "name": "street1-13",
            "type": "other",
            "description": "",
            "x": 512,
            "y": 490.7083339691162,
            "createdAt": "2025-08-20T17:46:43.981Z",
            "updatedAt": "2025-08-20T17:46:43.981Z",
            "__v": 0
        },
        {
            "_id": "68a61e9de5f5a762fbaf840f",
            "name": "pukur er entrance ",
            "type": "other",
            "description": "",
            "x": 683,
            "y": 413.48611068725586,
            "createdAt": "2025-08-20T19:14:37.278Z",
            "updatedAt": "2025-08-20T19:14:37.278Z",
            "__v": 0
        },
        {
            "_id": "68a61f20e5f5a762fbaf842d",
            "name": "gacher side e ",
            "type": "other",
            "description": "",
            "x": 676,
            "y": 529.4861106872559,
            "createdAt": "2025-08-20T19:16:48.555Z",
            "updatedAt": "2025-08-20T19:16:48.555Z",
            "__v": 0
        },
        {
            "_id": "68a61f7fe5f5a762fbaf844b",
            "name": "4 te gach er kache ",
            "type": "road_turn",
            "description": "",
            "x": 600,
            "y": 530.4861106872559,
            "createdAt": "2025-08-20T19:18:23.581Z",
            "updatedAt": "2025-08-20T19:18:23.581Z",
            "__v": 0
        },
        {
            "_id": "68a620a0e5f5a762fbaf8474",
            "name": "2 to gacher middle",
            "type": "other",
            "description": "",
            "x": 559,
            "y": 490.48611068725586,
            "createdAt": "2025-08-20T19:23:12.046Z",
            "updatedAt": "2025-08-20T19:23:12.046Z",
            "__v": 0
        },
        {
            "_id": "68a620b5e5f5a762fbaf8482",
            "name": "2 to p er middle",
            "type": "other",
            "description": "",
            "x": 559,
            "y": 530.4861106872559,
            "createdAt": "2025-08-20T19:23:33.860Z",
            "updatedAt": "2025-08-20T19:23:33.860Z",
            "__v": 0
        }
    ],
    "connections": [
        {
            "_id": "68a5af3a1c52e725b8dc9f36",
            "from": {
                "_id": "68a5ae981c52e725b8dc9f28",
                "name": "street1-03",
                "type": "road_turn",
                "description": "",
                "x": 337,
                "y": 390.93055534362793,
                "createdAt": "2025-08-20T11:16:40.799Z",
                "updatedAt": "2025-08-20T11:16:40.799Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5ae831c52e725b8dc9f1e",
                "name": "street1-02",
                "type": "road_turn",
                "description": "",
                "x": 331,
                "y": 503.4861145019531,
                "createdAt": "2025-08-20T11:16:19.657Z",
                "updatedAt": "2025-08-20T11:16:19.657Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 112.71536673161846,
            "left_reference_nodes": [
                "68a5ae661c52e725b8dc9f19"
            ],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T11:19:22.227Z",
            "updatedAt": "2025-08-20T11:19:22.227Z",
            "__v": 0
        },
        {
            "_id": "68a5af951c52e725b8dc9f4a",
            "from": {
                "_id": "68a5aeb11c52e725b8dc9f2d",
                "name": "street1-04",
                "type": "road_turn",
                "description": "",
                "x": 333,
                "y": 612.9305553436279,
                "createdAt": "2025-08-20T11:17:05.887Z",
                "updatedAt": "2025-08-20T11:17:05.887Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5ae831c52e725b8dc9f1e",
                "name": "street1-02",
                "type": "road_turn",
                "description": "",
                "x": 331,
                "y": 503.4861145019531,
                "createdAt": "2025-08-20T11:16:19.657Z",
                "updatedAt": "2025-08-20T11:16:19.657Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 109.46271342857739,
            "left_reference_nodes": [
                "68a5ae661c52e725b8dc9f19"
            ],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T11:20:53.855Z",
            "updatedAt": "2025-08-20T11:20:53.855Z",
            "__v": 0
        },
        {
            "_id": "68a5b00f1c52e725b8dc9f61",
            "from": {
                "_id": "68a5ae981c52e725b8dc9f28",
                "name": "street1-03",
                "type": "road_turn",
                "description": "",
                "x": 337,
                "y": 390.93055534362793,
                "createdAt": "2025-08-20T11:16:40.799Z",
                "updatedAt": "2025-08-20T11:16:40.799Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5afbb1c52e725b8dc9f52",
                "name": "street1-05",
                "type": "other",
                "description": "",
                "x": 385,
                "y": 382.93055534362793,
                "createdAt": "2025-08-20T11:21:31.470Z",
                "updatedAt": "2025-08-20T11:21:31.470Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 48.662100242385755,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T11:22:55.031Z",
            "updatedAt": "2025-08-20T11:22:55.031Z",
            "__v": 0
        },
        {
            "_id": "68a5baf2e20f26b232fe4808",
            "from": {
                "_id": "68a5ba96e20f26b232fe47df",
                "name": "street1-06",
                "type": "other",
                "description": "",
                "x": 423,
                "y": 380.70833587646484,
                "createdAt": "2025-08-20T12:07:50.890Z",
                "updatedAt": "2025-08-20T12:07:50.890Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5bacce20f26b232fe47ed",
                "name": "street1-07",
                "type": "road_turn",
                "description": "",
                "x": 453,
                "y": 365.1527786254883,
                "createdAt": "2025-08-20T12:08:44.544Z",
                "updatedAt": "2025-08-20T12:08:44.544Z",
                "__v": 0
            },
            "direction": "SE-NW",
            "distance": 33.79312594875487,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:09:22.614Z",
            "updatedAt": "2025-08-20T12:09:22.614Z",
            "__v": 0
        },
        {
            "_id": "68a5bb12e20f26b232fe4818",
            "from": {
                "_id": "68a5ba96e20f26b232fe47df",
                "name": "street1-06",
                "type": "other",
                "description": "",
                "x": 423,
                "y": 380.70833587646484,
                "createdAt": "2025-08-20T12:07:50.890Z",
                "updatedAt": "2025-08-20T12:07:50.890Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5afbb1c52e725b8dc9f52",
                "name": "street1-05",
                "type": "other",
                "description": "",
                "x": 385,
                "y": 382.93055534362793,
                "createdAt": "2025-08-20T11:21:31.470Z",
                "updatedAt": "2025-08-20T11:21:31.470Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 38.06492163869825,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:09:54.240Z",
            "updatedAt": "2025-08-20T12:09:54.240Z",
            "__v": 0
        },
        {
            "_id": "68a5bb88e20f26b232fe4844",
            "from": {
                "_id": "68a5ba96e20f26b232fe47df",
                "name": "street1-06",
                "type": "other",
                "description": "",
                "x": 423,
                "y": 380.70833587646484,
                "createdAt": "2025-08-20T12:07:50.890Z",
                "updatedAt": "2025-08-20T12:07:50.890Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5bb62e20f26b232fe4834",
                "name": "street1-09",
                "type": "road_turn",
                "description": "",
                "x": 428,
                "y": 400.4861068725586,
                "createdAt": "2025-08-20T12:11:14.647Z",
                "updatedAt": "2025-08-20T12:11:14.647Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 20.400005528771974,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:11:52.391Z",
            "updatedAt": "2025-08-20T12:11:52.391Z",
            "__v": 0
        },
        {
            "_id": "68a5bbbae20f26b232fe4854",
            "from": {
                "_id": "68a5bb62e20f26b232fe4834",
                "name": "street1-09",
                "type": "road_turn",
                "description": "",
                "x": 428,
                "y": 400.4861068725586,
                "createdAt": "2025-08-20T12:11:14.647Z",
                "updatedAt": "2025-08-20T12:11:14.647Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5bb49e20f26b232fe4826",
                "name": "street1-08",
                "type": "road_turn",
                "description": "",
                "x": 454,
                "y": 396.7083339691162,
                "createdAt": "2025-08-20T12:10:49.622Z",
                "updatedAt": "2025-08-20T12:10:49.622Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 26.27301977523679,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:12:42.017Z",
            "updatedAt": "2025-08-20T12:12:42.017Z",
            "__v": 0
        },
        {
            "_id": "68a5bbcde20f26b232fe4864",
            "from": {
                "_id": "68a5bb49e20f26b232fe4826",
                "name": "street1-08",
                "type": "road_turn",
                "description": "",
                "x": 454,
                "y": 396.7083339691162,
                "createdAt": "2025-08-20T12:10:49.622Z",
                "updatedAt": "2025-08-20T12:10:49.622Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5bacce20f26b232fe47ed",
                "name": "street1-07",
                "type": "road_turn",
                "description": "",
                "x": 453,
                "y": 365.1527786254883,
                "createdAt": "2025-08-20T12:08:44.544Z",
                "updatedAt": "2025-08-20T12:08:44.544Z",
                "__v": 0
            },
            "direction": "S-N",
            "distance": 31.571396437990593,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:13:01.099Z",
            "updatedAt": "2025-08-20T12:13:01.099Z",
            "__v": 0
        },
        {
            "_id": "68a5c4d6e20f26b232fe48bc",
            "from": {
                "_id": "68a5bacce20f26b232fe47ed",
                "name": "street1-07",
                "type": "road_turn",
                "description": "",
                "x": 453,
                "y": 365.1527786254883,
                "createdAt": "2025-08-20T12:08:44.544Z",
                "updatedAt": "2025-08-20T12:08:44.544Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5b3b6e20f26b232fe478a",
                "name": "b1-entrance connector ",
                "type": "other",
                "description": "",
                "x": 534,
                "y": 371.26388931274414,
                "createdAt": "2025-08-20T11:38:30.338Z",
                "updatedAt": "2025-08-20T11:38:30.338Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 81.23020173452663,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:51:34.090Z",
            "updatedAt": "2025-08-20T12:51:34.090Z",
            "__v": 0
        },
        {
            "_id": "68a5c517e20f26b232fe48cc",
            "from": {
                "_id": "68a5bb49e20f26b232fe4826",
                "name": "street1-08",
                "type": "road_turn",
                "description": "",
                "x": 454,
                "y": 396.7083339691162,
                "createdAt": "2025-08-20T12:10:49.622Z",
                "updatedAt": "2025-08-20T12:10:49.622Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5c49fe20f26b232fe4893",
                "name": "street1-10",
                "type": "other",
                "description": "",
                "x": 474,
                "y": 411.7083339691162,
                "createdAt": "2025-08-20T12:50:39.030Z",
                "updatedAt": "2025-08-20T12:50:39.030Z",
                "__v": 0
            },
            "direction": "SE-NW",
            "distance": 25,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:52:39.534Z",
            "updatedAt": "2025-08-20T12:52:39.534Z",
            "__v": 0
        },
        {
            "_id": "68a5c528e20f26b232fe48dc",
            "from": {
                "_id": "68a5c49fe20f26b232fe4893",
                "name": "street1-10",
                "type": "other",
                "description": "",
                "x": 474,
                "y": 411.7083339691162,
                "createdAt": "2025-08-20T12:50:39.030Z",
                "updatedAt": "2025-08-20T12:50:39.030Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5c4bfe20f26b232fe48ac",
                "name": "street1-11",
                "type": "road_turn",
                "description": "",
                "x": 533,
                "y": 414.26388931274414,
                "createdAt": "2025-08-20T12:51:11.144Z",
                "updatedAt": "2025-08-20T12:51:11.144Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 59.05532036247323,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:52:56.519Z",
            "updatedAt": "2025-08-20T12:52:56.519Z",
            "__v": 0
        },
        {
            "_id": "68a5c531e20f26b232fe48ec",
            "from": {
                "_id": "68a5c4bfe20f26b232fe48ac",
                "name": "street1-11",
                "type": "road_turn",
                "description": "",
                "x": 533,
                "y": 414.26388931274414,
                "createdAt": "2025-08-20T12:51:11.144Z",
                "updatedAt": "2025-08-20T12:51:11.144Z",
                "__v": 0
            },
            "to": {
                "_id": "68a5b3b6e20f26b232fe478a",
                "name": "b1-entrance connector ",
                "type": "other",
                "description": "",
                "x": 534,
                "y": 371.26388931274414,
                "createdAt": "2025-08-20T11:38:30.338Z",
                "updatedAt": "2025-08-20T11:38:30.338Z",
                "__v": 0
            },
            "direction": "S-N",
            "distance": 43.01162633521314,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T12:53:05.833Z",
            "updatedAt": "2025-08-20T12:53:05.833Z",
            "__v": 0
        },
        {
            "_id": "68a609e0e5f5a762fbaf82d8",
            "from": {
                "_id": "68a5c4bfe20f26b232fe48ac",
                "name": "street1-11",
                "type": "road_turn",
                "description": "",
                "x": 533,
                "y": 414.26388931274414,
                "createdAt": "2025-08-20T12:51:11.144Z",
                "updatedAt": "2025-08-20T12:51:11.144Z",
                "__v": 0
            },
            "to": {
                "_id": "68a609bde5f5a762fbaf82c8",
                "name": "street1-12",
                "type": "other",
                "description": "",
                "x": 534,
                "y": 483.81944274902344,
                "createdAt": "2025-08-20T17:45:33.596Z",
                "updatedAt": "2025-08-20T17:45:33.596Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 69.5627415634771,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T17:46:08.366Z",
            "updatedAt": "2025-08-20T17:46:08.366Z",
            "__v": 0
        },
        {
            "_id": "68a60a28e5f5a762fbaf82f6",
            "from": {
                "_id": "68a60a03e5f5a762fbaf82e6",
                "name": "street1-13",
                "type": "other",
                "description": "",
                "x": 512,
                "y": 490.7083339691162,
                "createdAt": "2025-08-20T17:46:43.981Z",
                "updatedAt": "2025-08-20T17:46:43.981Z",
                "__v": 0
            },
            "to": {
                "_id": "68a609bde5f5a762fbaf82c8",
                "name": "street1-12",
                "type": "other",
                "description": "",
                "x": 534,
                "y": 483.81944274902344,
                "createdAt": "2025-08-20T17:45:33.596Z",
                "updatedAt": "2025-08-20T17:45:33.596Z",
                "__v": 0
            },
            "direction": "E-W",
            "distance": 23.053347311014758,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T17:47:20.251Z",
            "updatedAt": "2025-08-20T17:47:20.251Z",
            "__v": 0
        },
        {
            "_id": "68a6106de5f5a762fbaf83a1",
            "from": {
                "_id": "68a6103de5f5a762fbaf8391",
                "name": "entrance1",
                "type": "other",
                "description": "",
                "x": 713,
                "y": 706.6666660308838,
                "createdAt": "2025-08-20T18:13:17.454Z",
                "updatedAt": "2025-08-20T18:13:17.454Z",
                "__v": 0
            },
            "to": {
                "_id": "68a60a03e5f5a762fbaf82e6",
                "name": "street1-13",
                "type": "other",
                "description": "",
                "x": 512,
                "y": 490.7083339691162,
                "createdAt": "2025-08-20T17:46:43.981Z",
                "updatedAt": "2025-08-20T17:46:43.981Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 295.02372987083714,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T18:14:05.902Z",
            "updatedAt": "2025-08-20T18:14:05.902Z",
            "__v": 0
        },
        {
            "_id": "68a61eb0e5f5a762fbaf841f",
            "from": {
                "_id": "68a5c4bfe20f26b232fe48ac",
                "name": "street1-11",
                "type": "road_turn",
                "description": "",
                "x": 533,
                "y": 414.26388931274414,
                "createdAt": "2025-08-20T12:51:11.144Z",
                "updatedAt": "2025-08-20T12:51:11.144Z",
                "__v": 0
            },
            "to": {
                "_id": "68a61e9de5f5a762fbaf840f",
                "name": "pukur er entrance ",
                "type": "other",
                "description": "",
                "x": 683,
                "y": 413.48611068725586,
                "createdAt": "2025-08-20T19:14:37.278Z",
                "updatedAt": "2025-08-20T19:14:37.278Z",
                "__v": 0
            },
            "direction": "S-N",
            "distance": 150.0020164517473,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:14:56.529Z",
            "updatedAt": "2025-08-20T19:14:56.529Z",
            "__v": 0
        },
        {
            "_id": "68a61f45e5f5a762fbaf843d",
            "from": {
                "_id": "68a61e9de5f5a762fbaf840f",
                "name": "pukur er entrance ",
                "type": "other",
                "description": "",
                "x": 683,
                "y": 413.48611068725586,
                "createdAt": "2025-08-20T19:14:37.278Z",
                "updatedAt": "2025-08-20T19:14:37.278Z",
                "__v": 0
            },
            "to": {
                "_id": "68a61f20e5f5a762fbaf842d",
                "name": "gacher side e ",
                "type": "other",
                "description": "",
                "x": 676,
                "y": 529.4861106872559,
                "createdAt": "2025-08-20T19:16:48.555Z",
                "updatedAt": "2025-08-20T19:16:48.555Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 116.21101496846157,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:17:25.220Z",
            "updatedAt": "2025-08-20T19:17:25.220Z",
            "__v": 0
        },
        {
            "_id": "68a61f99e5f5a762fbaf845b",
            "from": {
                "_id": "68a61f7fe5f5a762fbaf844b",
                "name": "4 te gach er kache ",
                "type": "road_turn",
                "description": "",
                "x": 600,
                "y": 530.4861106872559,
                "createdAt": "2025-08-20T19:18:23.581Z",
                "updatedAt": "2025-08-20T19:18:23.581Z",
                "__v": 0
            },
            "to": {
                "_id": "68a61f20e5f5a762fbaf842d",
                "name": "gacher side e ",
                "type": "other",
                "description": "",
                "x": 676,
                "y": 529.4861106872559,
                "createdAt": "2025-08-20T19:16:48.555Z",
                "updatedAt": "2025-08-20T19:16:48.555Z",
                "__v": 0
            },
            "direction": "N-S",
            "distance": 76.00657866263946,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:18:49.189Z",
            "updatedAt": "2025-08-20T19:18:49.189Z",
            "__v": 0
        },
        {
            "_id": "68a620d6e5f5a762fbaf8492",
            "from": {
                "_id": "68a609bde5f5a762fbaf82c8",
                "name": "street1-12",
                "type": "other",
                "description": "",
                "x": 534,
                "y": 483.81944274902344,
                "createdAt": "2025-08-20T17:45:33.596Z",
                "updatedAt": "2025-08-20T17:45:33.596Z",
                "__v": 0
            },
            "to": {
                "_id": "68a620a0e5f5a762fbaf8474",
                "name": "2 to gacher middle",
                "type": "other",
                "description": "",
                "x": 559,
                "y": 490.48611068725586,
                "createdAt": "2025-08-20T19:23:12.046Z",
                "updatedAt": "2025-08-20T19:23:12.046Z",
                "__v": 0
            },
            "direction": "SW-NE",
            "distance": 25.873624821401737,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:24:06.742Z",
            "updatedAt": "2025-08-20T19:24:06.742Z",
            "__v": 0
        },
        {
            "_id": "68a620f4e5f5a762fbaf84a2",
            "from": {
                "_id": "68a620b5e5f5a762fbaf8482",
                "name": "2 to p er middle",
                "type": "other",
                "description": "",
                "x": 559,
                "y": 530.4861106872559,
                "createdAt": "2025-08-20T19:23:33.860Z",
                "updatedAt": "2025-08-20T19:23:33.860Z",
                "__v": 0
            },
            "to": {
                "_id": "68a620a0e5f5a762fbaf8474",
                "name": "2 to gacher middle",
                "type": "other",
                "description": "",
                "x": 559,
                "y": 490.48611068725586,
                "createdAt": "2025-08-20T19:23:12.046Z",
                "updatedAt": "2025-08-20T19:23:12.046Z",
                "__v": 0
            },
            "direction": "W-E",
            "distance": 40,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:24:36.524Z",
            "updatedAt": "2025-08-20T19:24:36.524Z",
            "__v": 0
        },
        {
            "_id": "68a62107e5f5a762fbaf84b2",
            "from": {
                "_id": "68a620b5e5f5a762fbaf8482",
                "name": "2 to p er middle",
                "type": "other",
                "description": "",
                "x": 559,
                "y": 530.4861106872559,
                "createdAt": "2025-08-20T19:23:33.860Z",
                "updatedAt": "2025-08-20T19:23:33.860Z",
                "__v": 0
            },
            "to": {
                "_id": "68a61f7fe5f5a762fbaf844b",
                "name": "4 te gach er kache ",
                "type": "road_turn",
                "description": "",
                "x": 600,
                "y": 530.4861106872559,
                "createdAt": "2025-08-20T19:18:23.581Z",
                "updatedAt": "2025-08-20T19:18:23.581Z",
                "__v": 0
            },
            "direction": "S-N",
            "distance": 41,
            "left_reference_nodes": [],
            "right_reference_nodes": [],
            "createdAt": "2025-08-20T19:24:55.892Z",
            "updatedAt": "2025-08-20T19:24:55.892Z",
            "__v": 0
        }
    ],
    "buildings": [
        {
            "_id": "68a5b0501c52e725b8dc9f73",
            "name": "B1",
            "entranceNodes": [],
            "entranceEdges": [],
            "floors": [
                {
                    "_id": "68a5b1dfe20f26b232fe472c",
                    "floorNumber": 1,
                    "mapImage": "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a5b1da0007358bad69/view?project=689b5787003b4e752196",
                    "width": 1280,
                    "height": 960,
                    "nodes": [
                        {
                            "_id": "68a5b231e20f26b232fe4736",
                            "name": "b1-Entrance",
                            "type": "entrance",
                            "description": "",
                            "x": 222,
                            "y": 679.1527767181396,
                            "createdAt": "2025-08-20T11:32:01.492Z",
                            "updatedAt": "2025-08-20T11:32:01.492Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a5b291e20f26b232fe4749",
                            "name": "b1-01",
                            "type": "road_turn",
                            "description": "",
                            "x": 239,
                            "y": 461.15277671813965,
                            "createdAt": "2025-08-20T11:33:37.591Z",
                            "updatedAt": "2025-08-20T11:33:37.591Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a5b2aee20f26b232fe4754",
                            "name": "d1",
                            "type": "door",
                            "description": "",
                            "x": 273,
                            "y": 428.15277671813965,
                            "createdAt": "2025-08-20T11:34:06.321Z",
                            "updatedAt": "2025-08-20T11:34:06.321Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a60a61e5f5a762fbaf8304",
                            "name": "incubation center enntrance ",
                            "type": "door",
                            "description": "",
                            "x": 276,
                            "y": 485.88888931274414,
                            "createdAt": "2025-08-20T17:48:17.162Z",
                            "updatedAt": "2025-08-20T17:48:17.162Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a60b83e5f5a762fbaf832b",
                            "name": "road2",
                            "type": "other",
                            "description": "",
                            "x": 396,
                            "y": 458.3333282470703,
                            "createdAt": "2025-08-20T17:53:07.984Z",
                            "updatedAt": "2025-08-20T17:53:07.984Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a60eabe5f5a762fbaf836a",
                            "name": "classroom1",
                            "type": "other",
                            "description": "",
                            "x": 414,
                            "y": 425.6666660308838,
                            "createdAt": "2025-08-20T18:06:35.235Z",
                            "updatedAt": "2025-08-20T18:06:35.235Z",
                            "__v": 0
                        }
                    ],
                    "connections": [
                        {
                            "_id": "68a5b2f9e20f26b232fe4761",
                            "from": {
                                "_id": "68a5b2aee20f26b232fe4754",
                                "name": "d1",
                                "type": "door",
                                "description": "",
                                "x": 273,
                                "y": 428.15277671813965,
                                "createdAt": "2025-08-20T11:34:06.321Z",
                                "updatedAt": "2025-08-20T11:34:06.321Z",
                                "__v": 0
                            },
                            "to": {
                                "_id": "68a5b291e20f26b232fe4749",
                                "name": "b1-01",
                                "type": "road_turn",
                                "description": "",
                                "x": 239,
                                "y": 461.15277671813965,
                                "createdAt": "2025-08-20T11:33:37.591Z",
                                "updatedAt": "2025-08-20T11:33:37.591Z",
                                "__v": 0
                            },
                            "direction": "SE-NW",
                            "distance": 47.38143096192854,
                            "left_reference_nodes": [],
                            "right_reference_nodes": [],
                            "createdAt": "2025-08-20T11:35:21.160Z",
                            "updatedAt": "2025-08-20T11:35:21.160Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a5b322e20f26b232fe4771",
                            "from": {
                                "_id": "68a5b291e20f26b232fe4749",
                                "name": "b1-01",
                                "type": "road_turn",
                                "description": "",
                                "x": 239,
                                "y": 461.15277671813965,
                                "createdAt": "2025-08-20T11:33:37.591Z",
                                "updatedAt": "2025-08-20T11:33:37.591Z",
                                "__v": 0
                            },
                            "to": {
                                "_id": "68a5b231e20f26b232fe4736",
                                "name": "b1-Entrance",
                                "type": "entrance",
                                "description": "",
                                "x": 222,
                                "y": 679.1527767181396,
                                "createdAt": "2025-08-20T11:32:01.492Z",
                                "updatedAt": "2025-08-20T11:32:01.492Z",
                                "__v": 0
                            },
                            "direction": "E-W",
                            "distance": 218.66183937761065,
                            "left_reference_nodes": [],
                            "right_reference_nodes": [],
                            "createdAt": "2025-08-20T11:36:02.987Z",
                            "updatedAt": "2025-08-20T11:36:02.987Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a5b3ebe20f26b232fe479a",
                            "from": {
                                "_id": "68a5b3b6e20f26b232fe478a",
                                "name": "b1-entrance connector ",
                                "type": "other",
                                "description": "",
                                "x": 534,
                                "y": 371.26388931274414,
                                "createdAt": "2025-08-20T11:38:30.338Z",
                                "updatedAt": "2025-08-20T11:38:30.338Z",
                                "__v": 0
                            },
                            "to": {
                                "_id": "68a5b231e20f26b232fe4736",
                                "name": "b1-Entrance",
                                "type": "entrance",
                                "description": "",
                                "x": 222,
                                "y": 679.1527767181396,
                                "createdAt": "2025-08-20T11:32:01.492Z",
                                "updatedAt": "2025-08-20T11:32:01.492Z",
                                "__v": 0
                            },
                            "direction": "E-W",
                            "distance": 438.33727538019434,
                            "left_reference_nodes": [],
                            "right_reference_nodes": [],
                            "createdAt": "2025-08-20T11:39:23.923Z",
                            "updatedAt": "2025-08-20T11:39:23.923Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a60bece5f5a762fbaf8346",
                            "from": {
                                "_id": "68a5b291e20f26b232fe4749",
                                "name": "b1-01",
                                "type": "road_turn",
                                "description": "",
                                "x": 239,
                                "y": 461.15277671813965,
                                "createdAt": "2025-08-20T11:33:37.591Z",
                                "updatedAt": "2025-08-20T11:33:37.591Z",
                                "__v": 0
                            },
                            "to": {
                                "_id": "68a60b83e5f5a762fbaf832b",
                                "name": "road2",
                                "type": "other",
                                "description": "",
                                "x": 396,
                                "y": 458.3333282470703,
                                "createdAt": "2025-08-20T17:53:07.984Z",
                                "updatedAt": "2025-08-20T17:53:07.984Z",
                                "__v": 0
                            },
                            "direction": "W-E",
                            "distance": 157.0253141683882,
                            "left_reference_nodes": [],
                            "right_reference_nodes": [],
                            "createdAt": "2025-08-20T17:54:52.848Z",
                            "updatedAt": "2025-08-20T17:54:52.848Z",
                            "__v": 0
                        }
                    ],
                    "createdAt": "2025-08-20T11:30:39.312Z",
                    "updatedAt": "2025-08-20T18:06:35.278Z",
                    "__v": 0
                }
            ],
            "createdAt": "2025-08-20T11:24:00.542Z",
            "updatedAt": "2025-08-20T11:30:39.353Z",
            "__v": 0
        },
        {
            "_id": "68a60afde5f5a762fbaf831d",
            "name": "B2",
            "entranceNodes": [],
            "entranceEdges": [],
            "floors": [
                {
                    "_id": "68a6100ce5f5a762fbaf8383",
                    "floorNumber": 1,
                    "mapImage": "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a6100a002ab28cfd6f/view?project=689b5787003b4e752196",
                    "width": 750,
                    "height": 698,
                    "nodes": [
                        {
                            "_id": "68a6103de5f5a762fbaf8391",
                            "name": "entrance1",
                            "type": "other",
                            "description": "",
                            "x": 713,
                            "y": 706.6666660308838,
                            "createdAt": "2025-08-20T18:13:17.454Z",
                            "updatedAt": "2025-08-20T18:13:17.454Z",
                            "__v": 0
                        },
                        {
                            "_id": "68a61a10e5f5a762fbaf83db",
                            "name": "entrance near point",
                            "type": "other",
                            "description": "",
                            "x": 707,
                            "y": 574.6666660308838,
                            "createdAt": "2025-08-20T18:55:12.156Z",
                            "updatedAt": "2025-08-20T18:55:12.156Z",
                            "__v": 0
                        }
                    ],
                    "connections": [
                        {
                            "_id": "68a61a2be5f5a762fbaf83eb",
                            "from": {
                                "_id": "68a61a10e5f5a762fbaf83db",
                                "name": "entrance near point",
                                "type": "other",
                                "description": "",
                                "x": 707,
                                "y": 574.6666660308838,
                                "createdAt": "2025-08-20T18:55:12.156Z",
                                "updatedAt": "2025-08-20T18:55:12.156Z",
                                "__v": 0
                            },
                            "to": {
                                "_id": "68a6103de5f5a762fbaf8391",
                                "name": "entrance1",
                                "type": "other",
                                "description": "",
                                "x": 713,
                                "y": 706.6666660308838,
                                "createdAt": "2025-08-20T18:13:17.454Z",
                                "updatedAt": "2025-08-20T18:13:17.454Z",
                                "__v": 0
                            },
                            "direction": "N-S",
                            "distance": 132.13629327327143,
                            "left_reference_nodes": [],
                            "right_reference_nodes": [],
                            "createdAt": "2025-08-20T18:55:39.096Z",
                            "updatedAt": "2025-08-20T18:55:39.096Z",
                            "__v": 0
                        }
                    ],
                    "createdAt": "2025-08-20T18:12:29.002Z",
                    "updatedAt": "2025-08-20T18:55:39.107Z",
                    "__v": 0
                }
            ],
            "createdAt": "2025-08-20T17:50:53.232Z",
            "updatedAt": "2025-08-20T18:12:29.035Z",
            "__v": 0
        }
    ],
    "createdAt": "2025-08-20T11:14:43.545Z",
    "updatedAt": "2025-08-20T19:24:55.897Z",
    "__v": 0
}
// Example usage with your data
const shortestPath = [
  "68a61f20e5f5a762fbaf842d → 68a61f7fe5f5a762fbaf844b (76.01 m)",
  "68a61f7fe5f5a762fbaf844b → 68a620b5e5f5a762fbaf8482 (41.00 m)",
  "68a620b5e5f5a762fbaf8482 → 68a620a0e5f5a762fbaf8474 (40.00 m)",
  "68a620a0e5f5a762fbaf8474 → 68a609bde5f5a762fbaf82c8 (25.87 m)",
  "68a609bde5f5a762fbaf82c8 → 68a5c4bfe20f26b232fe48ac (69.56 m)",
  "68a5c4bfe20f26b232fe48ac → 68a5b3b6e20f26b232fe478a (43.01 m)",
  "68a5b3b6e20f26b232fe478a → 68a5b231e20f26b232fe4736 (438.34 m)",
  "68a5b231e20f26b232fe4736 → 68a5b291e20f26b232fe4749 (218.66 m)",
  "68a5b291e20f26b232fe4749 → 68a60b83e5f5a762fbaf832b (157.03 m)"
]


console.log(filterJsonByShortestPath(rawJson,shortestPath))
// You would call it like this:
// const filteredResult = filterJsonByShortestPath(yourRawJsonData, shortestPath);
// console.log(JSON.stringify(filteredResult, null, 2));


