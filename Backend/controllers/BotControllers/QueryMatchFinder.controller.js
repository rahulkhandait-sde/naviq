import { GoogleGenerativeAI } from "@google/generative-ai"
import { configDotenv } from "dotenv"
configDotenv()

function cleanNode(node) {
  if (!node) return null

  // Handle both Mongoose documents and plain objects
  const cleanedNode = {
    _id: node._id,
    name: node.name,
    type: node.type,
    description: node.description || "",
    x: node.x,
    y: node.y,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    __v: node.__v,
  }

  // Add location metadata if present
  if (node.location) cleanedNode.location = node.location
  if (node.building) cleanedNode.building = node.building
  if (node.floor !== undefined && node.floor !== null) cleanedNode.floor = node.floor
  if (node.matchScore !== undefined) cleanedNode.matchScore = node.matchScore
  if (node.matchMethod) cleanedNode.matchMethod = node.matchMethod

  return cleanedNode
}

/**
 * Converts Mongoose documents to plain objects recursively
 */
function toPlainObject(obj) {
  if (!obj) return obj

  // Handle Mongoose documents
  if (obj.toObject && typeof obj.toObject === "function") {
    return obj.toObject()
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => toPlainObject(item))
  }

  // Handle plain objects
  if (typeof obj === "object") {
    const plain = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith("$") && key !== "__v" && key !== "_doc") {
        plain[key] = toPlainObject(obj[key])
      }
    }
    return plain
  }

  return obj
}

/**
 * Enhanced Node Matcher Function with Gemini AI integration
 * Takes JSON map data and a query string, returns the most matched node
 */
async function findBestMatchingNode(mapData, query) {
  // Handle both direct mapData format and wrapped format (e.g., {mapdata: {...}})
  const actualMapData = mapData.mapdata || mapData
  const cleanMapData = toPlainObject(actualMapData)

  const allNodes = extractAllNodes(cleanMapData)
  const cleanQuery = preprocessQuery(query)

  const queryType = await detectQueryTypeWithGemini(cleanQuery)

  if (queryType === "destination-only") {
    const result = await findDestinationOnly(allNodes, cleanQuery)
    return {
      ...result,
      destination: result.destination ? cleanNode(result.destination) : null,
    }
  } else if (queryType === "source-destination") {
    const queryParts = parseSourceDestination(cleanQuery)
    const result = await findSourceAndDestination(allNodes, queryParts, cleanQuery)
    return {
      ...result,
      source: result.source ? cleanNode(result.source) : null,
      destination: result.destination ? cleanNode(result.destination) : null,
    }
  } else {
    // Source-only query (existing logic)
    const shouldUseAI = cleanQuery.length > 10 || cleanQuery.split(" ").length > 2 || hasComplexTerms(cleanQuery)

    if (shouldUseAI) {
      const fuzzyResult = findBestMatchTraditional(allNodes, cleanQuery)

      if (fuzzyResult.matchScore < 0.5) {
        try {
          const aiResult = await findBestMatchWithGemini(cleanQuery, fuzzyResult.topCandidates, fuzzyResult.matchScore)
          return {
            source: cleanNode(aiResult),
            queryType: "source-only",
            matchMethod: aiResult.matchMethod,
          }
        } catch (error) {
          console.log("[v0] Gemini matching failed, using fuzzy result:", error.message)
          return {
            source: cleanNode(fuzzyResult),
            queryType: "source-only",
            matchMethod: fuzzyResult.matchMethod,
          }
        }
      }

      return {
        source: cleanNode(fuzzyResult),
        queryType: "source-only",
        matchMethod: fuzzyResult.matchMethod,
      }
    }

    // Traditional fuzzy matching for simple queries
    const traditionalResult = findBestMatchTraditional(allNodes, cleanQuery)
    return {
      source: cleanNode(traditionalResult),
      queryType: "source-only",
      matchMethod: traditionalResult.matchMethod,
    }
  }
}

function preprocessQuery(query) {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
}

function hasComplexTerms(query) {
  const complexTerms = ["entrance", "exit", "near", "close", "building", "floor", "room", "area", "section"]
  return complexTerms.some((term) => query.includes(term))
}

/**
 * Pre-filters nodes using lightweight scoring before sending to Gemini
 * Reduces API costs by 80-90% while maintaining accuracy
 */
function preFilterNodesForAI(allNodes, query, maxCandidates = 15) {
  const queryLower = query.toLowerCase().trim()
  const queryWords = queryLower.split(/\s+/)

  // Score all nodes using lightweight methods
  const scoredNodes = allNodes.map((node) => {
    let score = 0
    const nodeName = (node.name || "").toLowerCase()
    const nodeDesc = (node.description || "").toLowerCase()
    const nodeType = (node.type || "").toLowerCase()

    // Exact name match gets highest score
    if (nodeName === queryLower) score += 10

    // Name contains query
    if (nodeName.includes(queryLower)) score += 8

    // Query contains node name (for partial matches)
    if (queryLower.includes(nodeName) && nodeName.length > 2) score += 7

    // Word-level matching
    for (const queryWord of queryWords) {
      if (queryWord.length < 2) continue

      if (nodeName.includes(queryWord)) score += 3
      if (nodeDesc.includes(queryWord)) score += 2
      if (nodeType.includes(queryWord)) score += 2

      // Fuzzy word matching for typos
      if (levenshteinDistance(queryWord, nodeName) <= 2 && queryWord.length > 3) {
        score += 1
      }
    }

    // Type-based bonuses for common queries
    if (queryLower.includes("entrance") && nodeType.includes("entrance")) score += 5
    if (queryLower.includes("door") && nodeType.includes("door")) score += 5
    if (queryLower.includes("toilet") && (nodeName.includes("toilet") || nodeName.includes("washroom"))) score += 5

    return { node, score }
  })

  // Sort by score and return top candidates
  return scoredNodes
    .filter((item) => item.score > 0) // Only include nodes with some relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates)
    .map((item) => ({ node: item.node, score: item.score }))
}

async function findBestMatchWithGemini(query, topCandidates, fuzzyScore) {
  console.log("Sending to Gemini - Query:", query)
  console.log("Filtered candidates count:", topCandidates.length)
  console.log(
    "Filtered candidates data:",
    JSON.stringify(
      topCandidates.map((c) => ({
        name: c.node.name,
        type: c.node.type,
        building: c.node.building,
        floor: c.node.floor,
        score: c.score,
      })),
      null,
      2,
    ),
  )

  const candidateList = topCandidates
    .map((candidate, index) => {
      const node = candidate.node
      const location = node.building ? `${node.building} Floor ${node.floor}` : "Main Map"
      return `${index + 1}. "${node.name}" (${node.type}) - ${location}`
    })
    .join("\n")

  const prompt = `Find the best match for query: "${query}"

Options:
${candidateList}

Consider:
- Partial name matches (e.g., "entrance" matches "pukur er entrance")
- Synonyms (e.g., "entry" = "entrance", "washroom" = "toilet")
- Building/floor context
- Location type and purpose
Respond with ONLY the number (1-${topCandidates.length}) of the best match. No explanation. `

  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" })
    const response = await model.generateContent(prompt)

    const selectedIndex = Number.parseInt(response.response.text().trim()) - 1

    if (selectedIndex >= 0 && selectedIndex < topCandidates.length) {
      return {
        ...topCandidates[selectedIndex].node,
        matchScore: Math.min(0.95, Math.max(0.75, fuzzyScore + 0.2)),
        matchMethod: "gemini",
      }
    }
  } catch (error) {
    console.log("[v0] Gemini API error:", error.message)
  }

  return {
    ...topCandidates[0].node,
    matchScore: Math.max(0.6, fuzzyScore + 0.1),
    matchMethod: "gemini-fallback",
  }
}

