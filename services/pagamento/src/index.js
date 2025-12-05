require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor do pagamento rodando na porta ${PORT}`);
});

module.exports = app;