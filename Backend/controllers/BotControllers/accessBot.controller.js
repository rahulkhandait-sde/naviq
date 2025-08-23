import Mapdata from "../../models/Mapdata.js";
import { gettypeofquery } from "./gettypeofquery.controller.js";
import { findBestMatchingNode } from "./QueryMatchFinder.controller.js";
import { dijkstraWithSteps } from "./ShortestPathGenerator.js";

export const accessBot = async (req, res) => {
    const adminId = req.params.adminid;
    console.log(adminId)
    const mapdata = await Mapdata.findOne({ appwriteId: adminId }).populate('nodes').populate('connections').populate('buildings').populate({
        path: "buildings", // First, populate the 'buildings' field 
        populate: {
            path: "floors",
            populate: [{ path: "nodes" }, { path: "connections" }]
        }
    });
    const response = "Hello,Welcome to Xyz Campus. How can I assist you today?";
    res.json({ message: "Response from bot", response, mapdata: mapdata });
}

export const callbot = async (req, res) => {
  const adminId = req.params.adminid
  const query = req.body.userquery
  const userId = req.params.userid
  const typeof_query = await gettypeofquery(userId, query)
  if (typeof_query === "N") {
    const ans = "normal query is called"
    res.status(200).json({ reply: ans })
    // const ans = await callnormalbot(query);
    // res.status(200).json({ reply: ans });
    return
  }
  if (typeof_query === "P") {
    const mapdata = await Mapdata.findOne({ appwriteId: adminId })
      .populate("nodes")
      .populate("connections")
      .populate("buildings")
      .populate({
        path: "buildings", // First, populate the 'buildings' field
        populate: {
          path: "floors",
          populate: [{ path: "nodes" }, { path: "connections" }],
        },
      })

    const result = await findBestMatchingNode(mapdata, query)

    // Check what was found and respond accordingly
    if (result.source && result.destination) {
      // Both source and destination found - calculate path
      const pathResult = dijkstraWithSteps(mapdata, result.source._id, result.destination._id)
      res.status(200).json({
        reply: "Path found! Here's your route:",
        result: pathResult,
        source: result.source,
        destination: result.destination,
      })
    } else if (result.source && !result.destination) {
      // Only source found - ask for destination
      res.status(200).json({
        reply: "I found your starting point. Where would you like to go?",
        result: result,
        needsDestination: true,
      })
    } else if (!result.source && result.destination) {
      // Only destination found - ask for source
      res.status(200).json({
        reply: "I found your destination. Where are you starting from?",
        result: result,
        needsSource: true,
      })
    } else {
      // Neither found clearly - return original result for clarification
      res.status(200).json({
        reply: "I found some locations. Could you be more specific about your source and destination?",
        result: result,
      })
    }
    return
  }
}
