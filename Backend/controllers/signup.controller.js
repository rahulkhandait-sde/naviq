import { Account } from 'node-appwrite';
import Organization from '../models/Organizationmodel.js';
import { client } from '../configs/appwrite.js';
import Subscription from '../models/Subscription.js';

export const OrgSignup = async (req, res) => {
    const account = new Account(client);
    const { email, password, name } = req.body;
    try {
        const user = await account.create(
            'unique()', // Generates a unique ID for the user
            email,
            password,
            name
        );
        if (!user) {
            return res.status(400).json({ error: 'User creation failed' });
        }
        const org = await Organization.create({
            appwriteId: user.$id,
            username: name,
            email: email,
        });
        const subscription = await Subscription.create({
            userId: user.$id,
            usedCredit: 0,
        });
        const updatedOrg = await Organization.findByIdAndUpdate(
            org._id,
            { $set: { subscription: subscription._id } },
            { new: true } 
        );
        res.status(201).json({ message: 'User created successfully', user, organization: updatedOrg });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
}