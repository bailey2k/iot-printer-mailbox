// --- YOUR EXISTING IMPORTS + SETUP (unchanged) ---
require('dotenv').config();

const { google } = require('googleapis')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

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

let gmailClient = null;
let oAuth2Client = null;

if (process.env.GMAIL_USER && process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    gmailClient = google.gmail({ version: 'v1', auth: oAuth2Client });
    console.log('Gmail API client configured for', process.env.GMAIL_USER);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Incoming message endpoint
app.post('/send', async (req, res) => {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) return res.status(400).send("missing fields");

    const message = { 
        sender, 
        receiver, 
        text, 
        timestamp: new Date(), 
        delivered: false,
        queued: true   // IMPORTANT FOR OUTGOING SEND
    };
    await messagesCollection.insertOne(message);

    console.log("New message received:", message);

    res.send({ status: 'ok' });
});

// Fetch undelivered incoming messages
app.get('/messages/:user', async (req, res) => {
    const user = req.params.user;
    const userMessages = await messagesCollection.find({ 
        receiver: user, 
        delivered: false 
    }).toArray();

    res.send(userMessages);
});

// Confirm delivered
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

app.post('/send_outgoing/:username', async (req, res) => {
    const senderName = req.params.username;

    try {
        const outgoing = await messagesCollection.find({
            sender: senderName,
            queued: true
        }).toArray();

        console.log(`Sending ${outgoing.length} outgoing messages for ${senderName}`);

        for (const msg of outgoing) {
            if (!gmailClient) continue;

            const rawLines = [];
            rawLines.push(`From: ${process.env.GMAIL_USER}`);
            rawLines.push(`To: ${process.env.EMAIL_TO}`);
            rawLines.push(`Subject: A new message from ${msg.sender}!`);
            rawLines.push('Content-Type: text/plain; charset="UTF-8"');
            rawLines.push('');
            rawLines.push(msg.text);

            const raw = Buffer.from(rawLines.join('\n'))
                .toString('base64')
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            try {
                await gmailClient.users.messages.send({
                    userId: 'me',
                    requestBody: { raw }
                });
            } catch (err) {
                console.error("Email send error:", err);
            }

            await messagesCollection.updateOne(
                { _id: msg._id },
                { $set: { queued: false, delivered: true } }
            );
        }

        res.json({ sent: outgoing.length });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to send outgoing messages" });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("server running on port", PORT));
