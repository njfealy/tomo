import express from 'express'
import { setupSocket } from './socket-controller';
const router = express.Router();

router.get("/setup", setupSocket)

export default router;