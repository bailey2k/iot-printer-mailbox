import subprocess
import time
import requests
from datetime import datetime
from config import SERVER_URL, USERNAME, POLL_INTERVAL

PRINTER_NAME = "-"

def fetch_messages():
    try:
        resp = requests.get(f"{SERVER_URL}/messages/{USERNAME}", timeout=5)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print("Error fetching messages:", e)
    return []

def print_message(msg):
    """Print a message dict and notify server the message was delivered.

    Expects `msg` to be a dict with keys `sender`, `text`, and optionally `_id`.
    """
    sender = msg.get('sender', 'unknown')
    text = msg.get('text', '')
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    content = f"YOU'VE GOT MAIL!\n{timestamp}\nFROM: {sender}\n{text}\n\n\n"
    try:
        subprocess.run(["lp", "-d", PRINTER_NAME], input=content.encode(), check=True)
        msg_id = msg.get("_id")
        if msg_id:
            # handle different _id shapes (string or dict from some serializers)
            if isinstance(msg_id, dict):
                id_str = msg_id.get('$oid') or msg_id.get('oid') or str(msg_id)
            else:
                id_str = str(msg_id)
            try:
                requests.post(f"{SERVER_URL}/delivered/{id_str}", timeout=5)
            except Exception as e:
                print("Error notifying server about delivery:", e)
    except Exception as e:
        print("Print error:", e)

def main():
    print(f"Mailbox started for {USERNAME}. Polling {SERVER_URL} every {POLL_INTERVAL} seconds.")
    while True:
        messages = fetch_messages()
        for msg in messages:
            # msg should be a dict containing sender, text, and _id
            try:
                print_message(msg)
            except Exception as e:
                print('Error handling message:', e)
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
