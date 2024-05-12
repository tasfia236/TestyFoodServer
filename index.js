const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
//const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: ['http://localhost:5173'],
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

        const FoodCollection = client.db('foodCollection').collection('foods');

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


        //features related
        app.get('/foods', async (req, res) => {
            const cursor = FoodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) }
            const result = await FoodCollection.findOne(quary);
            res.send(result);
        })

        app.post('/foods', async (req, res) => {
            const food = req.body;
            console.log(food);
            const result = await FoodCollection.insertOne(food);
            res.send(result);
        });

        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateNote = req.body
            const notes = {
                $set: {
                    additional_notes: updateNote.additional_notes
                }
            }
            const result = await FoodCollection.updateOne(filter, notes, options);
            console.log(result);
            res.send(result);
        });


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
