# iot-printer-mailbox

An IOT "mailbox" I made as a present for my girlfriend. 

---

## Features

- Send "mail" via simple web portal
- Messages printed on thermal printer connected to Raspberry Pi
- Node.js/Express backend with MongoDB, easily deployable remotely

## Requirements (2x of each, if two-way)

- Raspberry Pi & an appropriate power supply (I used the Zero 2 W and its official power supply)
- USB thermal printer (TTL thermal printers work, but more finicky setup)
- A simple limit switch (cheaply found on Amazon, any of these should work)
- A 5V DC cable and a barrel jack adapter for the printer (adapter can be avoided by soldering directly to the 5V cable)
- A female to male MicroUSB to USB-A adapter (printer does not like if you use MicroUSB to MiniUSB directly)

## Installation

**NOTE:** You will need to setup the Pi/printer. Adafruit has a guide [here](https://learn.adafruit.com/networked-thermal-printer-using-cups-and-raspberry-pi/overview).

### Clone repo

```bash
git clone https://github.com/bailey2k/iot-printer-mailbox.git
cd iot-printer-mailbox
```

### Start MongoDB (via Docker)

```bash
docker run -d --name my-mongo -p 27017:27017 mongo
```

Or use MongoDB Atlas for remote hosting.

### Setup Node.js server

```bash
npm install
node server.js
```

### Environment variables

Create a `.env` file for MongoDB and port (required for Atlas or remote deployment):

```bash
MONGODB_URI=your-mongodb-uri
PORT=10000
```

### Pi setup (config.py)

Create `config.py` on the Pi (in the `pi-code` directory):

```python
SERVER_URL = "http://<your-server-url>"
USERNAME = "username"  # name of the person receiving mail on this Pi
POLL_INTERVAL = 10     # seconds between polls

# optional: limit switch GPIO pin (review a pinout diagram if needed) default is 17
# any of these work: 17 (physical 11), 27 (physical 13), 22 (physical 15), and more
SWITCH_PIN = 17
```

### Run mailbox client (on Pi)

```bash
cd pi-code
python3 -m venv venv
source venv/bin/activate
pip install requests RPi.GPIO
python mailbox.py
```

### Physical setup

1. Connect the Pi to USB power.
2. Connect the printer to power (it may spit out a test page, this is normal unless it happens every time).
3. Connect the printer to the Pi via the MiniUSB on the printer, to the MicroUSB adapter, to the Pi.
4. Connect the limit switch: one wire to GND (pin 6), one wire to your chosen GPIO pin (e.g. pin 11 = GPIO17). Set `SWITCH_PIN` in config.py to match if you decide to pick where to put it.
