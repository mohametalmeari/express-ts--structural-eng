import express from "express";
import http from "http";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";

import router from "./router";

const app = express();

dotenv.config();

app.use(bodyParser.json());

app.use("/", router());

const port = process.env.PORT || 8080;
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});
