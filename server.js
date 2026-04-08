const express = require('express');
const helmet = require('helmet');
const app = express();
const PORT = 3000;

app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor TLS funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});