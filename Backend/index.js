import express from 'express';
import { verifySession } from './middlewares/authMiddleware.js';
import {connectmongo} from './configs/mogodb.js';
import { router as authRoutes } from './routes/auth.routes.js';
import { router as paymentRoutes } from './routes/payment.routes.js';
import { router as generalOrgRoutes } from './routes/generalOrg.routes.js';
import {router as mapRoutes} from './routes/map.routes.js';
import {router as botroutes} from './routes/accessbot.routes.js'
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
connectmongo();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api',paymentRoutes);
app.use('/api',generalOrgRoutes);
app.use('/api/maps',mapRoutes );
app.use('/api/bot',botroutes);
app.get('/', (req, res) => {
  res.send('Hello DADA!');
})
app.get("/protected", verifySession, (req, res) => {
  res.json({ message: "Hello, " + req.user.name });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});