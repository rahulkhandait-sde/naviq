import Organization from "../models/Organizationmodel.js";

export const updateOrganizationProfile = async (req, res) => {
  try {
    const { appwriteId } = req.body; 
    const updates = req.body;

    // Only allow specific fields to be updated
    const allowedUpdates = ["username", "email", "typeofuser", "subscription", "mapdata", "visitors"];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Find and update
    const updatedOrganization = await Organization.findOneAndUpdate(
      { appwriteId: appwriteId },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedOrganization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
