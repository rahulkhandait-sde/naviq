import express from 'express';
import { OrgSignup } from '../controllers/signup.controller.js';
const router = express.Router();

router.post('/org/signup', OrgSignup);
export { router };