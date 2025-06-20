import express from 'express';
import router from "./router";
import cors from 'cors';
import multer from 'multer';

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());
app.use("/api/v1", router);


app.use(cors({
  origin: ['http://localhost:8000', 'https://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.get("/healthCheck", (req, res) => {
	res.send("Server is healthy!")
})


app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);

})
