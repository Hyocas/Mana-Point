require("dotenv").config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

module.exports = app;