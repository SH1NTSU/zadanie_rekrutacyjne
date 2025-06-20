import express from 'express';
import router from "./router";
import cors from 'cors';

const app = express();
const port = 8000;

app.use(cors({
  origin: ['http://localhost:5173'],   
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use("/api/v1", router);

app.get("/healthCheck", (req, res) => {
  res.send("Server is healthy!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
