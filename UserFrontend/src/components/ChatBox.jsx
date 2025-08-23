"use client"

import { useState, useRef, useEffect } from "react"
import { HiPaperAirplane, HiMicrophone, HiSpeakerWave, HiXMark } from "react-icons/hi2"

const IntegratedChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello user! How can I help you? Ask me general queries or tell me any landmark near you and the source where you want to go...",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [mapData, setMapData] = useState(null)
  const [pathData, setPathData] = useState(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const [activeMapTab, setActiveMapTab] = useState("main")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentQuery = inputText
    setInputText("")
    setIsTyping(true)

    try {
      // Get organization ID from localStorage
      const orgId = localStorage.getItem("organizationId")

      if (!orgId) {
        console.error("🚫 Organization ID not found in localStorage.")
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I couldn't connect to the navigation system. Please make sure you're properly logged in.",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setIsTyping(false)
        return
      }

      // Get user ID (you may need to adjust this based on your auth system)
      const userId = localStorage.getItem("userId") || "default-user"

      console.log("Sending API request...")
      const response = await fetch(`http://localhost:3000/api/bot/callbot/${orgId}/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userquery: currentQuery }),
      })

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ API call successful. Received data:", data)

      if (isPathRelatedResponse(data)) {
        console.log("🗺️ Path-related response detected, fetching map data...")
        const mapInfo = await fetchMapData(orgId)
        if (mapInfo) {
          setMapData(mapInfo)
          setPathData(data)
          setShowMap(true)
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        text: data.reply || data.response || data.message || "I received your request and I'm processing it.",
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (apiError) {
      console.error("❌ Error calling the API:", apiError)

      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting to the navigation system right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsTyping(false)
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const speakMessage = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isPathRelatedResponse = (data) => {
    return data && (data.result || data.source || data.destination || data.reply?.includes("Path found"))
  }

  const isDualMapPath = (pathResponse) => {
    if (!pathResponse || !pathResponse.source || !pathResponse.destination) return false

    const sourceLocation = pathResponse.source.location
    const destLocation = pathResponse.destination.location

    return (
      (sourceLocation === "main_map" && destLocation === "building") ||
      (sourceLocation === "building" && destLocation === "main_map") ||
      (sourceLocation === "building" &&
        destLocation === "building" &&
        pathResponse.source.building !== pathResponse.destination.building)
    )
  }

  const isSingleBuildingPath = (pathResponse) => {
    if (!pathResponse || !pathResponse.source || !pathResponse.destination) return false

    const sourceLocation = pathResponse.source.location
    const destLocation = pathResponse.destination.location

    return (
      sourceLocation === "building" &&
      destLocation === "building" &&
      pathResponse.source.building === pathResponse.destination.building
    )
  }

  const getSingleMapType = (pathResponse) => {
    if (isSingleBuildingPath(pathResponse)) {
      return "building"
    }
    return "main"
  }

  const fetchMapData = async (orgId) => {
    try {
      const mapResponse = await fetch(`http://localhost:3000/api/maps/${orgId}`)
      if (!mapResponse.ok) {
        throw new Error(`Map API call failed with status: ${mapResponse.status}`)
      }
      const mapInfo = await mapResponse.json()
      return mapInfo
    } catch (error) {
      console.error("❌ Error fetching map data:", error)
      return null
    }
  }

  const renderPathOnMap = (mapInfo, pathResponse, mapType = "main") => {
    if (!mapInfo || !pathResponse) return null

    let currentMapData, relevantNodes

    if (mapType === "main") {
      currentMapData = {
        mapImage: mapInfo.mapImage,
        width: mapInfo.width,
        height: mapInfo.height,
      }
      relevantNodes = mapInfo.nodes || []
    } else {
      let targetBuilding, targetFloor

      if (isSingleBuildingPath(pathResponse)) {
        // For single building paths, use the building that contains both points
        targetBuilding = pathResponse.source?.building || pathResponse.destination?.building
        targetFloor = pathResponse.source?.floor || pathResponse.destination?.floor
      } else {
        // For dual map paths, determine which building to show based on active tab or path data
        if (activeMapTab === "building" || mapType === "building") {
          // Show the building that contains the building-located point
          if (pathResponse.destination?.location === "building") {
            targetBuilding = pathResponse.destination.building
            targetFloor = pathResponse.destination.floor
          } else if (pathResponse.source?.location === "building") {
            targetBuilding = pathResponse.source.building
            targetFloor = pathResponse.source.floor
          }
        }
      }

      console.log(`[v0] Looking for building: ${targetBuilding}, floor: ${targetFloor}`)

      const building = mapInfo.buildings?.find((b) => b.name === targetBuilding)
      if (!building) {
        console.log(`[v0] Building not found: ${targetBuilding}`)
        console.log(
          `[v0] Available buildings:`,
          mapInfo.buildings?.map((b) => b.name),
        )
        return null
      }

      const floor = building.floors?.find((f) => f.floorNumber === targetFloor)
      if (!floor) {
        console.log(`[v0] Floor not found for building: ${targetBuilding}, floor: ${targetFloor}`)
        console.log(
          `[v0] Available floors:`,
          building.floors?.map((f) => f.floorNumber),
        )
        return null
      }

      currentMapData = {
        mapImage: floor.mapImage,
        width: floor.width,
        height: floor.height,
      }
      relevantNodes = floor.nodes || []

      console.log(`[v0] Using building floor data:`, {
        building: targetBuilding,
        floor: targetFloor,
        floorWidth: floor.width,
        floorHeight: floor.height,
        nodes: relevantNodes.length,
        mapImage: floor.mapImage ? "present" : "missing",
      })
    }

    const { mapImage, width, height } = currentMapData
    const { source, destination, result } = pathResponse

    console.log(`[v0] Rendering ${mapType} map with dimensions:`, { width, height, mapType })

    const maxWidth = Math.min(window.innerWidth - 16, window.innerWidth < 640 ? window.innerWidth - 32 : 800)
    const maxHeight = Math.min(window.innerHeight * (window.innerWidth < 640 ? 0.4 : 0.6), 600)

    const aspectRatio = width / height
    let displayWidth, displayHeight

    if (maxWidth / aspectRatio <= maxHeight) {
      displayWidth = maxWidth
      displayHeight = maxWidth / aspectRatio
    } else {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }

    const scaleX = displayWidth / width
    const scaleY = displayHeight / height

    console.log(`[v0] Scaling factors:`, {
      scaleX,
      scaleY,
      displayWidth,
      displayHeight,
      originalWidth: width,
      originalHeight: height,
    })

    const shouldShowSource =
      mapType === "main"
        ? source?.location === "main_map"
        : source?.location === "building" &&
          source?.building === pathResponse.source?.building &&
          source?.floor === pathResponse.source?.floor

    const shouldShowDestination =
      mapType === "main"
        ? destination?.location === "main_map"
        : destination?.location === "building" &&
          destination?.building === pathResponse.destination?.building &&
          destination?.floor === pathResponse.destination?.floor

    console.log(`[v0] Point visibility:`, { mapType, shouldShowSource, shouldShowDestination })

    if (shouldShowSource && source) {
      console.log(`[v0] Source coordinates:`, {
        x: source.x,
        y: source.y,
        scaled: { x: source.x * scaleX, y: source.y * scaleY },
      })
    }
    if (shouldShowDestination && destination) {
      console.log(`[v0] Destination coordinates:`, {
        x: destination.x,
        y: destination.y,
        scaled: { x: destination.x * scaleX, y: destination.y * scaleY },
      })
    }

    return (
      <div className="relative mx-auto" style={{ width: displayWidth, height: displayHeight }}>
        <img
          src={mapImage || "/placeholder.svg"}
          alt={`${mapType === "main" ? "Main" : "Building"} Navigation Map`}
          className="w-full h-full object-contain rounded-lg"
          style={{ width: displayWidth, height: displayHeight }}
        />

        {shouldShowSource && source && source.x !== undefined && source.y !== undefined && (
          <div
            className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-2 sm:border-3 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
            style={{
              left: `${source.x * scaleX}px`,
              top: `${source.y * scaleY}px`,
            }}
            title={`Source: ${source.name || "Start"}`}
          >
            <span className="text-white text-xs sm:text-sm font-bold">S</span>
            <div className="absolute -top-8 sm:-top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-1 sm:px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {source.name || "Start"}
            </div>
          </div>
        )}

        {shouldShowDestination && destination && destination.x !== undefined && destination.y !== undefined && (
          <div
            className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full border-2 sm:border-3 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
            style={{
              left: `${destination.x * scaleX}px`,
              top: `${destination.y * scaleY}px`,
            }}
            title={`Destination: ${destination.name || "End"}`}
          >
            <span className="text-white text-xs sm:text-sm font-bold">D</span>
            <div className="absolute -top-8 sm:-top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-1 sm:px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {destination.name || "End"}
            </div>
          </div>
        )}

        {result && result.length > 0 && relevantNodes && (
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            style={{ width: displayWidth, height: displayHeight }}
          >
            {result.map((segment, index) => {
              const match = segment.match(/^(.+?)\s*→\s*(.+?)\s*\(/)
              if (!match) return null

              const [, sourceNodeName, destNodeName] = match

              let sourceNode = relevantNodes.find(
                (n) => n.name === sourceNodeName.trim() || n._id === sourceNodeName.trim(),
              )
              let destNode = relevantNodes.find((n) => n.name === destNodeName.trim() || n._id === destNodeName.trim())

              if (!sourceNode && index === 0 && shouldShowSource) sourceNode = source
              if (!destNode && index === result.length - 1 && shouldShowDestination) destNode = destination

              console.log(`[v0] Path segment ${index}:`, {
                sourceNodeName,
                destNodeName,
                sourceNode: sourceNode ? { name: sourceNode.name, x: sourceNode.x, y: sourceNode.y } : null,
                destNode: destNode ? { name: destNode.name, x: destNode.x, y: destNode.y } : null,
              })

              if (
                sourceNode &&
                destNode &&
                sourceNode.x !== undefined &&
                sourceNode.y !== undefined &&
                destNode.x !== undefined &&
                destNode.y !== undefined
              ) {
                const x1 = sourceNode.x * scaleX
                const y1 = sourceNode.y * scaleY
                const x2 = destNode.x * scaleX
                const y2 = destNode.y * scaleY

                console.log(`[v0] Drawing line from (${x1}, ${y1}) to (${x2}, ${y2})`)

                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="6,3"
                    className="animate-pulse"
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))",
                    }}
                  />
                )
              }
              return null
            })}
          </svg>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {showMap && mapData && pathData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-1 sm:p-4">
          <div className="bg-slate-900 rounded-lg sm:rounded-2xl border border-slate-700 w-full h-full sm:max-w-7xl sm:max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-2 sm:p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-white">Navigation Route</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  From: {pathData.source?.name} → To: {pathData.destination?.name}
                </p>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {isDualMapPath(pathData) && (
              <div className="px-2 sm:px-4 py-2 border-b border-slate-700 flex space-x-1 sm:space-x-2">
                <button
                  onClick={() => setActiveMapTab("main")}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                    activeMapTab === "main" ? "bg-blue-600 text-white" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  🗺️ Main Map
                </button>
                <button
                  onClick={() => setActiveMapTab("building")}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                    activeMapTab === "building"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  🏢 {pathData.destination?.building} Floor {pathData.destination?.floor}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <div className="w-full max-w-full">
                {isDualMapPath(pathData) ? (
                  <>
                    {activeMapTab === "main" && renderPathOnMap(mapData, pathData, "main")}
                    {activeMapTab === "building" && renderPathOnMap(mapData, pathData, "building")}
                  </>
                ) : (
                  renderPathOnMap(mapData, pathData, getSingleMapType(pathData))
                )}
              </div>

              {pathData.result && (
                <div className="mt-3 sm:mt-4 bg-slate-800 rounded-lg p-2 sm:p-4">
                  <h4 className="text-sm sm:text-lg font-medium text-white mb-2">Route Details:</h4>
                  <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {pathData.result.map((segment, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-300 flex items-start">
                        <span className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white mr-2 flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="break-words">{segment}</span>
                      </div>
                    ))}
                  </div>

                  {isDualMapPath(pathData) && (
                    <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-700/50">
                      <p className="text-xs text-blue-200">
                        💡 Use the tabs above to switch between main campus map and building floor plan
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center">
        <div className="bg-slate-950/95 backdrop-blur-lg border-t border-white/10 sm:border sm:rounded-2xl w-full h-4/5 sm:w-96 sm:h-3/4 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-white">NaviQ Assistant</h3>
                <p className="text-xs text-gray-400">{isConnected ? "Online" : "Connecting..."}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-slate-800 text-gray-100 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.sender === "bot" && (
                    <button
                      onClick={() => speakMessage(message.text)}
                      className="mt-1 text-xs text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      <HiSpeakerWave className="w-3 h-3 mr-1" />
                      Listen
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-slate-800 text-gray-100 rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about navigation..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  disabled={isTyping}
                />
                <button
                  onClick={startListening}
                  disabled={isListening || isTyping}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isListening ? "bg-red-500 animate-pulse" : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  <HiMicrophone className="w-4 h-4 text-white" />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <HiPaperAirplane className="w-4 h-4 text-white" />
              </button>
            </div>

            {isListening && <p className="text-xs text-blue-400 mt-2 animate-pulse">🎤 Listening... Speak now</p>}
          </div>
        </div>
      </div>
    </>
  )
}

export default IntegratedChat
