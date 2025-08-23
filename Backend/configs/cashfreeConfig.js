import dotenv from 'dotenv';
dotenv.config();
import { Cashfree } from "cashfree-pg"; 

export var cashfree = new Cashfree(Cashfree.SANDBOX, process.env.CLIENT_ID, process.env.CLIENT_SECRET)

