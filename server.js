require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let messagesCollection;

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' 
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

async function sendEmail(sender, text) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_TO,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_TO,
      to: process.env.EMAIL_TO,
      subject: `New message from ${sender}`,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

async function connectMongo() {
  await client.connect();
  const db = client.db('mailboxDB');
  messagesCollection = db.collection('messages');
  console.log('connected to mongodb');
}
connectMongo().catch(console.error);

app.post('/send', async (req, res) => {
  const { sender, receiver, text } = req.body;
  if (!sender || !receiver || !text) return res.status(400).send("missing fields");

  const message = { sender, receiver, text, timestamp: new Date(), delivered: false };
  await messagesCollection.insertOne(message);

  if (process.env.EMAIL_RECEIVER && receiver.toLowerCase() === process.env.EMAIL_RECEIVER.toLowerCase()) {
    await sendEmail(sender, text);
  }

  console.log('New message received:', message);
  res.send({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("server running on port", PORT));
