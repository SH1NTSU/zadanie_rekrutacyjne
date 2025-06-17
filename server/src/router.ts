import { Router } from "express";
import generate from "./controllers/create";

const router = Router();

router.post('/generate', generate);



export default router;
