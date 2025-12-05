require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const client = require("prom-client");
const routes = require("./routes");

const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  try {
    res.send(await client.register.metrics());
  } catch (ex) {
    res.status(500).send(ex);
  }
});

module.exports = app;
