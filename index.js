const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
        await client.connect();

        // create a new collection called "test" in the "tutor-finder" database
        const database = client.db("tutor-finder");
        const tutorCollection = database.collection("tutors");

        app.get('/tutors', async (req, res) => {
            const cursor = tutorCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/tutors', async (req, res) => {
            const tutor = req.body;
            const result = await tutorCollection.insertOne(tutor);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World! This is tutor finder serverhue');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});