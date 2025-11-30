require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
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

// ✅ Set up optional email transport only if creds exist
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_PW) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PW
    }
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/send', async (req, res) => {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) return res.status(400).send("missing fields");

    const message = { sender, receiver, text, timestamp: new Date(), delivered: false };
    await messagesCollection.insertOne(message);

    console.log("New message received:", message);

    // ✅ Optional: email to you if receiver matches EMAIL_RECEIVER
    if (transporter && process.env.EMAIL_RECEIVER &&
        receiver.toLowerCase() === process.env.EMAIL_RECEIVER.toLowerCase()) {

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.EMAIL_TO,
            subject: `New message from ${sender}!!`,
            text: text
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.error('Error sending email:', err);
            else console.log('Email sent:', info.response);
        });
    }

    res.send({ status: "ok" });
});

app.get('/messages/:user', async (req, res) => {
    const user = req.params.user;
    const userMessages = await messagesCollection.find({ receiver: user }).toArray();
    res.send(userMessages);
});

app.post('/delivered/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await messagesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { delivered: true } }
        );
        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to confirm delivery" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("server running on port", PORT));
