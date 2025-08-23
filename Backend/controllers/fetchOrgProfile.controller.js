import Organization from "../models/Organizationmodel.js";

export const fetchOrgProfile = async (req, res) => {
  try {
    const appwriteId = req.user.$id; // Assuming the user object has an appwriteId field
    console.log("Fetching organization profile for Appwrite ID:", appwriteId);
    const orgProfile = await Organization.findOne({ appwriteId: appwriteId }).populate('subscription');

    if (!orgProfile) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.status(200).json(orgProfile);
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}