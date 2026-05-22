const express = require("express");
const app = express();

const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const port = process.env.PORT || 3500;

app.use(cors());
app.use(express.json());

const {
    MongoClient,
    ServerApiVersion,
    ObjectId,
} = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});


const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks")
)

const verified = async (req, res, next) => {
    const header = req?.headers.authorization;
    console.log("header: ", header);
    if (!header) {
        return res.status(401).send({
            message: "Unauthorized",
        });
    }
    const token = header.split(" ")[1];
    // if (token === "loggin") {
    //     next();
    // }
    if (!token) {
        return res.status(401).send({
            message: "Unauthorized",
        });
    }
    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log("payload:", payload);
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).send({
            message: "Forbidden",
        });
    }
}

async function run() {
    try {

        await client.connect();

        const database =
            client.db("tutor-finder");

        const tutorCollection =
            database.collection("tutors");

        const bookingCollection =
            database.collection("bookings");



        // =================================
        // Tutors API
        // =================================

        app.get("/tutors", async (req, res) => {

            try {

                const limit =
                    parseInt(req.query.limit);

                let query =
                    tutorCollection.find();

                if (limit) {
                    query =
                        query.limit(limit);
                }

                const result =
                    await query.toArray();

                res.send(result);

            }

            catch (error) {

                console.log(error);

                res.status(500).send({
                    message:
                        "Failed to fetch tutors",
                });

            }

        });


        // single tutor details

        app.get("/tutors/:id", verified,  async (req, res) => {

            try {

                const id =
                    req.params.id;

                const result =
                    await tutorCollection.findOne({
                        _id:
                            new ObjectId(id),
                    });

                res.send(result);

            }

            catch (error) {

                res.status(500).send({
                    message:
                        "Tutor not found",
                });

            }

        });



        // add tutor

        app.post("/tutors", verified, async (req, res) => {

            try {

                const tutor =
                    req.body;

                const result =
                    await tutorCollection.insertOne(
                        tutor
                    );

                res.send(result);

            }

            catch (error) {

                res.status(500).send({
                    message:
                        "Failed to add tutor",
                });

            }

        });



        // my tutors

        app.get("/my-tutors", verified, async (req, res) => {

            try {

                const email =
                    req.query.email;

                const result =
                    await tutorCollection
                        .find({
                            creatorEmail:
                                email,
                        })
                        .toArray();

                res.send(result);

            }

            catch {

                res.status(500).send({
                    message:
                        "Failed to load tutors",
                });

            }

        });



        // update tutor

        app.patch("/tutors/:id", verified, async (req, res) => {

            try {

                const id =
                    req.params.id;

                const data =
                    req.body;

                const result =
                    await tutorCollection.updateOne(

                        {
                            _id:
                                new ObjectId(id),
                        },

                        {
                            $set: data,
                        }

                    );

                res.send(result);

            }

            catch {

                res.status(500).send({
                    message:
                        "Update failed",
                });

            }

        });



        // delete tutor

        app.delete("/tutors/:id", verified, async (req, res) => {

            try {

                const id =
                    req.params.id;

                const result =
                    await tutorCollection.deleteOne({

                        _id:
                            new ObjectId(id),

                    });

                res.send(result);

            }

            catch {

                res.status(500).send({
                    message:
                        "Delete failed",
                });

            }

        });



        // decrease slot after booking

        app.patch( "/tutors/decrease-slot/:id", verified, async (req, res) => {

                try {

                    const id =
                        req.params.id;

                    const result =
                        await tutorCollection.updateOne(

                            {
                                _id:
                                    new ObjectId(id)
                            },

                            {
                                $inc: {
                                    totalSlot: -1
                                }
                            }

                        );

                    res.send(result);

                }

                catch {

                    res.status(500).send({
                        message:
                            "Slot update failed"
                    });

                }

            }
        );



        // =================================
        // Bookings API
        // =================================


        // create booking

        app.post("/bookings", verified, async (req, res) => {

            try {

                const booking =
                    req.body;

                const result =
                    await bookingCollection.insertOne(
                        booking
                    );

                res.send(result);

            }

            catch {

                res.status(500).send({
                    message:
                        "Booking failed",
                });

            }

        });



        // logged in user's bookings

        app.get(
            "/bookings/:email",
            verified,
            async (req, res) => {

                try {

                    const email =
                        req.params.email;

                    if (!email) {

                        return res
                            .status(400)
                            .send({
                                message:
                                    "Email required",
                            });

                    }

                    const result =
                        await bookingCollection
                            .find({
                                studentEmail:
                                    email,
                            })
                            .toArray();

                    res.send(result);

                }

                catch {

                    res.status(500).send({
                        message:
                            "Failed loading bookings",
                    });

                }

            }
        );



        // cancel booking

        app.patch(
            "/bookings/cancel/:id",
            verified,
            async (req, res) => {

                try {

                    const id =
                        req.params.id;

                    const result =
                        await bookingCollection.updateOne(

                            {
                                _id:
                                    new ObjectId(id)
                            },

                            {
                                $set: {
                                    status:
                                        "cancelled",
                                }
                            }

                        );

                    res.send(result);

                }

                catch {

                    res.status(500).send({
                        message:
                            "Cancel failed"
                    });

                }

            }
        );



        await client
            .db("admin")
            .command({ ping: 1 });

        console.log(
            "MongoDB Connected"
        );

    }

    finally {

    }

}

run().catch(console.dir);



app.get("/", (req, res) => {

    res.send(
        "Tutor Finder Server Running"
    );

});


app.listen(port, () => {

    console.log(
        `Server running at ${port}`
    );

});