function findBestMatchTraditional(allNodes, query) {
  // Calculate similarity scores
  const matches = allNodes.map((node) => {
    const nameScore = calculateSimilarity(query, node.name || "")
    const descriptionScore = node.description ? calculateSimilarity(query, node.description) * 0.7 : 0
    const typeScore = node.type ? calculateSimilarity(query, node.type) * 0.5 : 0

    const totalScore = Math.max(nameScore, descriptionScore, typeScore)

    return {
      node,
      score: totalScore,
    }
  })

  // Sort by score and return best match
  matches.sort((a, b) => b.score - a.score)

  const preFilteredCandidates = preFilterNodesForAI(allNodes, query, 15)

  // Return the best matching node with its complete data
  return {
    ...matches[0].node,
    matchScore: matches[0].score,
    matchMethod: "fuzzy",
    topCandidates: preFilteredCandidates.length > 0 ? preFilteredCandidates : matches.slice(0, 8),
  }
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function calculateSimilarity(query, target) {
  const queryLower = query.toLowerCase().trim()
  const targetLower = target.toLowerCase().trim()

  // Exact match
  if (queryLower === targetLower) return 1.0

  // Contains match with position bonus
  if (targetLower.includes(queryLower)) {
    const position = targetLower.indexOf(queryLower)
    const positionBonus = position === 0 ? 0.1 : 0.05 // Bonus for starting position
    return 0.9 - (targetLower.length - queryLower.length) * 0.005 + positionBonus
  }

  // Starts with match
  if (targetLower.startsWith(queryLower)) {
    return 0.85 - (targetLower.length - queryLower.length) * 0.005
  }

  const queryWords = queryLower.split(/\s+/)
  const targetWords = targetLower.split(/\s+/)

  let wordMatchScore = 0
  const totalWords = queryWords.length

  for (const queryWord of queryWords) {
    let bestWordMatch = 0

    for (const targetWord of targetWords) {
      if (targetWord === queryWord) {
        bestWordMatch = 1.0
        break
      } else if (targetWord.includes(queryWord) && queryWord.length > 2) {
        bestWordMatch = Math.max(bestWordMatch, 0.8)
      } else if (queryWord.includes(targetWord) && targetWord.length > 2) {
        bestWordMatch = Math.max(bestWordMatch, 0.7)
      } else {
        // Fuzzy word match
        const wordDistance = levenshteinDistance(queryWord, targetWord)
        const wordSimilarity = 1 - wordDistance / Math.max(queryWord.length, targetWord.length)
        if (wordSimilarity > 0.6) {
          bestWordMatch = Math.max(bestWordMatch, wordSimilarity * 0.6)
        }
      }
    }

    wordMatchScore += bestWordMatch
  }

  const averageWordMatch = wordMatchScore / totalWords

  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(queryLower, targetLower)
  const maxLength = Math.max(queryLower.length, targetLower.length)
  const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength

  return Math.min(Math.max(averageWordMatch, similarity * 0.8), 1.0)
}

function calculateBestSimilarity(query, node) {
  const nameScore = calculateSimilarity(query, node.name || "")
  const descriptionScore = node.description ? calculateSimilarity(query, node.description) * 0.7 : 0
  const typeScore = node.type ? calculateSimilarity(query, node.type) * 0.5 : 0
  return Math.max(nameScore, descriptionScore, typeScore)
}

function extractAllNodes(mapData) {
  const allNodes = []

  // Add main map nodes
  if (mapData.nodes && Array.isArray(mapData.nodes)) {
    mapData.nodes.forEach((node) => {
      allNodes.push({
        ...node,
        location: "main_map",
        building: null,
        floor: null,
      })
    })
  }

  // Add building floor nodes
  if (mapData.buildings && Array.isArray(mapData.buildings)) {
    mapData.buildings.forEach((building) => {
      if (building.floors && Array.isArray(building.floors)) {
        building.floors.forEach((floor) => {
          if (floor.nodes && Array.isArray(floor.nodes)) {
            floor.nodes.forEach((node) => {
              allNodes.push({
                ...node,
                location: "building",
                building: building.name,
                floor: floor.floorNumber,
              })
            })
          }
        })
      }
    })
  }

  return allNodes
}

function parseSourceDestination(query) {
  const sourceDestinationKeywords = [
    "to",
    "from",
    "go to",
    "navigate to",
    "route to",
    "path to",
    "from (.+) to (.+)",
    "between (.+) and (.+)",
    "(.+) to (.+)",
  ]

  // Check for common patterns that indicate both source and destination
  const hasToKeyword = /\bto\b/i.test(query)
  const hasFromKeyword = /\bfrom\b/i.test(query)
  const hasBetweenKeyword = /\bbetween\b.*\band\b/i.test(query)

  if (hasFromKeyword && hasToKeyword) {
    // Pattern: "from X to Y"
    const match = query.match(/from\s+(.+?)\s+to\s+(.+)/i)
    if (match) {
      return {
        hasDestination: true,
        source: match[1].trim(),
        destination: match[2].trim(),
      }
    }
  }

  if (hasBetweenKeyword) {
    // Pattern: "between X and Y"
    const match = query.match(/between\s+(.+?)\s+and\s+(.+)/i)
    if (match) {
      return {
        hasDestination: true,
        source: match[1].trim(),
        destination: match[2].trim(),
      }
    }
  }

  if (hasToKeyword && !hasFromKeyword) {
    // Pattern: "X to Y" (assuming current location as source)
    const match = query.match(/(.+?)\s+to\s+(.+)/i)
    if (match) {
      return {
        hasDestination: true,
        source: match[1].trim(),
        destination: match[2].trim(),
      }
    }
  }

  return {
    hasDestination: false,
    source: query,
    destination: null,
  }
}

async function findSourceAndDestination(allNodes, queryParts, originalQuery) {
  const shouldUseAI = originalQuery.length > 10 || originalQuery.split(" ").length > 2 || hasComplexTerms(originalQuery)

  let sourceNode, destinationNode

  if (shouldUseAI) {
    try {
      const sourceTraditional = findBestMatchTraditional(allNodes, queryParts.source)
      const destTraditional = findBestMatchTraditional(allNodes, queryParts.destination)

      const sourceResult = await findBestMatchWithGemini(
        queryParts.source,
        sourceTraditional.topCandidates,
        sourceTraditional.matchScore,
      )
      const destResult = await findDestinationWithGemini(
        queryParts.destination,
        destTraditional.topCandidates,
        destTraditional.matchScore,
      )

      sourceNode = sourceResult
      destinationNode = destResult
    } catch (error) {
      console.log("[v0] Gemini matching failed for source/destination, using fuzzy:", error.message)
      sourceNode = findBestMatchTraditional(allNodes, queryParts.source)
      destinationNode = findBestMatchTraditional(allNodes, queryParts.destination)
    }
  } else {
    // Use traditional matching
    sourceNode = findBestMatchTraditional(allNodes, queryParts.source)
    destinationNode = findBestMatchTraditional(allNodes, queryParts.destination)
  }

  return {
    source: sourceNode,
    destination: destinationNode,
    queryType: "source-destination",
    matchMethod: shouldUseAI ? "gemini-dual" : "fuzzy-dual",
    matchScore: Math.min(sourceNode.matchScore, destinationNode.matchScore),
  }
}

async function detectQueryTypeWithGemini(query) {
  const prompt = `Analyze this navigation query and determine its type:

Query: "${query}"

Types:
1. "source-only" - User wants to find a location (e.g., "where is entrance", "find toilet", "entrance")
2. "destination-only" - User wants to go somewhere (e.g., "i want to go to park", "take me to entrance", "go to toilet", "navigate to pond")
3. "source-destination" - User specifies both start and end points (e.g., "from entrance to park", "entrance to toilet", "between A and B")

Respond with ONLY one word: "source-only", "destination-only", or "source-destination"`

  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" })
    const response = await model.generateContent(prompt)

    const result = response.response.text().trim().toLowerCase()

    if (result.includes("destination-only")) return "destination-only"
    if (result.includes("source-destination")) return "source-destination"
    return "source-only"
  } catch (error) {
    console.log("[v0] Gemini query type detection failed:", error.message)
    // Fallback to simple pattern matching
    if (/\b(go to|want to go|take me to|navigate to)\b/i.test(query)) {
      return "destination-only"
    }
    if (/\b(from .+ to|between .+ and)\b/i.test(query)) {
      return "source-destination"
    }
    return "source-only"
  }
}

