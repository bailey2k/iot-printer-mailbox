require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let messagesCollection;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function connectMongo() {
    await client.connect();
    const db = client.db('mailboxDB');
    messagesCollection = db.collection('messages');
    console.log('Connected to MongoDB');
}
connectMongo().catch(console.error);

// show landing page upon website open
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// store a message in mongodb
app.post('/send', async (req, res) => {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) {
        return res.status(400).json({ error: 'Missing fields: sender, receiver, and text required' });
    }

    try {
        const message = {
            sender: sender.trim().toLowerCase(),
            receiver: receiver.trim().toLowerCase(),
            text,
            timestamp: new Date(),
            delivered: false,
            queued: true
        };
        await messagesCollection.insertOne(message);
        res.json({ status: 'ok' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// retrieve messages sent to the user from mongodb
app.get('/messages/:user', async (req, res) => {
    try {
        const user = req.params.user.trim().toLowerCase();
        const userMessages = await messagesCollection
            .find({ receiver: user, delivered: false, $or: [{ queued: false }, { queued: { $exists: false } }] })
            .toArray();
        res.json(userMessages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// when limit switch is pressed, do this
app.post('/send_outgoing/:username', async (req, res) => {
    try {
        const sender = req.params.username.trim().toLowerCase();
        const result = await messagesCollection.updateMany(
            { sender, queued: true },
            { $set: { queued: false } }
        );
        res.json({ sent: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send outgoing' });
    }
});

// mark delivered when printed (i prefer this over deleting from the db so i have nice memories)
app.post('/delivered/:id', async (req, res) => {
    try {
        const result = await messagesCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { delivered: true } }
        );
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to confirm delivery' });
    }
});

// start listening at designated port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
