import Mapdata from "../../models/Mapdata.js";
import Organization from "../../models/Organizationmodel.js";
import Subscription from "../../models/Subscription.js";
import { gettypeofquery } from "./gettypeofquery.controller.js";
import { instructiongenerator } from "./instructiongenerator.controller.js";
import { findBestMatchingNode } from "./QueryMatchFinder.controller.js";
import { dijkstraWithSteps } from "./ShortestPathGenerator.js";
import axios from "axios";
export const accessBot = async (req, res) => {
  const adminId = req.params.adminid;
  console.log(adminId);

  const mapdata = await Mapdata.findOne({ appwriteId: adminId })
    .populate("nodes")
    .populate("connections")
    .populate("buildings")
    .populate({
      path: "buildings",
      populate: {
        path: "floors",
        populate: [{ path: "nodes" }, { path: "connections" }],
      },
    });

  const response = "Hello, Welcome to Xyz Campus. How can I assist you today?";
  res.json({ message: "Response from bot", response, mapdata });
};

export const callbot = async (req, res) => {
  try {
    const adminId = req.params.adminid;
    const query = req.body.userquery;  // comes from frontend body
    const userId = req.params.userid;
    const orgId = req.body.organization_id; // ✅ also get org id from body
    await Subscription.findOneAndUpdate(
      { userId: orgId },
      { $inc: { remainingCredit: -1 } },
      { new: true }
    )
    const typeof_query = await gettypeofquery(userId, query);

    if (typeof_query === "N") {
      // ✅ Call the HuggingFace API just like frontend
      const apiResponse = await axios.get(
        "https://subhajit01-naviqrag.hf.space/query",
        {
          params: {
            organization_id: orgId,
            question: query,
          },
        }
      );

      return res.status(200).json({
        typeofquery: "general",
        reply: apiResponse.data.answer || "No reply from API",
      });
    }

    if (typeof_query === "P") {
      const mapdata = await Mapdata.findOne({ appwriteId: adminId })
        .populate("nodes")
        .populate("connections")
        .populate("buildings")
        .populate({
          path: "buildings",
          populate: {
            path: "floors",
            populate: [{ path: "nodes" }, { path: "connections" }],
          },
        });

      const result = await findBestMatchingNode(mapdata, query);

      if (result.source && result.destination) {
        // Run pathfinding
        const pathResult = dijkstraWithSteps(
          mapdata,
          result.source._id,
          result.destination._id
        );

        // Build populatedResult
        const populatedResult = pathResult.map((step) => {
          const [fromRaw, toRawWithDist] = step.split(" → ");
          const [toRaw, distance] = toRawWithDist.split(" (");

          const fromNode = mapdata.nodes.find(
            (n) => n._id.toString() === fromRaw.trim()
          );
          const toNode = mapdata.nodes.find(
            (n) => n._id.toString() === toRaw.trim()
          );
          const edge = mapdata.connections.find(
            (c) =>
              (c.from.toString() === fromRaw.trim() &&
                c.to.toString() === toRaw.trim()) ||
              (c.from.toString() === toRaw.trim() &&
                c.to.toString() === fromRaw.trim())
          );

          return {
            from: fromNode
              ? { id: fromNode._id, name: fromNode.name, type: fromNode.type }
              : fromRaw,
            to: toNode
              ? { id: toNode._id, name: toNode.name, type: toNode.type }
              : toRaw,
            edge: edge
              ? { id: edge._id, distance: edge.distance, type: edge.type }
              : { distance: distance.replace(")", "") },
          };
        });

        // Generate user-friendly instruction
        const prompt =
          "Generate step-by-step navigation instructions from the given path data. Include turns, distances, and any other important details.";
        const promptresult = await instructiongenerator(
          prompt,
          JSON.stringify(populatedResult, null, 2)
        );

        return res.status(200).json({
          reply: "Path found! Here's your route:",
          result: pathResult,
          populatedResult,
          promptresult,
          source: result.source,
          destination: result.destination,
        });
      }

      if (result.source && !result.destination) {
        return res.status(200).json({
          reply: "I found your starting point. Where would you like to go?",
          result,
          needsDestination: true,
        });
      }

      if (!result.source && result.destination) {
        return res.status(200).json({
          reply: "I found your destination. Where are you starting from?",
          result,
          needsSource: true,
        });
      }

      return res.status(200).json({
        reply:
          "I found some locations. Could you be more specific about your source and destination?",
        result,
      });
    }
  } catch (err) {
    console.error("Error in callbot:", err);
    res.status(500).json({
      reply: "Something went wrong while processing the query.",
      error: err.message,
    });
  }
};