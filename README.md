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

### Make config.py file (on pi)
```bash
SERVER_URL = "http://<your-server-ip>:3000" # 
USERNAME = "username" # change to whatever desired
POLL_INTERVAL = 10  # seconds between polls
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

