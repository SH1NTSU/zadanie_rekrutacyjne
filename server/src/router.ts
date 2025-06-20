import { Router, Request, Response} from "express";
import generate from "./controllers/create";
import multer from "multer";
const upload = multer({storage: multer.memoryStorage() })
const router = Router();

const uploadFiles = upload.fields([
	{name: 'csv', maxCount: 1 },
	{name: 'layout', maxCount: 1}
])


router.post('/generate', uploadFiles ,  generate);

export default router;
