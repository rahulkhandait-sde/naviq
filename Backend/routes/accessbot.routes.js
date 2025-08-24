import express from 'express';
import { accessBot, callbot } from '../controllers/BotControllers/accessBot.controller.js';
import { instructiongenerator } from '../controllers/BotControllers/instructiongenerator.controller.js';
const router = express.Router();

router.get('/:adminid',accessBot );
router.post('/callbot/:adminid/:userid', callbot);
router.post('/generateinstruction',instructiongenerator);
export { router };