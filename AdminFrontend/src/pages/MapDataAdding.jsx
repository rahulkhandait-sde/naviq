"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { Client, Storage, ID, Permission, Role } from "appwrite"
import AuthContext from "../context/AuthContext"

const MapInterface = () => {
  const { jwtToken, user } = useContext(AuthContext)
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [activeMode, setActiveMode] = useState("view") // view, addNode, addEdge, addBuilding
  const [selectedNodes, setSelectedNodes] = useState([])
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [showNodeForm, setShowNodeForm] = useState(false)
  const [showEdgeForm, setShowEdgeForm] = useState(false)
  const [showBuildingForm, setShowBuildingForm] = useState(false)
  const [showFloorForm, setShowFloorForm] = useState(false)
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 })
  const [clickIndicators, setClickIndicators] = useState([])
  const [floorUploading, setFloorUploading] = useState(false)
  const [selectedFloorFile, setSelectedFloorFile] = useState(null)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  // Appwrite client setup
  const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("689b5787003b4e752196")
  const storage = new Storage(client)

  // Node form state
  const [nodeForm, setNodeForm] = useState({
    name: "",
    type: "other",
    description: "",
    x: 0,
    y: 0,
  })

  // Edge form state
  const [edgeForm, setEdgeForm] = useState({
    direction: "N-S",
    left_reference_nodes: [],
    right_reference_nodes: [],
  })

  // Building form state
  const [buildingForm, setBuildingForm] = useState({
    name: "",
  })

  // Floor form state
  const [floorForm, setFloorForm] = useState({
    floorNumber: 1,
    imageUrl: "",
    width: 0,
    height: 0,
  })

  const nodeTypes = ["room", "stair", "lift", "door", "road_turn", "escalator", "entrance", "exit", "other"]
  const directions = ["N-S", "S-N", "E-W", "W-E", "NE-SW", "SW-NE", "NW-SE", "SE-NW"]

  // Fetch map data on component mount
  useEffect(() => {
    if (user && jwtToken) {
      fetchMapData()
    }
  }, [user, jwtToken, clickPosition])

  const fetchMapData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/rurl/api/maps/${user.$id}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMapData(data)
        setBuildings(data.buildings || [])
      } else if (response.status === 404) {
        setMapData(null)
      }
    } catch (error) {
      console.error("Error fetching map data:", error)
      setMapData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first")
      return
    }

    try {
      setUploading(true)

      const result = await storage.createFile("68a2407a000973202004", ID.unique(), selectedFile, [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ])

      const imageUrl = `${client.config.endpoint}/storage/buckets/68a2407a000973202004/files/${result.$id}/view?project=${client.config.project}`

      // Get image dimensions
      const img = new Image()
      img.onload = async () => {
        await createMap(imageUrl, img.width, img.height)
      }
      img.src = imageUrl
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const createMap = async (imageUrl, width, height) => {
    try {
      const response = await fetch("/rurl/api/maps", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appwriteId: user.$id,
          mapImage: imageUrl,
          width,
          height,
        }),
      })

      if (response.ok) {
        window.location.reload() // Reload to fetch new map data
      } else {
        throw new Error("Failed to create map")
      }
    } catch (error) {
      console.error("Error creating map:", error)
      alert("Failed to create map. Please try again.")
    }
  }

  const handleCanvasClick = (event) => {
    if (activeMode === "view") return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setClickPosition({ x, y })

    const clickId = Date.now()
    setClickIndicators((prev) => [...prev, { id: clickId, x, y }])
    setTimeout(() => {
      setClickIndicators((prev) => prev.filter((indicator) => indicator.id !== clickId))
    }, 2000)

    if (activeMode === "addNode") {
      setNodeForm((prev) => ({ ...prev, x, y }))
      setShowNodeForm(true)
    } else if (activeMode === "addEdge") {
      if (selectedNodes.length < 2) {
        // Find if there's a node at this position (within 10px radius)
        const clickedNode = findNodeAtPosition(x, y)
        if (clickedNode) {
          setSelectedNodes((prev) => [...prev, clickedNode])
          if (selectedNodes.length === 1) {
            setShowEdgeForm(true)
          }
        }
      }
    }
  }

  const findNodeAtPosition = (x, y) => {
    const mapNodes = mapData?.nodes || []
    const floorNodes = selectedFloor?.nodes || []
    const allNodes = [...mapNodes, ...floorNodes]

    return allNodes.find((node) => {
      const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2))
      return distance <= 10
    })
  }

  const createNode = async () => {
    try {
      const parentType = selectedFloor ? "floor" : "map"
      const parentId = selectedFloor ? selectedFloor._id : user.$id

      const response = await fetch("/rurl/api/maps/node", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...nodeForm,
          parentId,
          parentType,
        }),
      })

      if (response.ok) {
        setShowNodeForm(false)
        setNodeForm({ name: "", type: "other", description: "", x: 0, y: 0 })
        await fetchMapData()
      }
    } catch (error) {
      console.error("Error creating node:", error)
    }
  }

  const createEdge = async () => {
    if (selectedNodes.length !== 2) return

    try {
      const parentType = selectedFloor ? "floor" : "map"
      const parentId = selectedFloor ? selectedFloor._id : user.$id

      const isFromFloorNode = selectedFloor?.nodes?.some((node) => node._id === selectedNodes[0]._id)
      const isToFloorNode = selectedFloor?.nodes?.some((node) => node._id === selectedNodes[1]._id)
      const isFromMapNode = mapData?.nodes?.some((node) => node._id === selectedNodes[0]._id)
      const isToMapNode = mapData?.nodes?.some((node) => node._id === selectedNodes[1]._id)

      const isCrossLevelEdge = (isFromFloorNode && isToMapNode) || (isFromMapNode && isToFloorNode)

      const response = await fetch("/rurl/api/maps/edge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: selectedNodes[0]._id,
          to: selectedNodes[1]._id,
          ...edgeForm,
          parentType,
          parentId,
          distance: isCrossLevelEdge ? 0 : undefined, // Set distance to 0 for cross-level edges
        }),
      })

      if (response.ok) {
        setShowEdgeForm(false)
        setSelectedNodes([])
        setEdgeForm({ direction: "N-S", left_reference_nodes: [], right_reference_nodes: [] })
        await fetchMapData()
      }
    } catch (error) {
      console.error("Error creating edge:", error)
    }
  }

  const createBuilding = async () => {
    try {
      const response = await fetch("/rurl/api/maps/building", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appwriteId: user.$id,
          name: buildingForm.name,
        }),
      })

      if (response.ok) {
        setShowBuildingForm(false)
        setBuildingForm({ name: "" })
        await fetchMapData()
      }
    } catch (error) {
      console.error("Error creating building:", error)
    }
  }

  const handleFloorFileUpload = async () => {
    if (!selectedFloorFile) {
      alert("Please select a file first")
      return
    }

    try {
      setFloorUploading(true)

      const result = await storage.createFile("68a2407a000973202004", ID.unique(), selectedFloorFile, [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ])

      const imageUrl = `${client.config.endpoint}/storage/buckets/68a2407a000973202004/files/${result.$id}/view?project=${client.config.project}`

      // Get image dimensions and auto-populate form
      const img = new Image()
      img.onload = () => {
        setFloorForm((prev) => ({
          ...prev,
          imageUrl,
          width: img.width,
          height: img.height,
        }))
      }
      img.src = imageUrl
    } catch (error) {
      console.error("Floor upload failed:", error)
      alert("Floor upload failed. Please try again.")
    } finally {
      setFloorUploading(false)
    }
  }

  const createFloor = async () => {
    if (!selectedBuilding) return

    let imageUrl = floorForm.imageUrl
    let width = floorForm.width
    let height = floorForm.height

    if (selectedFloorFile && !imageUrl) {
      try {
        setFloorUploading(true)

        const result = await storage.createFile("68a2407a000973202004", ID.unique(), selectedFloorFile, [
          Permission.read(Role.any()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ])

        imageUrl = `${client.config.endpoint}/storage/buckets/68a2407a000973202004/files/${result.$id}/view?project=${client.config.project}`

        // Get image dimensions
        const img = new Image()
        await new Promise((resolve) => {
          img.onload = () => {
            width = img.width
            height = img.height
            resolve()
          }
          img.src = imageUrl
        })
      } catch (error) {
        console.error("Floor upload failed:", error)
        alert("Floor upload failed. Please try again.")
        setFloorUploading(false)
        return
      } finally {
        setFloorUploading(false)
      }
    }

    try {
      const response = await fetch("/rurl/api/maps/floor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentBuildingId: selectedBuilding._id,
          mapImage: imageUrl,
          floorNumber: floorForm.floorNumber,
          width: width,
          height: height,
        }),
      })

      if (response.ok) {
        setShowFloorForm(false)
        setFloorForm({ floorNumber: 1, imageUrl: "", width: 0, height: 0 })
        setSelectedFloorFile(null)
        await fetchMapData()
      }
    } catch (error) {
      console.error("Error creating floor:", error)
    }
  }

  const deleteFloor = async (floorId) => {
    if (!confirm("Are you sure you want to delete this floor? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/rurl/api/maps/floor/${floorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // If we're currently viewing the deleted floor, go back to main map
        if (selectedFloor?._id === floorId) {
          setSelectedFloor(null)
          setSelectedBuilding(null)
        }
        await fetchMapData()
        alert("Floor deleted successfully")
      } else {
        throw new Error("Failed to delete floor")
      }
    } catch (error) {
      console.error("Error deleting floor:", error)
      alert("Failed to delete floor. Please try again.")
    }
  }

  const deleteNode = async (nodeId) => {
    if (!confirm("Are you sure you want to delete this node? This will also delete all connected edges.")) {
      return
    }

    try {
      const response = await fetch(`/rurl/api/maps/node/${nodeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Remove the node from selected nodes if it was selected
        setSelectedNodes((prev) => prev.filter((node) => node._id !== nodeId))
        await fetchMapData()
        alert("Node deleted successfully")
      } else {
        throw new Error("Failed to delete node")
      }
    } catch (error) {
      console.error("Error deleting node:", error)
      alert("Failed to delete node. Please try again.")
    }
  }

  const deleteEdge = async (edgeId) => {
    if (!confirm("Are you sure you want to delete this edge?")) {
      return
    }

    try {
      const response = await fetch(`/rurl/api/maps/edge/${edgeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        await fetchMapData()
        alert("Edge deleted successfully")
      } else {
        throw new Error("Failed to delete edge")
      }
    } catch (error) {
      console.error("Error deleting edge:", error)
      alert("Failed to delete edge. Please try again.")
    }
  }

  const drawMap = () => {
    const canvas = canvasRef.current
    if (!canvas || !mapData) return

    const ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw map image if available
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    }

    // Draw nodes
    const currentNodes = selectedFloor ? selectedFloor.nodes : mapData.nodes
    currentNodes?.forEach((node) => {
      ctx.fillStyle = selectedNodes.includes(node) ? "#ff0000" : "#0066cc"
      ctx.beginPath()
      ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI)
      ctx.fill()

      // Draw node label
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.fillText(node.name, node.x + 8, node.y - 8)
    })

    const currentEdges = selectedFloor ? selectedFloor.connections : mapData.connections
    currentEdges?.forEach((edge) => {
      if (edge.from && edge.to) {
        // Check if this is a cross-level edge
        const isFromCurrentLevel = currentNodes?.some((node) => node._id === edge.from._id)
        const isToCurrentLevel = currentNodes?.some((node) => node._id === edge.to._id)

        // Only draw the line if both nodes are on the current level
        if (isFromCurrentLevel && isToCurrentLevel) {
          ctx.strokeStyle = "#666"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(edge.from.x, edge.from.y)
          ctx.lineTo(edge.to.x, edge.to.y)
          ctx.stroke()
        }
      }
    })

    clickIndicators.forEach((indicator) => {
      ctx.strokeStyle = "#ff0000"
      ctx.lineWidth = 2

      // Draw circle
      ctx.beginPath()
      ctx.arc(indicator.x, indicator.y, 8, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw crosshairs
      ctx.beginPath()
      ctx.moveTo(indicator.x - 12, indicator.y)
      ctx.lineTo(indicator.x + 12, indicator.y)
      ctx.moveTo(indicator.x, indicator.y - 12)
      ctx.lineTo(indicator.x, indicator.y + 12)
      ctx.stroke()
    })
  }

  useEffect(() => {
    drawMap()
  }, [mapData, selectedFloor, selectedNodes, clickIndicators])

  const getAllAvailableNodes = () => {
    const mapNodes = mapData?.nodes || []
    const floorNodes = selectedFloor?.nodes || []
    return [...mapNodes, ...floorNodes]
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 bg-slate-900 text-white">Loading...</div>
  }

  if (!mapData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-900 min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-white">Upload Campus Map</h2>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center bg-slate-800">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="mb-4 text-white"
          />
          <button
            onClick={handleFileUpload}
            disabled={uploading || !selectedFile}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-slate-600 hover:bg-blue-700"
          >
            {uploading ? "Uploading..." : "Upload Map"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800 p-4 overflow-y-auto border-r border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-white">Map Interface</h2>

        {selectedFloor && (
          <div className="mb-4 p-3 bg-blue-900 rounded-lg border border-blue-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-200">Currently Viewing:</p>
                <p className="text-lg font-bold text-white">
                  {selectedBuilding?.name} - Floor {selectedFloor.floorNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFloor(null)
                  setSelectedBuilding(null)
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Back to Main Map
              </button>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-white">Mode</h3>
          <select
            value={activeMode}
            onChange={(e) => {
              setActiveMode(e.target.value)
              setSelectedNodes([])
            }}
            className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
          >
            <option value="view">View</option>
            <option value="addNode">Add Node</option>
            <option value="addEdge">Add Edge</option>
            <option value="addBuilding">Add Building</option>
          </select>
        </div>

        {/* Buildings */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-white">Buildings</h3>
            <button
              onClick={() => setShowBuildingForm(true)}
              className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {buildings.map((building) => (
              <div key={building._id} className="border border-slate-600 rounded p-2 bg-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{building.name}</span>
                  <button
                    onClick={() => setSelectedBuilding(building)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Select
                  </button>
                </div>
                {selectedBuilding?._id === building._id && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowFloorForm(true)}
                      className="bg-purple-600 text-white px-2 py-1 rounded text-sm mr-2 hover:bg-purple-700"
                    >
                      Add Floor
                    </button>
                    {building.floors?.map((floor) => (
                      <div key={floor._id} className="mt-1 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedFloor(floor)}
                          className={`text-sm px-2 py-1 rounded ${
                            selectedFloor?._id === floor._id ? "bg-blue-600 text-white" : "bg-slate-600 text-slate-200"
                          }`}
                        >
                          Floor {floor.floorNumber}
                        </button>
                        {/* Delete button for floors */}
                        <button
                          onClick={() => deleteFloor(floor._id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          title="Delete Floor"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nodes section with delete functionality */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-white">Nodes</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {(selectedFloor ? selectedFloor.nodes : mapData.nodes)?.map((node) => (
              <div
                key={node._id}
                className="flex items-center justify-between text-sm bg-slate-700 p-2 rounded border border-slate-600"
              >
                <span className="truncate text-slate-200">
                  {node.name} ({node.type})
                </span>
                {/* Delete button for nodes */}
                <button
                  onClick={() => deleteNode(node._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 ml-2"
                  title="Delete Node"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Edges section with delete functionality */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-white">Edges</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {(selectedFloor ? selectedFloor.connections : mapData.connections)?.map((edge) => (
              <div
                key={edge._id}
                className="flex items-center justify-between text-sm bg-slate-700 p-2 rounded border border-slate-600"
              >
                <span className="truncate text-slate-200">
                  {edge.from?.name} → {edge.to?.name}
                </span>
                {/* Delete button for edges */}
                <button
                  onClick={() => deleteEdge(edge._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 ml-2"
                  title="Delete Edge"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Nodes for Edge Creation */}
        {activeMode === "addEdge" && (
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-4 text-white">Selected Nodes</h3>
            <div className="text-sm">
              {selectedNodes.map((node, index) => (
                <div key={node._id} className="text-slate-200">
                  Node {index + 1}: {node.name}
                </div>
              ))}
              {selectedNodes.length < 2 && <div className="text-slate-400">Click on nodes to select them</div>}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-black">
        <canvas
          ref={canvasRef}
          width={mapData.width}
          height={mapData.height}
          onClick={handleCanvasClick}
          className="border border-slate-600 cursor-crosshair"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
        <img
          ref={imageRef}
          src={selectedFloor ? selectedFloor.mapImage : mapData.mapImage}
          alt="Map"
          style={{ display: "none" }}
          onLoad={drawMap}
        />
      </div>

      {/* Node Form Modal */}
      {showNodeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-600">
            <h3 className="text-lg font-bold mb-4 text-white">Add Node</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Node Name"
                value={nodeForm.name}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400"
              />
              <select
                value={nodeForm.type}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              >
                {nodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                value={nodeForm.description}
                onChange={(e) => setNodeForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNodeForm(false)}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button onClick={createNode} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge Form Modal */}
      {showEdgeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-600">
            <h3 className="text-lg font-bold mb-4 text-white">Add Edge</h3>
            <div className="space-y-4">
              <select
                value={edgeForm.direction}
                onChange={(e) => setEdgeForm((prev) => ({ ...prev, direction: e.target.value }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              >
                {directions.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Left Reference Nodes</label>
                <select
                  multiple
                  value={edgeForm.left_reference_nodes}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (option) => option.value)
                    setEdgeForm((prev) => ({ ...prev, left_reference_nodes: values }))
                  }}
                  className="w-full p-2 border border-slate-600 rounded h-20 bg-slate-700 text-white"
                >
                  {getAllAvailableNodes().map((node) => (
                    <option key={node._id} value={node._id}>
                      {node.name} ({node.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Right Reference Nodes</label>
                <select
                  multiple
                  value={edgeForm.right_reference_nodes}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (option) => option.value)
                    setEdgeForm((prev) => ({ ...prev, right_reference_nodes: values }))
                  }}
                  className="w-full p-2 border border-slate-600 rounded h-20 bg-slate-700 text-white"
                >
                  {getAllAvailableNodes().map((node) => (
                    <option key={node._id} value={node._id}>
                      {node.name} ({node.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowEdgeForm(false)
                    setSelectedNodes([])
                  }}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button onClick={createEdge} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Building Form Modal */}
      {showBuildingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-600">
            <h3 className="text-lg font-bold mb-4 text-white">Add Building</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Building Name"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowBuildingForm(false)}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button onClick={createBuilding} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floor Form Modal */}
      {showFloorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-600">
            <h3 className="text-lg font-bold mb-4 text-white">Add Floor</h3>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Floor Number"
                value={floorForm.floorNumber}
                onChange={(e) => setFloorForm((prev) => ({ ...prev, floorNumber: Number.parseInt(e.target.value) }))}
                className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white placeholder-slate-400"
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Floor Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    setSelectedFloorFile(file)
                    if (file) {
                      const img = new Image()
                      img.onload = () => {
                        setFloorForm((prev) => ({
                          ...prev,
                          width: img.width,
                          height: img.height,
                        }))
                      }
                      img.src = URL.createObjectURL(file)
                    }
                  }}
                  className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Width (auto-filled)"
                  value={floorForm.width}
                  readOnly
                  className="w-1/2 p-2 border border-slate-600 rounded bg-slate-600 text-slate-300"
                />
                <input
                  type="number"
                  placeholder="Height (auto-filled)"
                  value={floorForm.height}
                  readOnly
                  className="w-1/2 p-2 border border-slate-600 rounded bg-slate-600 text-slate-300"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowFloorForm(false)}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createFloor}
                  disabled={!selectedFloorFile || floorUploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-slate-600 hover:bg-blue-700"
                >
                  {floorUploading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapInterface
