const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

let messagesCollection;

async function connectMongo() {
    await client.connect();
    const db = client.db('mailboxDB');
    messagesCollection = db.collection('messages');
    console.log('connected to mongodb');
}

connectMongo().catch(console.error);

app.post('/send', async(req, res) => {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) return res.status(400).send("missing fields");

    const message = {sender, receiver, text, timestamp: new Date(), delivered: false};
    await messagesCollection.insertOne(message);

    console.log("New message received:", message);
    res.send({ status: "ok" });
});


app.get('/messages/:user', async(req, res) => {
    const user = req.params.user;
    const userMessages = await messagesCollection.find({ receiver: user}).toArray();
    res.send(userMessages);
});

app.post('/delivered/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const result = await messagesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { delivered: true } }
        );
        res.json({ success: true, modifiedCOunt: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to confirm delivery"});
    }
});

app.get("/delivered/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const msgs = await messagesCollection.find({
      sender: username,
      delivered: true
    }).toArray();

    await messagesCollection.deleteMany({ sender: username, delivered: true });
    res.json(msgs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch delivered messages" });
  }
});


app.listen(3000, '0.0.0.0', () => console.log("server running on port 3000"));