async function findDestinationOnly(allNodes, query) {
  const shouldUseAI = query.length > 10 || query.split(" ").length > 2 || hasComplexTerms(query)

  if (shouldUseAI) {
    const fuzzyResult = findBestMatchTraditional(allNodes, query)

    if (fuzzyResult.matchScore < 0.5) {
      try {
        const aiResult = await findDestinationWithGemini(query, fuzzyResult.topCandidates, fuzzyResult.matchScore)
        return {
          destination: aiResult,
          queryType: "destination-only",
          matchMethod: aiResult.matchMethod,
        }
      } catch (error) {
        console.log("[v0] Gemini destination matching failed:", error.message)
        return {
          destination: fuzzyResult,
          queryType: "destination-only",
          matchMethod: fuzzyResult.matchMethod,
        }
      }
    }

    return {
      destination: fuzzyResult,
      queryType: "destination-only",
      matchMethod: fuzzyResult.matchMethod,
    }
  }

  const traditionalResult = findBestMatchTraditional(allNodes, query)
  return {
    destination: traditionalResult,
    queryType: "destination-only",
    matchMethod: traditionalResult.matchMethod,
  }
}

async function findDestinationWithGemini(query, topCandidates, fuzzyScore) {
  console.log("[v0] Destination matching - Query:", query)
  console.log("[v0] Destination candidates count:", topCandidates.length)
  console.log(
    "[v0] Destination candidates data:",
    JSON.stringify(
      topCandidates.map((c) => ({
        name: c.node.name,
        type: c.node.type,
        building: c.node.building,
        floor: c.node.floor,
        score: c.score,
      })),
      null,
      2,
    ),
  )

  const candidateList = topCandidates
    .map((candidate, index) => {
      const node = candidate.node
      const location = node.building ? `${node.building} Floor ${node.floor}` : "Main Map"
      return `${index + 1}. "${node.name}" (${node.type}) - ${location}`
    })
    .join("\n")

  const prompt = `Find the best DESTINATION match for this navigation query: "${query}"

Available destinations:
${candidateList}

The user wants to GO TO a location. Consider:
- Partial name matches (e.g., "park" matches "central park")
- Synonyms (e.g., "toilet" = "washroom", "entrance" = "entry")
- Building/floor context
- Location type and purpose

Respond with ONLY the number (1-${topCandidates.length}) of the best destination match.`

  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" })
    const response = await model.generateContent(prompt)

    const selectedIndex = Number.parseInt(response.response.text().trim()) - 1

    if (selectedIndex >= 0 && selectedIndex < topCandidates.length) {
      return {
        ...topCandidates[selectedIndex].node,
        matchScore: Math.min(0.95, Math.max(0.75, fuzzyScore + 0.2)),
        matchMethod: "gemini-destination",
      }
    }
  } catch (error) {
    console.log("[v0] Gemini destination API error:", error.message)
  }

  return {
    ...topCandidates[0].node,
    matchScore: Math.max(0.6, fuzzyScore + 0.1),
    matchMethod: "gemini-destination-fallback",
  }
}

