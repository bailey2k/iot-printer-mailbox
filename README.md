# iot-printer-mailbox

An IOT "mailbox" I made as a birthday present for my girlfriend.

---

## Features:
- send "mail" via simple web portal
- messages printed on thermal printer connected to Raspberry Pi
- simple Node.js/Express backend

## Requirements:
- Raspberry Pi (I used the Zero 2 W)
- USB thermal printer (TTL thermal printers work, but more finicky setup)

## Installation:

## NOTE: You will need to setup the Pi/printer, Adafruit has a guide [here](https://learn.adafruit.com/networked-thermal-printer-using-cups-and-raspberry-pi/overview).

### Clone repo
```bash
git clone https://github.com/bailey2k/iot-printer-mailbox.git
cd iot-printer-mailbox
```

### Start MongoDB (via Docker)
```bash
docker run -d --name my-mongo -p 27017:27017 mongo
```

### Note: you can use MongoDB Atlas if you so choose.

### Make a config.js file
```bash
echo "const SERVER_URL = 'http://localhost:3000';" > config.js
```
You can obviously replace this with wherever you'd like to host.

### Setup Node.js server (on home server)
```bash
npm install
node server.js
```

### Make a .env file (if using MongoDB Atlas and remote deployment)
```bash
MONGODB_URI=mongodb+srv://baileyjones740_db_user:RI7p1dUR4SqSkwA6@mailbox.t05phln.mongodb.net/?appName=mailbox
PORT=10000

EMAIL_RECEIVER=name-of-person-getting-emailed
EMAIL_TO=xxx@email.com
GMAIL_USER=xxx@email.com

# i chose to use gmail oauth2 over https as Render was blocking SMTP ports, replace these with your respective values
GMAIL_CLIENT_ID=client_id
GMAIL_CLIENT_SECRET=client_secret
GMAIL_REFRESH_TOKEN=refresh_token
```

### Make config.py file (on pi)
```bash
SERVER_URL = "http://<your-server-url>" # 
USERNAME = "username" # change to whatever desired
POLL_INTERVAL = 10  # seconds between polls, i like to set this to be daily to act like a real mailbox, being delivered daily
```

### Setup mailbox client (on Pi)
Setup virtual env (recommended)
```bash
python3 -m venv venv
source venv/bin/activate
pip install requests
```
### Run mailbox client (on Pi)
```bash
python mailbox.py
```

