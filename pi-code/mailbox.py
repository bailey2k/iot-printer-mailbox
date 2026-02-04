import subprocess
import time
import requests
import RPi.GPIO as GPIO
from datetime import datetime
import config

PRINTER_NAME = "-"
SERVER_URL = config.SERVER_URL
USERNAME = config.USERNAME
POLL_INTERVAL = config.POLL_INTERVAL
SWITCH_PIN = getattr(config, 'SWITCH_PIN', 17)

def on_switch():
    try:
        requests.post(f"{SERVER_URL}/send_outgoing/{USERNAME}", timeout=5)
    except Exception as e:
        print(e)

def main():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(SWITCH_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.add_event_detect(SWITCH_PIN, GPIO.FALLING, callback=lambda x: on_switch(), bouncetime=300)

    while True:
        try:
            resp = requests.get(f"{SERVER_URL}/messages/{USERNAME}", timeout=5)
            if resp.status_code == 200:
                for msg in resp.json():
                    sender = msg.get('sender', 'unknown')
                    text = msg.get('text', '')
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    content = f"you've got mail!\n{timestamp}\nfrom: {sender}\n{text}\n\n\n"
                    try:
                        subprocess.run(["lp", "-d", PRINTER_NAME], input=content.encode(), check=True)
                        oid = msg.get("_id")
                        if oid:
                            id_str = oid.get("$oid", str(oid)) if isinstance(oid, dict) else str(oid)
                            requests.post(f"{SERVER_URL}/delivered/{id_str}", timeout=5)
                    except Exception as e:
                        print(e)
        except Exception as e:
            print(e)
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
