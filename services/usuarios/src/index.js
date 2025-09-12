const express = require('express');
const routes = require('./routes');

const app = express(); 
const PORT = process.env.PORT || 3000; 

app.use(express.json());

app.use('/api', routes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Servidor do usuários está rodando na porta ${PORT}`);
});