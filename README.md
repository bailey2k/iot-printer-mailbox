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

### Gmail email notifications (optional)

This project can optionally send an email notification to you when a message is delivered to a specific mailbox receiver. To enable email sending using Gmail:

- Use an App Password (recommended) if your Google account uses 2-step verification.
- Add the following variables to a `.env` file in the project root (see `.env.example`):

```
GMAIL_USER=your.email@gmail.com
GMAIL_PW=your_app_password_here    # App Password
EMAIL_RECEIVER=mailbox_username   # receiver name to watch for
EMAIL_TO=your.forwarding.address@example.com
```

How to create an App Password:

1. Go to https://myaccount.google.com/
2. Select `Security` → under "Signing in to Google" ensure `2-Step Verification` is ON.
3. Click `App passwords`, choose `Other (Custom name)` and name it e.g. `iot-printer-mailbox`.
4. Copy the generated 16-character password and paste it into `GMAIL_PW` in your `.env`.

On macOS (zsh) you can create the `.env` file quickly:

```bash
cat .env.example > .env
open .env
# then edit the file and paste your values
```

If you prefer not to use an App Password, older Google accounts allowed "less secure app access" but that is deprecated and not recommended.

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