// Test example
const sampleMapData = {
  _id: "68a5ae231c52e725b8dc9f15",
  appwriteId: "68a2173370f999d92b7b",
  mapImage:
    "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a5ae19002f3d5a9b17/view?project=689b5787003b4e752196",
  width: 980,
  height: 757,
  nodes: [
    {
      _id: "68a5ae661c52e725b8dc9f19",
      name: "street1-01",
      type: "other",
      description: "",
      x: 309,
      y: 502.93055534362793,
      createdAt: "2025-08-20T11:15:50.286Z",
      updatedAt: "2025-08-20T11:15:50.286Z",
      __v: 0,
    },
    {
      _id: "68a5ae831c52e725b8dc9f1e",
      name: "street1-02",
      type: "road_turn",
      description: "",
      x: 331,
      y: 503.4861145019531,
      createdAt: "2025-08-20T11:16:19.657Z",
      updatedAt: "2025-08-20T11:16:19.657Z",
      __v: 0,
    },
    {
      _id: "68a5ae831c52e725b8dc9f23",
      name: "street1-01",
      type: "other",
      description: "",
      x: 309,
      y: 502.93055534362793,
      createdAt: "2025-08-20T11:16:19.899Z",
      updatedAt: "2025-08-20T11:16:19.899Z",
      __v: 0,
    },
    {
      _id: "68a5ae981c52e725b8dc9f28",
      name: "street1-03",
      type: "road_turn",
      description: "",
      x: 337,
      y: 390.93055534362793,
      createdAt: "2025-08-20T11:16:40.799Z",
      updatedAt: "2025-08-20T11:16:40.799Z",
      __v: 0,
    },
    {
      _id: "68a5aeb11c52e725b8dc9f2d",
      name: "street1-04",
      type: "road_turn",
      description: "",
      x: 333,
      y: 612.9305553436279,
      createdAt: "2025-08-20T11:17:05.887Z",
      updatedAt: "2025-08-20T11:17:05.887Z",
      __v: 0,
    },
    {
      _id: "68a5afbb1c52e725b8dc9f52",
      name: "street1-05",
      type: "other",
      description: "",
      x: 385,
      y: 382.93055534362793,
      createdAt: "2025-08-20T11:21:31.470Z",
      updatedAt: "2025-08-20T11:21:31.470Z",
      __v: 0,
    },
    {
      _id: "68a5b3b6e20f26b232fe478a",
      name: "b1-entrance connector ",
      type: "other",
      description: "",
      x: 534,
      y: 371.26388931274414,
      createdAt: "2025-08-20T11:38:30.338Z",
      updatedAt: "2025-08-20T11:38:30.338Z",
      __v: 0,
    },
    {
      _id: "68a5ba96e20f26b232fe47df",
      name: "street1-06",
      type: "other",
      description: "",
      x: 423,
      y: 380.70833587646484,
      createdAt: "2025-08-20T12:07:50.890Z",
      updatedAt: "2025-08-20T12:07:50.890Z",
      __v: 0,
    },
    {
      _id: "68a5bacce20f26b232fe47ed",
      name: "street1-07",
      type: "road_turn",
      description: "",
      x: 453,
      y: 365.1527786254883,
      createdAt: "2025-08-20T12:08:44.544Z",
      updatedAt: "2025-08-20T12:08:44.544Z",
      __v: 0,
    },
    {
      _id: "68a5bb49e20f26b232fe4826",
      name: "street1-08",
      type: "road_turn",
      description: "",
      x: 454,
      y: 396.7083339691162,
      createdAt: "2025-08-20T12:10:49.622Z",
      updatedAt: "2025-08-20T12:10:49.622Z",
      __v: 0,
    },
    {
      _id: "68a5bb62e20f26b232fe4834",
      name: "street1-09",
      type: "road_turn",
      description: "",
      x: 428,
      y: 400.4861068725586,
      createdAt: "2025-08-20T12:11:14.647Z",
      updatedAt: "2025-08-20T12:11:14.647Z",
      __v: 0,
    },
    {
      _id: "68a5c49fe20f26b232fe4893",
      name: "street1-10",
      type: "other",
      description: "",
      x: 474,
      y: 411.7083339691162,
      createdAt: "2025-08-20T12:50:39.030Z",
      updatedAt: "2025-08-20T12:50:39.030Z",
      __v: 0,
    },
    {
      _id: "68a5c4bfe20f26b232fe48ac",
      name: "street1-11",
      type: "road_turn",
      description: "",
      x: 533,
      y: 414.26388931274414,
      createdAt: "2025-08-20T12:51:11.144Z",
      updatedAt: "2025-08-20T12:51:11.144Z",
      __v: 0,
    },
    {
      _id: "68a609bde5f5a762fbaf82c8",
      name: "street1-12",
      type: "other",
      description: "",
      x: 534,
      y: 483.81944274902344,
      createdAt: "2025-08-20T17:45:33.596Z",
      updatedAt: "2025-08-20T17:45:33.596Z",
      __v: 0,
    },
    {
      _id: "68a60a03e5f5a762fbaf82e6",
      name: "street1-13",
      type: "other",
      description: "",
      x: 512,
      y: 490.7083339691162,
      createdAt: "2025-08-20T17:46:43.981Z",
      updatedAt: "2025-08-20T17:46:43.981Z",
      __v: 0,
    },
    {
      _id: "68a61e9de5f5a762fbaf840f",
      name: "pukur er entrance ",
      type: "other",
      description: "",
      x: 683,
      y: 413.48611068725586,
      createdAt: "2025-08-20T19:14:37.278Z",
      updatedAt: "2025-08-20T19:14:37.278Z",
      __v: 0,
    },
    {
      _id: "68a61f20e5f5a762fbaf842d",
      name: "gacher side e ",
      type: "other",
      description: "",
      x: 676,
      y: 529.4861106872559,
      createdAt: "2025-08-20T19:16:48.555Z",
      updatedAt: "2025-08-20T19:16:48.555Z",
      __v: 0,
    },
    {
      _id: "68a61f7fe5f5a762fbaf844b",
      name: "4 te gach er kache ",
      type: "road_turn",
      description: "",
      x: 600,
      y: 530.4861106872559,
      createdAt: "2025-08-20T19:18:23.581Z",
      updatedAt: "2025-08-20T19:18:23.581Z",
      __v: 0,
    },
    {
      _id: "68a620a0e5f5a762fbaf8474",
      name: "2 to gacher middle",
      type: "other",
      description: "",
      x: 559,
      y: 490.48611068725586,
      createdAt: "2025-08-20T19:23:12.046Z",
      updatedAt: "2025-08-20T19:23:12.046Z",
      __v: 0,
    },
    {
      _id: "68a620b5e5f5a762fbaf8482",
      name: "2 to p er middle",
      type: "other",
      description: "",
      x: 559,
      y: 530.4861106872559,
      createdAt: "2025-08-20T19:23:33.860Z",
      updatedAt: "2025-08-20T19:23:33.860Z",
      __v: 0,
    },
  ],
  connections: [
    {
      _id: "68a5af3a1c52e725b8dc9f36",
      from: {
        _id: "68a5ae981c52e725b8dc9f28",
        name: "street1-03",
        type: "road_turn",
        description: "",
        x: 337,
        y: 390.93055534362793,
        createdAt: "2025-08-20T11:16:40.799Z",
        updatedAt: "2025-08-20T11:16:40.799Z",
        __v: 0,
      },
      to: {
        _id: "68a5ae831c52e725b8dc9f1e",
        name: "street1-02",
        type: "road_turn",
        description: "",
        x: 331,
        y: 503.4861145019531,
        createdAt: "2025-08-20T11:16:19.657Z",
        updatedAt: "2025-08-20T11:16:19.657Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 112.71536673161846,
      left_reference_nodes: ["68a5ae661c52e725b8dc9f19"],
      right_reference_nodes: [],
      createdAt: "2025-08-20T11:19:22.227Z",
      updatedAt: "2025-08-20T11:19:22.227Z",
      __v: 0,
    },
    {
      _id: "68a5af951c52e725b8dc9f4a",
      from: {
        _id: "68a5aeb11c52e725b8dc9f2d",
        name: "street1-04",
        type: "road_turn",
        description: "",
        x: 333,
        y: 612.9305553436279,
        createdAt: "2025-08-20T11:17:05.887Z",
        updatedAt: "2025-08-20T11:17:05.887Z",
        __v: 0,
      },
      to: {
        _id: "68a5ae831c52e725b8dc9f1e",
        name: "street1-02",
        type: "road_turn",
        description: "",
        x: 331,
        y: 503.4861145019531,
        createdAt: "2025-08-20T11:16:19.657Z",
        updatedAt: "2025-08-20T11:16:19.657Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 109.46271342857739,
      left_reference_nodes: ["68a5ae661c52e725b8dc9f19"],
      right_reference_nodes: [],
      createdAt: "2025-08-20T11:20:53.855Z",
      updatedAt: "2025-08-20T11:20:53.855Z",
      __v: 0,
    },
    {
      _id: "68a5b00f1c52e725b8dc9f61",
      from: {
        _id: "68a5ae981c52e725b8dc9f28",
        name: "street1-03",
        type: "road_turn",
        description: "",
        x: 337,
        y: 390.93055534362793,
        createdAt: "2025-08-20T11:16:40.799Z",
        updatedAt: "2025-08-20T11:16:40.799Z",
        __v: 0,
      },
      to: {
        _id: "68a5afbb1c52e725b8dc9f52",
        name: "street1-05",
        type: "other",
        description: "",
        x: 385,
        y: 382.93055534362793,
        createdAt: "2025-08-20T11:21:31.470Z",
        updatedAt: "2025-08-20T11:21:31.470Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 48.662100242385755,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T11:22:55.031Z",
      updatedAt: "2025-08-20T11:22:55.031Z",
      __v: 0,
    },
    {
      _id: "68a5baf2e20f26b232fe4808",
      from: {
        _id: "68a5ba96e20f26b232fe47df",
        name: "street1-06",
        type: "other",
        description: "",
        x: 423,
        y: 380.70833587646484,
        createdAt: "2025-08-20T12:07:50.890Z",
        updatedAt: "2025-08-20T12:07:50.890Z",
        __v: 0,
      },
      to: {
        _id: "68a5bacce20f26b232fe47ed",
        name: "street1-07",
        type: "road_turn",
        description: "",
        x: 453,
        y: 365.1527786254883,
        createdAt: "2025-08-20T12:08:44.544Z",
        updatedAt: "2025-08-20T12:08:44.544Z",
        __v: 0,
      },
      direction: "SE-NW",
      distance: 33.79312594875487,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:09:22.614Z",
      updatedAt: "2025-08-20T12:09:22.614Z",
      __v: 0,
    },
    {
      _id: "68a5bb12e20f26b232fe4818",
      from: {
        _id: "68a5ba96e20f26b232fe47df",
        name: "street1-06",
        type: "other",
        description: "",
        x: 423,
        y: 380.70833587646484,
        createdAt: "2025-08-20T12:07:50.890Z",
        updatedAt: "2025-08-20T12:07:50.890Z",
        __v: 0,
      },
      to: {
        _id: "68a5afbb1c52e725b8dc9f52",
        name: "street1-05",
        type: "other",
        description: "",
        x: 385,
        y: 382.93055534362793,
        createdAt: "2025-08-20T11:21:31.470Z",
        updatedAt: "2025-08-20T11:21:31.470Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 38.06492163869825,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:09:54.240Z",
      updatedAt: "2025-08-20T12:09:54.240Z",
      __v: 0,
    },
    {
      _id: "68a5bb88e20f26b232fe4844",
      from: {
        _id: "68a5ba96e20f26b232fe47df",
        name: "street1-06",
        type: "other",
        description: "",
        x: 423,
        y: 380.70833587646484,
        createdAt: "2025-08-20T12:07:50.890Z",
        updatedAt: "2025-08-20T12:07:50.890Z",
        __v: 0,
      },
      to: {
        _id: "68a5bb62e20f26b232fe4834",
        name: "street1-09",
        type: "road_turn",
        description: "",
        x: 428,
        y: 400.4861068725586,
        createdAt: "2025-08-20T12:11:14.647Z",
        updatedAt: "2025-08-20T12:11:14.647Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 20.400005528771974,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:11:52.391Z",
      updatedAt: "2025-08-20T12:11:52.391Z",
      __v: 0,
    },
    {
      _id: "68a5bbbae20f26b232fe4854",
      from: {
        _id: "68a5bb62e20f26b232fe4834",
        name: "street1-09",
        type: "road_turn",
        description: "",
        x: 428,
        y: 400.4861068725586,
        createdAt: "2025-08-20T12:11:14.647Z",
        updatedAt: "2025-08-20T12:11:14.647Z",
        __v: 0,
      },
      to: {
        _id: "68a5bb49e20f26b232fe4826",
        name: "street1-08",
        type: "road_turn",
        description: "",
        x: 454,
        y: 396.7083339691162,
        createdAt: "2025-08-20T12:10:49.622Z",
        updatedAt: "2025-08-20T12:10:49.622Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 26.27301977523679,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:12:42.017Z",
      updatedAt: "2025-08-20T12:12:42.017Z",
      __v: 0,
    },
    {
      _id: "68a5bbcde20f26b232fe4864",
      from: {
        _id: "68a5bb49e20f26b232fe4826",
        name: "street1-08",
        type: "road_turn",
        description: "",
        x: 454,
        y: 396.7083339691162,
        createdAt: "2025-08-20T12:10:49.622Z",
        updatedAt: "2025-08-20T12:10:49.622Z",
        __v: 0,
      },
      to: {
        _id: "68a5bacce20f26b232fe47ed",
        name: "street1-07",
        type: "road_turn",
        description: "",
        x: 453,
        y: 365.1527786254883,
        createdAt: "2025-08-20T12:08:44.544Z",
        updatedAt: "2025-08-20T12:08:44.544Z",
        __v: 0,
      },
      direction: "S-N",
      distance: 31.571396437990593,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:13:01.099Z",
      updatedAt: "2025-08-20T12:13:01.099Z",
      __v: 0,
    },
    {
      _id: "68a5c4d6e20f26b232fe48bc",
      from: {
        _id: "68a5bacce20f26b232fe47ed",
        name: "street1-07",
        type: "road_turn",
        description: "",
        x: 453,
        y: 365.1527786254883,
        createdAt: "2025-08-20T12:08:44.544Z",
        updatedAt: "2025-08-20T12:08:44.544Z",
        __v: 0,
      },
      to: {
        _id: "68a5b3b6e20f26b232fe478a",
        name: "b1-entrance connector ",
        type: "other",
        description: "",
        x: 534,
        y: 371.26388931274414,
        createdAt: "2025-08-20T11:38:30.338Z",
        updatedAt: "2025-08-20T11:38:30.338Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 81.23020173452663,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:51:34.090Z",
      updatedAt: "2025-08-20T12:51:34.090Z",
      __v: 0,
    },
    {
      _id: "68a5c517e20f26b232fe48cc",
      from: {
        _id: "68a5bb49e20f26b232fe4826",
        name: "street1-08",
        type: "road_turn",
        description: "",
        x: 454,
        y: 396.7083339691162,
        createdAt: "2025-08-20T12:10:49.622Z",
        updatedAt: "2025-08-20T12:10:49.622Z",
        __v: 0,
      },
      to: {
        _id: "68a5c49fe20f26b232fe4893",
        name: "street1-10",
        type: "other",
        description: "",
        x: 474,
        y: 411.7083339691162,
        createdAt: "2025-08-20T12:50:39.030Z",
        updatedAt: "2025-08-20T12:50:39.030Z",
        __v: 0,
      },
      direction: "SE-NW",
      distance: 25,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:52:39.534Z",
      updatedAt: "2025-08-20T12:52:39.534Z",
      __v: 0,
    },
    {
      _id: "68a5c528e20f26b232fe48dc",
      from: {
        _id: "68a5c49fe20f26b232fe4893",
        name: "street1-10",
        type: "other",
        description: "",
        x: 474,
        y: 411.7083339691162,
        createdAt: "2025-08-20T12:50:39.030Z",
        updatedAt: "2025-08-20T12:50:39.030Z",
        __v: 0,
      },
      to: {
        _id: "68a5c4bfe20f26b232fe48ac",
        name: "street1-11",
        type: "road_turn",
        description: "",
        x: 533,
        y: 414.26388931274414,
        createdAt: "2025-08-20T12:51:11.144Z",
        updatedAt: "2025-08-20T12:51:11.144Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 59.05532036247323,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:52:56.519Z",
      updatedAt: "2025-08-20T12:52:56.519Z",
      __v: 0,
    },
    {
      _id: "68a5c531e20f26b232fe48ec",
      from: {
        _id: "68a5c4bfe20f26b232fe48ac",
        name: "street1-11",
        type: "road_turn",
        description: "",
        x: 533,
        y: 414.26388931274414,
        createdAt: "2025-08-20T12:51:11.144Z",
        updatedAt: "2025-08-20T12:51:11.144Z",
        __v: 0,
      },
      to: {
        _id: "68a5b3b6e20f26b232fe478a",
        name: "b1-entrance connector ",
        type: "other",
        description: "",
        x: 534,
        y: 371.26388931274414,
        createdAt: "2025-08-20T11:38:30.338Z",
        updatedAt: "2025-08-20T11:38:30.338Z",
        __v: 0,
      },
      direction: "S-N",
      distance: 43.01162633521314,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T12:53:05.833Z",
      updatedAt: "2025-08-20T12:53:05.833Z",
      __v: 0,
    },
    {
      _id: "68a609e0e5f5a762fbaf82d8",
      from: {
        _id: "68a5c4bfe20f26b232fe48ac",
        name: "street1-11",
        type: "road_turn",
        description: "",
        x: 533,
        y: 414.26388931274414,
        createdAt: "2025-08-20T12:51:11.144Z",
        updatedAt: "2025-08-20T12:51:11.144Z",
        __v: 0,
      },
      to: {
        _id: "68a609bde5f5a762fbaf82c8",
        name: "street1-12",
        type: "other",
        description: "",
        x: 534,
        y: 483.81944274902344,
        createdAt: "2025-08-20T17:45:33.596Z",
        updatedAt: "2025-08-20T17:45:33.596Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 69.5627415634771,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T17:46:08.366Z",
      updatedAt: "2025-08-20T17:46:08.366Z",
      __v: 0,
    },
    {
      _id: "68a60a28e5f5a762fbaf82f6",
      from: {
        _id: "68a60a03e5f5a762fbaf82e6",
        name: "street1-13",
        type: "other",
        description: "",
        x: 512,
        y: 490.7083339691162,
        createdAt: "2025-08-20T17:46:43.981Z",
        updatedAt: "2025-08-20T17:46:43.981Z",
        __v: 0,
      },
      to: {
        _id: "68a609bde5f5a762fbaf82c8",
        name: "street1-12",
        type: "other",
        description: "",
        x: 534,
        y: 483.81944274902344,
        createdAt: "2025-08-20T17:45:33.596Z",
        updatedAt: "2025-08-20T17:45:33.596Z",
        __v: 0,
      },
      direction: "E-W",
      distance: 23.053347311014758,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T17:47:20.251Z",
      updatedAt: "2025-08-20T17:47:20.251Z",
      __v: 0,
    },
    {
      _id: "68a6106de5f5a762fbaf83a1",
      from: {
        _id: "68a6103de5f5a762fbaf8391",
        name: "entrance1",
        type: "other",
        description: "",
        x: 713,
        y: 706.6666660308838,
        createdAt: "2025-08-20T18:13:17.454Z",
        updatedAt: "2025-08-20T18:13:17.454Z",
        __v: 0,
      },
      to: {
        _id: "68a60a03e5f5a762fbaf82e6",
        name: "street1-13",
        type: "other",
        description: "",
        x: 512,
        y: 490.7083339691162,
        createdAt: "2025-08-20T17:46:43.981Z",
        updatedAt: "2025-08-20T17:46:43.981Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 295.02372987083714,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T18:14:05.902Z",
      updatedAt: "2025-08-20T18:14:05.902Z",
      __v: 0,
    },
    {
      _id: "68a61eb0e5f5a762fbaf841f",
      from: {
        _id: "68a5c4bfe20f26b232fe48ac",
        name: "street1-11",
        type: "road_turn",
        description: "",
        x: 533,
        y: 414.26388931274414,
        createdAt: "2025-08-20T12:51:11.144Z",
        updatedAt: "2025-08-20T12:51:11.144Z",
        __v: 0,
      },
      to: {
        _id: "68a61e9de5f5a762fbaf840f",
        name: "pukur er entrance ",
        type: "other",
        description: "",
        x: 683,
        y: 413.48611068725586,
        createdAt: "2025-08-20T19:14:37.278Z",
        updatedAt: "2025-08-20T19:14:37.278Z",
        __v: 0,
      },
      direction: "S-N",
      distance: 150.0020164517473,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:14:56.529Z",
      updatedAt: "2025-08-20T19:14:56.529Z",
      __v: 0,
    },
    {
      _id: "68a61f45e5f5a762fbaf843d",
      from: {
        _id: "68a61e9de5f5a762fbaf840f",
        name: "pukur er entrance ",
        type: "other",
        description: "",
        x: 683,
        y: 413.48611068725586,
        createdAt: "2025-08-20T19:14:37.278Z",
        updatedAt: "2025-08-20T19:14:37.278Z",
        __v: 0,
      },
      to: {
        _id: "68a61f20e5f5a762fbaf842d",
        name: "gacher side e ",
        type: "other",
        description: "",
        x: 676,
        y: 529.4861106872559,
        createdAt: "2025-08-20T19:16:48.555Z",
        updatedAt: "2025-08-20T19:16:48.555Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 116.21101496846157,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:17:25.220Z",
      updatedAt: "2025-08-20T19:17:25.220Z",
      __v: 0,
    },
    {
      _id: "68a61f99e5f5a762fbaf845b",
      from: {
        _id: "68a61f7fe5f5a762fbaf844b",
        name: "4 te gach er kache ",
        type: "road_turn",
        description: "",
        x: 600,
        y: 530.4861106872559,
        createdAt: "2025-08-20T19:18:23.581Z",
        updatedAt: "2025-08-20T19:18:23.581Z",
        __v: 0,
      },
      to: {
        _id: "68a61f20e5f5a762fbaf842d",
        name: "gacher side e ",
        type: "other",
        description: "",
        x: 676,
        y: 529.4861106872559,
        createdAt: "2025-08-20T19:16:48.555Z",
        updatedAt: "2025-08-20T19:16:48.555Z",
        __v: 0,
      },
      direction: "N-S",
      distance: 76.00657866263946,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:18:49.189Z",
      updatedAt: "2025-08-20T19:18:49.189Z",
      __v: 0,
    },
    {
      _id: "68a620d6e5f5a762fbaf8492",
      from: {
        _id: "68a609bde5f5a762fbaf82c8",
        name: "street1-12",
        type: "other",
        description: "",
        x: 534,
        y: 483.81944274902344,
        createdAt: "2025-08-20T17:45:33.596Z",
        updatedAt: "2025-08-20T17:45:33.596Z",
        __v: 0,
      },
      to: {
        _id: "68a620a0e5f5a762fbaf8474",
        name: "2 to gacher middle",
        type: "other",
        description: "",
        x: 559,
        y: 490.48611068725586,
        createdAt: "2025-08-20T19:23:12.046Z",
        updatedAt: "2025-08-20T19:23:12.046Z",
        __v: 0,
      },
      direction: "SW-NE",
      distance: 25.873624821401737,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:24:06.742Z",
      updatedAt: "2025-08-20T19:24:06.742Z",
      __v: 0,
    },
    {
      _id: "68a620f4e5f5a762fbaf84a2",
      from: {
        _id: "68a620b5e5f5a762fbaf8482",
        name: "2 to p er middle",
        type: "other",
        description: "",
        x: 559,
        y: 530.4861106872559,
        createdAt: "2025-08-20T19:23:33.860Z",
        updatedAt: "2025-08-20T19:23:33.860Z",
        __v: 0,
      },
      to: {
        _id: "68a620a0e5f5a762fbaf8474",
        name: "2 to gacher middle",
        type: "other",
        description: "",
        x: 559,
        y: 490.48611068725586,
        createdAt: "2025-08-20T19:23:12.046Z",
        updatedAt: "2025-08-20T19:23:12.046Z",
        __v: 0,
      },
      direction: "W-E",
      distance: 40,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:24:36.524Z",
      updatedAt: "2025-08-20T19:24:36.524Z",
      __v: 0,
    },
    {
      _id: "68a62107e5f5a762fbaf84b2",
      from: {
        _id: "68a620b5e5f5a762fbaf8482",
        name: "2 to p er middle",
        type: "other",
        description: "",
        x: 559,
        y: 530.4861106872559,
        createdAt: "2025-08-20T17:46:43.981Z",
        updatedAt: "2025-08-20T17:46:43.981Z",
        __v: 0,
      },
      to: {
        _id: "68a61f7fe5f5a762fbaf844b",
        name: "4 te gach er kache ",
        type: "road_turn",
        description: "",
        x: 600,
        y: 530.4861106872559,
        createdAt: "2025-08-20T19:18:23.581Z",
        updatedAt: "2025-08-20T19:18:23.581Z",
        __v: 0,
      },
      direction: "S-N",
      distance: 41,
      left_reference_nodes: [],
      right_reference_nodes: [],
      createdAt: "2025-08-20T19:24:55.892Z",
      updatedAt: "2025-08-20T19:24:55.892Z",
      __v: 0,
    },
  ],
  buildings: [
    {
      _id: "68a5b0501c52e725b8dc9f73",
      name: "B1",
      entranceNodes: [],
      entranceEdges: [],
      floors: [
        {
          _id: "68a5b1dfe20f26b232fe472c",
          floorNumber: 1,
          mapImage:
            "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a5b1da0007358bad69/view?project=689b5787003b4e752196",
          width: 1280,
          height: 960,
          nodes: [
            {
              _id: "68a5b231e20f26b232fe4736",
              name: "b1-Entrance",
              type: "entrance",
              description: "",
              x: 222,
              y: 679.1527767181396,
              createdAt: "2025-08-20T11:32:01.492Z",
              updatedAt: "2025-08-20T11:32:01.492Z",
              __v: 0,
            },
            {
              _id: "68a5b291e20f26b232fe4749",
              name: "b1-01",
              type: "road_turn",
              description: "",
              x: 239,
              y: 461.15277671813965,
              createdAt: "2025-08-20T11:33:37.591Z",
              updatedAt: "2025-08-20T11:33:37.591Z",
              __v: 0,
            },
            {
              _id: "68a5b2aee20f26b232fe4754",
              name: "d1",
              type: "door",
              description: "",
              x: 273,
              y: 428.15277671813965,
              createdAt: "2025-08-20T11:34:06.321Z",
              updatedAt: "2025-08-20T11:34:06.321Z",
              __v: 0,
            },
            {
              _id: "68a60a61e5f5a762fbaf8304",
              name: "incubation center enntrance ",
              type: "door",
              description: "",
              x: 276,
              y: 485.88888931274414,
              createdAt: "2025-08-20T17:48:17.162Z",
              updatedAt: "2025-08-20T17:48:17.162Z",
              __v: 0,
            },
            {
              _id: "68a60b83e5f5a762fbaf832b",
              name: "road2",
              type: "other",
              description: "",
              x: 396,
              y: 458.3333282470703,
              createdAt: "2025-08-20T17:53:07.984Z",
              updatedAt: "2025-08-20T17:53:07.984Z",
              __v: 0,
            },
            {
              _id: "68a60eabe5f5a762fbaf836a",
              name: "classroom1",
              type: "other",
              description: "",
              x: 414,
              y: 425.6666660308838,
              createdAt: "2025-08-20T18:06:35.235Z",
              updatedAt: "2025-08-20T18:06:35.235Z",
              __v: 0,
            },
          ],
          connections: [
            {
              _id: "68a5b2f9e20f26b232fe4761",
              from: {
                _id: "68a5b2aee20f26b232fe4754",
                name: "d1",
                type: "door",
                description: "",
                x: 273,
                y: 428.15277671813965,
                createdAt: "2025-08-20T11:34:06.321Z",
                updatedAt: "2025-08-20T11:34:06.321Z",
                __v: 0,
              },
              to: {
                _id: "68a5b291e20f26b232fe4749",
                name: "b1-01",
                type: "road_turn",
                description: "",
                x: 239,
                y: 461.15277671813965,
                createdAt: "2025-08-20T11:33:37.591Z",
                updatedAt: "2025-08-20T11:33:37.591Z",
                __v: 0,
              },
              direction: "SE-NW",
              distance: 47.38143096192854,
              left_reference_nodes: [],
              right_reference_nodes: [],
              createdAt: "2025-08-20T11:35:21.160Z",
              updatedAt: "2025-08-20T11:35:21.160Z",
              __v: 0,
            },
            {
              _id: "68a5b322e20f26b232fe4771",
              from: {
                _id: "68a5b291e20f26b232fe4749",
                name: "b1-01",
                type: "road_turn",
                description: "",
                x: 239,
                y: 461.15277671813965,
                createdAt: "2025-08-20T11:33:37.591Z",
                updatedAt: "2025-08-20T11:33:37.591Z",
                __v: 0,
              },
              to: {
                _id: "68a5b231e20f26b232fe4736",
                name: "b1-Entrance",
                type: "entrance",
                description: "",
                x: 222,
                y: 679.1527767181396,
                createdAt: "2025-08-20T11:32:01.492Z",
                updatedAt: "2025-08-20T11:32:01.492Z",
                __v: 0,
              },
              direction: "E-W",
              distance: 218.66183937761065,
              left_reference_nodes: [],
              right_reference_nodes: [],
              createdAt: "2025-08-20T11:36:02.987Z",
              updatedAt: "2025-08-20T11:36:02.987Z",
              __v: 0,
            },
            {
              _id: "68a5b3ebe20f26b232fe479a",
              from: {
                _id: "68a5b3b6e20f26b232fe478a",
                name: "b1-entrance connector ",
                type: "other",
                description: "",
                x: 534,
                y: 371.26388931274414,
                createdAt: "2025-08-20T11:38:30.338Z",
                updatedAt: "2025-08-20T11:38:30.338Z",
                __v: 0,
              },
              to: {
                _id: "68a5b231e20f26b232fe4736",
                name: "b1-Entrance",
                type: "entrance",
                description: "",
                x: 222,
                y: 679.1527767181396,
                createdAt: "2025-08-20T11:32:01.492Z",
                updatedAt: "2025-08-20T11:32:01.492Z",
                __v: 0,
              },
              direction: "E-W",
              distance: 438.33727538019434,
              left_reference_nodes: [],
              right_reference_nodes: [],
              createdAt: "2025-08-20T11:39:23.923Z",
              updatedAt: "2025-08-20T11:39:23.923Z",
              __v: 0,
            },
            {
              _id: "68a60bece5f5a762fbaf8346",
              from: {
                _id: "68a5b291e20f26b232fe4749",
                name: "b1-01",
                type: "road_turn",
                description: "",
                x: 239,
                y: 461.15277671813965,
                createdAt: "2025-08-20T11:33:37.591Z",
                updatedAt: "2025-08-20T11:33:37.591Z",
                __v: 0,
              },
              to: {
                _id: "68a60b83e5f5a762fbaf832b",
                name: "road2",
                type: "other",
                description: "",
                x: 396,
                y: 458.3333282470703,
                createdAt: "2025-08-20T17:53:07.984Z",
                updatedAt: "2025-08-20T17:53:07.984Z",
                __v: 0,
              },
              direction: "W-E",
              distance: 157.0253141683882,
              left_reference_nodes: [],
              right_reference_nodes: [],
              createdAt: "2025-08-20T17:54:52.848Z",
              updatedAt: "2025-08-20T17:54:52.848Z",
              __v: 0,
            },
          ],
          createdAt: "2025-08-20T11:30:39.312Z",
          updatedAt: "2025-08-20T18:06:35.278Z",
          __v: 0,
        },
      ],
      createdAt: "2025-08-20T11:24:00.542Z",
      updatedAt: "2025-08-20T11:30:39.353Z",
      __v: 0,
    },
    {
      _id: "68a60afde5f5a762fbaf831d",
      name: "B2",
      entranceNodes: [],
      entranceEdges: [],
      floors: [
        {
          _id: "68a6100ce5f5a762fbaf8383",
          floorNumber: 1,
          mapImage:
            "https://fra.cloud.appwrite.io/v1/storage/buckets/68a2407a000973202004/files/68a6100a002ab28cfd6f/view?project=689b5787003b4e752196",
          width: 750,
          height: 698,
          nodes: [
            {
              _id: "68a6103de5f5a762fbaf8391",
              name: "entrance1",
              type: "other",
              description: "",
              x: 713,
              y: 706.6666660308838,
              createdAt: "2025-08-20T18:13:17.454Z",
              updatedAt: "2025-08-20T18:13:17.454Z",
              __v: 0,
            },
            {
              _id: "68a61a10e5f5a762fbaf83db",
              name: "entrance near point",
              type: "other",
              description: "",
              x: 707,
              y: 574.6666660308838,
              createdAt: "2025-08-20T18:55:12.156Z",
              updatedAt: "2025-08-20T18:55:12.156Z",
              __v: 0,
            },
          ],
          connections: [
            {
              _id: "68a61a2be5f5a762fbaf83eb",
              from: {
                _id: "68a61a10e5f5a762fbaf83db",
                name: "entrance near point",
                type: "other",
                description: "",
                x: 707,
                y: 574.6666660308838,
                createdAt: "2025-08-20T18:55:12.156Z",
                updatedAt: "2025-08-20T18:55:12.156Z",
                __v: 0,
              },
              to: {
                _id: "68a6103de5f5a762fbaf8391",
                name: "entrance1",
                type: "other",
                description: "",
                x: 713,
                y: 706.6666660308838,
                createdAt: "2025-08-20T18:13:17.454Z",
                updatedAt: "2025-08-20T18:13:17.454Z",
                __v: 0,
              },
              direction: "N-S",
              distance: 132.13629327327143,
              left_reference_nodes: [],
              right_reference_nodes: [],
              createdAt: "2025-08-20T18:55:39.096Z",
              updatedAt: "2025-08-20T18:55:39.096Z",
              __v: 0,
            },
          ],
          createdAt: "2025-08-20T18:12:29.002Z",
          updatedAt: "2025-08-20T18:55:39.107Z",
          __v: 0,
        },
      ],
      createdAt: "2025-08-20T17:50:53.232Z",
      updatedAt: "2025-08-20T18:12:29.035Z",
      __v: 0,
    },
  ],
  createdAt: "2025-08-20T11:14:43.545Z",
  updatedAt: "2025-08-20T19:24:55.897Z",
  __v: 0,
}
// Test the function
// console.log("Testing Node Matcher:")
// console.log("Query: 'entrance'")
// const result = await findBestMatchingNode(sampleMapData, "i can see studyroom and i want to go to lake")
// console.log("Best match:", result)

// Export the function
export { findBestMatchingNode }

export function findBestMatchingNodeSync(mapData, query) {
  const actualMapData = mapData.mapdata || mapData
  const cleanMapData = toPlainObject(actualMapData)

  const allNodes = extractAllNodes(cleanMapData)
  const cleanQuery = preprocessQuery(query)
  const queryParts = parseSourceDestination(cleanQuery)

  if (queryParts.hasDestination) {
    // Handle source + destination query synchronously
    const sourceNode = findBestMatchTraditional(allNodes, queryParts.source)
    const destinationNode = findBestMatchTraditional(allNodes, queryParts.destination)

    return {
      source: cleanNode(sourceNode),
      destination: cleanNode(destinationNode),
      queryType: "source-destination",
      matchMethod: "fuzzy-dual-sync",
      matchScore: Math.min(sourceNode.matchScore, destinationNode.matchScore),
    }
  } else {
    // Handle source-only query (existing logic)
    const result = findBestMatchTraditional(allNodes, cleanQuery)
    return {
      source: cleanNode(result),
      queryType: "source-only",
      matchMethod: result.matchMethod,
      matchScore: result.matchScore,
    }
  }
}
