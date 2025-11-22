const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const routes = require('./routes');

const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Servidor do catálogo de cartas rodando na porta ${PORT}`);
});

