const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.send('Welcome Our Testy Food Home');
})

app.listen(port, (req, res) => {
    console.log('listening on port ' + port);
})