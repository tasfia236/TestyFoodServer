const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
//const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: ['http://localhost:5176'],
    credentials: true
}));
app.use(express.json());
//app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxwisw2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect()

        //auth related
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user)

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });

            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    sameState: 'none'
                })
                .send({ success: true });
        })

        app.get('/', (req, res) => {
            res.send('Welcome to Our testy Food Home!');
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, (req, res) => {
    console.log('listening on port ' + port);
})
