const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require("crypto");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = "mongodb+srv://twitter_admin:Ww7qhXlpNa3EMCkV@twitter.oozpoc1.mongodb.net/?retryWrites=true&w=majority";;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const postCollection = client.db("database").collection("posts");
        const userCollection = client.db("database").collection("users");
        // get
        app.get('/user', async (req, res) => {
            const user = await userCollection.find().toArray();
            res.send(user);
        })
        app.get('/loggedInUser', async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.find({ email: email }).toArray();
            res.send(user);
        })
        app.get('/post', async (req, res) => {
            const post = (await postCollection.find().toArray()).reverse();
            res.send(post);
        })
        app.get('/userPost', async (req, res) => {
            const email = req.query.email;
            const post = (await postCollection.find({ email: email }).toArray()).reverse();
            res.send(post);
        })

        // post
        app.post('/register', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.post('/post', async (req, res) => {
            const post = req.body;
            const result = await postCollection.insertOne(post);
            res.send(result);
        })

        app.post('/orders', async (req, res) => {
            try {
                const instance = new window.Razorpay({
                    key_id: rzp_test_etaMWnZEj692gm,
                    key_secret: TUK8WseTIPMtwr6feaotSOaN,
                });

                const options = {
                    amount: req.body.amount * 100,
                    currency: 'INR',
                    receipt: crypto.randomBytes(10).toString("hex"),
                };
                instance.orders.create(options, (err, order) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "Something Went Wrong!" });
                    }
                    res.status(200).json({ data: order });

                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Internal server error' });
            }
        });

        app.post('/verify', async (req, res) => {
            try {
                const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
                    req.body;
                const sign = razorpay_order_id + "|" + razorpay_payment_id;
                const expectedSign = crypto
                    .createHmac("sha256", process.env.KEY_SECRET)
                    .update(sign.toString())
                    .digest("hex");

                if (razorpay_signature === expectedSign) {
                    return res.status(200).json({ message: "Payment verified successfully" });
                } else {
                    return res.status(400).json({ message: "Invalid signature sent!" });
                }
            } catch (error) {
                res.status(500).json({ message: "Internal Server Error!" });
                console.log(error);
            }
        });

        // patch
        app.patch('/userUpdates/:email', async (req, res) => {
            const filter = req.params;
            const profile = req.body;
            const options = { upsert: true };
            const updateDoc = { $set: profile };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
    } catch (error) {
        console.log(error);
    }
} run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from Twitter Clone!')
})

app.listen(port, () => {
    console.log(`Twitter clone is listening on port ${port}`)
})