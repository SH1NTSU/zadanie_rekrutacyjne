import { Router } from "express";
import generate from "./controllers/create";
import multer from "multer";
const upload = multer({dest: 'uploads/'})
const router = Router();

const uploadFiles = upload.fields([
	{name: 'csv', maxCount: 1 },
	{name: 'layout'}
])


router.post('/generate', uploadFiles ,  generate);



export default router;
