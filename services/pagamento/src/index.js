const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const client = require('prom-client');  
const routes = require('./routes');

const app = express(); 
const PORT = process.env.PORT || 3000; 

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-type', client.register.contentType);
    try {
        res.send(await client.register.metrics());
    } catch (ex) {
        res.status(500).send(ex);
    }
});


app.listen(PORT, () => {
    console.log(`Servidor do pagamento de cartas rodando na porta ${PORT}`);
});

