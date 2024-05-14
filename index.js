const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wxwisw2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(403).send({ message: 'Token is required' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect()

        const FoodCollection = client.db('foodCollection').collection('foods');
        const RequestFoodCollection = client.db('foodCollection').collection('requestedfoods');

        //auth related
        app.post('/jwt', logger, async (req, res) => {
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
        app.get('/foods', logger, async (req, res) => {
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

        // managefoods 
        app.get('/managefoods', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            // console.log('ttttt token', req.cookies.token)
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await FoodCollection.find(query).toArray();
            res.send(result);
        })

        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateNote = req.body
            const notes = {
                $set: {
                    additional_notes: updateNote.additional_notes,
      //              intStatus: updatedStatus.intStatus
                }
            }
            const result = await FoodCollection.updateOne(filter, notes, options);
            console.log(result);
            res.send(result);
        });

        app.patch('/statusfoods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedStatus = req.body;
            console.log(updatedStatus);
            const updateDoc = {
                $set: {
                    intStatus: JSON.parse(updatedStatus.status),
                },
            };
            const result = await FoodCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //request food
        app.post('/requestfoodadd', async (req, res) => {
            const food = req.body;
            console.log(food);
            const result = await RequestFoodCollection.insertOne(food);
            res.send(result);
            console.log(result)
        })

        app.get('/requestfoods', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
        
            console.log('user in the valid token', req.user)
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await RequestFoodCollection.find(query).toArray();
            res.send(result);
        })

        // app.patch('/removestatusfoods/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const updatedStatus = req.body;
        //     console.log(updatedStatus);
        //     const updateDoc = {
        //         $set: {
        //             intStatus: JSON.parse(updatedStatus.status),
        //         },
        //     };
        //     const result = await FoodCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })

        app.put('/updatefoods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateFoods = req.body
            const foods = {
                $set: {
                    food_image: updateFoods.food_image,
                    food_name: updateFoods.food_name,
                    food_quantity: JSON.parse(updateFoods.food_quantity),
                    pickup_location: updateFoods.pickup_location,
                    additional_notes: updateFoods.additional_notes,
                    expired_datetime: updateFoods.expired_datetime,
                    donator_name: updateFoods.donator_name,
                    donator_email: updateFoods.donator_email,
                    donator_image: updateFoods.donator_image,
                    intStatus: JSON.parse(updateFoods.status),
                }
            }
            const result = await FoodCollection.updateOne(filter, foods);
            res.send(result);
        });

        app.delete('/deletereqfoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await RequestFoodCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/deletefoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await FoodCollection.deleteOne(query);
            res.send(result);
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
