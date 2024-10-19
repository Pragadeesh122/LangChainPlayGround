import express from "express";
import generateImage from "./imageGenerator";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.post("/", async (req, res) => {
  const {prompt} = req.body;
  const data = await generateImage(prompt);
  res.json({data});
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
